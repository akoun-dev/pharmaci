"use client";

import { useEffect, useState } from "react";
import { Search, Loader2, MessageSquare, Send } from "lucide-react";
import { AppHeader } from "@/components/app/app-header";
import { useAppStore } from "@/lib/store";
import { api, formatRelative } from "@/lib/api";
import { Input } from "@/components/ui/input";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";

interface Conversation {
  otherUser: {
    id: string;
    name: string;
    role: string;
    avatarUrl: string | null;
  };
  lastMessage: {
    content: string;
    createdAt: string;
    senderId: string;
  };
  unreadCount: number;
}

interface UserSearchResult {
  id: string;
  name: string;
  email: string;
  role: string;
}

export function MessagesScreen() {
  const navigate = useAppStore((s) => s.navigate);
  const user = useAppStore((s) => s.user);
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [loading, setLoading] = useState(true);
  const [showNewChat, setShowNewChat] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [searchResults, setSearchResults] = useState<UserSearchResult[]>([]);
  const [searching, setSearching] = useState(false);

  useEffect(() => {
    void loadConversations();
  }, []);

  async function loadConversations() {
    setLoading(true);
    try {
      const res = await api.get<{ conversations: Conversation[] }>("/api/messages");
      setConversations(res.conversations);
    } catch {
      // ignore
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    if (!searchQuery.trim() || !showNewChat) return;
    const t = setTimeout(() => void searchUsers(), 200);
    return () => clearTimeout(t);
  }, [searchQuery, showNewChat]);

  async function searchUsers() {
    setSearching(true);
    try {
      const res = await api.get<{ users: UserSearchResult[] }>(
        `/api/users/search?q=${encodeURIComponent(searchQuery)}&limit=10`
      );
      setSearchResults(res.users);
    } catch {
      setSearchResults([]);
    } finally {
      setSearching(false);
    }
  }

  function openChat(userId: string) {
    setShowNewChat(false);
    setSearchQuery("");
    navigate("chat", { userId });
  }

  return (
    <div className="flex flex-col h-full">
      <AppHeader
        title="Messages"
        showBack
        rightSlot={
          <button
            onClick={() => setShowNewChat(true)}
            className="flex h-8 w-8 items-center justify-center rounded-full hover:bg-muted"
          >
            <Send className="h-4 w-4" />
          </button>
        }
      />

      <div className="flex-1 overflow-y-auto">
        {loading ? (
          <div className="flex justify-center py-10">
            <Loader2 className="h-6 w-6 animate-spin text-primary" />
          </div>
        ) : conversations.length === 0 ? (
          <div className="flex flex-col items-center py-16 text-muted-foreground">
            <MessageSquare className="h-12 w-12 mb-3 opacity-50" />
            <p className="text-sm">Aucune conversation</p>
            <Button
              variant="outline"
              size="sm"
              className="mt-3"
              onClick={() => setShowNewChat(true)}
            >
              Nouvelle conversation
            </Button>
          </div>
        ) : (
          <div className="divide-y divide-border">
            {conversations.map((conv) => (
              <button
                key={conv.otherUser.id}
                onClick={() => openChat(conv.otherUser.id)}
                className="flex w-full items-center gap-3 px-4 py-3 text-left transition-colors hover:bg-accent"
              >
                <div className="flex h-10 w-10 items-center justify-center rounded-full bg-primary/10 text-sm font-bold text-primary shrink-0">
                  {conv.otherUser.name.charAt(0).toUpperCase()}
                </div>
                <div className="min-w-0 flex-1">
                  <div className="flex items-center justify-between">
                    <p className="font-medium text-sm truncate">{conv.otherUser.name}</p>
                    <span className="text-[10px] text-muted-foreground shrink-0 ml-2">
                      {formatRelative(conv.lastMessage.createdAt)}
                    </span>
                  </div>
                  <p className="text-xs text-muted-foreground truncate">
                    {conv.lastMessage.senderId === user?.id ? "Vous: " : ""}
                    {conv.lastMessage.content}
                  </p>
                </div>
                {conv.unreadCount > 0 && (
                  <span className="flex h-5 min-w-5 items-center justify-center rounded-full bg-primary px-1 text-[10px] font-bold text-primary-foreground shrink-0">
                    {conv.unreadCount}
                  </span>
                )}
              </button>
            ))}
          </div>
        )}
      </div>

      {/* New chat dialog */}
      <Dialog open={showNewChat} onOpenChange={setShowNewChat}>
        <DialogContent className="max-w-sm">
          <DialogHeader>
            <DialogTitle>Nouvelle conversation</DialogTitle>
          </DialogHeader>
          <div className="relative">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Rechercher un utilisateur..."
              className="pl-9"
              autoFocus
            />
          </div>
          <div className="max-h-60 overflow-y-auto">
            {searching ? (
              <div className="flex justify-center py-4">
                <Loader2 className="h-4 w-4 animate-spin text-primary" />
              </div>
            ) : searchResults.length === 0 ? (
              <p className="py-4 text-center text-sm text-muted-foreground">
                {searchQuery ? "Aucun résultat" : "Tapez un nom pour rechercher"}
              </p>
            ) : (
              <div className="divide-y divide-border">
                {searchResults.map((u) => (
                  <button
                    key={u.id}
                    onClick={() => openChat(u.id)}
                    className="flex w-full items-center gap-3 px-2 py-2 text-left rounded-lg hover:bg-accent"
                  >
                    <div className="flex h-8 w-8 items-center justify-center rounded-full bg-primary/10 text-xs font-bold text-primary">
                      {u.name.charAt(0).toUpperCase()}
                    </div>
                    <div className="min-w-0 flex-1">
                      <p className="font-medium text-sm">{u.name}</p>
                      <p className="text-xs text-muted-foreground">{u.email}</p>
                    </div>
                  </button>
                ))}
              </div>
            )}
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
