// Clinical RAG System for HIPAA-Compliant Medical Policy Management
// Enhanced with medical context understanding and extensive logging

import { ChatOpenAI } from "@langchain/openai";
import { PDFLoader } from "@langchain/community/document_loaders/fs/pdf";
import { RecursiveCharacterTextSplitter } from "langchain/text_splitter";
import { OpenAIEmbeddings } from "@langchain/openai";
import { createStuffDocumentsChain } from "langchain/chains/combine_documents";
import { ChatPromptTemplate } from "@langchain/core/prompts";
import { createRetrievalChain } from "langchain/chains/retrieval";
import { createHistoryAwareRetriever } from "langchain/chains/history_aware_retriever";
import { HumanMessage, AIMessage } from "@langchain/core/messages";
import pineconeClient from "./pinecone";
import { PineconeStore } from "@langchain/pinecone";
import { Index, RecordMetadata } from "@pinecone-database/pinecone";
import { adminDb } from "@/firebaseAdmin";
import { auth } from "@clerk/nextjs/server";

// HIPAA Compliance Logger
interface AuditLog {
  timestamp: string;
  userId: string;
  action: string;
  resourceId: string;
  resourceType: string;
  details: any;
  ipAddress?: string;
  userAgent?: string;
}

class ClinicalLogger {
  private static instance: ClinicalLogger;
  
  static getInstance(): ClinicalLogger {
    if (!ClinicalLogger.instance) {
      ClinicalLogger.instance = new ClinicalLogger();
    }
    return ClinicalLogger.instance;
  }

  async logAuditEvent(event: Partial<AuditLog>) {
    const timestamp = new Date().toISOString();
    const auditLog: AuditLog = {
      timestamp,
      userId: event.userId || 'anonymous',
      action: event.action || 'unknown',
      resourceId: event.resourceId || '',
      resourceType: event.resourceType || 'unknown',
      details: event.details || {},
      ...event
    };

    console.log(`[AUDIT] ${timestamp}: ${auditLog.action} by ${auditLog.userId} on ${auditLog.resourceType}:${auditLog.resourceId}`);
    
    // Store in Firebase for compliance
    try {
      await adminDb.collection('audit_logs').add(auditLog);
    } catch (error) {
      console.error('[AUDIT ERROR]', error);
    }
  }

  logDebug(component: string, message: string, data?: any) {
    const timestamp = new Date().toISOString();
    console.log(`[DEBUG] ${timestamp} [${component}]: ${message}`, data || '');
  }

  logError(component: string, error: string, data?: any) {
    const timestamp = new Date().toISOString();
    console.error(`[ERROR] ${timestamp} [${component}]: ${error}`, data || '');
  }
}

// Enhanced OpenAI model with medical specialization
const clinicalModel = new ChatOpenAI({
  apiKey: process.env.OPENAI_API_KEY,
  modelName: "gpt-4o",
  temperature: 0.1, // Lower temperature for more consistent medical responses
  maxTokens: 2000,
});

export const clinicalIndexName = "clinical-policies";
const logger = ClinicalLogger.getInstance();

// Import types from separate file to avoid client-side import issues
import { PolicyType, PolicyMetadata, ClinicalPolicy } from './clinical-types';

