import { NextRequest } from "next/server";
import { db } from "@/lib/db";
import { getSession } from "@/lib/auth";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

// Maximum connection duration (30 minutes) to prevent resource exhaustion
const MAX_CONNECTION_DURATION_MS = 30 * 60 * 1000;
// Polling interval increased from 15s to 30s for better performance
const POLL_INTERVAL_MS = 30000;

// GET /api/notifications/stream - SSE endpoint for real-time order notifications
// Supports PATIENT, PHARMACIST, and ADMIN roles
export async function GET(req: NextRequest) {
  const session = await getSession();
  if (!session) {
    return new Response("Non authentifié", { status: 401 });
  }

  const encoder = new TextEncoder();
  
  // Set a timeout to close the connection after max duration
  const connectionStartTime = Date.now();
  const maxDurationTimeout = setTimeout(() => {
    // Connection will be closed by returning from the start function
  }, MAX_CONNECTION_DURATION_MS);

  let previousStatusMap = new Map<string, string>();
  let previousPendingCount = 0;

  const stream = new ReadableStream({
    async start(controller) {
      // Send initial connection event
      controller.enqueue(
        encoder.encode(`event: connected\ndata: {"message":"Connecté aux notifications"}\n\n`)
      );

      const poll = async () => {
        // Check if we've exceeded max connection duration
        if (Date.now() - connectionStartTime > MAX_CONNECTION_DURATION_MS) {
          controller.close();
          clearTimeout(maxDurationTimeout);
          return;
        }
        
        try {
          let where: Record<string, unknown> = {};
          let role: string = session.role;
          let pharmacyId: string | null = null;

          if (role === "PATIENT") {
            where = { userId: session.id };
          } else if (role === "PHARMACIST") {
            // Find the pharmacy owned by this pharmacist
            const pharmacy = await db.pharmacy.findUnique({
              where: { ownerId: session.id },
              select: { id: true, name: true },
            });
            if (pharmacy) {
              pharmacyId = pharmacy.id;
              where = { pharmacyId: pharmacy.id };
            } else {
              // No pharmacy yet
              controller.enqueue(
                encoder.encode(`event: count\ndata: ${JSON.stringify({ count: 0, pendingCount: 0 })}\n\n`)
              );
              return;
            }
          }
          // ADMIN: no filter - sees all orders

          const orders = await db.order.findMany({
            where,
            orderBy: { createdAt: "desc" },
            include: {
              pharmacy: { select: { name: true } },
              user: { select: { id: true, name: true } },
            },
          });

          const currentMap = new Map<string, string>();
          for (const order of orders) {
            currentMap.set(order.id, order.status);
          }

          // Detect changes (status updates and new orders)
          // Skip notifications on first poll (previousStatusMap is empty)
          const isFirstPoll = previousStatusMap.size === 0;
          const changes: {
            id: string;
            code: string;
            status: string;
            pharmacyName: string;
            userName: string;
            role: string;
          }[] = [];

          if (!isFirstPoll) {
            for (const order of orders) {
              const prevStatus = previousStatusMap.get(order.id);
              if (!prevStatus) {
                // New order
                changes.push({
                  id: order.id,
                  code: order.code,
                  status: order.status,
                  pharmacyName: order.pharmacy?.name || "Pharmacie",
                  userName: order.user?.name || "Client",
                  role,
                });
              } else if (prevStatus !== order.status) {
                // Status change
                changes.push({
                  id: order.id,
                  code: order.code,
                  status: order.status,
                  pharmacyName: order.pharmacy?.name || "Pharmacie",
                  userName: order.user?.name || "Client",
                  role,
                });
              }
            }
          }

          if (changes.length > 0) {
            const data = JSON.stringify({ type: "order_update", changes });
            controller.enqueue(
              encoder.encode(`event: notification\ndata: ${data}\n\n`)
            );
          }

          // Count active orders
          const activeCount = orders.filter(
            (o) => o.status === "PENDING" || o.status === "CONFIRMED" || o.status === "READY"
          ).length;

          // For pharmacist: also send pending new orders count
          const pendingCount = orders.filter((o) => o.status === "PENDING").length;
          if (pendingCount !== previousPendingCount) {
            controller.enqueue(
              encoder.encode(`event: pending-count\ndata: ${JSON.stringify({ count: pendingCount })}\n\n`)
            );
            previousPendingCount = pendingCount;
          }

          controller.enqueue(
            encoder.encode(`event: count\ndata: ${JSON.stringify({ count: activeCount, role })}\n\n`)
          );

          previousStatusMap = currentMap;
        } catch {
          // Ignore polling errors
        }
      };

      // Initial poll
      await poll();

      // Poll every 30 seconds (reduced from 15s for better performance)
      const interval = setInterval(poll, POLL_INTERVAL_MS);

      // Cleanup on close
      req.signal.addEventListener("abort", () => {
        clearInterval(interval);
        clearTimeout(maxDurationTimeout);
      });
    },
  });

  return new Response(stream, {
    headers: {
      "Content-Type": "text/event-stream",
      "Cache-Control": "no-cache",
      Connection: "keep-alive",
    },
  });
}
