"use client";

import { useState, useEffect, useRef } from "react";
import { Card, CardContent } from "./ui/card";
import { Badge } from "./ui/badge";
import { Button } from "./ui/button";
import { Input } from "./ui/input";
import { Skeleton } from "./ui/skeleton";
import { useToast } from "./Toast";
import { MessageCircle, Send, ArrowLeft, User, Clock } from "lucide-react";
import Link from "next/link";

interface Conversation {
  bookingId: string;
  programTitle: string;
  companyName: string;
  status: string;
  trainerId: string;
  unreadCount: number;
  latestMessage: { content: string; senderName: string; createdAt: string } | null;
}

interface Message {
  id: string;
  content: string;
  senderId: string;
  sender: { id: string; name: string; role: string };
  receiverId: string;
  createdAt: string;
}

export default function MessagesInbox({ role }: { role: "HR" | "TRAINER" | "ADMIN" }) {
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [messages, setMessages] = useState<Message[]>([]);
  const [selected, setSelected] = useState<Conversation | null>(null);
  const [newMsg, setNewMsg] = useState("");
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);
  const [otherUserId, setOtherUserId] = useState("");
  const chatEndRef = useRef<HTMLDivElement>(null);
  const { toast } = useToast();

  // Fetch conversation list
  useEffect(() => {
    fetch("/api/messages?list=true")
      .then((r) => r.json())
      .then(setConversations)
      .catch(console.error)
      .finally(() => setLoading(false));
  }, []);

  // Poll for new messages every 10 seconds
  useEffect(() => {
    const interval = setInterval(() => {
      fetch("/api/messages?list=true")
        .then((r) => r.json())
        .then(setConversations)
        .catch(() => {});
    }, 10000);
    return () => clearInterval(interval);
  }, []);

  // Fetch messages when a conversation is selected
  useEffect(() => {
    if (!selected) return;
    fetch(`/api/messages?bookingId=${selected.bookingId}`)
      .then((r) => r.json())
      .then((data) => {
        setMessages(data);
        // Determine the other user's ID for sending
        if (data.length > 0) {
          const other = data.find((m: Message) => m.sender.role !== role);
          if (other) setOtherUserId(other.sender.id);
        }
      })
      .catch(console.error);
  }, [selected, role]);

  // Scroll to bottom on new messages
  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  async function handleSend() {
    if (!newMsg.trim() || !selected || !otherUserId) return;
    setSending(true);
    const res = await fetch("/api/messages", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        bookingId: selected.bookingId,
        content: newMsg.trim(),
        receiverId: otherUserId,
      }),
    });
    if (res.ok) {
      const msg = await res.json();
      setMessages((prev) => [...prev, msg]);
      setNewMsg("");
      // Refresh unread counts
      fetch("/api/messages?list=true").then(r => r.json()).then(setConversations).catch(() => {});
    } else {
      toast("Failed to send message", "error");
    }
    setSending(false);
  }

  function formatTime(iso: string) {
    const d = new Date(iso);
    const now = new Date();
    const diff = now.getTime() - d.getTime();
    if (diff < 86400000) return d.toLocaleTimeString("en-MY", { hour: "2-digit", minute: "2-digit" });
    if (diff < 604800000) return d.toLocaleDateString("en-MY", { weekday: "short" });
    return d.toLocaleDateString("en-MY", { day: "numeric", month: "short" });
  }

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="space-y-1"><Skeleton className="h-8 w-40" /><Skeleton className="h-4 w-56" /></div>
        <div className="grid gap-4 lg:grid-cols-3">
          <div className="space-y-2">
            {[...Array(6)].map((_, i) => <Skeleton key={i} className="h-16 w-full rounded-lg" />)}
          </div>
          <div className="lg:col-span-2">
            <Skeleton className="h-[500px] w-full rounded-lg" />
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Messages</h1>
        <p className="text-muted-foreground">
          {role === "ADMIN" ? "View all conversations across the platform" : `Chat with ${role === "HR" ? "trainers" : "HR representatives"} about your bookings`}
        </p>
      </div>

      <div className="grid gap-4 lg:grid-cols-3 h-[calc(100vh-220px)] min-h-[500px]">
        {/* Conversation list */}
        <Card className="lg:col-span-1 overflow-hidden flex flex-col">
          <div className="border-b px-4 py-3">
            <p className="text-sm font-semibold">Conversations</p>
          </div>
          <div className="flex-1 overflow-y-auto">
            {conversations.length === 0 ? (
              <div className="flex flex-col items-center justify-center h-full text-center p-6">
                <MessageCircle className="h-10 w-10 text-muted-foreground/40 mb-3" />
                <p className="text-sm text-muted-foreground">No messages yet</p>
                <p className="text-xs text-muted-foreground mt-1">
                  Messages appear here when you communicate about a booking
                </p>
              </div>
            ) : (
              conversations.map((c) => (
                <button
                  key={c.bookingId}
                  onClick={() => setSelected(c)}
                  className={`w-full text-left px-4 py-3 border-b hover:bg-accent/50 transition-colors ${
                    selected?.bookingId === c.bookingId ? "bg-accent" : ""
                  }`}
                >
                  <div className="flex items-start justify-between gap-2">
                    <div className="min-w-0 flex-1">
                      <p className="text-sm font-medium truncate">{c.programTitle}</p>
                      <p className="text-xs text-muted-foreground truncate">{c.companyName}</p>
                      {c.latestMessage && (
                        <p className="text-xs text-muted-foreground truncate mt-0.5">{c.latestMessage.content}</p>
                      )}
                    </div>
                    <div className="flex flex-col items-end gap-1 flex-shrink-0">
                      {c.latestMessage && (
                        <span className="text-[10px] text-muted-foreground">{formatTime(c.latestMessage.createdAt)}</span>
                      )}
                      {c.unreadCount > 0 && (
                        <Badge className="h-5 min-w-5 flex items-center justify-center text-[10px] px-1.5 bg-primary text-primary-foreground">
                          {c.unreadCount}
                        </Badge>
                      )}
                    </div>
                  </div>
                </button>
              ))
            )}
          </div>
        </Card>

        {/* Chat area */}
        <Card className="lg:col-span-2 flex flex-col overflow-hidden">
          {!selected ? (
            <div className="flex flex-col items-center justify-center h-full text-center p-6">
              <MessageCircle className="h-16 w-16 text-muted-foreground/20 mb-4" />
              <p className="text-lg font-semibold text-muted-foreground">Select a conversation</p>
              <p className="text-sm text-muted-foreground mt-1">
                Choose a booking from the left to view messages
              </p>
            </div>
          ) : (
            <>
              {/* Chat header */}
              <div className="border-b px-4 py-3 flex items-center justify-between">
                <div className="min-w-0">
                  <p className="text-sm font-semibold truncate">{selected.programTitle}</p>
                  <p className="text-xs text-muted-foreground">{selected.companyName}</p>
                </div>
                <Link
                  href={`/${role === "HR" ? "hr" : role === "ADMIN" ? "admin" : "trainer"}/bookings/${selected.bookingId}`}
                  className="text-xs text-primary hover:underline flex-shrink-0 ml-2"
                >
                  View booking
                </Link>
              </div>

              {/* Messages */}
              <div className="flex-1 overflow-y-auto p-4 space-y-3">
                {messages.map((m) => {
                  const isMine = m.sender.role === role;
                  return (
                    <div key={m.id} className={`flex ${isMine ? "justify-end" : "justify-start"}`}>
                      <div className={`max-w-[75%] space-y-1`}>
                        <div className={`flex items-center gap-1.5 ${isMine ? "justify-end" : "justify-start"}`}>
                          {!isMine && <User className="h-3 w-3 text-muted-foreground" />}
                          <span className="text-[10px] text-muted-foreground">{m.sender.name}</span>
                          <Clock className="h-2.5 w-2.5 text-muted-foreground/50" />
                          <span className="text-[10px] text-muted-foreground/50">{formatTime(m.createdAt)}</span>
                        </div>
                        <div
                          className={`rounded-lg px-3 py-2 text-sm ${
                            isMine
                              ? "bg-primary text-primary-foreground"
                              : "bg-muted"
                          }`}
                        >
                          {m.content}
                        </div>
                      </div>
                    </div>
                  );
                })}
                <div ref={chatEndRef} />
              </div>

              {/* Input */}
              <div className="border-t p-3 flex items-center gap-2">
                <Input
                  value={newMsg}
                  onChange={(e) => setNewMsg(e.target.value)}
                  onKeyDown={(e) => { if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); handleSend(); } }}
                  placeholder="Type a message..."
                  className="flex-1"
                />
                <Button size="icon" onClick={handleSend} disabled={sending || !newMsg.trim()}>
                  <Send className="h-4 w-4" />
                </Button>
              </div>
            </>
          )}
        </Card>
      </div>
    </div>
  );
}
