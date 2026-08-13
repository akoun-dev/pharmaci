import { createServer } from "http";
import { Server, type Socket } from "socket.io";
import { PrismaClient } from "@prisma/client";
import { jwtVerify } from "jose";

const prisma = new PrismaClient();
const httpServer = createServer();

// --- JWT verification (shared with the Next.js app via JWT_SECRET) ---
const JWT_SECRET = process.env.JWT_SECRET;
const COOKIE_NAME = "pharmaci-token";
if (!JWT_SECRET) {
  console.error("JWT_SECRET environment variable is required for the WebSocket server");
  process.exit(1);
}
const encodedSecret = new TextEncoder().encode(JWT_SECRET);

async function verifyToken(token: string) {
  try {
    const { payload } = await jwtVerify(token, encodedSecret);
    return payload as { id: string; email: string; name: string; role: string };
  } catch {
    return null;
  }
}

// Parse the Cookie header from the handshake and extract a named cookie.
function readCookie(cookieHeader: string | undefined, name: string): string | null {
  if (!cookieHeader) return null;
  for (const part of cookieHeader.split(";")) {
    const [k, ...rest] = part.trim().split("=");
    if (k === name) return decodeURIComponent(rest.join("="));
  }
  return null;
}

// --- Allowed origin (restrict to the app to prevent CSWSH) ---
const ALLOWED_ORIGIN = process.env.WS_ALLOWED_ORIGIN || process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000";

const io = new Server(httpServer, {
  path: "/socket.io/",
  cors: {
    origin: ALLOWED_ORIGIN,
    methods: ["GET", "POST"],
    credentials: true,
  },
  pingTimeout: 60000,
  pingInterval: 25000,
});

// Track which users are online: userId -> Set<socketId>
const onlineUsers = new Map<string, Set<string>>();

// Extend the socket with a typed userId once authenticated.
interface AuthedSocket extends Socket {
  userId?: string;
}

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

// --- Authentication middleware: reject any socket without a valid session cookie ---
io.use(async (socket: AuthedSocket, next) => {
  const cookieHeader = socket.handshake.headers.cookie;
  const token = readCookie(cookieHeader, COOKIE_NAME);
  if (!token) {
    return next(new Error("Non authentifié"));
  }
  const payload = await verifyToken(token);
  if (!payload) {
    return next(new Error("Session invalide ou expirée"));
  }
  // Bind the userId strictly to the verified token; the client can no longer
  // impersonate another user.
  socket.userId = payload.id;
  next();
});

io.on("connection", (socket: AuthedSocket) => {
  const userId = socket.userId!;
  console.log(`[WS] Connexion authentifiée: ${userId} (socket: ${socket.id})`);

  addOnlineUser(userId, socket.id);
  socket.join(`user:${userId}`);

  // Send confirmation + online status of other users
  socket.emit("identified", {
    userId,
    onlineUsers: Array.from(onlineUsers.keys()),
  });

  // Broadcast to others that this user is online
  socket.broadcast.emit("user-status", { userId, isOnline: true });

  // Send a message
  socket.on("send-message", async (data: SendMessageData) => {
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

      io.to(`user:${receiverId}`).emit("new-message", messageData);
      socket.emit("message-sent", messageData);

      console.log(`[WS] Message envoyé: ${userId} -> ${receiverId}`);
    } catch (err) {
      console.error(`[WS] Erreur d'envoi:`, err);
      socket.emit("error", { message: "Erreur lors de l'envoi du message" });
    }
  });

  // Mark messages as read
  socket.on("mark-read", async (data: { senderId: string }) => {
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

      io.to(`user:${data.senderId}`).emit("messages-read", { readBy: userId });
    } catch {
      // ignore
    }
  });

  // Typing indicator
  socket.on("typing", (data: TypingData) => {
    if (!userId) return;
    io.to(`user:${data.receiverId}`).emit("typing-indicator", {
      userId,
      isTyping: data.isTyping,
    });
  });

  // Load conversation history
  socket.on("load-conversation", async (data: { otherUserId: string }) => {
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

      const unreadIds = messages
        .filter((m) => m.receiverId === userId && !m.isRead)
        .map((m) => m.id);

      if (unreadIds.length > 0) {
        await prisma.message.updateMany({
          where: { id: { in: unreadIds } },
          data: { isRead: true },
        });

        io.to(`user:${data.otherUserId}`).emit("messages-read", { readBy: userId });
      }

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
    if (userId) {
      removeOnlineUser(userId, socket.id);
      console.log(`[WS] Déconnexion: ${userId} (socket: ${socket.id})`);

      if (!isUserOnline(userId)) {
        socket.broadcast.emit("user-status", { userId, isOnline: false });
      }
    }
  });

  socket.on("error", (error) => {
    console.error(`[WS] Erreur socket (${socket.id}):`, error);
  });
});

const PORT = parseInt(process.env.WS_PORT || "3003", 10);
httpServer.listen(PORT, () => {
  console.log(`🚀 Serveur WebSocket démarré sur le port ${PORT}`);
});

// Graceful shutdown
async function shutdown() {
  console.log("Arrêt du serveur WebSocket...");
  httpServer.close(async () => {
    await prisma.$disconnect();
    process.exit(0);
  });
}
process.on("SIGTERM", shutdown);
process.on("SIGINT", shutdown);
