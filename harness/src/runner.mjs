import { isGateStage, nextStage, previousStage, stageIndex, ADAPTER_REQUIRED_STAGES, STAGES, STAGE_DEFINITIONS } from "./stages.mjs";
import { validateProjectStage } from "./validation.mjs";
import { writeJson } from "./storage.mjs";
import { fingerprintStageArtifacts } from "./fingerprints.mjs";
import { ensureTtsScript } from "./tts-script.mjs";
import { freezePrototypeBaseline } from "./remotion-alignment.mjs";

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
  item.rebuildBaselineFingerprint = null;
  item.outputs = outputs;
  item.remote = null;
  item.outputFingerprint = STAGE_DEFINITIONS[stage].remoteOutput
    ? null
    : fingerprintStageArtifacts(project, stage);
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

export function markAdapterStageFailed(project, stage, error) {
  const failure = {
    code: "adapter-failed",
    stage,
    message: error instanceof Error ? error.message : String(error),
  };
  const item = project.state.stages[stage];
  item.status = "failed";
  item.error = failure;
  if (!(stage === "remotion" && item.invalidatedBy === "gate-3-rejected")) {
    item.invalidatedBy = null;
  }
  item.remote = null;
  item.updatedAt = new Date().toISOString();
  saveState(project);
  return failure;
}

function failAdapterStage(project, stage, error) {
  const failure = markAdapterStageFailed(project, stage, error);
  throw new Error(failure.message);
}

function markExecutorStageFailed(project, stage, error) {
  const failure = {
    code: error?.code ?? "executor-failed",
    stage,
    message: error instanceof Error ? error.message : String(error),
    ...(error?.issues ? { issues: error.issues } : {}),
  };
  const item = project.state.stages[stage];
  item.status = "failed";
  item.error = failure;
  item.invalidatedBy = null;
  item.updatedAt = new Date().toISOString();
  saveState(project);
  return failure;
}

function completeExecutorStage(project, stage, result) {
  const issues = validateStage(project, stage);
  if (issues.length > 0) {
    const error = new Error(`${issues.length} artifact validation issue(s) in ${stage}`);
    error.code = "validation-failed";
    error.issues = issues;
    markExecutorStageFailed(project, stage, error);
    throw error;
  }
  return completeStage(project, stage, result?.outputs ?? []);
}

export function completeAdapterStage(project, stage, result) {
  completeStage(project, stage, result?.outputs ?? []);
  return { stage, status: "succeeded", nextStage: project.state.currentStage };
}

export function validateStage(project, requestedStage, options = {}) {
  const stage = requestedStage ?? project.state.currentStage;
  requireKnownStage(stage);
  const defaultOptions = {
    remotePreflight: project.state?.stages?.[stage]?.status === "ready"
      && STAGE_DEFINITIONS[stage].remoteOutput === true,
  };
  return validateProjectStage(project, stage, { ...defaultOptions, ...options });
}

