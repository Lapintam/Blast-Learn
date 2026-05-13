# Application Schema PRD: Blast Learn

## Purpose
Full-stack RAG learning platform that turns uploaded PDFs into document-grounded quizzes, explanations, chat, and progress tracking.

## Runtime / Surfaces
- Web app: Next.js 14 App Router, React/TypeScript, Tailwind/DaisyUI.
- AI pipeline: LangChain, OpenAI chat/embeddings, Pinecone namespaces.
- Data/backend: Firebase Firestore, Firebase Storage, Firebase Admin, server actions/API routes.
- Commercial layer: Clerk auth and Stripe subscriptions.

## Core Schema
- `User`: Clerk-authenticated learner linked to Firestore ownership and subscription state.
- `Subscription`: tier, Stripe customer/subscription ids, document and quiz limits.
- `Document`: ownerId, title, storage path, page count, status, createdAt, quota metadata.
- `DocumentChunk`: documentId, chunk index, text, page references, embedding id, Pinecone namespace.
- `Quiz`: documentId, generatedAt, model, source chunk ids, attempt limits.
- `Question`: prompt, choices, correct answer, explanation, citation/source chunk.
- `QuizAttempt`: userId, quizId, answers, score, completedAt.
- `ChatMessage`: document-scoped learner question/answer with sources.

## Data Stores & Integrations
- Firebase Storage stores PDFs.
- Firestore stores user, document, quiz, attempt, and chat metadata.
- Pinecone stores vector embeddings per document namespace.
- Stripe webhooks synchronize paid/free limits.

## Future Edit Map
- Normalize document processing status across upload, chunk, embed, ready, and failed.
- Make quiz generation idempotent per document/version/model.
- Keep quota checks server-side and tied to `Subscription`.
- Store citations at question and answer level so future UI edits can always ground claims.
