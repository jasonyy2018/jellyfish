import { NextResponse } from "next/server";
import { z } from "zod";

import { db, type Prisma } from "@jellyfish/db";
import { requireNodeAccess } from "@/lib/guards";
import { getRequestIp, enforceRateLimit } from "@/lib/rate-limit";
import { emitRealtime } from "@/lib/realtime";

const createTaskSchema = z.object({
  nodeId: z.string().min(1),
  type: z.string().min(1),
  payload: z.unknown(),
});

const updateTaskSchema = z.object({
  id: z.string().min(1),
  status: z.enum(["pending", "running", "done", "failed"]),
  result: z.unknown().optional(),
});

export async function GET(request: Request) {
  enforceRateLimit(`tasks:get:${getRequestIp(request)}`);
  const { searchParams } = new URL(request.url);
  const status = searchParams.get("status");
  const nodeId = searchParams.get("nodeId");
  const take = Number(searchParams.get("take") ?? "100");

  const where: { status?: "pending" | "running" | "done" | "failed"; nodeId?: string } = {};
  if (status === "pending" || status === "running" || status === "done" || status === "failed") where.status = status;
  if (nodeId) where.nodeId = nodeId;

  const tasks = await db.task.findMany({
    where,
    orderBy: { createdAt: "desc" },
    take: Number.isFinite(take) ? Math.min(Math.max(take, 1), 500) : 100,
  });
  return NextResponse.json({ tasks });
}

export async function POST(request: Request) {
  try {
    enforceRateLimit(`tasks:post:${getRequestIp(request)}`);
    const payload = createTaskSchema.parse(await request.json());
    const nodeAccess = await requireNodeAccess(request, payload.nodeId);
    if (!nodeAccess) return NextResponse.json({ error: "Unauthorized node access" }, { status: 401 });
    const task = await db.task.create({
      data: {
        nodeId: payload.nodeId,
        type: payload.type,
        payload: payload.payload as Prisma.InputJsonValue,
        maxAttempts: 3,
      },
    });
    emitRealtime("task", { event: "created", taskId: task.id, nodeId: task.nodeId, type: task.type, status: task.status });
    return NextResponse.json({ task }, { status: 201 });
  } catch (error) {
    if (error instanceof z.ZodError) return NextResponse.json({ error: error.issues[0]?.message }, { status: 400 });
    return NextResponse.json({ error: "Failed to create task" }, { status: 500 });
  }
}

export async function PATCH(request: Request) {
  try {
    enforceRateLimit(`tasks:patch:${getRequestIp(request)}`);
    const payload = updateTaskSchema.parse(await request.json());
    const nodeId = request.headers.get("x-node-id")?.trim();
    if (!nodeId) return NextResponse.json({ error: "x-node-id header is required" }, { status: 400 });
    const nodeAccess = await requireNodeAccess(request, nodeId);
    if (!nodeAccess) return NextResponse.json({ error: "Unauthorized node access" }, { status: 401 });
    const task = await db.task.update({
      where: { id: payload.id },
      data: {
        status: payload.status,
        result: payload.result ? (payload.result as Prisma.InputJsonValue) : undefined,
        finishedAt: payload.status === "done" || payload.status === "failed" ? new Date() : undefined,
        lastError:
          payload.status === "failed"
            ? typeof (payload.result as { error?: unknown } | undefined)?.error === "string"
              ? ((payload.result as { error?: string }).error ?? "Task execution failed on node")
              : "Task execution failed on node"
            : null,
      },
    });
    emitRealtime("task", { event: "updated", taskId: task.id, nodeId: task.nodeId, type: task.type, status: task.status });
    return NextResponse.json({ task });
  } catch (error) {
    if (error instanceof z.ZodError) return NextResponse.json({ error: error.issues[0]?.message }, { status: 400 });
    return NextResponse.json({ error: "Failed to update task" }, { status: 500 });
  }
}
