import Link from "next/link";

const architectureSections = [
  {
    title: "Data plane",
    description:
      "Next.js App Router UI, Fastify gateway, Pinecone vector store, Ollama inference via mTLS, and a multi-tenant Postgres with RLS serve policy intelligence.",
  },
  {
    title: "Tenant isolation",
    description:
      "Cognito-issued JWT tenant claims propagate via ALB headers. The gateway sets app.tenant_id on each Postgres session, Pinecone namespaces per tenant, and S3 prefixes with unique CMKs.",
  },
  {
    title: "Billing + compliance",
    description:
      "Stripe metered subscriptions sync hourly usage aggregates. Runbooks enforce encryption, WAF, IAM guardrails, database backups, and automated smoke tests.",
  },
];

export default function DocsPage() {
  return (
    <div className="mx-auto max-w-4xl space-y-8 px-6 py-16">
      <div className="space-y-3">
        <h1 className="text-3xl font-bold text-slate-900">Platform architecture</h1>
        <p className="text-sm text-slate-600">
          Ironsight orchestrates ingestion, retrieval, billing, and compliance across AWS. Review the components below or
          dive into the codebase.
        </p>
      </div>
      <ol className="space-y-6">
        {architectureSections.map((section, index) => (
          <li key={section.title} className="rounded-lg border border-slate-200 bg-white p-6 shadow-sm">
            <div className="text-xs font-semibold uppercase tracking-wider text-blue-500">Phase {index + 1}</div>
            <h2 className="mt-2 text-lg font-semibold text-slate-900">{section.title}</h2>
            <p className="mt-2 text-sm text-slate-600">{section.description}</p>
          </li>
        ))}
      </ol>
      <div className="rounded-lg border border-slate-200 bg-slate-50 p-6 text-sm text-slate-600">
        <p>
          Need more detail? Review the <Link href="/ingest" className="text-blue-600">ingestion pipeline</Link>, run sample RAG
          chats in <Link href="/chat" className="text-blue-600">Ask policies</Link>, or examine Terraform under <code>infra/terraform</code>.
        </p>
      </div>
    </div>
  );
}
