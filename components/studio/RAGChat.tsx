"use client";

import { useState, useRef, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { SendHorizonal, Loader2, AlertCircle, Sparkles } from "lucide-react";
import { cn } from "@/lib/utils";

interface Message {
  role: "user" | "assistant";
  content: string;
  sources?: string[];
  isError?: boolean;
}

interface RAGChatProps {
  programId: string;
  className?: string;
  programTitle?: string;
}

const EXAMPLE_QUESTIONS = [
  "What are the key concepts covered?",
  "Give me a 2-minute summary",
  "What are the main takeaways?",
  "How does this apply in practice?",
];

export function RAGChat({ programId, className, programTitle }: RAGChatProps) {
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  // Auto-scroll to bottom
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  // Auto-resize textarea
  function handleInput(e: React.ChangeEvent<HTMLTextAreaElement>) {
    setInput(e.target.value);
    if (textareaRef.current) {
      textareaRef.current.style.height = "auto";
      textareaRef.current.style.height = `${Math.min(textareaRef.current.scrollHeight, 120)}px`;
    }
  }

  async function handleSend(questionOverride?: string) {
    const trimmed = (questionOverride ?? input).trim();
    if (!trimmed || loading) return;

    const userMsg: Message = { role: "user", content: trimmed };
    setMessages((prev) => [...prev, userMsg]);
    setInput("");
    setLoading(true);

    if (textareaRef.current) {
      textareaRef.current.style.height = "auto";
    }

    try {
      const res = await fetch(`/api/program/${programId}/studio/chat`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ question: trimmed }),
      });
      const data = await res.json();

      if (!res.ok) {
        setMessages((prev) => [
          ...prev,
          {
            role: "assistant",
            content: data.error ?? `Request failed (${res.status})`,
            isError: true,
          },
        ]);
        return;
      }

      setMessages((prev) => [
        ...prev,
        {
          role: "assistant",
          content: data.answer,
          sources: data.sources ?? [],
        },
      ]);
    } catch {
      setMessages((prev) => [
        ...prev,
        {
          role: "assistant",
          content: "Failed to get a response. Check your connection and try again.",
          isError: true,
        },
      ]);
    } finally {
      setLoading(false);
    }
  }

  function handleKeyDown(e: React.KeyboardEvent<HTMLTextAreaElement>) {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  }

  return (
    <div className={cn("flex flex-col h-full", className)}>
      {/* Message list */}
      <div className="flex-1 overflow-y-auto space-y-4 mb-4 min-h-0">
        {messages.length === 0 && !loading && (
          <div className="flex flex-col items-center justify-center h-full min-h-48 text-center px-6 gap-4">
            <div className="size-10 rounded-full bg-primary/10 flex items-center justify-center">
              <Sparkles className="size-5 text-primary" />
            </div>
            <div>
              <p className="text-sm font-medium text-foreground">
                Ask anything about this program
              </p>
              <p className="text-xs text-muted-foreground mt-1 max-w-sm">
                {programTitle
                  ? `Get instant answers grounded in the source material for "${programTitle}".`
                  : "Get instant answers grounded in the source material."}
              </p>
            </div>
            <div className="flex flex-wrap gap-2 justify-center max-w-md">
              {EXAMPLE_QUESTIONS.map((q) => (
                <button
                  key={q}
                  onClick={() => handleSend(q)}
                  className="text-xs px-3 py-1.5 rounded-full border border-border bg-background hover:bg-muted hover:border-primary/40 transition-colors"
                >
                  {q}
                </button>
              ))}
            </div>
          </div>
        )}

        {messages.map((msg, i) => (
          <div
            key={i}
            className={cn("flex", msg.role === "user" ? "justify-end" : "justify-start")}
          >
            <div
              className={cn(
                "max-w-[80%] rounded-2xl px-4 py-3 text-sm leading-relaxed",
                msg.isError
                  ? "bg-rose-50 dark:bg-rose-950/30 border border-rose-200 dark:border-rose-800/50 text-rose-900 dark:text-rose-200 rounded-bl-md"
                  : msg.role === "user"
                    ? "bg-primary text-primary-foreground rounded-br-md"
                    : "bg-muted text-foreground rounded-bl-md"
              )}
            >
              {msg.isError && (
                <div className="flex items-center gap-1.5 mb-1.5 text-xs font-medium text-rose-700 dark:text-rose-300">
                  <AlertCircle className="size-3.5" />
                  Error
                </div>
              )}
              <div className="whitespace-pre-wrap">{msg.content}</div>

              {/* Sources */}
              {msg.role === "assistant" && !msg.isError && msg.sources && msg.sources.length > 0 && (
                <div className="mt-2 pt-2 border-t border-border/50">
                  <p className="text-[10px] font-medium text-muted-foreground mb-1 uppercase tracking-wide">
                    Sources
                  </p>
                  <div className="space-y-1">
                    {msg.sources.map((src, j) => (
                      <details
                        key={j}
                        className="text-[11px] text-muted-foreground leading-snug group"
                      >
                        <summary className="cursor-pointer hover:text-foreground list-none flex items-start gap-1">
                          <span className="select-none">▸</span>
                          <span className="group-open:hidden">
                            {src.length > 100 ? src.slice(0, 100) + "…" : src}
                          </span>
                          <span className="hidden group-open:inline">{src}</span>
                        </summary>
                      </details>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </div>
        ))}

        {/* Typing indicator */}
        {loading && (
          <div className="flex justify-start">
            <div className="bg-muted rounded-2xl rounded-bl-md px-4 py-3">
              <div className="flex items-center gap-1" aria-label="Assistant is typing">
                <span
                  className="size-1.5 rounded-full bg-muted-foreground/50 animate-bounce"
                  style={{ animationDelay: "0ms" }}
                />
                <span
                  className="size-1.5 rounded-full bg-muted-foreground/50 animate-bounce"
                  style={{ animationDelay: "160ms" }}
                />
                <span
                  className="size-1.5 rounded-full bg-muted-foreground/50 animate-bounce"
                  style={{ animationDelay: "320ms" }}
                />
              </div>
            </div>
          </div>
        )}

        <div ref={messagesEndRef} />
      </div>

      {/* Input area */}
      <div className="shrink-0 flex gap-2 items-end">
        <Textarea
          ref={textareaRef}
          value={input}
          onChange={handleInput}
          onKeyDown={handleKeyDown}
          placeholder="Ask about the program content…"
          rows={1}
          className="min-h-11 max-h-32 resize-none"
        />
        <Button
          size="icon"
          onClick={() => handleSend()}
          disabled={!input.trim() || loading}
          className="shrink-0 size-11"
          aria-label="Send message"
        >
          {loading ? (
            <Loader2 className="h-4 w-4 animate-spin" />
          ) : (
            <SendHorizonal className="h-4 w-4" />
          )}
        </Button>
      </div>
    </div>
  );
}
