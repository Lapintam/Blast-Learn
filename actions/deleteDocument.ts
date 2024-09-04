'use server'

import { adminDb, adminStorage } from "@/firebaseAdmin";
import { indexName } from "@/lib/langchain";
import pineconeClient from "@/lib/pinecone";
import { auth } from "@clerk/nextjs/server";
import { revalidatePath } from "next/cache";

// this document will be deleted from firestore, pinecone embeddings, and firebase storage

export async function deleteDocument(docId : string) {
  console.log("docId received upon clicking deleteDocument:", docId); // Log the received docId

  const { userId } = await auth();

  if (!userId) {
    throw new Error("userId is null or undefined");
  }

  if (!docId) {
    throw new Error("docId is null or undefined");
  }

  // Delete the document from the database
  await adminDb
    .collection("users")
    .doc(userId!)
    .collection("files")
    .doc(docId)
    .delete();

    // Delete from firebase storage
    await adminStorage
        .bucket(process.env.FIREBASE_STORAGE_BUCKET) // update with env variable
        .file(`users/${userId}/files/${docId}`)
        .delete();

    // Delete all embeddings associated with the document
    const index = await pineconeClient.index(indexName);
    await index.namespace(docId).deleteAll();

    // Revalidate the dashboard page to ensure the documents are up to date
    revalidatePath("/dashboard");
}
