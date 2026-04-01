import { fetchApi } from "@/lib/api";

import { SkillsConsole } from "./skills-console";

type NodeItem = { id: string; name: string; status: string };
type SkillItem = { name: string; version?: string; description?: string };
type TaskItem = { id: string; nodeId: string; status: string; type: string; createdAt: string };

export default async function SkillsPage() {
  const [{ nodes }, { skills }, { tasks }] = await Promise.all([
    fetchApi<{ nodes: NodeItem[] }>("/api/node"),
    fetchApi<{ skills: SkillItem[] }>("/api/skills"),
    fetchApi<{ tasks: TaskItem[] }>("/api/tasks?take=100"),
  ]);

  const skillTasks = tasks.filter((task) => task.type === "skill.run");

  return (
    <main style={{ maxWidth: 1100, margin: "24px auto", fontFamily: "sans-serif" }}>
      <h2>Skills</h2>
      <SkillsConsole nodes={nodes} skills={skills} tasks={skillTasks} />
    </main>
  );
}
