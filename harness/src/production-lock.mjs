import fs from "node:fs";
import path from "node:path";

// Kept independent of storage/runner so every executor can use the same lock.
function lockPath(project) {
  return path.join(path.dirname(project.files.state), "production-task.lock.json");
}

function assertMutable(project) {
  const state = JSON.parse(fs.readFileSync(project.files.state, "utf8"));
  if (state.currentStage === "completed") throw Object.assign(new Error("已完成视频永久只读，不能修改执行锁。"), { code: "completed-project-read-only" });
}

export function activeProductionTask(project) {
  if (!project.files?.state) return null;
  const file = lockPath(project);
  return fs.existsSync(file) ? JSON.parse(fs.readFileSync(file, "utf8")) : null;
}

export function assertProductionTaskOwner(project, owner = project.taskOwner ?? null) {
  const active = activeProductionTask(project);
  if (active && active.id !== owner) {
    throw Object.assign(new Error(`任务 ${active.id} 已占用项目，请恢复或结束原任务。`), { code: "production-task-owned", taskId: active.id });
  }
  return active;
}

export function acquireProductionTask(project, { id, stage, mode }) {
  assertMutable(project);
  const existing = activeProductionTask(project);
  if (existing?.id === id) return existing;
  assertProductionTaskOwner(project, id);
  const record = { id, stage, mode, claimedAt: new Date().toISOString() };
  try {
    fs.writeFileSync(lockPath(project), `${JSON.stringify(record)}\n`, { flag: "wx" });
  } catch (error) {
    if (error.code === "EEXIST") assertProductionTaskOwner(project, id);
    throw error;
  }
  return record;
}

export function releaseProductionTask(project, id) {
  assertMutable(project);
  const active = assertProductionTaskOwner(project, id);
  if (!active) return;
  // Archive rather than discard the claim; the ID remains available for recovery.
  fs.renameSync(lockPath(project), `${lockPath(project)}.${id}.released`);
}
