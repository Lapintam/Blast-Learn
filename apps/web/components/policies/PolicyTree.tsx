"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { ChevronDown, ChevronRight, FileText, Folder } from "lucide-react";
import { cn } from "@/lib/utils";
import type { PolicyTreeNode } from "@/lib/data/policies";

export type PolicyTreeProps = {
  tree: PolicyTreeNode[];
  selectedNodeId?: string;
  linkPrefix?: string;
};

type TreeState = Record<string, boolean>;

export function PolicyTree({ tree, selectedNodeId, linkPrefix = "/documents" }: PolicyTreeProps) {
  const [expanded, setExpanded] = useState<TreeState>({});
  const router = useRouter();

  const toggle = (id: string) => setExpanded((prev) => ({ ...prev, [id]: !prev[id] }));

  const renderNode = (node: PolicyTreeNode, depth = 0) => {
    const hasChildren = node.children && node.children.length > 0;
    const isExpanded = expanded[node.id] ?? depth < 1;
    const isActive = selectedNodeId === (node.document?.id ?? node.id);
    return (
      <div key={node.id} className={cn("space-y-1", depth > 0 && "pl-4")}>
        <button
          type="button"
          className={cn(
            "flex w-full items-center gap-2 rounded-md px-2 py-1 text-left text-sm transition",
            isActive ? "bg-blue-100 text-blue-700" : "text-slate-700 hover:bg-slate-100",
          )}
          onClick={() => {
            if (hasChildren) {
              toggle(node.id);
            }
            if (node.document) {
              router.push(`${linkPrefix}/${node.document.id}`);
            }
          }}
        >
          {hasChildren ? (
            isExpanded ? <ChevronDown className="h-4 w-4" /> : <ChevronRight className="h-4 w-4" />
          ) : (
            <FileText className="h-4 w-4" />
          )}
          {node.type === "FOLDER" ? <Folder className="h-4 w-4 text-slate-400" /> : null}
          <span className="truncate font-medium">{node.name}</span>
        </button>
        {hasChildren && isExpanded ? (
          <div>
            {node.children.map((child) => renderNode(child, depth + 1))}
          </div>
        ) : null}
      </div>
    );
  };

  return <div className="space-y-1">{tree.map((node) => renderNode(node))}</div>;
}
