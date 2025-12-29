import type { FastifyInstance } from "fastify";
import { withTenantTransaction } from "@ironsight/db";
import type { PolicyNode } from "@prisma/client";

function buildTree(nodes: PolicyNode & { document: any }[]) {
  const map = new Map<string, PolicyNode & { document: any; children: any[] }>();
  const roots: any[] = [];
  nodes.forEach((node) => {
    map.set(node.id, { ...node, children: [] });
  });
  nodes.forEach((node) => {
    const entry = map.get(node.id)!;
    if (node.parentId) {
      map.get(node.parentId)?.children.push(entry);
    } else {
      roots.push(entry);
    }
  });
  return roots;
}

export function registerPolicyRoutes(server: FastifyInstance) {
  server.get("/policies/tree", async (request, reply) => {
    const session = request.tenantSession;
    if (!session) {
      return reply.code(401).send({ error: "Unauthorized" });
    }

    const nodes = await withTenantTransaction(session.tenantId, (tx) =>
      tx.policyNode.findMany({
        include: {
          document: {
            include: {
              latestVersion: true,
            },
          },
        },
        orderBy: [{ depth: "asc" }, { name: "asc" }],
      }),
    );

    return buildTree(nodes);
  });

  server.get("/policies/:documentId", async (request, reply) => {
    const session = request.tenantSession;
    if (!session) {
      return reply.code(401).send({ error: "Unauthorized" });
    }

    const { documentId } = request.params as { documentId: string };

    const result = await withTenantTransaction(session.tenantId, async (tx) => {
      const document = await tx.policyDocument.findUnique({
        where: { id: documentId },
        include: {
          latestVersion: true,
          node: true,
        },
      });
      if (!document) return null;

      const breadcrumbs: PolicyNode[] = [];
      let current: PolicyNode | null | undefined = document.node as PolicyNode;
      while (current) {
        breadcrumbs.unshift(current);
        if (!current.parentId) break;
        current = await tx.policyNode.findUnique({ where: { id: current.parentId } });
      }

      const relatedPolicies = await tx.policyDocument.findMany({
        where: {
          tenantId: session.tenantId,
          category: document.category,
          id: { not: documentId },
        },
        take: 5,
      });

      return { document, breadcrumbs, relatedPolicies };
    });

    if (!result) {
      return reply.code(404).send({ error: "Policy not found" });
    }

    return result;
  });
}
