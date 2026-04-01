import { execFile } from "child_process";
import { existsSync } from "fs";
import path from "path";
import { promisify } from "util";

const execFileAsync = promisify(execFile);

export async function runSkill(skill: string, args: Record<string, unknown>) {
  const skillsDir = process.env.JELLYFISH_SKILLS_DIR ?? path.join(process.cwd(), "skills");
  const skillDir = path.join(skillsDir, skill);

  const runJs = path.join(skillDir, "run.js");
  const runPy = path.join(skillDir, "run.py");
  const runSh = path.join(skillDir, "run.sh");

  const input = JSON.stringify(args ?? {});
  const timeout = Number(process.env.JELLYFISH_SKILL_TIMEOUT_MS ?? 120_000);

  if (existsSync(runJs)) {
    const { stdout } = await execFileAsync("node", [runJs, input], { maxBuffer: 4 * 1024 * 1024, timeout });
    return stdout.trim();
  }
  if (existsSync(runPy)) {
    const { stdout } = await execFileAsync("python", [runPy, input], { maxBuffer: 4 * 1024 * 1024, timeout });
    return stdout.trim();
  }
  if (existsSync(runSh)) {
    const shell = process.platform === "win32" ? "bash" : "sh";
    const { stdout } = await execFileAsync(shell, [runSh, input], { maxBuffer: 4 * 1024 * 1024, timeout });
    return stdout.trim();
  }

  throw new Error(`Skill runner not found for ${skill}`);
}
