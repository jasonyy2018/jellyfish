import { NextResponse } from "next/server";

import { db } from "@jellyfish/db";
import { getRequestIp, enforceRateLimit } from "@/lib/rate-limit";

export async function GET(request: Request) {
  enforceRateLimit(`node:get:${getRequestIp(request)}`);
  const nodes = await db.node.findMany({
    orderBy: { createdAt: "desc" },
    include: {
      metrics: { orderBy: { createdAt: "desc" }, take: 1 },
    },
  });
  return NextResponse.json({ nodes });
}
