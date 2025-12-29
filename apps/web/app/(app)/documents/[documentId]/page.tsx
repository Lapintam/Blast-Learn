import { notFound } from "next/navigation";
import { Suspense } from "react";
import { PolicyTree } from "@/components/policies/PolicyTree";
import { PolicySummary } from "@/components/policies/PolicySummary";
import { Card, CardContent } from "@/components/ui/card";
import { getPolicyTree, getPolicyDocumentDetail } from "@/lib/data/policies";

export default async function DocumentDetailPage({ params }: { params: { documentId: string } }) {
  const [tree, detail] = await Promise.all([getPolicyTree(), getPolicyDocumentDetail(params.documentId)]);
  if (!detail) {
    notFound();
  }
  return (
    <div className="grid gap-6 lg:grid-cols-[320px,1fr]">
      <Card className="sticky top-4 h-full max-h-[calc(100vh-8rem)] overflow-y-auto">
        <CardContent className="pt-6">
          <h2 className="text-sm font-semibold uppercase tracking-wide text-slate-500">Hierarchy</h2>
          <p className="mt-1 text-xs text-slate-500">Browse policies by system or facility level.</p>
          <div className="mt-4">
            <PolicyTree tree={tree} selectedNodeId={params.documentId} />
          </div>
        </CardContent>
      </Card>
      <div className="space-y-6">
        <Suspense fallback={<div>Loading policy…</div>}>
          <PolicySummary detail={detail} />
        </Suspense>
      </div>
    </div>
  );
}
