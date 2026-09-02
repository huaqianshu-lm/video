export function actionViewModel({ action, stage, gate, pending = false } = {}) {
  return { action, stage: stage ?? null, gate: gate ?? null, pending: Boolean(pending) };
}