export function runStage(project, requestedStage, { adapters = {}, executors = {}, deferAdapters = false } = {}) {
  const stage = requireCurrentStage(project, requestedStage);
  requireReady(project, stage);
  requirePreviousSucceeded(project, stage);

  const item = project.state.stages[stage];
  item.status = "running";
  item.attempts += 1;
  item.updatedAt = new Date().toISOString();
  saveState(project);

  if (isGateStage(stage)) {
    const issues = validateStage(project, stage);
    if (issues.length > 0) {
      const error = { code: "validation-failed", stage, issues };
      item.status = "failed";
      item.error = error;
      item.updatedAt = new Date().toISOString();
      saveState(project);
      throw new Error(`${issues.length} artifact validation issue(s) in ${stage}`);
    }
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
      const result = adapter.run({ stage, project, defer: deferAdapters });
      if (result && typeof result.then === "function") {
        return result.then(
          (resolved) => {
            if (resolved?.deferred) {
              item.remote = resolved.remote ?? null;
              item.updatedAt = new Date().toISOString();
              saveState(project);
              return { stage, status: "running", remote: resolved.remote ?? null };
            }
            return completeAdapterStage(project, stage, resolved);
          },
          (error) => failAdapterStage(project, stage, error),
        );
      }
      if (result?.deferred) {
        item.remote = result.remote ?? null;
        item.updatedAt = new Date().toISOString();
        saveState(project);
        return { stage, status: "running", remote: result.remote ?? null };
      }
      return completeAdapterStage(project, stage, result);
    } catch (error) {
      return failAdapterStage(project, stage, error);
    }
  }

  if (stage === "subtitle-timeline") {
    const inputIssues = validateProjectStage(project, "tts").filter((item) => item.severity !== "warning");
    if (inputIssues.length > 0) {
      const error = { code: "input-validation-failed", stage, inputStage: "tts", issues: inputIssues };
      item.status = "failed";
      item.error = error;
      item.updatedAt = new Date().toISOString();
      saveState(project);
      throw new Error(`TTS 输入校验失败：${inputIssues.map((issue) => issue.message).join("；")}`);
    }
  }

  const executor = executors[stage];
  if (executor) {
    if (typeof executor.run !== "function") {
      const error = new Error(`Executor for ${stage} must expose run()`);
      error.code = "executor-invalid";
      markExecutorStageFailed(project, stage, error);
      throw error;
    }

    try {
      const result = executor.run({ stage, project });
      if (result && typeof result.then === "function") {
        return result.then(
          (resolved) => completeExecutorStage(project, stage, resolved),
          (error) => {
            markExecutorStageFailed(project, stage, error);
            throw error;
          },
        );
      }
      return completeExecutorStage(project, stage, result);
    } catch (error) {
      markExecutorStageFailed(project, stage, error);
      throw error;
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

  let ttsScript = null;
  if (gate === "gate-2") {
    ttsScript = ensureTtsScript(project);
    const issues = validateStage(project, "tts").filter((item) => item.severity !== "warning");
    if (issues.length > 0) {
      throw new Error(`Gate 2 通过后无法进入 TTS：${issues.map((item) => item.message).join("；")}`);
    }
    freezePrototypeBaseline(project);
  }

  completeStage(project, gate);
  project.state.stages[gate].review = {
    decision: "approved",
    reviewedAt: new Date().toISOString(),
  };
  saveState(project);
  return {
    stage: gate,
    status: "succeeded",
    nextStage: project.state.currentStage,
    ...(ttsScript ? { ttsScript } : {}),
  };
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
  const returnStageItem = project.state.stages[returnTo];
  const rebuildBaselineFingerprint = gate === "gate-3" && returnTo === "remotion"
    ? returnStageItem.outputFingerprint
    : null;
  for (let index = stageIndex(returnTo); index <= stageIndex(gate); index += 1) {
    const stage = STAGES[index];
    project.state.stages[stage].status = stage === returnTo ? "ready" : "pending";
    project.state.stages[stage].error = stage === gate ? rejection : null;
    project.state.stages[stage].outputs = [];
    project.state.stages[stage].review = null;
    project.state.stages[stage].invalidatedBy = null;
    project.state.stages[stage].rebuildBaselineFingerprint = null;
    project.state.stages[stage].outputFingerprint = null;
    project.state.stages[stage].updatedAt = new Date().toISOString();
  }
  if (rebuildBaselineFingerprint !== null || (gate === "gate-3" && returnTo === "remotion")) {
    returnStageItem.invalidatedBy = "gate-3-rejected";
    returnStageItem.rebuildBaselineFingerprint = rebuildBaselineFingerprint;
  }
  project.state.stages[gate].review = {
    decision: "rejected",
    returnTo,
    reason,
    reviewedAt: new Date().toISOString(),
  };
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
  if (!(stage === "remotion" && project.state.stages[stage].invalidatedBy === "gate-3-rejected")) {
    project.state.stages[stage].invalidatedBy = null;
  }
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
