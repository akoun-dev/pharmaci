"use client";

import { useEffect, useState, useRef, useMemo, useCallback } from "react";
import { Send, Loader2, Wifi, WifiOff } from "lucide-react";
import { AppHeader } from "@/components/app/app-header";
import { useAppStore } from "@/lib/store";
import { api } from "@/lib/api";
import { useWebSocket } from "@/hooks/use-websocket";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

interface Message {
  id: string;
  content: string;
  senderId: string;
  receiverId?: string;
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

const ROLE_LABELS: Record<string, string> = {
  PATIENT: "Patient",
  PHARMACIST: "Pharmacien",
  ADMIN: "Admin",
};

export function ChatScreen() {
  const params = useAppStore((s) => s.nav.params);
  const user = useAppStore((s) => s.user);
  const [messages, setMessages] = useState<Message[]>([]);
  const [otherUser, setOtherUser] = useState<OtherUser | null>(null);
  const [loading, setLoading] = useState(true);
  const [input, setInput] = useState("");
  const [otherTyping, setOtherTyping] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);
  const typingTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const otherId = params.userId;
  const [connectionLost, setConnectionLost] = useState(false);

  // WebSocket callbacks
  const handleNewMessage = useCallback((message: Message) => {
    // Only add messages from this conversation
    if (message.senderId === otherId || message.receiverId === otherId) {
      setMessages((prev) => {
        if (prev.some((m) => m.id === message.id)) return prev;
        return [...prev, message];
      });
    }
  }, [otherId]);

  const handleMessageSent = useCallback((message: Message) => {
    setMessages((prev) => {
      if (prev.some((m) => m.id === message.id)) return prev;
      return [...prev, message];
    });
  }, []);

  const handleConversationLoaded = useCallback((data: { messages: Message[]; otherUser: OtherUser }) => {
    setMessages(data.messages);
    setOtherUser(data.otherUser);
    setLoading(false);
  }, []);

  const handleTypingIndicator = useCallback((data: { userId: string; isTyping: boolean }) => {
    if (data.userId === otherId) {
      setOtherTyping(data.isTyping);
      if (data.isTyping && typingTimeoutRef.current) {
        clearTimeout(typingTimeoutRef.current);
      }
      if (data.isTyping) {
        typingTimeoutRef.current = setTimeout(() => setOtherTyping(false), 3000);
      }
    }
  }, [otherId]);

  const handleMessagesRead = useCallback((data: { readBy: string }) => {
    if (data.readBy === otherId) {
      setMessages((prev) => prev.map((m) => (m.senderId === user?.id ? { ...m, isRead: true } : m)));
    }
  }, [otherId, user?.id]);

  const {
    isConnected,
    sendMessage: wsSend,
    loadConversation,
    sendTyping,
    markAsRead,
  } = useWebSocket({
    onNewMessage: handleNewMessage,
    onMessageSent: handleMessageSent,
    onConversationLoaded: handleConversationLoaded,
    onTypingIndicator: handleTypingIndicator,
    onMessagesRead: handleMessagesRead,
  });

  // Connection status
  useEffect(() => {
    const timer = setTimeout(() => {
      if (!isConnected && !loading) setConnectionLost(true);
    }, 5000);
    if (isConnected) setConnectionLost(false);
    return () => clearTimeout(timer);
  }, [isConnected, loading]);

  // Load conversation on mount (with REST fallback if WS not connected)
  useEffect(() => {
    if (!otherId) return;

    if (isConnected) {
      loadConversation(otherId);
    } else {
      // Fallback: load via REST API
      void (async () => {
        try {
          const res = await api.get<{ messages: Message[]; otherUser: OtherUser }>(
            `/api/messages/conversations/${otherId}`
          );
          setMessages(res.messages);
          setOtherUser(res.otherUser);
          setLoading(false);
        } catch {
          useAppStore.getState().pushToast("Erreur de chargement de la conversation", "error");
          setLoading(false);
        }
      })();
    }

    return () => {
      if (typingTimeoutRef.current) clearTimeout(typingTimeoutRef.current);
    };
  }, [otherId, isConnected]);

