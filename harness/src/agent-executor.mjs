import { buildTaskPacket } from "./context.mjs";
import { commandConfigFromEnv, createCommandExecutor } from "./command-executor.mjs";

export function buildAgentExecutionInput(project) {
  const packet = buildTaskPacket(project);
  return {
    ...packet,
    kind: "video-agent-execution",
    constraints: [
      ...packet.context.constraints,
      "不得修改任务包 writePaths 之外的文件。",
      "不得自行通过人工 Gate，也不得提前执行下游阶段。",
      "进程退出后由 Harness 重新校验真实产物，校验结果是阶段推进的唯一依据。",
    ],
  };
}

export function createAgentExecutor(options = {}) {
  return createCommandExecutor({
    name: "video-agent",
    ...options,
    input: ({ project }) => buildAgentExecutionInput(project),
  });
}

export function createAgentExecutorFromEnv() {
  return createAgentExecutor(commandConfigFromEnv("HARNESS_AGENT_EXECUTOR"));
}
