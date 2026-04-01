import { NextResponse } from "next/server";
import { z } from "zod";

import { db } from "@jellyfish/db";

import { getRequestIp, enforceRateLimit } from "@/lib/rate-limit";
import { emitRealtime } from "@/lib/realtime";
import { resolveUserByApiKey } from "@/lib/request-auth";

const schema = z.object({
  name: z.string().min(1),
  type: z.string().default("openclaw"),
  ip: z.string().optional(),
  version: z.string().optional(),
});

export async function POST(request: Request) {
  try {
    enforceRateLimit(`node-register:post:${getRequestIp(request)}`);
    const user = await resolveUserByApiKey(request);
    if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    const payload = schema.parse(await request.json());
    const node = await db.node.create({
      data: {
        userId: user.id,
        name: payload.name,
        type: payload.type,
        status: "online",
        ip: payload.ip,
        version: payload.version,
        lastHeartbeat: new Date(),
      },
    });
    emitRealtime("node", { event: "registered", nodeId: node.id, status: node.status, name: node.name });
    return NextResponse.json({ node }, { status: 201 });
  } catch (error) {
    if (error instanceof z.ZodError) return NextResponse.json({ error: error.issues[0]?.message }, { status: 400 });
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
