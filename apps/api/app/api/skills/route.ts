import { existsSync, readdirSync, readFileSync } from "fs";
import path from "path";

import { NextResponse } from "next/server";
import { z } from "zod";
import { getRequestIp, enforceRateLimit } from "@/lib/rate-limit";

const skillManifestSchema = z.object({
  name: z.string().min(1),
  version: z.string().optional(),
  description: z.string().optional(),
});

type SkillManifest = z.infer<typeof skillManifestSchema> & { valid: boolean };

export async function GET(request: Request) {
  enforceRateLimit(`skills:get:${getRequestIp(request)}`);
  const skillsDir = process.env.JELLYFISH_SKILLS_DIR ?? path.join(process.cwd(), "..", "..", "skills");
  if (!existsSync(skillsDir)) return NextResponse.json({ skills: [] });

  const skills = readdirSync(skillsDir, { withFileTypes: true })
    .filter((entry) => entry.isDirectory())
    .map((entry) => {
      const manifestPath = path.join(skillsDir, entry.name, "manifest.json");
      if (!existsSync(manifestPath)) {
        return { name: entry.name, valid: false } as SkillManifest;
      }
      try {
        const parsed = skillManifestSchema.safeParse(JSON.parse(readFileSync(manifestPath, "utf-8")));
        if (!parsed.success) return { name: entry.name, valid: false } as SkillManifest;
        return { ...parsed.data, valid: true };
      } catch {
        return { name: entry.name, valid: false } as SkillManifest;
      }
    });

  return NextResponse.json({ skills });
}
