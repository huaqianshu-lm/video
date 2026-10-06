import { planningDocuments } from "./helpers/planning-fixture.mjs";
import assert from "node:assert/strict";
import crypto from "node:crypto";
import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import { execFile, execFileSync } from "node:child_process";
import test from "node:test";
import { claimDialogueTask, completeDialogueTask, createAgentJob, failAgentTask, getAgentJob, recoverInterruptedAgentJobs, resumeDialogueTask, retryAgentJob, runAgentJob } from "../src/agent-jobs.mjs";
import { buildTaskPacket } from "../src/context.mjs";
import { fingerprintStageArtifacts } from "../src/fingerprints.mjs";
import { activeProductionTask, acquireProductionTask, releaseProductionTask } from "../src/production-lock.mjs";
import { productionContract, taskStages } from "../src/production-contract.mjs";
import { approveGate, completeExecutorStage, rejectGate, runStage } from "../src/runner.mjs";
import { initializeProject, loadProject, writeJson } from "../src/storage.mjs";
import { createProjectActionService } from "../src/web/services/project-actions.mjs";
import { createWebServer } from "../src/web/server.mjs";
import { createWebServer as createLegacyWebServer } from "../src/web/legacy-server.mjs";
import { createFixture as createReviewFixture, runToGate3 } from "./helpers/production-fixture.mjs";
import { approveTtsQcForProject, createBatch, retryFailedBatchItems, runBatch } from "../src/batches.mjs";
import { runSingleStage } from "../src/single-runner.mjs";
import { listAgentJobs } from "../src/agent-jobs.mjs";

const documents = planningDocuments;

function fixture(t, contract) {
  const root = fs.mkdtempSync(path.join(os.tmpdir(), "harness-unified-task-"));
  const keys = { HARNESS_WORKSPACE_ROOT: "workspace", HARNESS_PROJECTS_DIR: "projects", HARNESS_AGENT_JOBS_DIR: "agent-jobs", HARNESS_REMOTION_TASKS_DIR: "remotion-tasks", HARNESS_BATCHES_DIR: "batches", HARNESS_SERIES_DIR: "series" };
  const previous = Object.fromEntries(Object.keys(keys).map(key => [key, process.env[key]]));
  for (const [key, directory] of Object.entries(keys)) process.env[key] = path.join(root, directory);
  t.after(() => {
    for (const [key, value] of Object.entries(previous)) if (value === undefined) delete process.env[key]; else process.env[key] = value;
    fs.rmSync(root, { recursive: true, force: true });
  });
  const slug = "unified-fixture";
  const materials = path.join(process.env.HARNESS_WORKSPACE_ROOT, "videos", slug);
  fs.mkdirSync(materials, { recursive: true });
  fs.writeFileSync(path.join(materials, "source.md"), "# Source\n\n解释任务调度。\n");
  initializeProject(slug, { prototypeBaseline: null, ...(contract ? { productionContract: contract } : {}) });
  runStage(loadProject(slug, { refresh: false }), "source");
  const write = (values = documents) => { for (const [name, content] of Object.entries(values)) fs.writeFileSync(path.join(materials, name), content); };
  return { slug, root, materials, write, project: () => loadProject(slug, { refresh: false }) };
}

function snapshot(root) {
  const result = {};
  function visit(directory) {
    if (!fs.existsSync(directory)) return;
    for (const item of fs.readdirSync(directory, { withFileTypes: true })) {
      const file = path.join(directory, item.name);
      if (item.isDirectory()) visit(file);
      else result[path.relative(root, file)] = crypto.createHash("sha256").update(fs.readFileSync(file)).digest("hex");
    }
  }
  visit(root); return result;
}

test("new projects group planning while missing contract remains legacy and unknown versions fail", t => {
  const f = fixture(t);
  assert.equal(productionContract(f.project()), "unified-v1");
  assert.deepEqual(taskStages(f.project()), ["content-analysis", "video-narrative", "scene-script"]);
  const project = f.project(); delete project.config.productionContract; writeJson(project.files.config, project.config);
  assert.equal(productionContract(f.project()), "legacy-v1");
  assert.deepEqual(taskStages(f.project()), ["content-analysis"]);
  project.config.productionContract = "unknown"; writeJson(project.files.config, project.config);
  assert.throws(f.project, { code: "unsupported-production-contract" });
});

