export const UNIFIED_PRODUCTION_CONTRACT = "unified-v1";
export const STORYBOARD_PRODUCTION_CONTRACT = "storyboard-v1";
export const PLANNING_STAGES = Object.freeze(["content-analysis", "video-narrative", "scene-script"]);

export function productionContract(project) {
  const value = (project.config ?? project).productionContract ?? "legacy-v1";
  if (!["legacy-v1", UNIFIED_PRODUCTION_CONTRACT, STORYBOARD_PRODUCTION_CONTRACT].includes(value)) {
    throw Object.assign(new Error(`Unsupported production contract: ${value}`), { code: "unsupported-production-contract" });
  }
  return value;
}

export function usesUnifiedProduction(project) {
  return [UNIFIED_PRODUCTION_CONTRACT, STORYBOARD_PRODUCTION_CONTRACT].includes(productionContract(project));
}

export function usesStoryboardProduction(project) {
  return productionContract(project) === STORYBOARD_PRODUCTION_CONTRACT;
}

export function planningStages(project) {
  return usesStoryboardProduction(project) ? PLANNING_STAGES.slice(0, 2) : PLANNING_STAGES;
}

export function taskStages(project) {
  const stage = project.state.currentStage;
  const planning = planningStages(project);
  const index = planning.indexOf(stage);
  if (usesStoryboardProduction(project) && stage === "narration-script") return [stage, "storyboard"];
  return usesUnifiedProduction(project) && index >= 0 ? planning.slice(index) : [stage];
}

export function productionManualChecks(project, definition) {
  return [...definition.manualChecks, ...(usesUnifiedProduction(project) && definition.stage === "gate-3"
    ? ["正常速度试听当前音频，确认发音、停顿、语速及字幕音画同步。"] : [])];
}
