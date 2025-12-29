import Link from "next/link";
import { Suspense } from "react";
import { PolicyTree } from "@/components/policies/PolicyTree";
import { PolicySummary } from "@/components/policies/PolicySummary";
import { Card, CardContent } from "@/components/ui/card";
import { getPolicyTree, getPolicyDocumentDetail } from "@/lib/data/policies";

export default async function DocumentsPage() {
  const tree = await getPolicyTree();
  const firstDocumentNode = tree.find((node) => node.document);
  return (
    <div className="grid gap-6 lg:grid-cols-[320px,1fr]">
      <Card className="sticky top-4 h-full max-h-[calc(100vh-8rem)] overflow-y-auto">
        <CardContent className="pt-6">
          <h2 className="text-sm font-semibold uppercase tracking-wide text-slate-500">Hierarchy</h2>
          <p className="mt-1 text-xs text-slate-500">Browse policies by system or facility level.</p>
          <div className="mt-4">
            <PolicyTree tree={tree} selectedNodeId={firstDocumentNode?.document?.id} />
          </div>
        </CardContent>
      </Card>
      <div className="space-y-6">
        {firstDocumentNode?.document ? (
          <Suspense fallback={<div>Loading policy…</div>}>
            <PolicyDetail documentId={firstDocumentNode.document.id} />
          </Suspense>
        ) : (
          <Card>
            <CardContent className="py-12 text-center text-sm text-slate-500">
              No policies ingested yet. <Link href="/ingest" className="text-blue-600">Upload your first hierarchy.</Link>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
}

async function PolicyDetail({ documentId }: { documentId: string }) {
  const detail = await getPolicyDocumentDetail(documentId);
  return <PolicySummary detail={detail} />;
}
