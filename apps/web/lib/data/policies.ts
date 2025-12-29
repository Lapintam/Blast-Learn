import "server-only";
import { PolicyDocument, PolicyNode, PolicyVersion } from "@ironsight/common";
import { gatewayFetch } from "../api/gateway";
import { requireTenantSession } from "../auth/session";

export type PolicyTreeNode = PolicyNode & {
  document?: PolicyDocument & { latestVersion?: PolicyVersion | null };
  children: PolicyTreeNode[];
};

export type PolicyDocumentDetail = {
  document: PolicyDocument & { latestVersion?: PolicyVersion | null };
  breadcrumbs: PolicyNode[];
  relatedPolicies: PolicyDocument[];
};

function revivePolicyNode(node: PolicyTreeNode): PolicyTreeNode {
  return {
    ...node,
    document: node.document
      ? {
          ...node.document,
          effectiveAt: new Date(node.document.effectiveAt),
          reviewAt: node.document.reviewAt ? new Date(node.document.reviewAt) : undefined,
          latestVersion: node.document.latestVersion
            ? {
                ...node.document.latestVersion,
                ingestedAt: new Date(node.document.latestVersion.ingestedAt),
              }
            : undefined,
        }
      : undefined,
    children: node.children?.map(revivePolicyNode) ?? [],
  };
}

export async function getPolicyTree(): Promise<PolicyTreeNode[]> {
  const session = await requireTenantSession();
  const response = await gatewayFetch<PolicyTreeNode[]>("/policies/tree", { method: "GET" }, session);
  return response.map(revivePolicyNode);
}

export async function getPolicyDocumentDetail(documentId: string): Promise<PolicyDocumentDetail> {
  const session = await requireTenantSession();
  const detail = await gatewayFetch<PolicyDocumentDetail>(`/policies/${documentId}`, { method: "GET" }, session);
  return {
    ...detail,
    document: revivePolicyNode({ ...detail.document, children: [] }).document!,
    breadcrumbs: detail.breadcrumbs.map((node) => ({ ...node, createdAt: new Date(node.createdAt), updatedAt: new Date(node.updatedAt) })),
    relatedPolicies: detail.relatedPolicies.map((policy) => ({
      ...policy,
      effectiveAt: new Date(policy.effectiveAt),
      reviewAt: policy.reviewAt ? new Date(policy.reviewAt) : undefined,
    })),
  };
}
