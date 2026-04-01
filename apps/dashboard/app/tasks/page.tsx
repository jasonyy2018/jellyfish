import { fetchApi } from "@/lib/api";

type TaskItem = {
  id: string;
  nodeId: string;
  type: string;
  status: string;
  createdAt: string;
};

function statusColor(status: string) {
  if (status === "done") return "#2e7d32";
  if (status === "failed") return "#c62828";
  if (status === "running") return "#1565c0";
  return "#616161";
}

export default async function TasksPage() {
  const { tasks } = await fetchApi<{ tasks: TaskItem[] }>("/api/tasks?take=200");

  return (
    <main style={{ maxWidth: 1100, margin: "24px auto", fontFamily: "sans-serif" }}>
      <h2>Tasks</h2>
      <table style={{ width: "100%", borderCollapse: "collapse" }}>
        <thead>
          <tr>
            <th align="left">Task ID</th>
            <th align="left">Node</th>
            <th align="left">Type</th>
            <th align="left">Status</th>
            <th align="left">Created</th>
          </tr>
        </thead>
        <tbody>
          {tasks.map((task) => (
            <tr key={task.id}>
              <td>{task.id}</td>
              <td>{task.nodeId}</td>
              <td>{task.type}</td>
              <td style={{ color: statusColor(task.status), fontWeight: 600 }}>{task.status}</td>
              <td>{new Date(task.createdAt).toLocaleString()}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </main>
  );
}
