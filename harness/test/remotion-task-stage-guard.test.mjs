import assert from "node:assert/strict";
import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import test from "node:test";
import {
  completeRemotionTask,
  ensureRemotionTask,
  getRemotionTask,
  retryRemotionTask,
  runRemotionTask,
  startRemotionTask,
} from "../src/remotion-tasks.mjs";
import { initializeProject, loadProject, writeJson } from "../src/storage.mjs";

function writeTask(root, { id, slug, status }) {
  const now = new Date().toISOString();
  const task = {
    schemaVersion: 1,
    id,
    kind: "remotion-production-task",
    stage: "remotion",
    slug,
    batchId: null,
    status,
    createdAt: now,
    updatedAt: now,
    startedAt: null,
    completedAt: null,
    error: status === "ready" ? null : { code: "fixture", message: "fixture" },
  };
  fs.writeFileSync(path.join(root, `${id}.json`), `${JSON.stringify(task, null, 2)}\n`, "utf8");
  return task;
}

test("blocks stale Remotion task start, retry, and run after the project reaches Gate 3", async () => {
  const root = fs.mkdtempSync(path.join(os.tmpdir(), "video-remotion-stage-guard-"));
  const previousProjectsRoot = process.env.HARNESS_PROJECTS_DIR;
  const previousTasksRoot = process.env.HARNESS_REMOTION_TASKS_DIR;
  process.env.HARNESS_PROJECTS_DIR = path.join(root, "projects");
  process.env.HARNESS_REMOTION_TASKS_DIR = path.join(root, "remotion-tasks");
  fs.mkdirSync(process.env.HARNESS_REMOTION_TASKS_DIR, { recursive: true });

  try {
    const slug = "stale-remotion-video";
    initializeProject(slug);
    const project = loadProject(slug, { refresh: false });
    project.state.currentStage = "gate-3";
    project.state.stages.remotion.status = "succeeded";
    project.state.stages["gate-3"].status = "waiting";
    writeJson(project.files.state, project.state);

    const startTask = writeTask(process.env.HARNESS_REMOTION_TASKS_DIR, {
      id: "11111111-1111-4111-8111-111111111111",
      slug,
      status: "blocked",
    });
    const retryTask = writeTask(process.env.HARNESS_REMOTION_TASKS_DIR, {
      id: "22222222-2222-4222-8222-222222222222",
      slug,
      status: "failed",
    });
    const runTask = writeTask(process.env.HARNESS_REMOTION_TASKS_DIR, {
      id: "33333333-3333-4333-8333-333333333333",
      slug,
      status: "ready",
    });
    const completeTask = writeTask(process.env.HARNESS_REMOTION_TASKS_DIR, {
      id: "44444444-4444-4444-8444-444444444444",
      slug,
      status: "in-progress",
    });
    let executorCalls = 0;

    assert.throws(
      () => ensureRemotionTask({ slug }),
      (error) => error.code === "remotion-stage-not-ready",
    );
    assert.throws(
      () => startRemotionTask(startTask.id),
      (error) => error.code === "remotion-stage-not-ready",
    );
    assert.throws(
      () => retryRemotionTask(retryTask.id),
      (error) => error.code === "remotion-stage-not-ready",
    );
    await assert.rejects(
      () => runRemotionTask(runTask.id, {
        executor: { async run() { executorCalls += 1; } },
      }),
      (error) => error.code === "remotion-stage-not-ready",
    );
    assert.throws(
      () => completeRemotionTask(completeTask.id),
      (error) => error.code === "remotion-stage-not-ready",
    );

    assert.equal(executorCalls, 0);
    assert.equal(getRemotionTask(startTask.id).status, "blocked");
    assert.equal(getRemotionTask(retryTask.id).status, "failed");
    assert.equal(getRemotionTask(runTask.id).status, "ready");
    assert.equal(getRemotionTask(completeTask.id).status, "in-progress");
  } finally {
    if (previousProjectsRoot === undefined) delete process.env.HARNESS_PROJECTS_DIR;
    else process.env.HARNESS_PROJECTS_DIR = previousProjectsRoot;
    if (previousTasksRoot === undefined) delete process.env.HARNESS_REMOTION_TASKS_DIR;
    else process.env.HARNESS_REMOTION_TASKS_DIR = previousTasksRoot;
    fs.rmSync(root, { recursive: true, force: true });
  }
});
