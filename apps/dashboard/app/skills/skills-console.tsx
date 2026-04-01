"use client";

import { useEffect, useMemo, useState } from "react";
import { io } from "socket.io-client";

import { getApi, postApi } from "@/lib/api-client";

type NodeItem = { id: string; name: string; status: string };
type SkillItem = { name: string; version?: string; description?: string };
type TaskItem = { id: string; nodeId: string; status: string; type: string; createdAt: string; payload?: unknown; result?: unknown };

export function SkillsConsole({
  nodes,
  skills,
  tasks,
}: {
  nodes: NodeItem[];
  skills: SkillItem[];
  tasks: TaskItem[];
}) {
  const onlineNodes = useMemo(() => nodes.filter((node) => node.status === "online"), [nodes]);
  const [nodeId, setNodeId] = useState(onlineNodes[0]?.id ?? nodes[0]?.id ?? "");
  const [skill, setSkill] = useState(skills[0]?.name ?? "echo");
  const [argsText, setArgsText] = useState('{"message":"hello"}');
  const [submitting, setSubmitting] = useState(false);
  const [feedback, setFeedback] = useState<string>("");
  const [tasksState, setTasksState] = useState<TaskItem[]>(tasks);
  const [selectedTaskId, setSelectedTaskId] = useState<string>(tasks[0]?.id ?? "");
  const [jsonError, setJsonError] = useState<string>("");
  const socketUrl = useMemo(() => process.env.NEXT_PUBLIC_JELLYFISH_API_WS_URL ?? "http://localhost:3002", []);
  const apiKey = useMemo(() => process.env.NEXT_PUBLIC_JELLYFISH_API_KEY ?? "", []);

  useEffect(() => {
    setTasksState(tasks);
    if (!selectedTaskId && tasks[0]?.id) setSelectedTaskId(tasks[0].id);
  }, [tasks, selectedTaskId]);

  useEffect(() => {
    try {
      JSON.parse(argsText);
      setJsonError("");
    } catch (error) {
      setJsonError(error instanceof Error ? error.message : "Invalid JSON");
    }
  }, [argsText]);

  useEffect(() => {
    const socket = io(socketUrl, {
      path: "/socket.io",
      transports: ["websocket", "polling"],
      auth: apiKey ? { apiKey } : {},
    });
    const refresh = async () => {
      try {
        const data = await getApi<{ tasks: TaskItem[] }>("/api/tasks?take=100");
        const list = data.tasks.filter((item) => item.type === "skill.run");
        setTasksState(list);
      } catch {
        // ignore refresh errors in client poll loop
      }
    };

    socket.on("task", (payload: Record<string, unknown>) => {
      const type = String(payload.type ?? "");
      if (type === "skill.run") {
        void refresh();
      }
    });
    socket.on("skill", () => {
      void refresh();
    });

    const timer = window.setInterval(() => {
      void refresh();
    }, 5000);

    return () => {
      window.clearInterval(timer);
      socket.disconnect();
    };
  }, [socketUrl, apiKey]);

  async function onSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setSubmitting(true);
    setFeedback("");
    try {
      const args = JSON.parse(argsText) as Record<string, unknown>;
      const response = await postApi<{ task: TaskItem }>("/api/skills/run", { nodeId, skill, args });
      setFeedback(`Queued task: ${response.task.id}`);
      setSelectedTaskId(response.task.id);
      setTasksState((prev) => [response.task, ...prev].slice(0, 100));
    } catch (error) {
      setFeedback(error instanceof Error ? error.message : "Failed to queue skill");
    } finally {
      setSubmitting(false);
    }
  }

  const selectedTask = tasksState.find((task) => task.id === selectedTaskId);

  return (
    <section style={{ display: "grid", gap: 20 }}>
      <form onSubmit={onSubmit} style={{ border: "1px solid #ddd", borderRadius: 8, padding: 16, display: "grid", gap: 12 }}>
        <h3 style={{ margin: 0 }}>Run Skill</h3>
        <label style={{ display: "grid", gap: 6 }}>
          <span>Node</span>
          <select value={nodeId} onChange={(e) => setNodeId(e.target.value)}>
            {nodes.map((node) => (
              <option key={node.id} value={node.id}>
                {node.name} ({node.status})
              </option>
            ))}
          </select>
        </label>
        <label style={{ display: "grid", gap: 6 }}>
          <span>Skill</span>
          <select value={skill} onChange={(e) => setSkill(e.target.value)}>
            {skills.map((item) => (
              <option key={item.name} value={item.name}>
                {item.name}
              </option>
            ))}
          </select>
        </label>
        <label style={{ display: "grid", gap: 6 }}>
          <span>Args (JSON)</span>
          <textarea value={argsText} onChange={(e) => setArgsText(e.target.value)} rows={6} />
          {jsonError ? <span style={{ color: "#c0392b", fontSize: 12 }}>JSON error: {jsonError}</span> : null}
        </label>
        <button type="submit" disabled={submitting || !nodeId || !skill || Boolean(jsonError)}>
          {submitting ? "Queuing..." : "Run Skill"}
        </button>
        {feedback ? <div style={{ fontSize: 12 }}>{feedback}</div> : null}
      </form>

      <section style={{ border: "1px solid #ddd", borderRadius: 8, padding: 16 }}>
        <h3 style={{ marginTop: 0 }}>Installed Skills</h3>
        <ul>
          {skills.map((item) => (
            <li key={item.name}>
              <strong>{item.name}</strong> {item.version ? `v${item.version}` : ""} {item.description ? `- ${item.description}` : ""}
            </li>
          ))}
        </ul>
      </section>

      <section style={{ border: "1px solid #ddd", borderRadius: 8, padding: 16 }}>
        <h3 style={{ marginTop: 0 }}>Recent Skill Tasks</h3>
        <table style={{ width: "100%", borderCollapse: "collapse" }}>
          <thead>
            <tr>
              <th align="left">Task ID</th>
              <th align="left">Node</th>
              <th align="left">Status</th>
              <th align="left">Created</th>
            </tr>
          </thead>
          <tbody>
            {tasksState.map((task) => (
              <tr key={task.id} style={{ cursor: "pointer", background: selectedTaskId === task.id ? "#f5f8ff" : "transparent" }} onClick={() => setSelectedTaskId(task.id)}>
                <td>{task.id}</td>
                <td>{task.nodeId}</td>
                <td>{task.status}</td>
                <td>{new Date(task.createdAt).toLocaleString()}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </section>

      <section style={{ border: "1px solid #ddd", borderRadius: 8, padding: 16 }}>
        <h3 style={{ marginTop: 0 }}>Task Detail</h3>
        {!selectedTask ? (
          <p style={{ margin: 0 }}>Select a task to inspect payload and result.</p>
        ) : (
          <div style={{ display: "grid", gap: 12 }}>
            <div><strong>Task ID:</strong> {selectedTask.id}</div>
            <div><strong>Status:</strong> {selectedTask.status}</div>
            <div>
              <strong>Payload</strong>
              <pre style={{ whiteSpace: "pre-wrap", overflowWrap: "anywhere", background: "#fafafa", padding: 12, borderRadius: 6 }}>
                {JSON.stringify(selectedTask.payload ?? null, null, 2)}
              </pre>
            </div>
            <div>
              <strong>Result</strong>
              <pre style={{ whiteSpace: "pre-wrap", overflowWrap: "anywhere", background: "#fafafa", padding: 12, borderRadius: 6 }}>
                {JSON.stringify(selectedTask.result ?? null, null, 2)}
              </pre>
            </div>
          </div>
        )}
      </section>
    </section>
  );
}
