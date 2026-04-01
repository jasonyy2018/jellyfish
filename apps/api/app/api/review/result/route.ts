import { NextResponse } from "next/server";

import { db } from "@jellyfish/db";

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const id = searchParams.get("id");
  if (id) {
    const run = await db.reviewRun.findUnique({ where: { id } });
    if (!run) return NextResponse.json({ error: "Not found" }, { status: 404 });
    return NextResponse.json({ run });
  }
  const runs = await db.reviewRun.findMany({ orderBy: { createdAt: "desc" }, take: 20 });
  return NextResponse.json({ runs });
}
