import { NextResponse } from "next/server";
import { z } from "zod";

import { db } from "@jellyfish/db";
import { requireNodeAccess } from "@/lib/guards";
import { getRequestIp, enforceRateLimit } from "@/lib/rate-limit";
import { emitRealtime } from "@/lib/realtime";

const schema = z.object({
  nodeId: z.string().min(1),
  content: z.string().min(1),
  level: z.enum(["info", "warn", "error"]).default("info"),
});

export async function POST(request: Request) {
  try {
    enforceRateLimit(`node-logs:post:${getRequestIp(request)}`);
    const payload = schema.parse(await request.json());
    const nodeAccess = await requireNodeAccess(request, payload.nodeId);
    if (!nodeAccess) return NextResponse.json({ error: "Unauthorized node access" }, { status: 401 });
    const log = await db.log.create({ data: payload });
    emitRealtime("log", { nodeId: log.nodeId, level: log.level, content: log.content });
    return NextResponse.json({ log }, { status: 201 });
  } catch (error) {
    if (error instanceof z.ZodError) return NextResponse.json({ error: error.issues[0]?.message }, { status: 400 });
    return NextResponse.json({ error: "Failed to write log" }, { status: 500 });
  }
}

export async function GET(request: Request) {
  enforceRateLimit(`node-logs:get:${getRequestIp(request)}`);
  const { searchParams } = new URL(request.url);
  const nodeId = searchParams.get("nodeId");
  const take = Number(searchParams.get("take") ?? "100");

  const where = nodeId ? { nodeId } : undefined;
  const logs = await db.log.findMany({
    where,
    orderBy: { createdAt: "desc" },
    take: Number.isFinite(take) ? Math.min(Math.max(take, 1), 500) : 100,
  });

  return NextResponse.json({ logs });
}
