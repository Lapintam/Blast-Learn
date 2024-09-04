'use server'

import { adminDb } from "@/firebaseAdmin";
import { auth } from "@clerk/nextjs/server";
import { generateLangchainCompletion } from "@/lib/langchain";

const PRO_LIMIT = 100;
const FREE_LIMIT = 3;

export async function askQuestion(id: string, question: string) {
    auth().protect();
    const { userId } = await auth();

    const quizRef = adminDb
        .collection("users")
        .doc(userId!)
        .collection("files")
        .doc(id)
        .collection("quiz");

    // check how many quiz questions are in the document
    const quizSnapshot = await quizRef.get();
    const quizCount = quizSnapshot.size;

    // Check membership limits for quizzes in a document
    const userRef = await adminDb.collection("users").doc(userId!).get();

    // Check if user is on FREE plan and has reached the FREE limit
    if (!userRef.data()?.hasActiveMembership) {
        if (quizCount >= FREE_LIMIT) {
            return {
                success: false,
                message: `You'll need to upgrade to PRO to generate more than ${FREE_LIMIT} quizzes!`,
            };
        }
    }

    // check if user is on PRO plan and has reached the PRO limit
    if (userRef.data()?.hasActiveMembership) {
        if (quizCount >= PRO_LIMIT) {
            return {
                success: false,
                message: `You've reached the PRO limit of ${PRO_LIMIT} quizzes per document!`,
            };
        }
    }

    try {
        // Generate the quiz question
        const quizQuestion = await generateLangchainCompletion(id, question);

        // Store the quiz question in Firestore
        await quizRef.add({
            ...quizQuestion,
            createdAt: new Date(),
        });

        return {
            success: true,
            quizQuestion,
        };
    } catch (err) {
        console.error("Error generating question:", err);
        return {
            success: false,
            message: "An error occurred while generating the question",
        };
    }
}