//LangChain is a framework for developing applications powered by large language models (LLMs).

import { ChatOpenAI } from "@langchain/openai";
import { PDFLoader } from "@langchain/community/document_loaders/fs/pdf";
import { RecursiveCharacterTextSplitter} from "langchain/text_splitter";
import { OpenAIEmbeddings } from "@langchain/openai";
import {createStuffDocumentsChain } from "langchain/chains/combine_documents";
import { ChatPromptTemplate } from "@langchain/core/prompts";
import { createRetrievalChain } from "langchain/chains/retrieval"
import { createHistoryAwareRetriever } from "langchain/chains/history_aware_retriever";
import { HumanMessage, AIMessage } from "@langchain/core/messages";
import pineconeClient from "./pinecone";
import { PineconeStore } from "@langchain/pinecone"
import { PineconeConflictError } from "@pinecone-database/pinecone/dist/errors";
import {Index, RecordMetadata} from "@pinecone-database/pinecone"
import { adminDb } from "@/firebaseAdmin";
import { auth } from "@clerk/nextjs/server";
import { StringOutputParser } from "@langchain/core/output_parsers";


// Initialize the OpenAI model with API key and model name
const model = new ChatOpenAI({
    apiKey : process.env.OPENAI_API_KEY,
    modelName: "gpt-4o",
});

export const indexName = "papafam";

async function fetchMessagesFromDB(docId: string) {
    const { userId } = await auth();
    if (!userId) {
        throw new Error("User not found");
    }

    console.log("--- Fetching chat history from the firestore database... ---");
    // Get the last 6 messages from the chat history
    const chats = await adminDb
        .collection('users')
        .doc(userId)
        .collection("files")
        .doc(docId)
        .collection("chat")
        .orderBy("createdAt", "desc")
        //.limit(LIMIT) if you want to limit the number of messages fetched from the DB
        .get();

    const chatHistory = chats.docs.map((doc) => 
        doc.data().role === "human"
        ? new HumanMessage(doc.data().message)
        : new AIMessage(doc.data().message)
    );

    console.log(
        `--- fetched last ${chatHistory.length} messages successfully ---`
    );
    console.log(chatHistory.map((msg) => msg.content.toString()));

    return chatHistory;
}

//generateDocs helper function
export async function generateDocs(docId: string) {
    const { userId } = await auth();

    if (!userId) {
        throw new Error("User not found");
    }

    console.log("--- Fetching the download URL from Firebase... ---");
    const firebaseRef = await adminDb
        .collection("users")
        .doc(userId)
        .collection("files")
        .doc(docId)
        .get();
    
    const downloadUrl = firebaseRef.data()?.downloadUrl;

    if (!downloadUrl) {
        throw new Error("Download URL not found");
    }

    console.log(`--- Download URL fetched successfully: ${downloadUrl} ---`);

    //Fetch the PDF from the specific URL
    const response = await fetch(downloadUrl);

    //Load the PDF into a PDFDocument object
    const data = await response.blob();

    //Load the PDF document from the specific path
    console.log("--- Loading PDF document... ---");
    const loader = new PDFLoader(data);
    const docs = await loader.load();

    //Split the loaded document into smaller parts for easier processing
    console.log("--- Splitting the document into smaller parts... ---")
    const splitter = new RecursiveCharacterTextSplitter();

    const splitDocs = await splitter.splitDocuments(docs);
    console.log(`--- Split into ${splitDocs.length} parts ---`)

    return splitDocs;
}

//namespaceExists helper function that will return true if the namespace exists
async function namespaceExists(index: Index<RecordMetadata>, namespace: string) {
    if (namespace === null) throw new Error("No namespace value provided.");
    const { namespaces } = await index.describeIndexStats();
    return namespaces?.[namespace] !== undefined;
}

export async function generateEmbeddingsInPineconeVectorStore(docId: string) {
    //verify user on server side
    const { userId } = await auth();

    if (!userId) {
        throw new Error("User not found");
    }

    let pineconeVectorStore;

    // Generate embeddings (numberical representations) for the split documents
    console.log("--- Generating embeddings... ---");
    const embeddings = new OpenAIEmbeddings();

    //Connect to Pinecone
    const index = await pineconeClient.index(indexName);
   
    //Verify namespace exists. In our Pinecone implementation, every single namespace resembles a document
    const namespaceAlreadyExists = await namespaceExists(index, docId);

    if (namespaceAlreadyExists) {
        console.log(
          `--- Namespace ${docId} already exists, reusing existing embeddings... ---`  
        );

        pineconeVectorStore = await PineconeStore.fromExistingIndex(embeddings, {
            pineconeIndex: index,
            namespace: docId,
        });

        return pineconeVectorStore;
    }   else {
        // If the namespace does not exist, download the PDF from firestore via the stored Download URL & generate the
        // embeddings and store them in the Pinecone vector store
        const splitDocs = await generateDocs(docId);

        console.log(
            `--- Storing the embeddings in namespace ${docId} in the ${indexName} Pinecone vector store... ---`
        );

        //generate embeddings and store them in Pinecone
        pineconeVectorStore = await PineconeStore.fromDocuments(
            splitDocs,
            embeddings,
            {
                pineconeIndex: index,
                namespace: docId,
            }
        );
        return pineconeVectorStore;
    }
}

// Modify the generateLangchainCompletion function
const generateLangchainCompletion = async (docId: string, question: string) => {
    let pineconeVectorStore;

    pineconeVectorStore = await generateEmbeddingsInPineconeVectorStore(docId);
    if (!pineconeVectorStore) {
        throw new Error("Pinecone vector store not found");
    }
    // create a retriever to search through the vector store
    console.log("--- Creating a retriever... ---");
    const retriever = pineconeVectorStore.asRetriever();

    // Fetch the chat history from the database
    const chatHistory = await fetchMessagesFromDB(docId);

    // Define a prompt template for generating quiz questions
    console.log("--- Defining a prompt template... ---");
    const quizPrompt = ChatPromptTemplate.fromMessages([
        ["system", "You are a quiz generator. Create a unique multiple-choice question based on the following context:\n\n{context}\n\nProvide the question, four answer options (A, B, C, D), the correct answer letter, and a brief explanation of the correct answer. Format your response as a JSON object with the following structure:\n\n{{\n  \"question\": \"...\",\n  \"options\": {{\n    \"A\": \"...\",\n    \"B\": \"...\",\n    \"C\": \"...\",\n    \"D\": \"...\"\n  }},\n  \"correctAnswer\": \"...\",\n  \"explanation\": \"...\"\n}}"],
        ["human", "{input}"],
    ]);

    // Create a chain to generate the quiz question
    console.log("--- Creating the quiz generation chain... ---");
    const quizGenerationChain = await createStuffDocumentsChain({
        llm: model,
        prompt: quizPrompt,
    });

    // Create the main retrieval chain
    console.log("--- Creating the main retrieval chain... ---");
    const quizRetrievalChain = await createRetrievalChain({
        retriever: retriever,
        combineDocsChain: quizGenerationChain,
    });

    console.log("--- Generating a quiz question... ---");
    const response = await quizRetrievalChain.invoke({
        input: "Generate a multiple-choice question with explanation",
    });

    // Parse the response into a structured quiz question object
    const quizQuestion = JSON.parse(response.answer);
    return quizQuestion;
};

// Export the model and run the function
export { model, generateLangchainCompletion };