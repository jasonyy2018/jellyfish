import { spawn } from "child_process";
import path from "path";

import { NextResponse } from "next/server";
import { getRequestIp, enforceRateLimit } from "@/lib/rate-limit";

export async function POST(request: Request) {
  enforceRateLimit(`install-openclaw:post:${getRequestIp(request)}`);
  const adminToken = process.env.JELLYFISH_ADMIN_TOKEN ?? "";
  const providedToken = request.headers.get("x-admin-token")?.trim() ?? "";
  if (!adminToken || providedToken !== adminToken) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }
  const scriptPath = path.join(process.cwd(), "..", "..", "services", "installer", "install-openclaw.sh");
  const command = process.platform === "win32" ? "powershell" : "bash";
  const args =
    process.platform === "win32"
      ? ["-NoProfile", "-ExecutionPolicy", "Bypass", "-Command", `bash "${scriptPath}"`]
      : [scriptPath];

  return new Promise<Response>((resolve) => {
    const child = spawn(command, args, { stdio: "pipe" });
    let output = "";
    child.stdout.on("data", (chunk) => {
      output += chunk.toString();
    });
    child.stderr.on("data", (chunk) => {
      output += chunk.toString();
    });
    child.on("close", (code) => {
      if (code === 0) resolve(NextResponse.json({ ok: true, output }) as Response);
      else resolve(NextResponse.json({ ok: false, output }, { status: 500 }) as Response);
    });
  });
}
