# Blast Learn — Product Requirements Document (Scaffold)

> One-page schema reference. Living document; refine as features harden.

## 1. Product

An AI-powered learning platform that turns user-uploaded PDFs into RAG-grounded multiple-choice quizzes. Built on the testing-effect principle (Roediger & Karpicke; Karpicke & Blunt): active retrieval beats passive review. Free + Pro tiers, with per-document namespacing of embeddings so quizzes are grounded in a specific source.

> The repo also contains an in-progress migration toward a multi-tenant gateway / monorepo architecture (see §3). The current shipping product is the Firebase-backed single-app surface.

## 2. Users & Roles

| Role | Capability |
|---|---|
| **Free user** | 2 docs · 10 pages/PDF · 3 quizzes/doc · no deletion |
| **Pro user** ($5.99/mo) | 20 docs · 100 pages/PDF · 100 quizzes/doc · deletion |

Auth via Clerk; subscription state synced from Stripe webhooks; per-route protection in middleware.

## 3. Architecture

Hybrid: a Next.js 14 consumer app *plus* a pnpm-workspace monorepo extension with a Fastify gateway and microservices.

```
# Consumer app (root)
app/                       Next.js App Router pages + API
  page.tsx                 Landing
  dashboard/               Files list, upload, file viewer, upgrade
  webhook/route.ts         Stripe webhook
actions/                   Server Actions: askQuestion, generateEmbeddings,
                           createCheckoutSession, createStripePortal, deleteDocument
components/                Quiz, PdfView, FileUploader, etc. (per README)
hooks/                     useUpload, useSubscription
lib/                       LangChain config, Pinecone client, Stripe clients

# Monorepo extension (in-progress)
apps/
  gateway/                 Fastify API gateway — routes: health, ingest, policies,
                           query, tenants, usage; auth plugin; tenant-config
  web/                     Next.js front-end (built artifacts present)
packages/
  auth/                    Shared auth
  db/                      Prisma + Postgres schema (multi-tenant)
  vectors/                 Pinecone client + embedding helpers
  common/                  Shared types
services/
  ingest/                  PDF → chunks → embeddings pipeline
  llm/                     LLM inference / RAG orchestration
  billing/                 Stripe + usage metering
```

## 4. Data Model

Two co-existing stores reflecting the architecture migration:

**Firestore (current consumer app)**
| Collection | Notes |
|---|---|
| `users/{uid}` | Profile, Clerk-synced |
| `users/{uid}/files/{fileId}` | PDF metadata, storage ref, page count |
| `users/{uid}/files/{fileId}/messages/{msgId}` | Chat / quiz history per doc |
| `users/{uid}/subscriptions/{id}` | Stripe-Firebase subscription docs |
| Pinecone namespace = `{userId}/{fileId}` | Vector isolation per document |

**Postgres via Prisma (monorepo target — see [packages/db/prisma/schema.prisma](packages/db/prisma/schema.prisma))**
Multi-tenant model mirroring ISTXAI: `Tenant → Facility → TenantUser`, `PolicyNode → PolicyDocument → PolicyVersion → PolicyChunk`, plus `IngestJob`, `ChatSession`, `ChatMessage`, `UsageEvent`, `UsageAggregate`, `AuditEvent`, `ApiKey`.

## 5. Key Flows

1. **Sign up:** Clerk sign-up → user record provisioned in Firestore.
2. **Upload:** `dashboard/upload` → file to Firebase Storage → `generateEmbeddings` Server Action → LangChain splits → OpenAI embeddings → Pinecone (`{userId}/{fileId}` namespace) → metadata in Firestore.
3. **Quiz / Ask:** `askQuestion` Server Action → retrieve top-k from Pinecone (RAG) → GPT-4o generates MCQ + explanation → result rendered + persisted under `files/{id}/messages`.
4. **Upgrade:** `dashboard/upgrade` → `createCheckoutSession` → Stripe checkout → `app/webhook/route.ts` → subscription doc updated → tier limits enforced via `useSubscription`.
5. **Delete (Pro):** `deleteDocument` → Firestore + Storage + Pinecone namespace cleanup.

## 6. Integrations

Clerk · OpenAI (GPT-4o + embeddings) · Pinecone · LangChain · Firebase (Auth/Storage/Firestore + Admin) · Stripe · Vercel · Fastify (gateway) · Prisma + PostgreSQL (monorepo) · OpenTelemetry + Pino (observability).

## 7. Non-Functional

- **Vector isolation:** Per-document Pinecone namespace prevents cross-doc leakage.
- **Tier enforcement** lives on both client (UX) and server (Server Actions / webhook) — server is source of truth.
- **Build artifacts in repo:** `apps/web/.next/` is checked in; should be `.gitignore`d on the next monorepo cleanup pass.
- **Observability:** Pino structured logs + OpenTelemetry traces planned across services.
