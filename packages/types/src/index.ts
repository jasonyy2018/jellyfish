export type NodeStatus = "online" | "offline" | "degraded";
export type TaskStatus = "pending" | "running" | "done" | "failed";

export type NodeMetric = {
  cpu: number;
  memory: number;
  disk: number;
};

export type CreateTaskInput = {
  nodeId: string;
  type: string;
  payload: Record<string, unknown>;
};
