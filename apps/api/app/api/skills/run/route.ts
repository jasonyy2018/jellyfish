import { NextResponse } from "next/server";
import { z } from "zod";

import { db, type Prisma } from "@jellyfish/db";
import { requireNodeAccess } from "@/lib/guards";
import { getRequestIp, enforceRateLimit } from "@/lib/rate-limit";
import { emitRealtime } from "@/lib/realtime";

const schema = z.object({
  nodeId: z.string().min(1),
  skill: z.string().min(1),
  args: z.record(z.string(), z.unknown()).optional().default({}),
});

export async function POST(request: Request) {
  try {
    enforceRateLimit(`skills-run:post:${getRequestIp(request)}`);
    const payload = schema.parse(await request.json());
    const nodeAccess = await requireNodeAccess(request, payload.nodeId);
    if (!nodeAccess) return NextResponse.json({ error: "Unauthorized node access" }, { status: 401 });
    const task = await db.task.create({
      data: {
        nodeId: payload.nodeId,
        type: "skill.run",
        payload: { skill: payload.skill, args: payload.args } as Prisma.InputJsonObject,
        maxAttempts: 2,
      },
    });
    emitRealtime("skill", { event: "queued", taskId: task.id, nodeId: task.nodeId, skill: payload.skill });
    return NextResponse.json({ task }, { status: 201 });
  } catch (error) {
    if (error instanceof z.ZodError) return NextResponse.json({ error: error.issues[0]?.message }, { status: 400 });
    return NextResponse.json({ error: "Failed to queue skill task" }, { status: 500 });
  }
}
