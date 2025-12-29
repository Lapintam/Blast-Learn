import { ChatPanel } from "@/components/chat/ChatPanel";

export default function ChatPage() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-slate-900">Ask a policy question</h1>
        <p className="text-sm text-slate-500">Select relevant nodes in the library and gather sourced answers.</p>
      </div>
      <ChatPanel />
    </div>
  );
}
