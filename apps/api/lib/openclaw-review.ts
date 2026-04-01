import { execFile } from "child_process";
import { promisify } from "util";

const execFileAsync = promisify(execFile);

export async function runOpenClawPrompt(prompt: string) {
  try {
    const { stdout, stderr } = await execFileAsync(
      "openclaw",
      ["run", "--prompt", prompt, "--json"],
      { maxBuffer: 8 * 1024 * 1024 },
    );
    const raw = (stdout || stderr).trim();
    return { ok: true, raw };
  } catch (error: any) {
    const message = error?.stderr?.toString?.() || error?.stdout?.toString?.() || error?.message || "openclaw run failed";
    return { ok: false, raw: String(message).trim() };
  }
}

export function scoreFromOutput(raw: string, expected?: string) {
  const text = raw.toLowerCase();
  let score = 45;
  const dimensions = {
    executed: text.includes("success") || text.includes("ok") || text.includes("result"),
    containsJson: text.includes("{") && text.includes("}"),
    matchesExpected: expected ? text.includes(expected.toLowerCase()) : true,
    nonTrivial: raw.trim().length >= 32,
  };
  if (dimensions.executed) score += 20;
  if (dimensions.containsJson) score += 15;
  if (dimensions.matchesExpected) score += 15;
  if (dimensions.nonTrivial) score += 10;
  return Math.min(100, Math.max(0, score));
}

export function reviewBreakdown(raw: string, expected?: string, rules: string[] = []) {
  const text = raw.toLowerCase();
  return {
    rules,
    checks: {
      executed: text.includes("success") || text.includes("ok") || text.includes("result"),
      containsJson: text.includes("{") && text.includes("}"),
      matchesExpected: expected ? text.includes(expected.toLowerCase()) : true,
      mustUseBrowserSatisfied: rules.includes("must_use_browser") ? text.includes("browser") : true,
    },
  };
}
