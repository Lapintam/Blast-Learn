'use client';

import { useState, useRef, useEffect } from "react";
import { useUser } from "@clerk/nextjs";
import { collection, addDoc, orderBy, query, onSnapshot, serverTimestamp } from "firebase/firestore";
import { db } from "@/firebase";
import { Send, Loader2, AlertTriangle, FileText, User, Bot, Shield } from "lucide-react";
import ReactMarkdown from "react-markdown";

interface Message {
  id?: string;
  role: 'human' | 'ai';
  message: string;
  timestamp: any;
  metadata?: {
    sources?: any[];
    confidence?: number;
    policyReferences?: string[];
  };
}

interface Props {
  policyId: string;
  policyData: any;
}

function ClinicalChatInterface({ policyId, policyData }: Props) {
  const [messages, setMessages] = useState<Message[]>([]);
  const [inputValue, setInputValue] = useState("");
  const [patientContext, setPatientContext] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [showPatientContext, setShowPatientContext] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const { user } = useUser();

  // Fetch messages from Firebase
  useEffect(() => {
    if (!user?.id) return;

    const q = query(
      collection(db, "users", user.id, "clinical_policies", policyId, "clinical_chat"),
      orderBy("createdAt", "asc")
    );

    const unsubscribe = onSnapshot(q, (snapshot) => {
      const msgs: Message[] = [];
      snapshot.forEach((doc) => {
        msgs.push({
          id: doc.id,
          ...doc.data()
        } as Message);
      });
      setMessages(msgs);
    });

    return () => unsubscribe();
  }, [user?.id, policyId]);

  // Auto scroll to bottom
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!inputValue.trim() || isLoading || !user?.id) return;

    const userMessage = inputValue.trim();
    setInputValue("");
    setIsLoading(true);

    try {
      // Save user message
      await addDoc(
        collection(db, "users", user.id, "clinical_policies", policyId, "clinical_chat"),
        {
          role: "human",
          message: userMessage,
          createdAt: serverTimestamp(),
        }
      );

      // Call clinical decision API
      const response = await fetch("/api/clinical-decision", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          policyId,
          question: userMessage,
          patientContext: patientContext.trim() || undefined,
        }),
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const result = await response.json();

      // Save AI response
      await addDoc(
        collection(db, "users", user.id, "clinical_policies", policyId, "clinical_chat"),
        {
          role: "ai",
          message: result.answer,
          createdAt: serverTimestamp(),
          metadata: {
            sources: result.sources,
            confidence: result.confidence,
            policyReferences: result.policyReferences,
          },
        }
      );

      console.log('[CLINICAL] Decision support response generated');
    } catch (error) {
      console.error("Error in clinical decision support:", error);
      
      // Add error message
      await addDoc(
        collection(db, "users", user.id, "clinical_policies", policyId, "clinical_chat"),
        {
          role: "ai",
          message: "I apologize, but I encountered an error while processing your clinical question. Please try again or contact your system administrator for assistance.",
          createdAt: serverTimestamp(),
          metadata: {
            error: true
          },
        }
      );
    } finally {
      setIsLoading(false);
    }
  };

  const formatTimestamp = (timestamp: any) => {
    if (!timestamp) return '';
    const date = timestamp.toDate ? timestamp.toDate() : new Date(timestamp);
    return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  };

  return (
    <div className="h-[calc(100vh-200px)] flex flex-col bg-gray-50 rounded-lg">
      {/* Clinical Context Panel */}
      <div className="bg-white border-b border-gray-200 p-4">
        <div className="flex items-center justify-between mb-3">
          <h3 className="text-lg font-semibold text-gray-800 flex items-center gap-2">
            <Shield className="w-5 h-5 text-blue-600" />
            Clinical Decision Support
          </h3>
          <button
            onClick={() => setShowPatientContext(!showPatientContext)}
            className="text-sm text-blue-600 hover:text-blue-800 underline"
          >
            {showPatientContext ? 'Hide' : 'Add'} Patient Context
          </button>
        </div>

        {showPatientContext && (
          <div className="mb-4">
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Patient Context (Optional - De-identified Information Only)
            </label>
            <textarea
              value={patientContext}
              onChange={(e) => setPatientContext(e.target.value)}
              placeholder="Provide relevant clinical context without identifying information (e.g., patient age range, condition type, relevant symptoms). This helps provide more targeted decision support."
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm"
              rows={3}
            />
          </div>
        )}

        <div className="flex items-center gap-4 text-sm text-gray-600">
          <div className="flex items-center gap-2">
            <AlertTriangle className="w-4 h-4 text-amber-500" />
            <span>For decision support only - not a substitute for clinical judgment</span>
          </div>
          <div className="flex items-center gap-2">
            <Shield className="w-4 h-4 text-green-500" />
            <span>HIPAA Compliant</span>
          </div>
        </div>
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        {messages.length === 0 && (
          <div className="text-center py-12">
            <div className="w-16 h-16 mx-auto bg-blue-100 rounded-full flex items-center justify-center mb-4">
              <Bot className="w-8 h-8 text-blue-600" />
            </div>
            <h3 className="text-lg font-medium text-gray-900 mb-2">
              Clinical Decision Support Ready
            </h3>
            <p className="text-gray-600 max-w-md mx-auto">
              Ask questions about &quot;{policyData?.name}&quot; to get AI-powered clinical decision support based on hospital policies and protocols.
            </p>
            <div className="mt-4 text-sm text-gray-500">
              <p>Example questions:</p>
              <ul className="mt-2 space-y-1">
                <li>• What are the contraindications for this procedure?</li>
                <li>• When should I escalate to a senior clinician?</li>
                <li>• What documentation is required?</li>
              </ul>
            </div>
          </div>
        )}

        {messages.map((message, index) => (
          <div
            key={message.id || index}
            className={`flex gap-3 ${message.role === 'human' ? 'justify-end' : 'justify-start'}`}
          >
            <div className={`flex gap-3 max-w-4xl ${message.role === 'human' ? 'flex-row-reverse' : 'flex-row'}`}>
              {/* Avatar */}
              <div className={`flex-shrink-0 w-8 h-8 rounded-full flex items-center justify-center ${
                message.role === 'human' 
                  ? 'bg-blue-600 text-white' 
                  : 'bg-gray-600 text-white'
              }`}>
                {message.role === 'human' ? (
                  <User className="w-4 h-4" />
                ) : (
                  <Bot className="w-4 h-4" />
                )}
              </div>

              {/* Message Content */}
              <div className={`flex-1 ${message.role === 'human' ? 'text-right' : 'text-left'}`}>
                <div className={`inline-block max-w-full px-4 py-3 rounded-lg ${
                  message.role === 'human'
                    ? 'bg-blue-600 text-white'
                    : 'bg-white border border-gray-200 text-gray-900'
                }`}>
                  {message.role === 'ai' ? (
                    <ReactMarkdown className="prose prose-sm max-w-none">
                      {message.message}
                    </ReactMarkdown>
                  ) : (
                    <p>{message.message}</p>
                  )}
                </div>

                {/* Metadata */}
                <div className="mt-1 text-xs text-gray-500 flex items-center gap-2">
                  <span>{formatTimestamp(message.timestamp)}</span>
                  {message.metadata?.sources && message.metadata.sources.length > 0 && (
                    <span className="flex items-center gap-1">
                      <FileText className="w-3 h-3" />
                      {message.metadata.sources.length} sources
                    </span>
                  )}
                  {(message.metadata as any)?.error && (
                    <span className="text-red-500 flex items-center gap-1">
                      <AlertTriangle className="w-3 h-3" />
                      Error
                    </span>
                  )}
                </div>
              </div>
            </div>
          </div>
        ))}

        {isLoading && (
          <div className="flex gap-3 justify-start">
            <div className="flex gap-3 max-w-4xl">
              <div className="flex-shrink-0 w-8 h-8 rounded-full bg-gray-600 text-white flex items-center justify-center">
                <Bot className="w-4 h-4" />
              </div>
              <div className="flex-1">
                <div className="inline-block bg-white border border-gray-200 px-4 py-3 rounded-lg">
                  <div className="flex items-center gap-2 text-gray-600">
                    <Loader2 className="w-4 h-4 animate-spin" />
                    <span>Analyzing policy and generating clinical decision support...</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        <div ref={messagesEndRef} />
      </div>

      {/* Input */}
      <div className="bg-white border-t border-gray-200 p-4">
        <form onSubmit={handleSubmit} className="flex gap-2">
          <input
            type="text"
            value={inputValue}
            onChange={(e) => setInputValue(e.target.value)}
            placeholder="Ask a clinical question about this policy..."
            className="flex-1 px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            disabled={isLoading}
          />
          <button
            type="submit"
            disabled={!inputValue.trim() || isLoading}
            className="px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
          >
            {isLoading ? (
              <Loader2 className="w-4 h-4 animate-spin" />
            ) : (
              <>
                <Send className="w-4 h-4" />
                Ask
              </>
            )}
          </button>
        </form>
        <div className="mt-2 text-xs text-gray-500 text-center">
          This AI assistant provides decision support based on hospital policies. Always use clinical judgment and consult colleagues when needed.
        </div>
      </div>
    </div>
  );
}

export default ClinicalChatInterface;