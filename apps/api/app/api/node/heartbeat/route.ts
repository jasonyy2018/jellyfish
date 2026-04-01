import { NextResponse } from "next/server";
import { z } from "zod";

import { db } from "@jellyfish/db";
import { requireNodeAccess } from "@/lib/guards";
import { getRequestIp, enforceRateLimit } from "@/lib/rate-limit";
import { emitRealtime } from "@/lib/realtime";

const schema = z.object({
  nodeId: z.string().min(1),
  status: z.string().default("online"),
  version: z.string().optional(),
});

export async function POST(request: Request) {
  try {
    enforceRateLimit(`node-heartbeat:post:${getRequestIp(request)}`);
    const payload = schema.parse(await request.json());
    const nodeAccess = await requireNodeAccess(request, payload.nodeId);
    if (!nodeAccess) return NextResponse.json({ error: "Unauthorized node access" }, { status: 401 });
    const node = await db.node.update({
      where: { id: payload.nodeId },
      data: {
        status: payload.status,
        version: payload.version,
        lastHeartbeat: new Date(),
      },
    });
    emitRealtime("node", { event: "heartbeat", nodeId: node.id, status: node.status });
    return NextResponse.json({ node });
  } catch (error) {
    if (error instanceof z.ZodError) return NextResponse.json({ error: error.issues[0]?.message }, { status: 400 });
    return NextResponse.json({ error: "Failed to process heartbeat" }, { status: 500 });
  }
}
