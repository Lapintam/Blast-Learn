'use server'

import { generateEmbeddingsInPineconeVectorStore } from "@/lib/langchain";
import { auth } from "@clerk/nextjs/server"
import { revalidatePath } from "next/cache";

export async function generateEmbeddings(docId: string) {
    auth().protect(); //Protect this route with Clerk

    //turn a PDF into embeddings
   await generateEmbeddingsInPineconeVectorStore(docId);

    revalidatePath('/dashboard'); //make sure to refetch the dashboard page

    return {completed: true};
}