test("dialogue and Web expose the same planning packet and dialogue holds the shared lock", async t => {
  const f = fixture(t);
  const service = createProjectActionService({ queueAgentJob() { assert.fail("must not launch another executor"); } });
  const web = await service.execute({ slug: f.slug, action: "context" });
  const job = claimDialogueTask(f.slug);
  assert.deepEqual(job.task.task.stages, web.result.task.stages);
  assert.deepEqual(job.task.context.writePaths, web.result.context.writePaths);
  assert.equal(activeProductionTask(f.project()).id, job.id);
  await assert.rejects(service.execute({ slug: f.slug, action: "run", stage: "content-analysis" }), { code: "production-task-owned" });
  assert.throws(() => claimDialogueTask(f.slug), { code: "production-task-owned" });
  assert.throws(() => runStage(f.project(), "content-analysis"), { code: "production-task-required" });
});

test("one dialogue planning submission validates all three outputs and records internal Gate 1", t => {
  const f = fixture(t); const job = claimDialogueTask(f.slug); f.write();
  const finished = completeDialogueTask(job.id, "制作三份策划资料。");
  assert.equal(finished.status, "succeeded");
  assert.equal(f.project().state.currentStage, "narration-script");
  assert.equal(f.project().state.stages["scene-script"].review.internal, true);
  assert.equal(activeProductionTask(f.project()), null);
  assert.deepEqual(completeDialogueTask(job.id, "重复提交。"), getAgentJob(job.id));
});

test("simultaneous CLI claims across processes persist exactly one owner", async t => {
  const f = fixture(t);
  const cli = path.resolve(new URL("../src/cli.mjs", import.meta.url).pathname);
  const claim = () => new Promise(resolve => {
    execFile(process.execPath, [cli, "production-task", "claim", f.slug], { env: process.env }, (error, stdout, stderr) => resolve({ error, stdout, stderr }));
  });
  const results = await Promise.all([claim(), claim()]);
  const successful = results.filter(result => !result.error);
  assert.equal(successful.length, 1);
  const rejected = results.find(result => result.error);
  assert.match(rejected.stdout + rejected.stderr, /已领取|已占用/);
  const jobs = listAgentJobs({ slug: f.slug });
  assert.equal(jobs.length, 1);
  assert.equal(activeProductionTask(f.project()).id, jobs[0].id);
});

test("background planning uses the same grouped output validation", async t => {
  const f = fixture(t); const job = createAgentJob({ slug: f.slug, stage: "content-analysis" });
  const finished = await runAgentJob(job.id, { executor: { async run({ project }) {
    assert.deepEqual(buildTaskPacket(project).task.stages, job.stages); f.write(); return { summary: "后台制作。" };
  } } });
  assert.equal(finished.status, "succeeded");
  assert.equal(f.project().state.currentStage, "narration-script");
});

test("missing or invalid planning output never advances any internal stage", t => {
  const f = fixture(t); const job = claimDialogueTask(f.slug);
  f.write({ ...documents, "scene-script.md": "# Invalid\n" });
  assert.throws(() => completeDialogueTask(job.id, "不合格策划。"), { code: "validation-failed" });
  assert.equal(f.project().state.currentStage, "content-analysis");
  assert.equal(f.project().state.stages["video-narrative"].status, "pending");
  assert.equal(activeProductionTask(f.project()).id, job.id);
  f.write(); assert.equal(completeDialogueTask(job.id, "修复后提交。").status, "succeeded");
});

test("existing unchanged files cannot be reported as fresh production", t => {
  const f = fixture(t); f.write(); const job = claimDialogueTask(f.slug);
  assert.throws(() => completeDialogueTask(job.id, "原样回传。"), { code: "production-output-unchanged" });
  assert.equal(f.project().state.currentStage, "content-analysis");
});

test("upstream changes reject stale results without losing the claim", t => {
  const f = fixture(t); const job = claimDialogueTask(f.slug); f.write();
  fs.appendFileSync(path.join(f.materials, "source.md"), "更新来源。\n");
  assert.throws(() => completeDialogueTask(job.id, "基于旧输入。"), { code: "production-input-changed" });
  assert.equal(activeProductionTask(f.project()).id, job.id);
  failAgentTask(job.id, "输入改变，需要重新安排。");
  assert.equal(loadProject(f.slug, { refresh: true }).state.currentStage, "source");
});

test("server restart preserves dialogue tasks and failure resumes the same ID", t => {
  const f = fixture(t); const job = claimDialogueTask(f.slug);
  recoverInterruptedAgentJobs();
  assert.equal(getAgentJob(job.id).status, "running");
  assert.equal(resumeDialogueTask(job.id).id, job.id);
  failAgentTask(job.id, "主动模拟中断。");
  assert.equal(activeProductionTask(f.project()), null);
  const resumed = resumeDialogueTask(job.id);
  assert.equal(resumed.id, job.id); assert.equal(resumed.attempts, 2);
  f.write(); assert.equal(completeDialogueTask(job.id, "恢复后完成。").status, "succeeded");
});

