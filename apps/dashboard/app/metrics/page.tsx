import { fetchApi } from "@/lib/api";

type MetricItem = {
  id: string;
  nodeId: string;
  cpu: number;
  memory: number;
  disk: number;
  createdAt: string;
};

export default async function MetricsPage() {
  const { metrics } = await fetchApi<{ metrics: MetricItem[] }>("/api/node/metrics?take=200");

  return (
    <main style={{ maxWidth: 1100, margin: "24px auto", fontFamily: "sans-serif" }}>
      <h2>Metrics</h2>
      <table style={{ width: "100%", borderCollapse: "collapse" }}>
        <thead>
          <tr>
            <th align="left">Time</th>
            <th align="left">Node</th>
            <th align="left">CPU</th>
            <th align="left">Memory</th>
            <th align="left">Disk</th>
          </tr>
        </thead>
        <tbody>
          {metrics.map((metric) => (
            <tr key={metric.id}>
              <td>{new Date(metric.createdAt).toLocaleString()}</td>
              <td>{metric.nodeId}</td>
              <td>{metric.cpu}</td>
              <td>{metric.memory}</td>
              <td>{metric.disk}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </main>
  );
}
