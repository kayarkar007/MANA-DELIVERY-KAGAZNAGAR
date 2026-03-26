import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import connectToDatabase from "@/lib/mongoose";
import Notification from "@/models/Notification";

export const dynamic = "force-dynamic";

export async function GET(req: Request) {
    const session = await getServerSession(authOptions);

    if (!session?.user?.id) {
        return new Response(JSON.stringify({ success: false, error: "Unauthorized" }), {
            status: 401,
            headers: { "Content-Type": "application/json" },
        });
    }

    await connectToDatabase();

    const recipientId = session.user.id;
    const stream = new ReadableStream({
        async start(controller) {
            const encoder = new TextEncoder();
            let lastNotificationId = "";
            let lastUnreadCount = -1;
            let closed = false;
            let pollInterval: ReturnType<typeof setInterval> | null = null;
            let heartbeatInterval: ReturnType<typeof setInterval> | null = null;
            let changeStream: ReturnType<typeof Notification.watch> | null = null;

            const closeStream = () => {
                if (closed) return;
                closed = true;

                if (pollInterval) {
                    clearInterval(pollInterval);
                    pollInterval = null;
                }

                if (heartbeatInterval) {
                    clearInterval(heartbeatInterval);
                    heartbeatInterval = null;
                }

                if (changeStream) {
                    changeStream.close().catch(() => {
                        // Ignore shutdown errors.
                    });
                    changeStream = null;
                }

                try {
                    controller.close();
                } catch {
                    // Stream already closed.
                }
            };

            const sendEvent = (payload: Record<string, any>) => {
                try {
                    controller.enqueue(encoder.encode(`data: ${JSON.stringify(payload)}\n\n`));
                } catch {
                    closeStream();
                }
            };

            const emitLatestState = async () => {
                if (closed) return;

                try {
                    const [latestNotification, unreadCount] = await Promise.all([
                        Notification.findOne({ recipientId })
                            .sort({ createdAt: -1 })
                            .select("_id title message type href metadata createdAt readAt")
                            .lean(),
                        Notification.countDocuments({
                            recipientId,
                            readAt: { $exists: false },
                        }),
                    ]);

                    const latestId = latestNotification?._id?.toString() || "";
                    if (latestId !== lastNotificationId || unreadCount !== lastUnreadCount) {
                        lastNotificationId = latestId;
                        lastUnreadCount = unreadCount;
                        sendEvent({
                            unreadCount,
                            latestNotification,
                        });
                    }
                } catch {
                    // Ignore transient errors and retry on the next tick.
                }
            };

            await emitLatestState();

            heartbeatInterval = setInterval(() => {
                sendEvent({ type: "ping", timestamp: Date.now() });
            }, 25000);

            try {
                changeStream = Notification.watch(
                    [
                        {
                            $match: {
                                "fullDocument.recipientId": recipientId,
                            },
                        },
                    ],
                    {
                        fullDocument: "updateLookup",
                    }
                );

                changeStream.on("change", () => {
                    void emitLatestState();
                });

                changeStream.on("error", () => {
                    if (!pollInterval) {
                        pollInterval = setInterval(() => {
                            void emitLatestState();
                        }, 3000);
                    }
                });
            } catch {
                pollInterval = setInterval(() => {
                    void emitLatestState();
                }, 3000);
            }

            req.signal.addEventListener("abort", () => {
                closeStream();
            });
        },
    });

    return new Response(stream, {
        headers: {
            "Content-Type": "text/event-stream",
            "Cache-Control": "no-cache, no-transform",
            Connection: "keep-alive",
        },
    });
}
