import axios from "axios";

export type AgentConfig = {
  baseUrl: string;
  apiKey: string;
  nodeId?: string;
  nodeName: string;
  nodeType: string;
};

export async function registerNode(config: AgentConfig, ip?: string) {
  const response = await axios.post(
    `${config.baseUrl}/api/node/register`,
    { name: config.nodeName, type: config.nodeType, ip, version: "1.0.0" },
    { headers: { "x-api-key": config.apiKey } },
  );
  return response.data.node as { id: string };
}

export async function sendHeartbeat(config: AgentConfig, nodeId: string) {
  await axios.post(
    `${config.baseUrl}/api/node/heartbeat`,
    {
      nodeId,
      status: "online",
      version: "1.0.0",
    },
    { headers: { "x-api-key": config.apiKey } },
  );
}

export async function sendMetrics(
  config: AgentConfig,
  nodeId: string,
  metrics: { cpu: number; memory: number; disk: number },
) {
  await axios.post(`${config.baseUrl}/api/node/metrics`, { nodeId, ...metrics }, { headers: { "x-api-key": config.apiKey } });
}

export async function pushLog(config: AgentConfig, nodeId: string, content: string, level: "info" | "warn" | "error" = "info") {
  await axios.post(`${config.baseUrl}/api/node/logs`, { nodeId, content, level }, { headers: { "x-api-key": config.apiKey } });
}

export async function fetchTasks(config: AgentConfig, nodeId: string) {
  const response = await axios.get(`${config.baseUrl}/api/node/tasks`, {
    params: { nodeId },
    headers: { "x-api-key": config.apiKey },
  });
  return (response.data.tasks ?? []) as Array<{ id: string; type: string; payload: Record<string, unknown> }>;
}

export async function completeTask(config: AgentConfig, taskId: string, ok: boolean, result: Record<string, unknown>) {
  await axios.patch(
    `${config.baseUrl}/api/tasks`,
    {
      id: taskId,
      status: ok ? "done" : "failed",
      result,
    },
    {
      headers: {
        "x-api-key": config.apiKey,
        "x-node-id": config.nodeId ?? "",
      },
    },
  );
}
