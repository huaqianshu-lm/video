export const HARNESS_VERSION = "0.1.0";

export const STAGES = Object.freeze([
  "source",
  "content-analysis",
  "video-narrative",
  "scene-script",
  "narration-script",
  "visual-script",
  "visual-prototype",
  "gate-2",
  "tts",
  "subtitle-timeline",
  "remotion",
  "gate-3",
  "smoke-render",
  "render",
  "gate-4",
]);

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
    updatedAt: null,
  };
}

export function createStagesState() {
  return Object.fromEntries(STAGES.map((stage, index) => [stage, createStageState(stage, index)]));
}

export const GATE_STAGES = new Set(["gate-2", "gate-3", "gate-4"]);
export const ADAPTER_REQUIRED_STAGES = new Set(["smoke-render", "render"]);

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