  // Scroll to bottom on new messages
  useEffect(() => {
    scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight, behavior: "smooth" });
  }, [messages]);

  // Mark messages as read when conversation is opened
  useEffect(() => {
    if (otherId && messages.length > 0) {
      markAsRead(otherId);
    }
  }, [otherId, messages.length > 0]);

  async function handleSend() {
    const text = input.trim();
    if (!text) return;

    if (isConnected) {
      // Send via WebSocket (real-time)
      wsSend(otherId, text);
      setInput("");
      setOtherTyping(false);
    } else {
      // Fallback to REST API
      try {
        setLoading(true);
        await api.post("/api/messages", { receiverId: otherId, content: text });
        setInput("");
        setOtherTyping(false);
        // Reload conversation
        loadConversation(otherId);
      } catch (err) {
        useAppStore.getState().pushToast(
          err instanceof Error ? err.message : "Erreur",
          "error"
        );
      } finally {
        setLoading(false);
      }
    }
  }

  function handleKeyDown(e: React.KeyboardEvent) {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      void handleSend();
    }
  }

  // Send typing indicator
  function handleInputChange(e: React.ChangeEvent<HTMLInputElement>) {
    setInput(e.target.value);
    if (isConnected && e.target.value.trim()) {
      sendTyping(otherId, true);
    }
  }

  function handleInputBlur() {
    if (isConnected) {
      sendTyping(otherId, false);
    }
  }

  function formatDetailedTime(dateStr: string): string {
    const d = new Date(dateStr);
    const now = new Date();
    const diff = (now.getTime() - d.getTime()) / 1000;
    if (diff < 60) return "À l'instant";
    if (diff < 3600) return `Il y a ${Math.floor(diff / 60)} min`;
    return d.toLocaleTimeString("fr-FR", { hour: "2-digit", minute: "2-digit" });
  }

  // Group messages by date
  const messageGroups = useMemo(() => {
    const groups: { date: string; messages: Message[] }[] = [];
    for (const msg of messages) {
      const dateKey = new Date(msg.createdAt).toLocaleDateString("fr-FR", {
        day: "numeric",
        month: "long",
        year: "numeric",
      });
      const last = groups[groups.length - 1];
      if (last && last.date === dateKey) {
        last.messages.push(msg);
      } else {
        groups.push({ date: dateKey, messages: [msg] });
      }
    }
    return groups;
  }, [messages]);

  return (
    <div className="flex flex-col h-full">
      <AppHeader
        title={otherUser?.name || "Chat"}
        showBack
        subtitle={
          otherUser
            ? `${ROLE_LABELS[otherUser.role] || otherUser.role}${isConnected ? "" : " · Hors ligne"}`
            : undefined
        }
      />

      {/* Connection indicator */}
      {connectionLost && (
        <div className="flex items-center justify-center gap-1.5 bg-amber-500/10 py-1.5 text-[11px] font-medium text-amber-500">
          <WifiOff className="h-3 w-3" />
          Connexion perdue — reconnexion automatique...
          <button
            onClick={() => {
              setConnectionLost(false);
              if (otherId) loadConversation(otherId);
            }}
            className="ml-2 underline hover:text-amber-400"
          >
            Réessayer
          </button>
        </div>
      )}
      {isConnected && !loading && messages.length > 0 && (
        <div className="flex items-center justify-center gap-1.5 bg-green-500/10 py-0.5 text-[10px] font-medium text-green-500">
          <Wifi className="h-3 w-3" />
          Connecté en temps réel
        </div>
      )}

      {loading && messages.length === 0 ? (
        <div className="flex-1 flex items-center justify-center">
          <Loader2 className="h-6 w-6 animate-spin text-primary" />
        </div>
      ) : messages.length === 0 ? (
        <div className="flex-1 flex flex-col items-center justify-center px-4 text-center">
          <div className="flex h-14 w-14 items-center justify-center rounded-full bg-primary/10 text-primary mb-3">
            <Send className="h-6 w-6" />
          </div>
          <p className="text-sm font-medium text-foreground">Commencez la conversation</p>
          <p className="text-xs text-muted-foreground mt-1">
            Envoyez un message à {otherUser?.name || "cet utilisateur"} pour démarrer.
          </p>
        </div>
      ) : (
        <div ref={scrollRef} className="flex-1 overflow-y-auto px-4 py-3 space-y-3">
          {messageGroups.map((group) => (
            <div key={group.date}>
              <div className="flex justify-center mb-2">
                <span className="rounded-full bg-muted px-3 py-1 text-[10px] font-medium text-muted-foreground">
                  {group.date}
                </span>
              </div>
              {group.messages.map((msg) => {
                const isMine = msg.senderId === user?.id;
                return (
                  <div
                    key={msg.id}
                    className={cn("flex mb-2", isMine ? "justify-end" : "justify-start")}
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
                        {formatDetailedTime(msg.createdAt)}
                        {isMine && msg.isRead && " · Lu"}
                      </p>
                    </div>
                  </div>
                );
              })}
            </div>
          ))}
          {/* Typing indicator */}
          {otherTyping && (
            <div className="flex justify-start" aria-live="polite">
              <div className="rounded-2xl rounded-bl-md bg-muted px-3 py-2">
                <div className="flex items-center gap-1">
                  <span className="h-1.5 w-1.5 animate-bounce rounded-full bg-muted-foreground/40" style={{ animationDelay: "0ms" }} />
                  <span className="h-1.5 w-1.5 animate-bounce rounded-full bg-muted-foreground/40" style={{ animationDelay: "150ms" }} />
                  <span className="h-1.5 w-1.5 animate-bounce rounded-full bg-muted-foreground/40" style={{ animationDelay: "300ms" }} />
                </div>
              </div>
            </div>
          )}
        </div>
      )}

      <div className="border-t border-border px-3 py-2 flex items-center gap-2">
        <Input
          value={input}
          onChange={handleInputChange}
          onBlur={handleInputBlur}
          onKeyDown={handleKeyDown}
          placeholder={isConnected ? "Votre message..." : "Hors ligne - tapez pour envoyer..."}
          className="flex-1"
          aria-label="Votre message"
        />
        <Button
          size="icon"
          onClick={() => void handleSend()}
          disabled={!input.trim()}
          className="shrink-0"
        >
          <Send className="h-4 w-4" />
        </Button>
      </div>
    </div>
  );
}
