import { NextResponse } from "next/server";

import { db } from "@jellyfish/db";

import { verifyUserToken } from "@/lib/auth";

export async function requireUser(request: Request) {
  const auth = request.headers.get("authorization");
  if (!auth?.startsWith("Bearer ")) return null;
  const token = auth.slice("Bearer ".length).trim();
  try {
    const payload = verifyUserToken(token);
    return db.user.findUnique({
      where: { id: payload.userId },
      select: { id: true, email: true, role: true, plan: true },
    });
  } catch {
    return null;
  }
}

export async function requireAdmin(request: Request) {
  const user = await requireUser(request);
  if (!user || user.role !== "admin") {
    return { user: null, error: NextResponse.json({ error: "Forbidden" }, { status: 403 }) };
  }
  return { user, error: null };
}

export async function requireNodeAccess(request: Request, nodeId: string) {
  const apiKey = request.headers.get("x-api-key")?.trim();
  if (!apiKey) return null;
  const node = await db.node.findFirst({
    where: {
      id: nodeId,
      user: { apiKey },
    },
    select: { id: true, userId: true },
  });
  return node;
}
