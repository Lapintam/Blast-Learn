import Link from "next/link";
import { ArrowRight } from "lucide-react";

export default function LandingPage() {
  return (
    <div className="mx-auto flex min-h-screen max-w-5xl flex-col justify-between px-6 py-24">
      <header>
        <div className="flex items-center justify-between">
          <div className="text-xs font-semibold uppercase tracking-[0.3em] text-slate-500">Ironsight</div>
          <div className="text-xs text-slate-500">Secure multi-tenant hospital policy intelligence</div>
        </div>
        <div className="mt-12 space-y-6">
          <div className="inline-flex rounded-full border border-slate-200 bg-white px-4 py-1 text-xs font-medium uppercase tracking-wide text-slate-500">
            Built for clinical governance teams
          </div>
          <h1 className="text-4xl font-extrabold tracking-tight text-slate-900 md:text-6xl">
            Operationalize every policy. Answer high-stakes questions backed by citations.
          </h1>
          <p className="max-w-2xl text-lg text-slate-600">
            Ironsight ingests system-wide and site-specific Markdown policies, builds a navigable hierarchy, and connects to
            Pinecone + Ollama for contextual RAG. Clinicians, compliance, and operations get auditable answers in seconds.
          </p>
          <div className="flex flex-wrap gap-3">
            <Link
              href="/dashboard"
              className="inline-flex items-center gap-2 rounded-md bg-blue-600 px-4 py-2 text-sm font-medium text-white shadow-sm transition hover:bg-blue-500"
            >
              Enter tenant console
              <ArrowRight className="h-4 w-4" />
            </Link>
            <Link
              href="/docs"
              className="inline-flex items-center gap-2 rounded-md border border-slate-300 bg-white px-4 py-2 text-sm font-medium text-slate-900 shadow-sm transition hover:border-blue-400"
            >
              View architecture brief
              <ArrowRight className="h-4 w-4" />
            </Link>
          </div>
        </div>
      </header>
      <footer className="mt-24 grid gap-6 rounded-xl border border-slate-200 bg-white p-6 shadow-sm md:grid-cols-3">
        <div>
          <div className="text-xs font-semibold uppercase tracking-wide text-slate-500">Tenant-first</div>
          <p className="mt-2 text-sm text-slate-600">
            Cognito OIDC federation, ALB header propagation, and Postgres row level security isolate every health system.
          </p>
        </div>
        <div>
          <div className="text-xs font-semibold uppercase tracking-wide text-slate-500">Governed ingestion</div>
          <p className="mt-2 text-sm text-slate-600">
            Upload nested Markdown hierarchies. Deterministic chunking and idempotent Pinecone upserts keep policy versions synced.
          </p>
        </div>
        <div>
          <div className="text-xs font-semibold uppercase tracking-wide text-slate-500">Metered by design</div>
          <p className="mt-2 text-sm text-slate-600">
            Stripe subscriptions + usage-based metering with hourly token aggregates ensure finance has instant visibility.
          </p>
        </div>
      </footer>
    </div>
  );
}