// Enhanced document processing for medical policies
export async function generateClinicalDocs(policyId: string) {
  const { userId } = await auth();
  
  if (!userId) {
    throw new Error("User not authenticated for clinical system access");
  }

  logger.logAuditEvent({
    userId,
    action: 'GENERATE_CLINICAL_DOCS',
    resourceId: policyId,
    resourceType: 'POLICY'
  });

  logger.logDebug('ClinicalRAG', 'Fetching policy document from Firebase', { policyId });

  const firebaseRef = await adminDb
    .collection("users")
    .doc(userId)
    .collection("clinical_policies")
    .doc(policyId)
    .get();

  const policyData = firebaseRef.data();
  if (!policyData) {
    logger.logError('ClinicalRAG', 'Policy document not found', { policyId });
    throw new Error("Policy document not found");
  }

  const downloadUrl = policyData.downloadUrl;
  const metadata: PolicyMetadata = policyData.metadata;

  logger.logDebug('ClinicalRAG', 'Policy metadata retrieved', metadata);

  // Fetch and process the PDF
  const response = await fetch(downloadUrl);
  const data = await response.blob();

  logger.logDebug('ClinicalRAG', 'Loading PDF document for processing');
  const loader = new PDFLoader(data);
  const docs = await loader.load();

  // Enhanced text splitter for medical documents
  const medicalSplitter = new RecursiveCharacterTextSplitter({
    chunkSize: 1500, // Larger chunks for medical context
    chunkOverlap: 300, // More overlap for continuity
    separators: [
      "\n\n### ", // Medical section headers
      "\n\n## ", 
      "\n\n# ",
      "\n\nPROCEDURE:",
      "\n\nINDICATION:",
      "\n\nCONTRAINDICATION:",
      "\n\nDOSAGE:",
      "\n\nWARNING:",
      "\n\n",
      "\n",
      " ",
      ""
    ]
  });

  const splitDocs = await medicalSplitter.splitDocuments(docs);
  
  // Enhance each document with medical metadata
  const enhancedDocs = splitDocs.map((doc) => ({
    ...doc,
    metadata: {
      ...doc.metadata,
      policyId,
      policyType: metadata.type,
      clinicalArea: metadata.clinicalArea,
      riskLevel: metadata.riskLevel,
      version: metadata.version,
      department: metadata.department,
      effectiveDate: metadata.effectiveDate
    }
  }));

  logger.logDebug('ClinicalRAG', 'Document processing completed', {
    totalChunks: enhancedDocs.length,
    policyType: metadata.type,
    riskLevel: metadata.riskLevel
  });

  return enhancedDocs;
}

// Enhanced namespace management for clinical policies
async function clinicalNamespaceExists(index: Index<RecordMetadata>, namespace: string) {
  if (!namespace) {
    logger.logError('ClinicalRAG', 'No namespace provided for existence check');
    throw new Error("No namespace value provided.");
  }
  
  try {
    const { namespaces } = await index.describeIndexStats();
    const exists = namespaces?.[namespace] !== undefined;
    
    logger.logDebug('ClinicalRAG', 'Namespace existence check', { namespace, exists });
    return exists;
  } catch (error) {
    logger.logError('ClinicalRAG', 'Error checking namespace existence', { namespace, error });
    throw error;
  }
}

// Enhanced embeddings generation with medical context
export async function generateClinicalEmbeddings(policyId: string) {
  const { userId } = await auth();

  if (!userId) {
    throw new Error("User not authenticated for clinical embeddings generation");
  }

  logger.logAuditEvent({
    userId,
    action: 'GENERATE_CLINICAL_EMBEDDINGS',
    resourceId: policyId,
    resourceType: 'POLICY'
  });

  let pineconeVectorStore;

  // Enhanced embeddings for medical content
  logger.logDebug('ClinicalRAG', 'Initializing medical embeddings model');
  const clinicalEmbeddings = new OpenAIEmbeddings({
    model: "text-embedding-3-large", // Higher quality embeddings for medical content
    dimensions: 3072
  });

  const index = await pineconeClient.index(clinicalIndexName);
  const namespaceExists = await clinicalNamespaceExists(index, policyId);

  if (namespaceExists) {
    logger.logDebug('ClinicalRAG', 'Reusing existing clinical embeddings', { policyId });
    
    pineconeVectorStore = await PineconeStore.fromExistingIndex(clinicalEmbeddings, {
      pineconeIndex: index,
      namespace: policyId,
    });

    return pineconeVectorStore;
  } else {
    logger.logDebug('ClinicalRAG', 'Generating new clinical embeddings', { policyId });
    
    const splitDocs = await generateClinicalDocs(policyId);

    pineconeVectorStore = await PineconeStore.fromDocuments(
      splitDocs,
      clinicalEmbeddings,
      {
        pineconeIndex: index,
        namespace: policyId,
      }
    );

    logger.logAuditEvent({
      userId,
      action: 'EMBEDDINGS_CREATED',
      resourceId: policyId,
      resourceType: 'POLICY',
      details: { chunksCount: splitDocs.length }
    });

    return pineconeVectorStore;
  }
}

