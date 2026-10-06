import { STAGE_DEFINITIONS, STAGES } from "../stages.mjs";

const overrides = {
  "narration-script": { inputStages: ["video-narrative"], fallbackStage: "video-narrative" },
  storyboard: {
    stage: "storyboard", label: "分镜方案", kind: "production", executor: "agent",
    requiresApproval: false, requiresAdapter: false,
    artifacts: ["videos/{slug}/storyboard.json"],
    objective: "先拟定场景草案，再与纯口播一起收敛为可审核的分镜方案。",
    inputStages: ["source", "content-analysis", "video-narrative", "narration-script"],
    validation: ["required-artifacts", "storyboard-contract"], manualChecks: [], fallbackStage: "narration-script",
  },
  "gate-2": {
    label: "Gate 2：口播与分镜审核", artifacts: [],
    objective: "人工确认口播与分镜方案，冻结同一审核版本。",
    inputStages: ["narration-script", "storyboard"], fallbackStage: "narration-script",
    manualChecks: ["确认事实、口播表达、开场及场景顺序。", "逐场确认视觉焦点、变化链、文字依据、停留和衔接。", "确认系列封面、片头、下一集预告与实现条件；实际动画、遮挡、节奏和同步留在 Gate 3 验证。"],
  },
  remotion: { inputStages: ["tts", "subtitle-timeline", "storyboard", "gate-2"] },
  "gate-3": { manualChecks: ["逐 Scene／Event 对照冻结分镜及 alignment，检查实际变化链、中间文字状态、遮挡、生命周期、停留和衔接。", "确认音频、字幕、视觉事件与 Scene 边界同步。", "确认安全区、无溢出遮挡白屏及预览控件。"] },
};
export const STORYBOARD_STAGES = Object.freeze(STAGES.filter(stage => !["scene-script", "visual-script", "visual-prototype"].includes(stage)).flatMap(stage => stage === "narration-script" ? [stage, "storyboard"] : [stage]));
export const STORYBOARD_STAGE_DEFINITIONS = Object.freeze(Object.fromEntries(STORYBOARD_STAGES.map((stage, order) => {
  const definition = { ...STAGE_DEFINITIONS[stage], ...overrides[stage], order, previousStage: STORYBOARD_STAGES[order - 1] ?? null, nextStage: STORYBOARD_STAGES[order + 1] ?? null };
  definition.contract = Object.freeze({ label: definition.label, objective: definition.objective, inputStages: definition.inputStages, outputArtifacts: definition.artifacts, executor: definition.executor, validation: definition.validation, manualChecks: definition.manualChecks, fallbackStage: definition.fallbackStage, nextStage: definition.nextStage });
  return [stage, Object.freeze(definition)];
})));
