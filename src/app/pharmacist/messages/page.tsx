"use client";

import { useEffect, useState } from "react";
import { MessageSquare, Send, UserRound } from "lucide-react";
import { useAppStore } from "@/lib/store";
import { api, formatRelative } from "@/lib/api";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

interface Conversation {
  otherUser: { id: string; name: string; role: string; avatarUrl: string | null };
  lastMessage: { content: string; createdAt: string; senderId: string };
  unreadCount: number;
}

interface Message {
  id: string;
  content: string;
  senderId: string;
  receiverId: string;
  createdAt: string;
}

export default function PharmacistMessagesPage() {
  const user = useAppStore((s) => s.user);
  const pushToast = useAppStore((s) => s.pushToast);
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [text, setText] = useState("");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    void loadConversations();
  }, []);

  useEffect(() => {
    if (selectedId) void loadConversation(selectedId);
  }, [selectedId]);

  async function loadConversations() {
    try {
      const res = await api.get<{ conversations: Conversation[] }>("/api/messages");
      setConversations(res.conversations);
      if (!selectedId && res.conversations[0]) setSelectedId(res.conversations[0].otherUser.id);
    } catch (error) {
      pushToast(error instanceof Error ? error.message : "Erreur de chargement", "error");
    } finally {
      setLoading(false);
    }
  }

  async function loadConversation(otherId: string) {
    try {
      const res = await api.get<{ messages: Message[] }>(`/api/messages/conversations/${otherId}`);
      setMessages(res.messages);
    } catch (error) {
      pushToast(error instanceof Error ? error.message : "Erreur de chargement", "error");
    }
  }

  async function sendMessage() {
    if (!selectedId || !text.trim()) return;
    const content = text.trim();
    setText("");
    try {
      await api.post("/api/messages", { receiverId: selectedId, content });
      await Promise.all([loadConversation(selectedId), loadConversations()]);
    } catch (error) {
      setText(content);
      pushToast(error instanceof Error ? error.message : "Erreur d'envoi", "error");
    }
  }

  const selected = conversations.find((item) => item.otherUser.id === selectedId);

  return (
    <div className="flex min-h-[calc(100vh-8rem)] flex-col gap-6">
      <div><p className="text-sm font-medium text-primary">Relation patient</p><h1 className="mt-1 text-3xl font-bold tracking-tight">Messages</h1><p className="mt-1 text-sm text-muted-foreground">Répondez aux demandes et accompagnez vos patients.</p></div>
      <Card className="min-h-[560px] flex-1 overflow-hidden">
        <CardContent className="grid h-full min-h-[560px] grid-cols-1 p-0 lg:grid-cols-[300px_1fr]">
          <aside className="border-b border-border lg:border-b-0 lg:border-r">
            <div className="border-b border-border p-4"><div className="relative"><MessageSquare className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" /><Input className="pl-9" placeholder="Rechercher une conversation" /></div></div>
            <div className="divide-y divide-border">
              {loading ? <p className="p-6 text-sm text-muted-foreground">Chargement...</p> : conversations.length === 0 ? <div className="flex flex-col items-center gap-2 p-8 text-center text-muted-foreground"><UserRound className="h-8 w-8 opacity-40" /><p className="text-sm">Aucune conversation</p></div> : conversations.map((conversation) => <button key={conversation.otherUser.id} onClick={() => setSelectedId(conversation.otherUser.id)} className={cn("flex w-full items-start gap-3 p-4 text-left hover:bg-muted/50", selectedId === conversation.otherUser.id && "bg-primary/5") }><div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-primary/10 text-sm font-bold text-primary">{conversation.otherUser.name.charAt(0)}</div><div className="min-w-0 flex-1"><div className="flex justify-between gap-2"><p className="truncate text-sm font-semibold">{conversation.otherUser.name}</p>{conversation.unreadCount > 0 && <span className="rounded-full bg-primary px-1.5 text-[10px] font-bold text-white">{conversation.unreadCount}</span>}</div><p className="mt-1 truncate text-xs text-muted-foreground">{conversation.lastMessage.content}</p></div></button>)}
            </div>
          </aside>
          <section className="flex min-h-[560px] flex-col">
            {selected ? <><div className="flex items-center gap-3 border-b border-border p-4"><div className="flex h-10 w-10 items-center justify-center rounded-full bg-primary/10 font-bold text-primary">{selected.otherUser.name.charAt(0)}</div><div><p className="text-sm font-semibold">{selected.otherUser.name}</p><p className="text-xs text-muted-foreground">Patient</p></div></div><div className="flex-1 space-y-3 overflow-y-auto bg-muted/20 p-5">{messages.map((message) => <div key={message.id} className={cn("flex", message.senderId === user?.id ? "justify-end" : "justify-start")}><div className={cn("max-w-[70%] rounded-2xl px-4 py-2.5 text-sm", message.senderId === user?.id ? "rounded-br-sm bg-primary text-primary-foreground" : "rounded-bl-sm bg-card shadow-sm")}><p>{message.content}</p><p className={cn("mt-1 text-[10px]", message.senderId === user?.id ? "text-primary-foreground/70" : "text-muted-foreground")}>{formatRelative(message.createdAt)}</p></div></div>)}</div><div className="flex gap-2 border-t border-border p-4"><Input value={text} onChange={(e) => setText(e.target.value)} onKeyDown={(e) => { if (e.key === "Enter") void sendMessage(); }} placeholder="Écrire une réponse..." /><Button onClick={() => void sendMessage()} disabled={!text.trim()}><Send className="h-4 w-4" /></Button></div></> : <div className="flex flex-1 flex-col items-center justify-center gap-3 text-center text-muted-foreground"><MessageSquare className="h-12 w-12 opacity-30" /><p className="text-sm">Sélectionnez une conversation</p></div>}
          </section>
        </CardContent>
      </Card>
    </div>
  );
}
