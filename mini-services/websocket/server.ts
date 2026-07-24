import { createServer } from "http";
import { Server } from "socket.io";
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();
const httpServer = createServer();

const io = new Server(httpServer, {
  path: "/",
  cors: {
    origin: "*",
    methods: ["GET", "POST"],
  },
  pingTimeout: 60000,
  pingInterval: 25000,
});

// Track which users are online: userId -> Set<socketId>
const onlineUsers = new Map<string, Set<string>>();

interface SendMessageData {
  receiverId: string;
  content: string;
}

interface TypingData {
  receiverId: string;
  isTyping: boolean;
}

function addOnlineUser(userId: string, socketId: string) {
  const sockets = onlineUsers.get(userId) || new Set();
  sockets.add(socketId);
  onlineUsers.set(userId, sockets);
}

function removeOnlineUser(userId: string, socketId: string) {
  const sockets = onlineUsers.get(userId);
  if (!sockets) return;
  sockets.delete(socketId);
  if (sockets.size === 0) {
    onlineUsers.delete(userId);
  }
}

function isUserOnline(userId: string): boolean {
  return onlineUsers.has(userId);
}

io.on("connection", (socket) => {
  console.log(`[WS] Connexion: ${socket.id}`);

  // User identifies themselves after connecting
  socket.on("identify", (data: { userId: string; token: string }) => {
    const { userId, token } = data;

    // Basic validation: token should not be empty
    if (!userId || !token) {
      socket.emit("error", { message: "Identification invalide" });
      return;
    }

    // Store userId on socket for easy access
    (socket as any).userId = userId;
    addOnlineUser(userId, socket.id);

    // Join a personal room for targeted messages
    socket.join(`user:${userId}`);

    console.log(`[WS] Utilisateur identifié: ${userId} (socket: ${socket.id})`);

    // Send confirmation + online status of other users
    socket.emit("identified", {
      userId,
      onlineUsers: Array.from(onlineUsers.keys()),
    });

    // Broadcast to others that this user is online
    socket.broadcast.emit("user-status", {
      userId,
      isOnline: true,
    });
  });

  // Send a message
  socket.on("send-message", async (data: SendMessageData) => {
    const userId = (socket as any).userId;
    if (!userId) {
      socket.emit("error", { message: "Non identifié" });
      return;
    }

    const { receiverId, content } = data;

    if (!receiverId || !content?.trim()) {
      socket.emit("error", { message: "Données invalides" });
      return;
    }

    if (receiverId === userId) {
      socket.emit("error", { message: "Vous ne pouvez pas vous envoyer un message" });
      return;
    }

    try {
      // Persist to database
      const message = await prisma.message.create({
        data: {
          senderId: userId,
          receiverId,
          content: content.trim(),
        },
        include: {
          sender: {
            select: { id: true, name: true, role: true, avatarUrl: true },
          },
        },
      });

      const messageData = {
        id: message.id,
        content: message.content,
        senderId: message.senderId,
        receiverId,
        isRead: false,
        createdAt: message.createdAt.toISOString(),
        sender: message.sender,
      };

      // Emit to receiver in real-time (if online)
      io.to(`user:${receiverId}`).emit("new-message", messageData);

      // Also send back to sender with full data
      socket.emit("message-sent", messageData);

      console.log(`[WS] Message envoyé: ${userId} -> ${receiverId}`);
    } catch (err) {
      console.error(`[WS] Erreur d'envoi:`, err);
      socket.emit("error", { message: "Erreur lors de l'envoi du message" });
    }
  });

  // Mark messages as read
  socket.on("mark-read", async (data: { senderId: string }) => {
    const userId = (socket as any).userId;
    if (!userId || !data.senderId) return;

    try {
      await prisma.message.updateMany({
        where: {
          senderId: data.senderId,
          receiverId: userId,
          isRead: false,
        },
        data: { isRead: true },
      });

      // Notify the sender that messages were read
      io.to(`user:${data.senderId}`).emit("messages-read", {
        readBy: userId,
      });
    } catch {
      // ignore
    }
  });

  // Typing indicator
  socket.on("typing", (data: TypingData) => {
    const userId = (socket as any).userId;
    if (!userId) return;

    io.to(`user:${data.receiverId}`).emit("typing-indicator", {
      userId,
      isTyping: data.isTyping,
    });
  });

  // Load conversation history
  socket.on("load-conversation", async (data: { otherUserId: string }) => {
    const userId = (socket as any).userId;
    if (!userId || !data.otherUserId) return;

    try {
      const messages = await prisma.message.findMany({
        where: {
          OR: [
            { senderId: userId, receiverId: data.otherUserId },
            { senderId: data.otherUserId, receiverId: userId },
          ],
        },
        orderBy: { createdAt: "asc" },
        include: {
          sender: {
            select: { id: true, name: true, role: true, avatarUrl: true },
          },
        },
      });

      // Mark unread as read
      const unreadIds = messages
        .filter((m) => m.receiverId === userId && !m.isRead)
        .map((m) => m.id);

      if (unreadIds.length > 0) {
        await prisma.message.updateMany({
          where: { id: { in: unreadIds } },
          data: { isRead: true },
        });

        // Notify sender that messages were read
        io.to(`user:${data.otherUserId}`).emit("messages-read", {
          readBy: userId,
        });
      }

      // Get other user info
      const otherUser = await prisma.user.findUnique({
        where: { id: data.otherUserId },
        select: { id: true, name: true, role: true, avatarUrl: true },
      });

      socket.emit("conversation-loaded", {
        messages: messages.map((m) => ({
          id: m.id,
          content: m.content,
          senderId: m.senderId,
          receiverId: m.receiverId,
          isRead: m.isRead,
          createdAt: m.createdAt.toISOString(),
          sender: m.sender,
        })),
        otherUser,
      });
    } catch (err) {
      console.error(`[WS] Erreur chargement conversation:`, err);
      socket.emit("error", { message: "Erreur de chargement" });
    }
  });

  // Disconnect
  socket.on("disconnect", () => {
    const userId = (socket as any).userId;
    if (userId) {
      removeOnlineUser(userId, socket.id);
      console.log(`[WS] Déconnexion: ${userId} (socket: ${socket.id})`);

      // If user has no more active sockets, broadcast offline
      if (!isUserOnline(userId)) {
        socket.broadcast.emit("user-status", {
          userId,
          isOnline: false,
        });
      }
    }
  });

  socket.on("error", (error) => {
    console.error(`[WS] Erreur socket (${socket.id}):`, error);
  });
});

const PORT = 3003;
httpServer.listen(PORT, () => {
  console.log(`🚀 Serveur WebSocket démarré sur le port ${PORT}`);
});

// Graceful shutdown
process.on("SIGTERM", async () => {
  console.log("Arrêt du serveur WebSocket...");
  httpServer.close(async () => {
    await prisma.$disconnect();
    process.exit(0);
  });
});

process.on("SIGINT", async () => {
  console.log("Arrêt du serveur WebSocket...");
  httpServer.close(async () => {
    await prisma.$disconnect();
    process.exit(0);
  });
});
