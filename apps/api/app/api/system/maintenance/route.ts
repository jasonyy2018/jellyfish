import { NextResponse } from "next/server";

import { db } from "@jellyfish/db";
import { getRequestIp, enforceRateLimit } from "@/lib/rate-limit";

export async function POST(request: Request) {
  enforceRateLimit(`system-maintenance:post:${getRequestIp(request)}`);
  const adminToken = process.env.JELLYFISH_ADMIN_TOKEN ?? "";
  const providedToken = request.headers.get("x-admin-token")?.trim() ?? "";
  if (!adminToken || providedToken !== adminToken) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const now = new Date();
  const offlineThresholdMinutes = Number(process.env.NODE_OFFLINE_THRESHOLD_MINUTES ?? 2);
  const offlineBefore = new Date(now.getTime() - offlineThresholdMinutes * 60 * 1000);

  const nodeResult = await db.node.updateMany({
    where: {
      status: "online",
      OR: [{ lastHeartbeat: null }, { lastHeartbeat: { lt: offlineBefore } }],
    },
    data: { status: "offline" },
  });

  const timeoutResult = await db.task.updateMany({
    where: {
      status: "running",
      timeoutAt: { lt: now },
    },
    data: {
      status: "failed",
      lastError: "Task timeout",
      finishedAt: now,
    },
  });

  const retryCandidates = await db.task.findMany({
    where: { status: "failed" },
    select: { id: true, attempts: true, maxAttempts: true },
    take: 500,
  });
  const retryableIds = retryCandidates.filter((task) => task.attempts < task.maxAttempts).map((task) => task.id);
  const retryResult =
    retryableIds.length === 0
      ? { count: 0 }
      : await db.task.updateMany({
          where: { id: { in: retryableIds } },
          data: {
            status: "pending",
            lockedAt: null,
            startedAt: null,
            timeoutAt: null,
          },
        });

  return NextResponse.json({
    nodesMarkedOffline: nodeResult.count,
    tasksTimedOut: timeoutResult.count,
    tasksRequeued: retryResult.count,
  });
}
