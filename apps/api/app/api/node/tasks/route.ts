import { NextResponse } from "next/server";

import { db } from "@jellyfish/db";
import { requireNodeAccess } from "@/lib/guards";
import { getRequestIp, enforceRateLimit } from "@/lib/rate-limit";

export async function GET(request: Request) {
  enforceRateLimit(`node-tasks:get:${getRequestIp(request)}`);
  const { searchParams } = new URL(request.url);
  const nodeId = searchParams.get("nodeId");
  if (!nodeId) return NextResponse.json({ error: "nodeId is required" }, { status: 400 });
  const nodeAccess = await requireNodeAccess(request, nodeId);
  if (!nodeAccess) return NextResponse.json({ error: "Unauthorized node access" }, { status: 401 });

  const now = new Date();
  await db.task.updateMany({
    where: {
      nodeId,
      status: "running",
      timeoutAt: { lt: now },
    },
    data: {
      status: "failed",
      lastError: "Task timeout",
      finishedAt: now,
    },
  });

  const tasks = await db.task.findMany({
    where: {
      nodeId,
      status: "pending",
      OR: [{ timeoutAt: null }, { timeoutAt: { gt: now } }],
    },
    orderBy: { createdAt: "asc" },
    take: 20,
  });
  if (tasks.length) {
    const timeoutAt = new Date(Date.now() + 5 * 60 * 1000);
    await Promise.all(
      tasks.map((task) =>
        db.task.updateMany({
          where: {
            id: task.id,
            status: "pending",
            attempts: { lt: task.maxAttempts },
          },
          data: {
            status: "running",
            lockedAt: new Date(),
            startedAt: new Date(),
            timeoutAt,
            attempts: { increment: 1 },
          },
        }),
      ),
    );
  }
  const claimed = await db.task.findMany({
    where: {
      id: { in: tasks.map((task) => task.id) },
      status: "running",
    },
  });
  return NextResponse.json({ tasks: claimed });
}
