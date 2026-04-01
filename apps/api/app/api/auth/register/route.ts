import bcrypt from "bcryptjs";
import { NextResponse } from "next/server";
import { z } from "zod";

import { db } from "@jellyfish/db";

import { createApiKey, signUserToken } from "@/lib/auth";
import { getRequestIp, enforceRateLimit } from "@/lib/rate-limit";

const registerSchema = z.object({
  email: z.email(),
  password: z.string().min(8),
});

export async function POST(request: Request) {
  try {
    enforceRateLimit(`auth-register:post:${getRequestIp(request)}`);
    const payload = registerSchema.parse(await request.json());
    const exists = await db.user.findUnique({ where: { email: payload.email } });
    if (exists) return NextResponse.json({ error: "Email already registered" }, { status: 409 });

    const user = await db.user.create({
      data: {
        email: payload.email,
        password: await bcrypt.hash(payload.password, 10),
        apiKey: createApiKey(),
      },
      select: { id: true, email: true, plan: true, apiKey: true },
    });
    const token = signUserToken({ userId: user.id, email: user.email });
    return NextResponse.json({ token, user }, { status: 201 });
  } catch (error) {
    if (error instanceof z.ZodError) return NextResponse.json({ error: error.issues[0]?.message }, { status: 400 });
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