test("server restart releases queued background tasks and retry reclaims their lock", t => {
  const f = fixture(t); const job = createAgentJob({ slug: f.slug, stage: "content-analysis" });
  recoverInterruptedAgentJobs();
  assert.equal(getAgentJob(job.id).status, "failed");
  assert.equal(activeProductionTask(f.project()), null);
  retryAgentJob(job.id);
  assert.equal(activeProductionTask(f.project())?.id, job.id);
  assert.throws(() => claimDialogueTask(f.slug), { code: "production-task-owned" });
});

test("a stale failed job must not fail the stage owned by a different task", async t => {
  const f = fixture(t); const old = createAgentJob({ slug: f.slug, stage: "content-analysis" });
  const failed = await runAgentJob(old.id); assert.equal(failed.status, "failed");
  const dialogue = claimDialogueTask(f.slug); const before = snapshot(path.join(f.root, "projects"));
  const rejected = await runAgentJob(old.id, { executor: { run() { assert.fail("must not run"); } } });
  assert.equal(rejected.status, "failed");
  assert.deepEqual(snapshot(path.join(f.root, "projects")), before);
  assert.equal(activeProductionTask(f.project()).id, dialogue.id);
});

test("completed projects reject task and lock writes including stale in-memory objects", t => {
  const f = fixture(t); const job = claimDialogueTask(f.slug); const stale = f.project();
  const completed = f.project(); completed.state.currentStage = "completed"; writeJson(completed.files.state, completed.state);
  const before = snapshot(f.root);
  assert.throws(() => failAgentTask(job.id, "不应修改。"), /永久只读/);
  assert.throws(() => resumeDialogueTask(job.id), /永久只读/);
  assert.throws(() => acquireProductionTask(stale, { id: "new", stage: "remotion", mode: "dialogue" }), /永久只读/);
  assert.throws(() => releaseProductionTask(stale, job.id), /永久只读/);
  recoverInterruptedAgentJobs(); loadProject(f.slug, { refresh: true });
  assert.deepEqual(snapshot(f.root), before);
});

test("planning submission resumes after the final stage checkpoint before job completion", t => {
  const f = fixture(t); const job = claimDialogueTask(f.slug); f.write();
  const project = f.project(); project.taskOwner = job.id;
  job.validatedFingerprints = Object.fromEntries(job.stages.map(stage => [stage, fingerprintStageArtifacts(project, stage)]));
  writeJson(path.join(f.root, "agent-jobs", `${job.id}.json`), job);
  for (const stage of job.stages) {
    if (project.state.stages[stage].status === "ready") { project.state.stages[stage].status = "running"; writeJson(project.files.state, project.state); }
    completeExecutorStage(project, stage, {});
  }
  assert.equal(f.project().state.currentStage, "narration-script");
  assert.equal(completeDialogueTask(job.id, "恢复完成检查点。").status, "succeeded");
  assert.equal(activeProductionTask(f.project()), null);
});

test("actual CLI claim and complete share persisted dialogue task state", t => {
  const f = fixture(t); const cli = path.resolve(new URL("../src/cli.mjs", import.meta.url).pathname);
  const run = args => JSON.parse(execFileSync(process.execPath, [cli, ...args], { encoding: "utf8", env: process.env }));
  const job = run(["production-task", "claim", f.slug]);
  assert.equal(getAgentJob(job.id).mode, "dialogue"); f.write();
  assert.equal(run(["production-task", "complete", job.id, "--summary", "CLI 制作完成。"]).status, "succeeded");
  assert.equal(f.project().state.currentStage, "narration-script");
});

test("source and TTS registration packets do not instruct agents to claim production jobs", t => {
  const f = fixture(t); const project = f.project(); project.state.currentStage = "source";
  assert.equal(buildTaskPacket(project).task.commands.claim, undefined);
  project.state.currentStage = "tts";
  assert.equal(buildTaskPacket(project).task.commands.claim, undefined);
});

