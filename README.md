# Blast Learn

An AI-powered learning platform that transforms PDFs into interactive quiz experiences using Retrieval-Augmented Generation (RAG). Upload any document and Blast Learn generates contextual multiple-choice questions to reinforce understanding — grounded in the actual content of your files.

This is a hosted, full-stack RAG application and part of my portfolio, building on the patterns and infrastructure established across my other projects.

## Why Quizzing Works

Blast Learn is built on the **testing effect**, a well-established finding in cognitive neuroscience showing that actively retrieving information through quizzing produces significantly stronger long-term retention than passive review alone. Peer-reviewed research — including Roediger & Karpicke (2006) in *Psychological Science* and Karpicke & Blunt (2011) in *Science* — demonstrates that frequent, low-stakes testing improves recall, deepens comprehension, and helps learners identify gaps in their understanding. Blast Learn applies this principle by generating targeted quizzes directly from your study material, turning every uploaded document into an active learning session.

## How It Works

1. **Upload a PDF** — drag and drop into the dashboard
2. **Embeddings are generated** — the document is chunked, vectorized, and stored in Pinecone
3. **Take a quiz** — the AI retrieves relevant sections from the document and generates targeted questions with explanations
4. **Track progress** — quiz history is persisted per document

## Tech Stack

### Frontend
- **Next.js 14** (App Router, React Server Components)
- **React 18** with TypeScript
- **Tailwind CSS** + **DaisyUI** for styling
- **Radix UI** primitives (toast, slot)
- **Lucide React** icons
- **react-pdf** / **react-dropzone** for PDF viewing and upload

### AI / RAG Pipeline
- **LangChain** for orchestration (document loading, text splitting, prompt chaining)
- **OpenAI GPT-4o** for question generation and conversational retrieval
- **OpenAI Embeddings** for vector representation of document content
- **Pinecone** as the vector database, with per-document namespace isolation

### Backend & Data
- **Firebase Firestore** for user data, document metadata, quiz history, and chat messages
- **Firebase Storage** for PDF file hosting
- **Firebase Admin SDK** for secure server-side operations
- **Next.js Server Actions** for auth-protected mutations

### Authentication & Payments
- **Clerk** for user authentication, session management, and route protection
- **Stripe** for subscription billing (free and pro tiers) with webhook-driven status sync

### Infrastructure
- **Vercel** for deployment
- **pnpm** workspaces (monorepo with shared packages and microservices)
- **Fastify** services for LLM, document ingestion, and billing
- **Prisma** + **PostgreSQL** in shared database package
- **OpenTelemetry** + **Pino** for observability and structured logging

## Architecture

```
app/                    Next.js pages and API routes
components/             React components (Quiz, PdfView, FileUploader, etc.)
actions/                Server Actions (askQuestion, generateEmbeddings, etc.)
hooks/                  Custom React hooks (useUpload, useSubscription)
lib/                    LangChain config, Pinecone client, Stripe clients
packages/               Shared packages (auth, db, vectors, common)
services/               Microservices (llm, ingest, billing)
```

## Subscription Tiers

| Feature              | Free       | Pro ($5.99/mo) |
|----------------------|------------|----------------|
| Documents            | 2          | 20             |
| Max pages per PDF    | 10         | 100            |
| Quizzes per document | 3          | 100            |
| Document deletion    | No         | Yes            |

## Getting Started

```bash
pnpm install
pnpm dev
```

Requires environment variables for Clerk, OpenAI, Pinecone, Stripe, and Firebase. See `.env.local.example` for the full list.

## Portfolio Context

Blast Learn is one of several projects in my portfolio that demonstrate end-to-end product development — from AI integration and vector search to auth, payments, and deployment. Each project builds on shared infrastructure and lessons from the ones before it.
