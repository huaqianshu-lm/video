import { commandConfigFromEnv, createCommandExecutor } from "./command-executor.mjs";
import { workflowForProject } from "./workflows/registry.mjs";

function remotionInput({ project, task }) {
  const workflow = workflowForProject(project);
  const isPromo = workflow.timelineMode === "visual-beats";
  return {
    schemaVersion: 1,
    kind: "video-remotion-execution",
    taskId: task.id,
    videoId: project.config.slug,
    workflow: workflow.id,
    workflowVersion: workflow.version,
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
      `Remotion 任务只生成当前视频的 ${project.config.remotionDirectory} 配置和组件，以及当前 Workflow 声明的对齐清单；不得写入或修改受跟踪的 src/Root.tsx，也不得把具体视频注册到通用 Root。`,
      "不要自行生成或复用旧的 src/RenderInputRoot.tsx；代码和对齐清单产出后由 Harness 根据当前已校验的输入包生成唯一临时入口。",
      ...(isPromo ? [
        "必须读取并消费已通过 Gate 2 的 Asset Manifest 和 visual-timeline.json；Visual Timeline 是宣传片唯一时间基准，不得生成或复用 TTS、字幕或 narrated Timeline 产物。",
        "必须以 Gate 2 冻结的 Visual Script 与 Motion Prototype 为视觉基线，并逐 Scene 完成宣传片 remotion-alignment.json：写明 Visual Timeline、Beat、Transition、屏幕文字和实现文件／组件映射。",
      ] : [
        "必须读取并消费已通过 TTS 质检的 tts-script.json、音频、字幕和 Timeline 产物。",
        "Timeline Manifest 是唯一时间基准；tts-script.json 用于确认 Scene／Segment 文本和 ID，不能被其他口播文本或旧音频资料替代。",
        "必须以 Gate 2 冻结的 Visual Script 与 Visual Prototype 为视觉基线，并逐 Scene 完成 schemaVersion 2 的 remotion-alignment.json：写明 Timeline、Audio Segment、Subtitle Cue 和视觉事件时间绑定。",
        "每个需要延迟出现的画面元素都必须在 remotion-alignment.json 的 visualElements 中声明，并通过 bindingId 一对一绑定命名 visualBindings；箭头、连线和关系标签必须声明依赖项，并从所有依赖项中最晚的显示帧开始。实现文件必须声明 implementationSymbols，禁止使用 Cue 数组下标、任意 fallback 帧、固定间隔推算或默认从 Scene 起始帧显示。",
      ]),
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
