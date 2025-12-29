"use client";

import { useState } from "react";
import { SendHorizonal, Sparkles, Link as LinkIcon } from "lucide-react";
import { Textarea } from "../ui/textarea";
import { Button } from "../ui/button";
import { Badge } from "../ui/badge";
import { cn } from "@/lib/utils";

type ChatMessage = {
  role: "user" | "assistant";
  content: string;
  citations?: Array<{
    title: string;
    url: string;
    excerpt: string;
  }>;
};

export function ChatPanel() {
  const [question, setQuestion] = useState("");
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const askQuestion = async () => {
    if (!question.trim()) return;
    const newMessage: ChatMessage = { role: "user", content: question.trim() };
    setMessages((prev) => [...prev, newMessage]);
    setQuestion("");
    setIsLoading(true);
    setError(null);
    try {
      const response = await fetch("/api/query", {
        method: "POST",
        headers: {
          "content-type": "application/json",
        },
        body: JSON.stringify({ question: newMessage.content }),
      });
      if (!response.ok) {
        throw new Error(await response.text());
      }
      const data = await response.json();
      setMessages((prev) => [
        ...prev,
        {
          role: "assistant",
          content: data.answer as string,
          citations: (data.citations ?? []) as ChatMessage["citations"],
        },
      ]);
    } catch (err) {
      console.error(err);
      setError(err instanceof Error ? err.message : "Failed to run policy query");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="flex h-full flex-col rounded-lg border border-slate-200 bg-white">
      <div className="flex items-center gap-2 border-b border-slate-200 px-6 py-4">
        <Sparkles className="h-5 w-5 text-blue-500" />
        <div>
          <div className="text-sm font-semibold text-slate-900">Clinical policy assistant</div>
          <div className="text-xs text-slate-500">Ask complex operational or clinical questions and receive sourced answers.</div>
        </div>
      </div>
      <div className="flex-1 space-y-4 overflow-y-auto px-6 py-4">
        {messages.length === 0 ? (
          <div className="rounded-md border border-dashed border-slate-200 p-6 text-center text-sm text-slate-500">
            Ask something like "What is the escalation pathway for fall risk at Midtown campus?"
          </div>
        ) : (
          messages.map((message, index) => (
            <div key={index} className={cn("flex flex-col gap-2", message.role === "user" ? "items-end" : "items-start")}>
              <div
                className={cn(
                  "max-w-xl rounded-lg px-4 py-3 text-sm shadow-sm",
                  message.role === "user" ? "bg-blue-600 text-white" : "bg-slate-100 text-slate-800",
                )}
              >
                {message.content}
              </div>
              {message.citations && message.citations.length ? (
                <div className="space-y-2 text-xs text-slate-500">
                  {message.citations.map((citation, idx) => (
                    <a
                      key={`${citation.url}-${idx}`}
                      href={citation.url}
                      target="_blank"
                      rel="noreferrer"
                      className="flex items-start gap-2 rounded-md border border-slate-200 bg-white p-3 transition hover:border-blue-300"
                    >
                      <LinkIcon className="mt-0.5 h-3 w-3 text-blue-500" />
                      <div>
                        <div className="font-medium text-slate-700">{citation.title}</div>
                        <div className="text-slate-500">{citation.excerpt}</div>
                      </div>
                    </a>
                  ))}
                </div>
              ) : null}
            </div>
          ))
        )}
      </div>
      <div className="border-t border-slate-200 px-6 py-4">
        <Textarea
          rows={3}
          value={question}
          onChange={(event) => setQuestion(event.target.value)}
          placeholder="Ask a policy question..."
          disabled={isLoading}
        />
        <div className="mt-3 flex items-center justify-between">
          {error ? <Badge variant="warning">{error}</Badge> : <div className="text-xs text-slate-400">Usage is metered based on token volume.</div>}
          <Button onClick={askQuestion} disabled={isLoading || !question.trim()}>
            <SendHorizonal className="mr-2 h-4 w-4" />
            Submit question
          </Button>
        </div>
      </div>
    </div>
  );
}
