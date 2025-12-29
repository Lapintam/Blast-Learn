import { gatewayFetch } from "../api/gateway";
import { requireTenantSession } from "../auth/session";

export type ChatMessage = {
  role: "user" | "assistant" | "system";
  content: string;
  sources?: Array<{
    documentId: string;
    versionId: string;
    title: string;
    url: string;
    excerpt: string;
  }>;
};

export type ChatRequestPayload = {
  question: string;
  contextNodeIds?: string[];
  facilityId?: string;
  stream?: boolean;
};

export type ChatResponse = {
  answer: string;
  citations: ChatMessage["sources"];
  usage: {
    inputTokens: number;
    outputTokens: number;
    totalTokens: number;
  };
};

export async function askPolicyQuestion(payload: ChatRequestPayload): Promise<ChatResponse> {
  const session = await requireTenantSession();
  return gatewayFetch<ChatResponse>(
    "/query",
    {
      method: "POST",
      body: JSON.stringify(payload),
    },
    session,
  );
}
