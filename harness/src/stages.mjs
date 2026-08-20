export const HARNESS_VERSION = "0.2.0";

const rawStageDefinitions = [
  { stage: "source", artifacts: ["videos/{slug}/source.md"] },
  { stage: "content-analysis", artifacts: ["videos/{slug}/content-analysis.md"] },
  { stage: "video-narrative", artifacts: ["videos/{slug}/video-narrative.md"] },
  { stage: "scene-script", artifacts: ["videos/{slug}/scene-script.md"] },
  { stage: "narration-script", artifacts: ["videos/{slug}/narration-script.md"] },
  { stage: "visual-script", artifacts: ["videos/{slug}/visual-script.md"] },
  { stage: "visual-prototype", artifacts: ["videos/{slug}/visual-prototype.html"] },
  { stage: "gate-2", kind: "gate", artifacts: [] },
  { stage: "tts", artifacts: ["videos/{slug}/tts-script.json"] },
  {
    stage: "subtitle-timeline",
    artifacts: [
      "src/videos/{slug}/generated/audio-manifest.json",
      "src/videos/{slug}/generated/subtitle-manifest.json",
      "src/videos/{slug}/generated/timeline-manifest.json",
    ],
  },
  {
    stage: "remotion",
    artifacts: ["src/videos/{slug}/video.config.ts", "src/videos/{slug}/*Video.tsx"],
  },
  { stage: "gate-3", kind: "gate", artifacts: [] },
  { stage: "smoke-render", requiresAdapter: true, artifacts: [] },
  { stage: "render", requiresAdapter: true, artifacts: ["out/{slug}.mp4"] },
  { stage: "gate-4", kind: "gate", artifacts: [] },
];

const stageDefinitions = rawStageDefinitions.map((definition, order) => ({
  kind: "production",
  requiresApproval: definition.kind === "gate",
  requiresAdapter: false,
  ...definition,
  order,
  previousStage: rawStageDefinitions[order - 1]?.stage ?? null,
  nextStage: rawStageDefinitions[order + 1]?.stage ?? null,
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

export function getStageDefinition(stage) {
  return STAGE_DEFINITIONS[stage] ?? null;
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
