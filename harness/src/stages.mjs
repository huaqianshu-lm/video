export const HARNESS_VERSION = "0.5.0";

const rawStageDefinitions = [
  {
    stage: "source",
    artifacts: ["videos/{slug}/source.md"],
    objective: "固定并登记单条视频的输入内容。",
    inputStages: [],
    executor: "agent",
    validation: ["required-artifacts"],
    fallbackStage: null,
  },
  {
    stage: "content-analysis",
    artifacts: ["videos/{slug}/content-analysis.md"],
    objective: "提取核心命题、知识骨架、关系和可视觉化内容。",
    inputStages: ["source"],
    executor: "agent",
    validation: ["required-artifacts", "content-analysis-structure"],
    fallbackStage: "source",
  },
  {
    stage: "video-narrative",
    artifacts: ["videos/{slug}/video-narrative.md"],
    objective: "按观众认知过程重组视频叙事。",
    inputStages: ["content-analysis"],
    executor: "agent",
    validation: ["required-artifacts", "narrative-structure"],
    fallbackStage: "content-analysis",
  },
  {
    stage: "scene-script",
    artifacts: ["videos/{slug}/scene-script.md"],
    objective: "把视频叙事拆分为具有明确认知任务的 Scene。",
    inputStages: ["video-narrative"],
    executor: "agent",
    validation: ["required-artifacts", "scene-structure"],
    fallbackStage: "video-narrative",
  },
  {
    stage: "narration-script",
    artifacts: ["videos/{slug}/narration-script.md"],
    objective: "生成只包含实际口播、可独立观看的讲解稿。",
    inputStages: ["scene-script"],
    executor: "agent",
    validation: ["required-artifacts", "narration-purity", "source-reference-boundary"],
    fallbackStage: "scene-script",
  },
  {
    stage: "visual-script",
    artifacts: ["videos/{slug}/visual-script.md"],
    objective: "为每个 Scene 设计与口播互补的视觉表达。",
    inputStages: ["scene-script", "narration-script"],
    executor: "agent",
    validation: ["required-artifacts", "visual-script-structure", "screen-text-provenance"],
    fallbackStage: "narration-script",
  },
  {
    stage: "visual-prototype",
    artifacts: ["videos/{slug}/visual-prototype.html"],
    objective: "用低成本横屏原型确认构图、信息密度和视觉事件。",
    inputStages: ["visual-script"],
    executor: "agent",
    validation: ["required-artifacts", "prototype-structure"],
    fallbackStage: "visual-script",
  },
  {
    stage: "gate-2",
    kind: "gate",
    artifacts: [],
    objective: "确认口播、视觉表达和原型可以进入下游生产。",
    inputStages: ["narration-script", "visual-script", "visual-prototype"],
    executor: "human",
    validation: ["manual-gate"],
    manualChecks: [
      "口播可以脱离制作资料独立面向观众表达，且没有来源指代或内部制作文字。",
      "Visual Script 与 Visual Prototype 的 Scene、视觉事件和屏幕文字一致。",
      "所有画面文字都能追溯到当前视频生产资料，未带入参考视频语义。",
    ],
    fallbackStage: "visual-script",
  },
  {
    stage: "tts",
    artifacts: ["videos/{slug}/tts-script.json"],
    objective: "从冻结口播派生并校验下游 TTS 输入。",
    inputStages: ["gate-2"],
    executor: "agent",
    validation: ["required-artifacts", "tts-script-alignment", "tts-script-purity"],
    fallbackStage: "narration-script",
  },
  {
    stage: "subtitle-timeline",
    artifacts: [
      "src/videos/{slug}/generated/audio-manifest.json",
      "src/videos/{slug}/generated/subtitle-manifest.json",
      "src/videos/{slug}/generated/timeline-manifest.json",
    ],
    objective: "基于冻结 TTS 输入生成并校验音频、字幕和时间轴资料。",
    inputStages: ["tts"],
    executor: "agent",
    validation: ["required-artifacts", "tts-coverage", "subtitle-timeline-alignment"],
    fallbackStage: "tts",
  },
  {
    stage: "remotion",
    artifacts: ["src/videos/{slug}/video.config.ts", "src/videos/{slug}/*Video.tsx"],
    objective: "把已确认的内容、视觉和时间资料接入 Remotion Composition。",
    inputStages: ["subtitle-timeline", "visual-prototype"],
    executor: "agent",
    validation: ["required-artifacts", "remotion-config", "resource-manifest"],
    fallbackStage: "subtitle-timeline",
  },
  {
    stage: "gate-3",
    kind: "gate",
    artifacts: [],
    objective: "确认 Remotion 预览中的音画同步、节奏、文字和清洁输出。",
    inputStages: ["remotion"],
    executor: "human",
    validation: ["manual-gate", "clean-output-review"],
    manualChecks: [
      "音频、字幕、视觉事件和 Scene 边界同步。",
      "字幕和主文字处于安全区，画面没有溢出、遮挡或白屏。",
      "Composition 中没有预览导航、调试标记、辅助说明或无关文字。",
    ],
    fallbackStage: "remotion",
  },
  {
    stage: "smoke-render",
    requiresAdapter: true,
    artifacts: [],
    objective: "在远程环境验证代表帧、短片、字体、资源和音轨。",
    inputStages: ["gate-3"],
    executor: "adapter",
    validation: ["adapter-result", "smoke-artifact-metadata", "clean-output-review"],
    fallbackStage: "gate-3",
  },
  {
    stage: "render",
    requiresAdapter: true,
    remoteOutput: true,
    artifacts: ["out/{slug}.mp4"],
    objective: "在远程环境生成最终完整 MP4。",
    inputStages: ["smoke-render"],
    executor: "adapter",
    validation: ["adapter-result", "render-artifact-metadata"],
    fallbackStage: "smoke-render",
  },
  {
    stage: "gate-4",
    kind: "gate",
    artifacts: [],
    objective: "确认最终 MP4 的内容、声音、字幕、画面和交付质量。",
    inputStages: ["render"],
    executor: "human",
    validation: ["manual-gate", "final-output-review"],
    manualChecks: [
      "最终 MP4 的主题、口播、字幕、画面和 Scene 顺序完整一致。",
      "声音自然，字幕无明显错字、错位、提前或滞后。",
      "最终文件不包含预览控件、调试信息、参考视频残留文案或其他无关画面文字。",
    ],
    fallbackStage: "render",
  },
];

