import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { db } from "@/lib/db";
import { getCurrentUser } from "@/lib/auth";

const sendMessageSchema = z.object({
  receiverId: z.string().min(1),
  content: z.string().min(1, "Le message ne peut pas être vide").max(2000),
});

// GET - Liste des conversations de l'utilisateur
export async function GET() {
  const user = await getCurrentUser();
  if (!user) {
    return NextResponse.json({ error: "Non authentifié" }, { status: 401 });
  }

  const messages = await db.message.findMany({
    where: {
      OR: [{ senderId: user.id }, { receiverId: user.id }],
    },
    orderBy: { createdAt: "desc" },
    include: {
      sender: { select: { id: true, name: true, role: true, avatarUrl: true } },
      receiver: { select: { id: true, name: true, role: true, avatarUrl: true } },
    },
  });

  // Grouper par conversation (l'autre utilisateur)
  const conversationMap = new Map<
    string,
    {
      otherUser: { id: string; name: string; role: string; avatarUrl: string | null };
      lastMessage: typeof messages[0];
      unreadCount: number;
    }
  >();

  for (const msg of messages) {
    const otherId = msg.senderId === user.id ? msg.receiverId : msg.senderId;
    const other = msg.senderId === user.id ? msg.receiver : msg.sender;

    if (!conversationMap.has(otherId)) {
      conversationMap.set(otherId, {
        otherUser: other,
        lastMessage: msg,
        unreadCount: 0,
      });
    }

    if (msg.receiverId === user.id && !msg.isRead) {
      const conv = conversationMap.get(otherId)!;
      conv.unreadCount++;
    }
  }

  const conversations = Array.from(conversationMap.values());

  return NextResponse.json({ conversations });
}

// POST - Envoyer un message
export async function POST(req: NextRequest) {
  const user = await getCurrentUser();
  if (!user) {
    return NextResponse.json({ error: "Non authentifié" }, { status: 401 });
  }

  // Rate limit message sending per user to prevent spam
  const { rateLimit } = await import("@/lib/rate-limit");
  const limited = rateLimit(req, {
    limit: 10,
    windowMs: 15 * 60 * 1000, // 15 minutes
    keyExtra: `msg:${user.id}`,
  });
  if (limited) return limited;

  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Corps invalide" }, { status: 400 });
  }

  const parsed = sendMessageSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { error: "Données invalides", details: parsed.error.flatten() },
      { status: 400 }
    );
  }

  const { receiverId, content } = parsed.data;

  if (receiverId === user.id) {
    return NextResponse.json({ error: "Vous ne pouvez pas vous envoyer un message" }, { status: 400 });
  }

  const receiver = await db.user.findUnique({
    where: { id: receiverId },
    select: { id: true },
  });
  if (!receiver) {
    return NextResponse.json({ error: "Destinataire introuvable" }, { status: 404 });
  }

  const message = await db.message.create({
    data: {
      senderId: user.id,
      receiverId,
      content,
    },
    include: {
      sender: { select: { id: true, name: true, role: true, avatarUrl: true } },
      receiver: { select: { id: true, name: true, role: true, avatarUrl: true } },
    },
  });

  return NextResponse.json({ message }, { status: 201 });
}
