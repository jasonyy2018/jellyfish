import { NextResponse } from "next/server";
import { z } from "zod";

import { db } from "@jellyfish/db";
import { requireNodeAccess } from "@/lib/guards";
import { getRequestIp, enforceRateLimit } from "@/lib/rate-limit";
import { emitRealtime } from "@/lib/realtime";

const schema = z.object({
  nodeId: z.string().min(1),
  cpu: z.number().int().min(0).max(100),
  memory: z.number().int().min(0),
  disk: z.number().int().min(0),
});

export async function POST(request: Request) {
  try {
    enforceRateLimit(`node-metrics:post:${getRequestIp(request)}`);
    const payload = schema.parse(await request.json());
    const nodeAccess = await requireNodeAccess(request, payload.nodeId);
    if (!nodeAccess) return NextResponse.json({ error: "Unauthorized node access" }, { status: 401 });
    const metric = await db.metric.create({ data: payload });
    emitRealtime("metric", { nodeId: metric.nodeId, cpu: metric.cpu, memory: metric.memory, disk: metric.disk });
    return NextResponse.json({ metric }, { status: 201 });
  } catch (error) {
    if (error instanceof z.ZodError) return NextResponse.json({ error: error.issues[0]?.message }, { status: 400 });
    return NextResponse.json({ error: "Failed to save metrics" }, { status: 500 });
  }
}

export async function GET(request: Request) {
  enforceRateLimit(`node-metrics:get:${getRequestIp(request)}`);
  const { searchParams } = new URL(request.url);
  const nodeId = searchParams.get("nodeId");
  const take = Number(searchParams.get("take") ?? "50");

  const where = nodeId ? { nodeId } : undefined;
  const metrics = await db.metric.findMany({
    where,
    orderBy: { createdAt: "desc" },
    take: Number.isFinite(take) ? Math.min(Math.max(take, 1), 500) : 50,
  });

  return NextResponse.json({ metrics });
}