function reviewFixture(t, unified = true) {
  const keys = ["HARNESS_WORKSPACE_ROOT", "HARNESS_PROJECTS_DIR", "HARNESS_TTS_PROJECT_DIR", "HARNESS_AGENT_JOBS_DIR", "HARNESS_REMOTION_TASKS_DIR", "HARNESS_BATCHES_DIR"];
  const previous = Object.fromEntries(keys.map(key => [key, process.env[key]]));
  const { slug, projectsRoot } = createReviewFixture();
  const project = loadProject(slug, { refresh: false });
  for (const [key, directory] of [["HARNESS_AGENT_JOBS_DIR", "agent-jobs"], ["HARNESS_REMOTION_TASKS_DIR", "remotion-tasks"], ["HARNESS_BATCHES_DIR", "batches"]]) process.env[key] = path.join(project.config.workspaceRoot, "local", directory);
  runToGate3(project);
  if (unified) {
    project.config.productionContract = "unified-v1";
    writeJson(project.files.config, project.config);
    for (const [stage, item] of Object.entries(project.state.stages)) if (item.status === "succeeded") item.outputFingerprint = fingerprintStageArtifacts(project, stage);
    writeJson(project.files.state, project.state);
  }
  t.after(() => {
    for (const [key, value] of Object.entries(previous)) if (value === undefined) delete process.env[key]; else process.env[key] = value;
    fs.rmSync(projectsRoot, { recursive: true, force: true });
    fs.rmSync(project.config.workspaceRoot, { recursive: true, force: true });
  });
  return project;
}

test("unified Gate 3 includes listening and approval binds current audio and TTS fingerprints", async t => {
  const project = reviewFixture(t);
  assert.match(buildTaskPacket(project).task.manualChecks.join(" "), /正常速度试听/);
  await assert.rejects(() => approveTtsQcForProject(project.config.slug), /Gate 3/);
  approveGate(project, "gate-3");
  const current = loadProject(project.config.slug, { refresh: false });
  assert.equal(current.state.currentStage, "render");
  const review = current.state.stages["subtitle-timeline"].review;
  assert.equal(review.gate, "gate-3");
  assert.equal(review.outputFingerprint, fingerprintStageArtifacts(current, "subtitle-timeline"));
  assert.equal(review.ttsFingerprint, fingerprintStageArtifacts(current, "tts"));
});

test("legacy Gate 3 does not fabricate a combined listening approval", t => {
  const project = reviewFixture(t, false);
  approveGate(project, "gate-3");
  assert.equal(loadProject(project.config.slug, { refresh: false }).state.stages["subtitle-timeline"].review, null);
});

test("changing audio invalidates Gate 3 approval and returns to audio production", t => {
  const project = reviewFixture(t);
  const audio = path.join(project.config.workspaceRoot, project.config.remotionDirectory, "generated/audio/scene-01/01-01.mp3");
  fs.mkdirSync(path.dirname(audio), { recursive: true }); fs.writeFileSync(audio, "original-test-audio");
  project.state.stages["subtitle-timeline"].outputFingerprint = fingerprintStageArtifacts(project, "subtitle-timeline");
  writeJson(project.files.state, project.state);
  approveGate(project, "gate-3");
  fs.writeFileSync(audio, "modified-test-audio");
  const refreshed = loadProject(project.config.slug, { refresh: true });
  assert.equal(refreshed.state.currentStage, "subtitle-timeline");
  assert.equal(refreshed.state.stages["gate-3"].review, null);
  assert.equal(refreshed.state.stages["subtitle-timeline"].review, null);
});

test("Gate 3 rejection returns to Remotion without approving delivery", t => {
  const project = reviewFixture(t);
  rejectGate(project, "gate-3", "remotion", "调整画面。");
  const current = loadProject(project.config.slug, { refresh: false });
  assert.equal(current.state.currentStage, "remotion");
  assert.equal(current.state.stages["gate-3"].review.decision, "rejected");
  assert.equal(fs.existsSync(path.join(current.config.workspaceRoot, "local/render-input", `${current.config.slug}.agent-delivery.json`)), false);
});

for (const [name, serverFactory] of [["modern", createWebServer], ["legacy", createLegacyWebServer]]) test(`actual ${name} Web HTTP routes share dialogue task state and reject duplicate execution`, async t => {
  const f = fixture(t); const job = claimDialogueTask(f.slug);
  const server = serverFactory({ port: 0, remoteJobMonitor: { start() {}, stop() {}, async poll() {} }, agentExecutorFactory: () => ({ run() { assert.fail("must not start"); } }) });
  await server.listen(); t.after(() => server.close());
  const base = `http://127.0.0.1:${server.server.address().port}`;
  const request = async body => {
    const response = await fetch(`${base}/api/projects/${f.slug}/action`, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(body) });
    return { status: response.status, body: await response.json() };
  };
  const packet = await request({ action: "context" });
  assert.deepEqual(packet.body.result.task.stages, job.stages);
  const duplicate = await request({ action: "run", stage: "content-analysis" });
  assert.equal(duplicate.status, 400); assert.equal(duplicate.body.code, "production-task-owned");
  f.write(); completeDialogueTask(job.id, "对话完成制作。");
  const response = await fetch(`${base}/api/projects/${f.slug}`);
  assert.equal((await response.json()).project.currentStage, "narration-script");
});

