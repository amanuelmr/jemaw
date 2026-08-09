import { type NextRequest } from "next/server";
import { auth } from "@/lib/auth";
import { db } from "@/db";
import { notifications } from "@/db/schema";
import { and, eq, gte } from "drizzle-orm";

export async function GET(request: NextRequest) {
  const session = await auth.api.getSession({ headers: request.headers });
  if (!session) {
    return new Response("Unauthorized", { status: 401 });
  }

  const userId = session.user.id;
  const encoder = new TextEncoder();
  let intervalId: ReturnType<typeof setInterval> | undefined;

  const stream = new ReadableStream({
    async start(controller) {
      const send = (data: unknown) => {
        try {
          controller.enqueue(encoder.encode(`data: ${JSON.stringify(data)}\n\n`));
        } catch { /* controller already closed */ }
      };

      // Capture before the query so nothing created during the fetch is missed
      let lastChecked = new Date();

      // Send all current notifications immediately on connect
      try {
        const initial = await db.query.notifications.findMany({
          where: eq(notifications.userId, userId),
          orderBy: (n, { desc }) => [desc(n.createdAt)],
          limit: 20,
        });
        send({ type: "init", notifications: initial });
      } catch {
        controller.close();
        return;
      }

      // Poll every 5s for new notifications
      intervalId = setInterval(async () => {
        if (request.signal.aborted) {
          clearInterval(intervalId);
          try { controller.close(); } catch { /* already closed */ }
          return;
        }

        try {
          // Capture the window start before querying so nothing falls through the gap
          const checkFrom = lastChecked;
          lastChecked = new Date();

          const fresh = await db.query.notifications.findMany({
            where: and(
              eq(notifications.userId, userId),
              gte(notifications.createdAt, checkFrom)
            ),
            orderBy: (n, { desc }) => [desc(n.createdAt)],
            limit: 20,
          });

          if (fresh.length > 0) {
            send({ type: "new", notifications: fresh });
          } else {
            try {
              controller.enqueue(encoder.encode(": heartbeat\n\n"));
            } catch { /* controller closed */ }
          }
        } catch {
          clearInterval(intervalId);
          try { controller.close(); } catch { /* already closed */ }
        }
      }, 5000);

      request.signal.addEventListener("abort", () => {
        clearInterval(intervalId);
        try { controller.close(); } catch { /* already closed */ }
      });
    },
    cancel() {
      clearInterval(intervalId);
    },
  });

  return new Response(stream, {
    headers: {
      "Content-Type": "text/event-stream",
      "Cache-Control": "no-cache, no-transform",
      "Connection": "keep-alive",
      "X-Accel-Buffering": "no",
    },
  });
}