const stageDefinitions = rawStageDefinitions.map((definition, order) => ({
  kind: "production",
  requiresApproval: definition.kind === "gate",
  requiresAdapter: false,
  manualChecks: [],
  ...definition,
  order,
  previousStage: rawStageDefinitions[order - 1]?.stage ?? null,
  nextStage: rawStageDefinitions[order + 1]?.stage ?? null,
  contract: Object.freeze({
    objective: definition.objective,
    inputStages: Object.freeze([...(definition.inputStages ?? [])]),
    outputArtifacts: Object.freeze([...definition.artifacts]),
    executor: definition.executor,
    validation: Object.freeze([...(definition.validation ?? [])]),
    manualChecks: Object.freeze([...(definition.manualChecks ?? [])]),
    fallbackStage: definition.fallbackStage,
    nextStage: rawStageDefinitions[order + 1]?.stage ?? null,
  }),
}));

export const STAGE_DEFINITIONS = Object.freeze(
  Object.fromEntries(
    stageDefinitions.map((definition) => [definition.stage, Object.freeze(definition)]),
  ),
);

export const STAGES = Object.freeze(stageDefinitions.map(({ stage }) => stage));

export const STAGE_STATUSES = Object.freeze([
  "pending",
  "ready",
  "running",
  "waiting",
  "succeeded",
  "failed",
  "invalidated",
]);

export function createStageState(stage, index) {
  return {
    stage,
    order: index,
    status: index === 0 ? "ready" : "pending",
    attempts: 0,
    outputs: [],
    error: null,
    invalidatedBy: null,
    outputFingerprint: null,
    updatedAt: null,
  };
}

export function createStagesState() {
  return Object.fromEntries(STAGES.map((stage, index) => [stage, createStageState(stage, index)]));
}

export const GATE_STAGES = new Set(
  stageDefinitions.filter(({ kind }) => kind === "gate").map(({ stage }) => stage),
);
export const ADAPTER_REQUIRED_STAGES = new Set(
  stageDefinitions.filter(({ requiresAdapter }) => requiresAdapter).map(({ stage }) => stage),
);

export const DEFAULT_WORKFLOW_ID = "default";
export const WORKFLOW_DEFINITIONS = Object.freeze({
  [DEFAULT_WORKFLOW_ID]: Object.freeze({
    id: DEFAULT_WORKFLOW_ID,
    version: 1,
    description: "单条视频的标准生产 Workflow。",
    stages: STAGES,
  }),
});

export function getStageDefinition(stage) {
  return STAGE_DEFINITIONS[stage] ?? null;
}

export function getWorkflowDefinition(workflow = DEFAULT_WORKFLOW_ID) {
  return WORKFLOW_DEFINITIONS[workflow] ?? null;
}

export function isGateStage(stage) {
  return GATE_STAGES.has(stage);
}

export function stageIndex(stage) {
  return STAGES.indexOf(stage);
}

export function previousStage(stage) {
  const index = stageIndex(stage);
  return index > 0 ? STAGES[index - 1] : null;
}

export function nextStage(stage) {
  const index = stageIndex(stage);
  return index >= 0 && index < STAGES.length - 1 ? STAGES[index + 1] : null;
}