test("recovery of an obsolete background record does not fail a dialogue-owned stage", async t => {
  const f = fixture(t); const old = createAgentJob({ slug: f.slug, stage: "content-analysis" });
  await runAgentJob(old.id);
  const dialogue = claimDialogueTask(f.slug);
  const record = getAgentJob(old.id); record.status = "running";
  writeJson(path.join(f.root, "agent-jobs", `${record.id}.json`), record);
  const before = snapshot(path.join(f.root, "projects"));
  recoverInterruptedAgentJobs();
  assert.deepEqual(snapshot(path.join(f.root, "projects")), before);
  assert.equal(getAgentJob(dialogue.id).status, "running");
});

test("background restart finishes the final validated checkpoint without rerunning production", t => {
  const f = fixture(t); const job = claimDialogueTask(f.slug); f.write();
  const project = f.project(); project.taskOwner = job.id;
  job.mode = "background";
  job.validatedFingerprints = Object.fromEntries(job.stages.map(stage => [stage, fingerprintStageArtifacts(project, stage)]));
  writeJson(path.join(f.root, "agent-jobs", `${job.id}.json`), job);
  for (const stage of job.stages) {
    if (project.state.stages[stage].status === "ready") { project.state.stages[stage].status = "running"; writeJson(project.files.state, project.state); }
    completeExecutorStage(project, stage, {});
  }
  recoverInterruptedAgentJobs();
  assert.equal(getAgentJob(job.id).status, "succeeded");
  assert.equal(f.project().state.currentStage, "narration-script");
  assert.equal(activeProductionTask(f.project()), null);
});

test("single and batch TTS entry cannot advance unchanged output and must persist a task", async t => {
  const project = reviewFixture(t);
  project.state.currentStage = "subtitle-timeline";
  project.state.stages["subtitle-timeline"].status = "ready";
  for (const stage of ["remotion", "gate-3"]) project.state.stages[stage].status = "pending";
  writeJson(project.files.state, project.state);
  await assert.rejects(() => runSingleStage(project, "subtitle-timeline", { ttsExecutor: { async run() { return { summary: "没有制作任何输出。" }; } } }), { code: "production-output-unchanged" });
  const jobs = listAgentJobs({ slug: project.config.slug });
  assert.equal(jobs.length, 1);
  assert.equal(jobs[0].status, "failed");
  assert.equal(jobs[0].stage, "subtitle-timeline");
});

test("TTS batch retries the same persisted task and reaches Remotion without a separate listening gate", async t => {
  const project = reviewFixture(t);
  project.state.currentStage = "subtitle-timeline";
  project.state.stages["subtitle-timeline"].status = "ready";
  for (const stage of ["remotion", "gate-3"]) project.state.stages[stage].status = "pending";
  writeJson(project.files.state, project.state);
  const batch = createBatch({ type: "to-tts", slugs: [project.config.slug] });
  const failed = await runBatch(batch.id, { executors: { "subtitle-timeline": { async run() { return {}; } } } });
  assert.equal(failed.items[0].status, "failed");
  const id = failed.items[0].agentJobId;
  assert.equal(getAgentJob(id).error.code, "production-output-unchanged");
  retryFailedBatchItems(batch.id);
  const result = await runBatch(batch.id, { executors: { "subtitle-timeline": { async run({ project: current }) {
    assert.equal(activeProductionTask(current).id, id);
    const audio = path.join(current.config.workspaceRoot, current.config.remotionDirectory, "generated/audio/scene-01/01-01.mp3");
    fs.mkdirSync(path.dirname(audio), { recursive: true }); fs.writeFileSync(audio, "new synthetic audio");
    return { summary: "重新制作模拟音频。" };
  } } } });
  assert.equal(result.items[0].status, "succeeded");
  assert.equal(result.items[0].agentJobId, id);
  assert.equal(getAgentJob(id).attempts, 2);
  assert.equal(loadProject(project.config.slug, { refresh: false }).state.currentStage, "remotion");
});
