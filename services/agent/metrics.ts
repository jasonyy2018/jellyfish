import os from "os";

export async function readMetrics() {
  const cpus = os.cpus();
  const cpu = Math.min(100, Math.max(0, Math.round((cpus.length / 16) * 100)));
  const memory = Math.round((1 - os.freemem() / os.totalmem()) * 100);
  const disk = 0;
  return { cpu, memory, disk };
}
