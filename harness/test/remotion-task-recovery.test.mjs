import assert from "node:assert/strict";
import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import test from "node:test";
import {
  getRemotionTask,
  recoverInterruptedRemotionTasks,
  runRemotionTask,
} from "../src/remotion-tasks.mjs";

function setup() {
  const root = fs.mkdtempSync(path.join(os.tmpdir(), "video-remotion-task-recovery-"));
  process.env.HARNESS_PROJECTS_DIR = path.join(root, "projects");
  process.env.HARNESS_REMOTION_TASKS_DIR = path.join(root, "remotion-tasks");
  fs.mkdirSync(process.env.HARNESS_REMOTION_TASKS_DIR, { recursive: true });
  return root;
}

function writeTask(id, status) {
  const task = {
    schemaVersion: 1,
    id,
    kind: "remotion-production-task",
    stage: "remotion",
    slug: "recovery-video",
    batchId: null,
    status,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
    startedAt: status === "in-progress" ? new Date().toISOString() : null,
    completedAt: null,
    error: null,
  };
  fs.writeFileSync(path.join(process.env.HARNESS_REMOTION_TASKS_DIR, `${id}.json`), `${JSON.stringify(task)}\n`);
}

test("recovers an interrupted Remotion task as blocked and retryable", () => {
  setup();
  const id = "11111111-1111-4111-8111-111111111111";
  writeTask(id, "in-progress");

  recoverInterruptedRemotionTasks();

  const task = getRemotionTask(id);
  assert.equal(task.status, "blocked");
  assert.equal(task.error.code, "server-restarted");
  assert.equal(task.error.message, "Web Server 重启导致 Remotion 任务中断，可以安全重试。");
  assert.equal(task.completedAt, null);
});

test("keeps an unconfigured Remotion task blocked instead of silently failing", async () => {
  setup();
  const id = "22222222-2222-4222-8222-222222222222";
  writeTask(id, "ready");

  const result = await runRemotionTask(id);

  assert.equal(result.completed, false);
  assert.equal(result.task.status, "blocked");
  assert.equal(result.task.error.code, "executor-not-configured");
});