// Fetch clinical chat history with enhanced privacy controls
async function fetchClinicalChatHistory(policyId: string) {
  const { userId } = await auth();
  if (!userId) {
    throw new Error("User not authenticated for chat history access");
  }

  logger.logAuditEvent({
    userId,
    action: 'FETCH_CLINICAL_CHAT_HISTORY',
    resourceId: policyId,
    resourceType: 'POLICY'
  });

  logger.logDebug('ClinicalRAG', 'Fetching clinical chat history', { policyId });
  
  const chats = await adminDb
    .collection('users')
    .doc(userId)
    .collection("clinical_policies")
    .doc(policyId)
    .collection("clinical_chat")
    .orderBy("createdAt", "desc")
    .limit(10) // Limit for performance and privacy
    .get();

  const chatHistory = chats.docs.map((doc) => 
    doc.data().role === "human"
      ? new HumanMessage(doc.data().message)
      : new AIMessage(doc.data().message)
  );

  logger.logDebug('ClinicalRAG', 'Chat history retrieved', { 
    messageCount: chatHistory.length,
    policyId 
  });

  return chatHistory;
}

// Enhanced clinical decision support with medical prompting
export const generateClinicalDecision = async (policyId: string, clinicalQuestion: string, patientContext?: string) => {
  const { userId } = await auth();
  
  if (!userId) {
    throw new Error("User not authenticated for clinical decision support");
  }

  logger.logAuditEvent({
    userId,
    action: 'GENERATE_CLINICAL_DECISION',
    resourceId: policyId,
    resourceType: 'POLICY',
    details: { 
      questionLength: clinicalQuestion.length,
      hasPatientContext: !!patientContext 
    }
  });

  logger.logDebug('ClinicalRAG', 'Starting clinical decision generation', {
    policyId,
    questionLength: clinicalQuestion.length
  });

  const pineconeVectorStore = await generateClinicalEmbeddings(policyId);
  if (!pineconeVectorStore) {
    logger.logError('ClinicalRAG', 'Failed to retrieve clinical vector store', { policyId });
    throw new Error("Clinical vector store not found");
  }

  // Enhanced retriever with clinical context
  const clinicalRetriever = pineconeVectorStore.asRetriever({
    k: 8, // More context for clinical decisions
    filter: {
      riskLevel: { $in: ['HIGH', 'CRITICAL', 'MEDIUM'] } // Prioritize high-risk content
    }
  });

  const chatHistory = await fetchClinicalChatHistory(policyId);

  // Specialized clinical decision prompt
  const clinicalPrompt = ChatPromptTemplate.fromMessages([
    ["system", `You are a clinical decision support AI assistant specialized in hospital policy interpretation. 

IMPORTANT GUIDELINES:
- You are providing decision support based on hospital policies, not direct medical advice
- Always reference specific policy sections and version numbers
- Highlight any safety considerations or contraindications
- Include relevant warnings and precautions
- Suggest when to escalate to senior clinicians or specialists
- Maintain HIPAA compliance in all responses

CONTEXT ANALYSIS:
{context}

CLINICAL QUESTION: {input}

${patientContext ? `PATIENT CONTEXT: ${patientContext}` : ''}

Provide a structured clinical decision support response including:
1. Relevant Policy References
2. Clinical Recommendations
3. Safety Considerations  
4. When to Escalate
5. Documentation Requirements

Format your response in a clear, actionable manner for healthcare professionals.`],
    ["human", "{input}"],
  ]);

  logger.logDebug('ClinicalRAG', 'Creating clinical decision chain');
  
  const clinicalDecisionChain = await createStuffDocumentsChain({
    llm: clinicalModel,
    prompt: clinicalPrompt,
  });

  const clinicalRetrievalChain = await createRetrievalChain({
    retriever: clinicalRetriever,
    combineDocsChain: clinicalDecisionChain,
  });

  logger.logDebug('ClinicalRAG', 'Invoking clinical decision chain');
  
  const response = await clinicalRetrievalChain.invoke({
    input: clinicalQuestion,
  });

  logger.logAuditEvent({
    userId, 
    action: 'CLINICAL_DECISION_GENERATED',
    resourceId: policyId,
    resourceType: 'POLICY',
    details: {
      responseLength: response.answer.length,
      sourceDocuments: response.context?.length || 0
    }
  });

  logger.logDebug('ClinicalRAG', 'Clinical decision generated successfully', {
    responseLength: response.answer.length,
    sourceCount: response.context?.length || 0
  });

  return {
    answer: response.answer,
    sources: response.context,
    metadata: {
      policyId,
      timestamp: new Date().toISOString(),
      userId,
      questionType: 'clinical_decision'
    }
  };
};

export { ClinicalLogger, clinicalModel };