import { commandConfigFromEnv, createCommandExecutor } from "./command-executor.mjs";

function remotionInput({ project, task }) {
  return {
    schemaVersion: 1,
    kind: "video-remotion-execution",
    taskId: task.id,
    videoId: project.config.slug,
    workspaceRoot: project.config.workspaceRoot,
    inputStages: task.inputStages,
    inputArtifacts: task.inputArtifacts,
    outputArtifacts: task.outputArtifacts,
    validation: task.validation,
    manualChecks: task.manualChecks,
    context: task.context,
    commands: task.commands,
    constraints: [
      "只写入当前 Remotion 任务声明的输出路径。",
      "必须消费已通过 TTS 质检的音频、字幕和 Timeline 产物。",
      "必须以 Gate 2 冻结的 Visual Script 与 Visual Prototype 为视觉基线，并逐 Scene 完成 remotion-alignment.json。",
      "原型中的布局关系、一级视觉事件和屏幕文字必须落实；任何偏离都要在对齐清单中明确说明。",
      "完成后不要自行通过 Gate 3，交回 Harness 校验并等待人工预览确认。",
    ],
  };
}

export function buildRemotionExecutionInput(project, task) {
  return remotionInput({ project, task });
}

export function createRemotionExecutor(options = {}) {
  const commandExecutor = createCommandExecutor({
    name: "remotion-agent",
    ...options,
    input: ({ project, task }) => remotionInput({ project, task }),
  });
  return {
    run(context) {
      return commandExecutor.run(context);
    },
  };
}

export function createRemotionExecutorFromEnv() {
  return createRemotionExecutor(commandConfigFromEnv("HARNESS_REMOTION_EXECUTOR"));
}
