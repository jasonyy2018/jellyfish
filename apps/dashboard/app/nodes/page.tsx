import { fetchApi } from "@/lib/api";

type NodeMetric = { cpu: number; memory: number; disk: number; createdAt: string };
type NodeItem = {
  id: string;
  name: string;
  type: string;
  status: string;
  lastHeartbeat: string | null;
  metrics: NodeMetric[];
};

function statusColor(status: string) {
  if (status === "online") return "#2e7d32";
  if (status === "degraded") return "#ef6c00";
  return "#c62828";
}

export default async function NodesPage() {
  const { nodes } = await fetchApi<{ nodes: NodeItem[] }>("/api/node");

  return (
    <main style={{ maxWidth: 1100, margin: "24px auto", fontFamily: "sans-serif" }}>
      <h2>Nodes</h2>
      <table style={{ width: "100%", borderCollapse: "collapse" }}>
        <thead>
          <tr>
            <th align="left">Name</th>
            <th align="left">Type</th>
            <th align="left">Status</th>
            <th align="left">CPU</th>
            <th align="left">Memory</th>
            <th align="left">Last Heartbeat</th>
          </tr>
        </thead>
        <tbody>
          {nodes.map((node) => (
            <tr key={node.id}>
              <td>{node.name}</td>
              <td>{node.type}</td>
              <td style={{ color: statusColor(node.status), fontWeight: 600 }}>{node.status}</td>
              <td>{node.metrics[0]?.cpu ?? "-"}</td>
              <td>{node.metrics[0]?.memory ?? "-"}</td>
              <td>{node.lastHeartbeat ? new Date(node.lastHeartbeat).toLocaleString() : "-"}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </main>
  );
}
