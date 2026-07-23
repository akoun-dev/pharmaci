"use client";

import { useEffect, useState, useRef } from "react";
import { Send, Loader2 } from "lucide-react";
import { AppHeader } from "@/components/app/app-header";
import { useAppStore } from "@/lib/store";
import { api, formatRelative } from "@/lib/api";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

interface Message {
  id: string;
  content: string;
  senderId: string;
  isRead: boolean;
  createdAt: string;
  sender: {
    id: string;
    name: string;
    role: string;
    avatarUrl: string | null;
  };
}

interface OtherUser {
  id: string;
  name: string;
  role: string;
  avatarUrl: string | null;
}

export function ChatScreen() {
  const params = useAppStore((s) => s.nav.params);
  const user = useAppStore((s) => s.user);
  const goBack = useAppStore((s) => s.goBack);
  const [messages, setMessages] = useState<Message[]>([]);
  const [otherUser, setOtherUser] = useState<OtherUser | null>(null);
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);
  const [input, setInput] = useState("");
  const scrollRef = useRef<HTMLDivElement>(null);
  const otherId = params.userId;

  useEffect(() => {
    void loadMessages();
    const interval = setInterval(() => void loadMessages(false), 5000);
    return () => clearInterval(interval);
  }, [otherId]);

  useEffect(() => {
    scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight, behavior: "smooth" });
  }, [messages]);

  async function loadMessages(silent = true) {
    if (silent) setLoading(true);
    try {
      const res = await api.get<{ messages: Message[]; otherUser: OtherUser }>(
        `/api/messages/conversations/${otherId}`
      );
      setMessages(res.messages);
      setOtherUser(res.otherUser);
    } catch {
      // ignore
    } finally {
      setLoading(false);
    }
  }

  async function handleSend() {
    const text = input.trim();
    if (!text || sending) return;
    setSending(true);
    try {
      await api.post("/api/messages", { receiverId: otherId, content: text });
      setInput("");
      await loadMessages();
    } catch (err) {
      useAppStore.getState().pushToast(
        err instanceof Error ? err.message : "Erreur",
        "error"
      );
    } finally {
      setSending(false);
    }
  }

  function handleKeyDown(e: React.KeyboardEvent) {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      void handleSend();
    }
  }

  const ROLE_LABELS: Record<string, string> = {
    PATIENT: "Patient",
    PHARMACIST: "Pharmacien",
    ADMIN: "Admin",
  };

  return (
    <div className="flex flex-col h-full">
      <AppHeader
        title={otherUser?.name || "Chat"}
        showBack
      />

      {loading && messages.length === 0 ? (
        <div className="flex-1 flex items-center justify-center">
          <Loader2 className="h-6 w-6 animate-spin text-primary" />
        </div>
      ) : (
        <div ref={scrollRef} className="flex-1 overflow-y-auto px-4 py-3 space-y-2">
          {messages.map((msg) => {
            const isMine = msg.senderId === user?.id;
            return (
              <div
                key={msg.id}
                className={cn("flex", isMine ? "justify-end" : "justify-start")}
              >
                <div
                  className={cn(
                    "max-w-[80%] rounded-2xl px-3 py-2",
                    isMine
                      ? "bg-primary text-primary-foreground rounded-br-md"
                      : "bg-muted rounded-bl-md"
                  )}
                >
                  <p className="text-sm whitespace-pre-wrap break-words">{msg.content}</p>
                  <p
                    className={cn(
                      "text-[10px] mt-0.5",
                      isMine ? "text-primary-foreground/70" : "text-muted-foreground"
                    )}
                  >
                    {formatRelative(msg.createdAt)}
                    {isMine && msg.isRead && " · Lu"}
                  </p>
                </div>
              </div>
            );
          })}
        </div>
      )}

      <div className="border-t border-border px-3 py-2 flex items-center gap-2">
        <Input
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={handleKeyDown}
          placeholder="Votre message..."
          className="flex-1"
          disabled={sending}
        />
        <Button
          size="icon"
          onClick={() => void handleSend()}
          disabled={!input.trim() || sending}
          className="shrink-0"
        >
          {sending ? (
            <Loader2 className="h-4 w-4 animate-spin" />
          ) : (
            <Send className="h-4 w-4" />
          )}
        </Button>
      </div>
    </div>
  );
}
