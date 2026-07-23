import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { getCurrentUser } from "@/lib/auth";

// GET /api/messages/conversations/[userId] - Messages avec un utilisateur spécifique
export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ userId: string }> }
) {
  const user = await getCurrentUser();
  if (!user) {
    return NextResponse.json({ error: "Non authentifié" }, { status: 401 });
  }

  const { userId: otherId } = await params;

  const otherUser = await db.user.findUnique({
    where: { id: otherId },
    select: { id: true, name: true, role: true, avatarUrl: true },
  });

  if (!otherUser) {
    return NextResponse.json({ error: "Utilisateur introuvable" }, { status: 404 });
  }

  const messages = await db.message.findMany({
    where: {
      OR: [
        { senderId: user.id, receiverId: otherId },
        { senderId: otherId, receiverId: user.id },
      ],
    },
    orderBy: { createdAt: "asc" },
    include: {
      sender: { select: { id: true, name: true, role: true, avatarUrl: true } },
    },
  });

  // Marquer les messages non lus comme lus
  const unreadIds = messages
    .filter((m) => m.receiverId === user.id && !m.isRead)
    .map((m) => m.id);

  if (unreadIds.length > 0) {
    await db.message.updateMany({
      where: { id: { in: unreadIds } },
      data: { isRead: true },
    });
  }

  return NextResponse.json({
    messages,
    otherUser,
  });
}
