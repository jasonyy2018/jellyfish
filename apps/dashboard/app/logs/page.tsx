import { fetchApi } from "@/lib/api";

type LogItem = {
  id: string;
  nodeId: string;
  level: string;
  content: string;
  createdAt: string;
};

export default async function LogsPage() {
  const { logs } = await fetchApi<{ logs: LogItem[] }>("/api/node/logs?take=200");

  return (
    <main style={{ maxWidth: 1100, margin: "24px auto", fontFamily: "sans-serif" }}>
      <h2>Logs</h2>
      <table style={{ width: "100%", borderCollapse: "collapse" }}>
        <thead>
          <tr>
            <th align="left">Time</th>
            <th align="left">Node</th>
            <th align="left">Level</th>
            <th align="left">Content</th>
          </tr>
        </thead>
        <tbody>
          {logs.map((log) => (
            <tr key={log.id}>
              <td>{new Date(log.createdAt).toLocaleString()}</td>
              <td>{log.nodeId}</td>
              <td>{log.level}</td>
              <td>{log.content}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </main>
  );
}
