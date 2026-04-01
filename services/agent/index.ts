import os from "os";

import { fetchTasks, pushLog, registerNode, sendHeartbeat, sendMetrics } from "./api";
import type { AgentConfig } from "./api";
import { readMetrics } from "./metrics";
import { runTasks } from "./tasks";

const config: AgentConfig = {
  baseUrl: process.env.JELLYFISH_BASE_URL ?? "http://localhost:3002",
  apiKey: process.env.JELLYFISH_API_KEY ?? "",
  nodeName: process.env.JELLYFISH_NODE_NAME ?? os.hostname(),
  nodeType: process.env.JELLYFISH_NODE_TYPE ?? "openclaw",
};

async function bootstrap() {
  if (!config.apiKey) {
    throw new Error("Missing JELLYFISH_API_KEY");
  }
  const node = await registerNode(config);
  config.nodeId = node.id;
  await pushLog(config, node.id, "Agent started");
}

async function loop() {
  if (!config.nodeId) return;
  await sendHeartbeat(config, config.nodeId);
  const metrics = await readMetrics();
  await sendMetrics(config, config.nodeId, metrics);
  const tasks = await fetchTasks(config, config.nodeId);
  await runTasks(config, tasks);
}

async function main() {
  await bootstrap();
  await loop();
  setInterval(async () => {
    try {
      await loop();
    } catch (error) {
      if (config.nodeId) {
        await pushLog(config, config.nodeId, `Loop error: ${error instanceof Error ? error.message : "unknown"}`, "error");
      }
    }
  }, 30_000);
}

main().catch((error) => {
  console.error("Agent failed:", error);
  process.exit(1);
});
