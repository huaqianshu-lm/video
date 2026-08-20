import { isGateStage, nextStage, previousStage, stageIndex, ADAPTER_REQUIRED_STAGES, STAGES } from "./stages.mjs";
import { validateProjectStage } from "./validation.mjs";
import { writeJson } from "./storage.mjs";
import { fingerprintStageArtifacts } from "./fingerprints.mjs";

function saveState(project) {
  project.state.updatedAt = new Date().toISOString();
  writeJson(project.files.state, project.state);
}

function requireKnownStage(stage) {
  if (!STAGES.includes(stage)) {
    throw new Error(`Unknown stage: ${stage}`);
  }
}

function requireCurrentStage(project, requestedStage) {
  const stage = requestedStage ?? project.state.currentStage;
  requireKnownStage(stage);
  if (stage !== project.state.currentStage) {
    throw new Error(`Cannot skip stages: current stage is ${project.state.currentStage}`);
  }
  return stage;
}

function requireReady(project, stage) {
  const status = project.state.stages[stage].status;
  if (status !== "ready") {
    throw new Error(`Stage ${stage} is not ready; current status is ${status}`);
  }
}

function requirePreviousSucceeded(project, stage) {
  const previous = previousStage(stage);
  if (previous && project.state.stages[previous].status !== "succeeded") {
    throw new Error(`Previous stage is not complete: ${previous}`);
  }
}

function completeStage(project, stage, outputs = []) {
  const item = project.state.stages[stage];
  item.status = "succeeded";
  item.error = null;
  item.invalidatedBy = null;
  item.outputs = outputs;
  item.outputFingerprint = fingerprintStageArtifacts(project, stage);
  item.updatedAt = new Date().toISOString();
  const following = nextStage(stage);
  if (following) {
    project.state.currentStage = following;
    project.state.stages[following].status = "ready";
  } else {
    project.state.currentStage = "completed";
  }
  saveState(project);
}

function failAdapterStage(project, stage, error) {
  const failure = {
    code: "adapter-failed",
    stage,
    message: error instanceof Error ? error.message : String(error),
  };
  const item = project.state.stages[stage];
  item.status = "failed";
  item.error = failure;
  item.invalidatedBy = null;
  item.updatedAt = new Date().toISOString();
  saveState(project);
  throw new Error(failure.message);
}

function completeAdapterStage(project, stage, result) {
  completeStage(project, stage, result?.outputs ?? []);
  return { stage, status: "succeeded", nextStage: project.state.currentStage };
}

export function validateStage(project, requestedStage) {
  const stage = requestedStage ?? project.state.currentStage;
  requireKnownStage(stage);
  return validateProjectStage(project, stage);
}

export function runStage(project, requestedStage, { adapters = {} } = {}) {
  const stage = requireCurrentStage(project, requestedStage);
  requireReady(project, stage);
  requirePreviousSucceeded(project, stage);

  const item = project.state.stages[stage];
  item.status = "running";
  item.attempts += 1;
  item.updatedAt = new Date().toISOString();
  saveState(project);

  if (isGateStage(stage)) {
    item.status = "waiting";
    item.updatedAt = new Date().toISOString();
    saveState(project);
    return { stage, status: "waiting", message: `Waiting for manual approval: ${stage}` };
  }

  if (ADAPTER_REQUIRED_STAGES.has(stage)) {
    const adapter = adapters[stage];
    if (!adapter) {
      const error = {
        code: "adapter-not-configured",
        stage,
        message: `No adapter is configured for ${stage}`,
      };
      item.status = "failed";
      item.error = error;
      item.invalidatedBy = null;
      item.updatedAt = new Date().toISOString();
      saveState(project);
      throw new Error(error.message);
    }

    try {
      const result = adapter.run({ stage, project });
      if (result && typeof result.then === "function") {
        return result.then(
          (resolved) => completeAdapterStage(project, stage, resolved),
          (error) => failAdapterStage(project, stage, error),
        );
      }
      return completeAdapterStage(project, stage, result);
    } catch (error) {
      return failAdapterStage(project, stage, error);
    }
  }

  const errors = validateStage(project, stage);
  if (errors.length > 0) {
    const error = { code: "validation-failed", stage, issues: errors };
    item.status = "failed";
    item.error = error;
    item.updatedAt = new Date().toISOString();
    saveState(project);
    throw new Error(`${errors.length} artifact validation issue(s) in ${stage}`);
  }

  completeStage(project, stage);
  return { stage, status: "succeeded", nextStage: project.state.currentStage };
}

export function approveGate(project, gate) {
  requireKnownStage(gate);
  if (!isGateStage(gate)) {
    throw new Error(`${gate} is not a Gate stage`);
  }
  if (project.state.currentStage !== gate || project.state.stages[gate].status !== "waiting") {
    throw new Error(`Gate ${gate} is not waiting for approval`);
  }
  completeStage(project, gate);
  return { stage: gate, status: "succeeded", nextStage: project.state.currentStage };
}

export function rejectGate(project, gate, returnTo, reason) {
  requireKnownStage(gate);
  requireKnownStage(returnTo);
  if (!isGateStage(gate)) {
    throw new Error(`${gate} is not a Gate stage`);
  }
  if (stageIndex(returnTo) >= stageIndex(gate)) {
    throw new Error(`Return stage must be before ${gate}`);
  }
  if (!reason) {
    throw new Error("Gate rejection requires --reason");
  }
  if (project.state.currentStage !== gate || project.state.stages[gate].status !== "waiting") {
    throw new Error(`Gate ${gate} is not waiting for rejection`);
  }

  const rejection = { code: "gate-rejected", gate, returnTo, message: reason };
  for (let index = stageIndex(returnTo); index <= stageIndex(gate); index += 1) {
    const stage = STAGES[index];
    project.state.stages[stage].status = stage === returnTo ? "ready" : "pending";
    project.state.stages[stage].error = stage === gate ? rejection : null;
    project.state.stages[stage].outputs = [];
    project.state.stages[stage].invalidatedBy = null;
    project.state.stages[stage].outputFingerprint = null;
    project.state.stages[stage].updatedAt = new Date().toISOString();
  }
  project.state.currentStage = returnTo;
  saveState(project);
  return { stage: gate, status: "rejected", returnTo, reason };
}

export function retryStage(project, requestedStage) {
  const stage = requestedStage ?? project.state.currentStage;
  requireKnownStage(stage);
  if (project.state.stages[stage].status !== "failed") {
    throw new Error(`Stage ${stage} is not failed`);
  }
  project.state.stages[stage].status = "ready";
  project.state.stages[stage].error = null;
  project.state.stages[stage].invalidatedBy = null;
  project.state.currentStage = stage;
  project.state.stages[stage].updatedAt = new Date().toISOString();
  saveState(project);
  return { stage, status: "ready" };
}

export function resumeProject(project) {
  const stage = project.state.currentStage;
  const item = project.state.stages[stage];
  if (item.status === "failed") {
    return retryStage(project, stage);
  }
  return { stage, status: item.status, message: `Nothing to resume at ${stage}` };
}
