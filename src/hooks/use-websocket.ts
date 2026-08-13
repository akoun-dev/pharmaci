"use client";

import { useEffect, useRef, useCallback, useState } from "react";
import { io, type Socket } from "socket.io-client";
import { useAppStore } from "@/lib/store";

interface WsMessage {
  id: string;
  content: string;
  senderId: string;
  receiverId: string;
  isRead: boolean;
  createdAt: string;
  sender: {
    id: string;
    name: string;
    role: string;
    avatarUrl: string | null;
  };
}

interface WsOtherUser {
  id: string;
  name: string;
  role: string;
  avatarUrl: string | null;
}

interface UseWebSocketOptions {
  /** Callback when a new message arrives */
  onNewMessage?: (message: WsMessage) => void;
  /** Callback when conversation is loaded */
  onConversationLoaded?: (data: {
    messages: WsMessage[];
    otherUser: WsOtherUser;
  }) => void;
  /** Callback when message is sent (confirmation from server) */
  onMessageSent?: (message: WsMessage) => void;
  /** Callback when messages are read by the other user */
  onMessagesRead?: (data: { readBy: string }) => void;
  /** Callback when typing indicator changes */
  onTypingIndicator?: (data: { userId: string; isTyping: boolean }) => void;
  /** Callback for online users list */
  onOnlineUsers?: (userIds: string[]) => void;
  /** Callback for user status change */
  onUserStatus?: (data: { userId: string; isOnline: boolean }) => void;
}

export function useWebSocket(options: UseWebSocketOptions = {}) {
  const socketRef = useRef<Socket | null>(null);
  const user = useAppStore((s) => s.user);
  const [isConnected, setIsConnected] = useState(false);
  const [onlineUserIds, setOnlineUserIds] = useState<string[]>([]);

  // Connect / disconnect based on auth state
  useEffect(() => {
    if (!user) return;

    // Connect on the same origin (proxied to the WS service by Caddy/the dev
    // proxy) so the http-only auth cookie is sent automatically. Authentication
    // is enforced server-side via the JWT in that cookie; the client no longer
    // sends a trust-on-client `userId`.
    const socketInstance = io({
      path: "/socket.io/",
      transports: ["websocket", "polling"],
      reconnection: true,
      reconnectionAttempts: 10,
      reconnectionDelay: 1000,
      reconnectionDelayMax: 5000,
      timeout: 10000,
      withCredentials: true,
    });

    socketRef.current = socketInstance;

    socketInstance.on("connect", () => {
      setIsConnected(true);
    });

    socketInstance.on("disconnect", () => {
      setIsConnected(false);
    });

    socketInstance.on("identified", (data: { userId: string; onlineUsers: string[] }) => {
      setOnlineUserIds(data.onlineUsers);
      options.onOnlineUsers?.(data.onlineUsers);
    });

    socketInstance.on("new-message", (message: WsMessage) => {
      options.onNewMessage?.(message);
    });

    socketInstance.on("message-sent", (message: WsMessage) => {
      options.onMessageSent?.(message);
    });

    socketInstance.on("conversation-loaded", (data: { messages: WsMessage[]; otherUser: WsOtherUser }) => {
      options.onConversationLoaded?.(data);
    });

    socketInstance.on("messages-read", (data: { readBy: string }) => {
      options.onMessagesRead?.(data);
    });

    socketInstance.on("typing-indicator", (data: { userId: string; isTyping: boolean }) => {
      options.onTypingIndicator?.(data);
    });

    socketInstance.on("user-status", (data: { userId: string; isOnline: boolean }) => {
      options.onUserStatus?.(data);
      setOnlineUserIds((prev) => {
        if (data.isOnline) {
          return prev.includes(data.userId) ? prev : [...prev, data.userId];
        } else {
          return prev.filter((id) => id !== data.userId);
        }
      });
    });

    socketInstance.on("error", (err: { message: string }) => {
      console.error("[WS] Erreur:", err.message);
    });

    return () => {
      socketInstance.disconnect();
      socketRef.current = null;
    };
  }, [user?.id]);

  /** Send a message via WebSocket */
  const sendMessage = useCallback(
    (receiverId: string, content: string) => {
      socketRef.current?.emit("send-message", { receiverId, content });
    },
    []
  );

  /** Load a conversation */
  const loadConversation = useCallback((otherUserId: string) => {
    socketRef.current?.emit("load-conversation", { otherUserId });
  }, []);

  /** Send typing indicator */
  const sendTyping = useCallback(
    (receiverId: string, isTyping: boolean) => {
      socketRef.current?.emit("typing", { receiverId, isTyping });
    },
    []
  );

  /** Mark messages as read */
  const markAsRead = useCallback((senderId: string) => {
    socketRef.current?.emit("mark-read", { senderId });
  }, []);

  return {
    isConnected,
    onlineUserIds,
    sendMessage,
    loadConversation,
    sendTyping,
    markAsRead,
  };
}
