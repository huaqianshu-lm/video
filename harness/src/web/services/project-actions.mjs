const ACTIONS = new Set([
  "initialize", "legacy-validate", "validate", "next", "report", "context", "plan", "run", "retry", "resume",
  "approve", "reject", "approve-tts-qc", "run-to-gate-2", "prepare-remote-render", "remote-run", "find-historical", "adopt-historical",
]);

export function normalizeProjectAction(input = {}) {
  return {
    slug: input.slug,
    action: input.action,
    stage: input.stage ?? null,
    gate: input.gate ?? null,
    returnTo: input.returnTo ?? null,
    reason: input.reason ?? null,
    runId: input.runId ?? null,
    commitAndPush: input.commitAndPush === true,
    confirmDelivery: input.confirmDelivery === true,
  };
}

export function isSupportedProjectAction(action) {
  return ACTIONS.has(action);
}

export async function executeProjectAction(input, runtime) {
  const action = normalizeProjectAction(input);
  if (!isSupportedProjectAction(action.action)) {
    const error = new Error(`Unknown action: ${action.action ?? "missing"}`);
    error.code = "unknown-project-action";
    throw error;
  }
  if (typeof runtime?.executeProjectAction !== "function") {
    throw new Error("Project action runtime is not configured");
  }
  return runtime.executeProjectAction(action);
}
