import { completeTask } from "./api";
import { listRunningContainers } from "./docker";
import { runSkill } from "./skills";

import type { AgentConfig } from "./api";

export async function runTasks(config: AgentConfig, tasks: Array<{ id: string; type: string; payload: Record<string, unknown> }>) {
  for (const task of tasks) {
    try {
      if (task.type === "docker.list") {
        const containers = await listRunningContainers();
        await completeTask(config, task.id, true, { containers });
        continue;
      }
      if (task.type === "skill.run") {
        const skillName = String(task.payload.skill ?? "");
        const args = (task.payload.args ?? {}) as Record<string, unknown>;
        const output = await runSkill(skillName, args);
        await completeTask(config, task.id, true, { skill: skillName, output });
        continue;
      }

      await completeTask(config, task.id, true, {
        message: `Task executed: ${task.type}`,
        payload: task.payload,
      });
    } catch (error) {
      await completeTask(config, task.id, false, {
        error: error instanceof Error ? error.message : "Unknown task error",
      });
    }
  }
}
