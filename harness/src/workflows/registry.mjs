import {
  CURRENT_WORKFLOW_VERSION,
  RETIRED_STAGE_DEFINITIONS,
} from "../stages.mjs";
import { NARRATED_TUTORIAL_WORKFLOW } from "./narrated-tutorial-v1.mjs";
import { PRODUCT_PROMO_WORKFLOW } from "./product-promo-v1.mjs";

export const LEGACY_WORKFLOW_ID = "default";
export const DEFAULT_WORKFLOW_ID = "narrated-tutorial-v1";

const definitions = Object.freeze({
  [DEFAULT_WORKFLOW_ID]: NARRATED_TUTORIAL_WORKFLOW,
  [PRODUCT_PROMO_WORKFLOW.id]: PRODUCT_PROMO_WORKFLOW,
});

function workflowConfig(input) {
  if (!input || typeof input !== "object") return { workflow: input };
  return input.config && typeof input.config === "object" ? input.config : input;
}

export function normalizeWorkflowId(workflow) {
  return workflow === undefined || workflow === null || workflow === "" || workflow === LEGACY_WORKFLOW_ID
    ? DEFAULT_WORKFLOW_ID
    : workflow;
}

function workflowError(code, message, details = {}) {
  const error = new Error(message);
  error.code = code;
  Object.assign(error, details);
  return error;
}

export function getWorkflowDefinition(workflow) {
  return definitions[normalizeWorkflowId(workflow)] ?? null;
}

export function requireWorkflowDefinition(input) {
  const config = workflowConfig(input);
  const rawWorkflow = config.workflow;
  const normalizedWorkflow = normalizeWorkflowId(rawWorkflow);
  const definition = definitions[normalizedWorkflow];
  if (!definition) {
    throw workflowError(
      "unknown-workflow",
      `Unknown workflow: ${String(rawWorkflow ?? normalizedWorkflow)}`,
      { workflow: rawWorkflow ?? null },
    );
  }

  const version = config.workflowVersion;
  const isLegacyReference = rawWorkflow === undefined
    || rawWorkflow === null
    || rawWorkflow === ""
    || rawWorkflow === LEGACY_WORKFLOW_ID;
  if (version === undefined || version === null || version === "") {
    if (!isLegacyReference) {
      throw workflowError(
        "workflow-version-missing",
        `Workflow ${normalizedWorkflow} requires an explicit workflowVersion`,
        { workflow: normalizedWorkflow },
      );
    }
    return definition;
  }

  const numericVersion = Number(version);
  const legacyVersionAllowed = isLegacyReference
    && Number.isInteger(numericVersion)
    && numericVersion >= 1
    && numericVersion <= definition.version;
  if (numericVersion !== definition.version && !legacyVersionAllowed) {
    throw workflowError(
      "unsupported-workflow-version",
      `Unsupported workflow version: ${normalizedWorkflow}@${String(version)}`,
      { workflow: normalizedWorkflow, workflowVersion: version },
    );
  }
  return definition;
}

export function workflowForProject(project) {
  return requireWorkflowDefinition(project);
}

export function workflowIdForProject(project) {
  return workflowForProject(project).id;
}

export function workflowStages(project) {
  return workflowForProject(project).stages;
}

export function workflowStageDefinitions(project) {
  return workflowForProject(project).stageDefinitions;
}

export function workflowStageDefinition(project, stage) {
  return workflowStageDefinitions(project)[stage] ?? null;
}

export function workflowStageIndex(project, stage) {
  return workflowStages(project).indexOf(stage);
}

export function workflowPreviousStage(project, stage) {
  const index = workflowStageIndex(project, stage);
  return index > 0 ? workflowStages(project)[index - 1] : null;
}

export function workflowNextStage(project, stage) {
  const stages = workflowStages(project);
  const index = stages.indexOf(stage);
  return index >= 0 && index < stages.length - 1 ? stages[index + 1] : null;
}

export function workflowReturnToStages(project, stage) {
  const index = workflowStageIndex(project, stage);
  if (index <= 0) return [];
  const definitionsForProject = workflowStageDefinitions(project);
  return workflowStages(project).slice(0, index).map((returnStage) => ({
    stage: returnStage,
    label: definitionsForProject[returnStage].label,
  }));
}

export function workflowIsGateStage(project, stage) {
  return workflowStageDefinition(project, stage)?.kind === "gate";
}

export function workflowAdapterStages(project) {
  return new Set(workflowStages(project).filter((stage) => workflowStageDefinition(project, stage)?.requiresAdapter));
}

export function workflowPaths(input, slugOverride = null) {
  const definition = input?.id && input?.stageDefinitions
    ? input
    : requireWorkflowDefinition(input);
  const config = workflowConfig(input);
  const slug = slugOverride ?? config.slug ?? input?.slug ?? input?.state?.slug;
  if (typeof slug !== "string" || !slug.trim()) throw new Error("Workflow paths require a project slug");
  const base = definition.pathNamespace ? `${definition.pathNamespace}/${slug}` : slug;
  return {
    sourceDirectory: `videos/${base}`,
    remotionDirectory: `src/videos/${base}`,
    assetArchive: `assets/${definition.pathNamespace ? `${definition.pathNamespace}/` : ""}${slug}-assets.zip`,
    renderInputDirectory: `local/render-input/${slug}`,
    renderOutput: `out/${slug}.mp4`,
  };
}

export function createWorkflowStageState(project, stage, index) {
  return {
    stage,
    order: index,
    status: index === 0 ? "ready" : "pending",
    attempts: 0,
    outputs: [],
    review: null,
    error: null,
    invalidatedBy: null,
    rebuildBaselineFingerprint: null,
    outputFingerprint: null,
    updatedAt: null,
  };
}

export function createWorkflowStagesState(project) {
  return Object.fromEntries(
    workflowStages(project).map((stage, index) => [stage, createWorkflowStageState(project, stage, index)]),
  );
}

export function stagesForWorkflowProjectView(project) {
  const stages = workflowStages(project);
  const config = workflowConfig(project);
  const workflowVersion = Number(config.workflowVersion ?? 1);
  const hasRetiredSmokeRecord = normalizeWorkflowId(config.workflow) === DEFAULT_WORKFLOW_ID
    && workflowVersion < CURRENT_WORKFLOW_VERSION
    && Boolean(project?.state?.stages?.["smoke-render"]);
  if (!hasRetiredSmokeRecord) return stages;
  return Object.freeze(stages.flatMap((stage) => stage === "render" ? ["smoke-render", stage] : [stage]));
}

export function retiredStageDefinition(stage) {
  return RETIRED_STAGE_DEFINITIONS[stage] ?? null;
}

export function allWorkflowDefinitions() {
  return definitions;
}

export function workflowCatalog() {
  return Object.values(definitions).map((definition) => Object.freeze({
    id: definition.id,
    version: definition.version,
    kind: definition.kind,
    label: definition.label,
    description: definition.description,
    pathMode: definition.pathMode,
    pathNamespace: definition.pathNamespace ?? null,
    timelineMode: definition.timelineMode,
    audioMode: definition.audioMode,
    stages: Object.freeze([...definition.stages]),
    gateStages: Object.freeze([...definition.gateStages]),
    batchSupported: definition.batchSupported !== false,
  }));
}
