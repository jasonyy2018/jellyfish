import { NextResponse } from "next/server";
import { z } from "zod";

import { db } from "@jellyfish/db";
import { runOpenClawPrompt, reviewBreakdown, scoreFromOutput } from "@/lib/openclaw-review";
import { getRequestIp, enforceRateLimit } from "@/lib/rate-limit";
import { emitRealtime } from "@/lib/realtime";

const schema = z.object({
  prompt: z.string().min(1),
  expected: z.string().optional(),
  rules: z.array(z.string()).default([]),
});

export async function POST(request: Request) {
  try {
    enforceRateLimit(`review-run:post:${getRequestIp(request)}`);
    const payload = schema.parse(await request.json());
    const execution = await runOpenClawPrompt(payload.prompt);
    const score = scoreFromOutput(execution.raw, payload.expected);
    const breakdown = reviewBreakdown(execution.raw, payload.expected, payload.rules);
    const run = await db.reviewRun.create({
      data: {
        prompt: payload.prompt,
        expected: payload.expected,
        rules: payload.rules,
        status: execution.ok ? "done" : "failed",
        score,
        summary: execution.ok
          ? score >= 80
            ? "Execution quality is acceptable."
            : "Execution quality needs improvement."
          : "OpenClaw execution failed.",
        rawResult: { provider: "openclaw-cli", output: execution.raw, score, breakdown },
      },
    });
    emitRealtime("review", { runId: run.id, status: run.status, score: run.score });
    return NextResponse.json({ run }, { status: 201 });
  } catch (error) {
    if (error instanceof z.ZodError) return NextResponse.json({ error: error.issues[0]?.message }, { status: 400 });
    return NextResponse.json({ error: "Failed to run review" }, { status: 500 });
  }
}
