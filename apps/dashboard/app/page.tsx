import { Stat } from "@jellyfish/ui";
import { fetchApi } from "@/lib/api";
import { RealtimeStream } from "@/app/components/realtime-stream";

type NodeItem = { id: string; status: string };
type TaskItem = { id: string; status: string };
type LogItem = { id: string; level: string };

export default async function DashboardPage() {
  const [{ nodes }, { tasks }, { logs }] = await Promise.all([
    fetchApi<{ nodes: NodeItem[] }>("/api/node"),
    fetchApi<{ tasks: TaskItem[] }>("/api/tasks?take=200"),
    fetchApi<{ logs: LogItem[] }>("/api/node/logs?take=200"),
  ]);

  const onlineNodes = nodes.filter((item) => item.status === "online").length;
  const errorLogs = logs.filter((item) => item.level === "error").length;

  return (
    <main style={{ maxWidth: 1100, margin: "24px auto", display: "grid", gap: 12 }}>
      <h1>Jellyfish Dashboard</h1>
      <div style={{ display: "grid", gridTemplateColumns: "repeat(3,minmax(0,1fr))", gap: 12 }}>
        <Stat label="Online Nodes" value={onlineNodes} />
        <Stat label="Tasks" value={tasks.length} />
        <Stat label="Errors" value={errorLogs} />
      </div>
      <RealtimeStream />
    </main>
  );
}
