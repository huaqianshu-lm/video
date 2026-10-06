import assert from "node:assert/strict";
import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import { execFileSync } from "node:child_process";
import test from "node:test";
import { planningDocuments } from "./helpers/planning-fixture.mjs";
import { initializeProject, loadProject, writeJson } from "../src/storage.mjs";
import { runStage, approveGate, rejectGate, validateStage } from "../src/runner.mjs";
import { claimDialogueTask, completeDialogueTask } from "../src/agent-jobs.mjs";
import { buildTaskPacket } from "../src/context.mjs";
import { workflowStages } from "../src/workflows/registry.mjs";
import { storyboardReview, storyboardTimingEvents, frozenStoryboardIssues } from "../src/storyboard.mjs";
import { buildStoryboardReview } from "../src/storyboard-review.mjs";
import { createProjectActionService } from "../src/web/services/project-actions.mjs";
import { createWebServer } from "../src/web/server.mjs";
import { getProjectWorkspace } from "../src/web/services/project-workspace.mjs";
import { createBatch, runBatch, getBatch } from "../src/batches.mjs";
import { storyboardPanel } from "../web/views/project/storyboard.js";
import { buildRemotionTimingPlanForProject } from "../src/remotion-timing.mjs";
import { getPrototypeBaseline, validateRemotionAlignment } from "../src/remotion-alignment.mjs";
import { prepareRenderInputEntry, validateCurrentRenderInput } from "../src/render-input.mjs";
import { buildRemotionExecutionInput } from "../src/remotion-executor.mjs";
import { buildRemotionAgentPrompt } from "../src/remotion-harness-adapter.mjs";
import { prepareStoryboardMigration, startStoryboardMigration } from "../src/storyboard-migration.mjs";

const repository = path.resolve(new URL("../..", import.meta.url).pathname);

function fixture(t) {
  const root = fs.mkdtempSync(path.join(os.tmpdir(), "storyboard-production-"));
  const previous = {};
  for (const [key, directory] of Object.entries({ HARNESS_WORKSPACE_ROOT: "workspace", HARNESS_PROJECTS_DIR: "projects", HARNESS_AGENT_JOBS_DIR: "agent-jobs", HARNESS_REMOTION_TASKS_DIR: "remotion-tasks", HARNESS_BATCHES_DIR: "batches", HARNESS_SERIES_DIR: "series" })) {
    previous[key] = process.env[key]; process.env[key] = path.join(root, directory);
  }
  t.after(() => { for (const [key, value] of Object.entries(previous)) if (value === undefined) delete process.env[key]; else process.env[key] = value; fs.rmSync(root, { recursive: true, force: true }); });
  const workspace = process.env.HARNESS_WORKSPACE_ROOT;
  const slug = "storyboard-fixture";
  const materials = path.join(workspace, "videos", slug);
  fs.mkdirSync(materials, { recursive: true });
  fs.mkdirSync(path.join(workspace, "styles/current"), { recursive: true });
  fs.copyFileSync(path.join(repository, "styles/current/STYLE.md"), path.join(workspace, "styles/current/STYLE.md"));
  fs.writeFileSync(path.join(materials, "source.md"), "# Source\n任务从等待进入制作，校验通过后完成。\n");
  initializeProject(slug, { productionContract: "storyboard-v1" });
  const project = () => loadProject(slug, { refresh: false });
  runStage(project(), "source");
  const board = JSON.parse(fs.readFileSync(path.join(repository, "templates/video-production/storyboard.json"), "utf8"));
  board.videoSlug = slug; board.scenes[0].sourceRefs[0].path = `videos/${slug}/source.md`;
  const writeBoard = value => fs.writeFileSync(path.join(materials, "storyboard.json"), JSON.stringify(value ?? board));
  const planning = () => {
    const job = claimDialogueTask(slug);
    for (const name of ["content-analysis.md", "video-narrative.md"]) fs.writeFileSync(path.join(materials, name), planningDocuments[name]);
    return completeDialogueTask(job.id, "制作分析与叙事。");
  };
  const converge = () => {
    planning(); const job = claimDialogueTask(slug);
    fs.writeFileSync(path.join(materials, "narration-script.md"), "# Narration Script\n\n## Scene 01\n任务从等待进入制作，校验通过后完成。\n");
    writeBoard(); completeDialogueTask(job.id, "口播与分镜共同收敛。");
    runStage(project(), "gate-2");
  };
  return { root, workspace, slug, materials, project, board, writeBoard, planning, converge };
}

async function downstreamFixture(t) {
  const f = fixture(t); f.converge();
  approveGate(f.project(), "gate-2", { reviewVersion: storyboardReview(f.project()).reviewVersion });
  const write = (file, content) => { const target = path.join(f.workspace, file); fs.mkdirSync(path.dirname(target), { recursive: true }); fs.writeFileSync(target, typeof content === "string" ? content : JSON.stringify(content)); };
  const keys = ["HARNESS_TTS_PROJECT_DIR", "HARNESS_TTS_PYTHON", "HARNESS_TTS_SCRIPT_BUILDER"];
  const previous = Object.fromEntries(keys.map(key => [key, process.env[key]]));
  // Exercise the subprocess/production handoff without the external TTS service.
  const builder = path.join(f.root, "mock-tts-builder.cjs");
  fs.writeFileSync(builder, "const fs = require('node:fs'); const args = process.argv; fs.writeFileSync(args[args.indexOf('--output')+1], JSON.stringify({schemaVersion: '1.0', scenes: [{sceneId:'01', segments:[{id:'01-01',text:'任务从等待进入制作，校验通过后完成。'}]}]}));");
  process.env.HARNESS_TTS_PROJECT_DIR = f.root; process.env.HARNESS_TTS_PYTHON = process.execPath; process.env.HARNESS_TTS_SCRIPT_BUILDER = builder;
  t.after(() => { for (const [key, value] of Object.entries(previous)) if (value === undefined) delete process.env[key]; else process.env[key] = value; });
  runStage(f.project(), "tts");
  const audioJob = claimDialogueTask(f.slug);
  const generated = `src/videos/${f.slug}/generated`;
  write(`${generated}/audio-manifest.json`, { videoId: f.slug, scenes: [{ sceneId: "01", segments: [{ id: "01-01", file: "audio/scene-01/01-01.mp3", duration: 3 }] }] });
  write(`${generated}/subtitle-manifest.json`, { videoId: f.slug, scenes: [{ sceneId: "01", segments: [{ segmentId: "01-01", cues: [{ id: "cue-1", start: 0, end: 1, text: "任务从等待" }, { id: "cue-2", start: 1, end: 2.9, text: "进入制作，校验通过后完成" }] }] }] });
  write(`${generated}/timeline-manifest.json`, { videoId: f.slug, duration: 3, scenes: [{ sceneId: "01", offset: 0, end: 3, duration: 3, segments: [{ segmentId: "01-01", offset: 0, end: 3, duration: 3 }] }] });
  for (const base of [generated, `public/local-assets/${f.slug}`]) {
    write(`${base}/audio/scene-01/01-01.mp3`, "simulated-test-audio");
    write(`${base}/subtitles/captions.vtt`, "WEBVTT\n"); write(`${base}/subtitles/captions.srt`, "1\n00:00:00,000 --> 00:00:03,000\n任务\n");
  }
  completeDialogueTask(audioJob.id, "模拟真实音频与字幕回传，仅验证契约。");
  const remotionJob = claimDialogueTask(f.slug);
  const baseline = getPrototypeBaseline(f.project());
  const plan = buildRemotionTimingPlanForProject(f.project());
  const scene = plan.scenes[0]; const segment = scene.segments[0]; const cue = segment.cues[1];
  const component = `src/videos/${f.slug}/StoryboardVideo.tsx`;
  write(component, "const Scene01 = () => null;\nexport const StoryboardVideo = () => null;");
  write(`src/videos/${f.slug}/video.config.ts`, `const fps = 30; const subtitleManifest = {}; const timelineManifest = {}; export const videoConfig = { slug: '${f.slug}', format: 'horizontal', width: 1920, height: 1080, fps, scenes: [] };`);
  const alignment = {
    schemaVersion: 3, slug: f.slug, reviewVersion: baseline.reviewVersion, storyboardFingerprint: baseline.storyboardFingerprint,
    timing: { fps: 30, totalDurationSeconds: plan.durationSeconds, totalDurationFrames: plan.durationFrames, sources: { ttsScript: `videos/${f.slug}/tts-script.json`, audioManifest: `${generated}/audio-manifest.json`, subtitleManifest: `${generated}/subtitle-manifest.json`, timelineManifest: `${generated}/timeline-manifest.json` } },
    scenes: [{ sceneId: "01", layout: f.board.scenes[0].layout, visualEvents: ["task-start"], screenText: ["任务"], implementationFiles: [component], implementationSymbols: ["Scene01"],
      timing: { timelineSource: `${generated}/timeline-manifest.json`, startSeconds: scene.startSeconds, endSeconds: scene.endSeconds, durationSeconds: scene.durationSeconds, startFrame: scene.startFrame, endFrame: scene.endFrame, durationFrames: scene.durationFrames },
      audioSegments: [{ segmentId: segment.segmentId, file: segment.audioFile, startSeconds: segment.startSeconds, endSeconds: segment.endSeconds, durationSeconds: segment.durationSeconds, startFrame: segment.startFrame, endFrame: segment.endFrame }],
      subtitleCues: segment.cues.map(cue => ({ cueId: cue.id, segmentId: cue.segmentId, startSeconds: cue.startSeconds, endSeconds: cue.endSeconds, startFrame: cue.startFrame, endFrame: cue.endFrame })),
      animationEvents: [{ event: "task-start", source: { type: "cue", id: cue.id }, atSeconds: cue.startSeconds, atFrame: cue.startFrame }],
      visualBindings: [{ id: "task-start", source: { type: "cue", id: cue.id }, atFrame: cue.startFrame }], visualElements: [{ id: "task", screenText: "任务", bindingId: "task-start" }],
      storyboardEvents: [{ id: "task-start", bindingId: "task-start", cueId: cue.id, segmentId: cue.segmentId, atFrame: cue.startFrame }],
    }],
  };
  write(`videos/${f.slug}/remotion-alignment.json`, alignment);
  return { ...f, write, alignment, remotionJob };
}

test("versioned graph groups two planning outputs and narration/storyboard without old stages", t => {
  const f = fixture(t);
  assert.equal(workflowStages(f.project()).length, 12);
  assert.equal(workflowStages(f.project()).includes("visual-prototype"), false);
  assert.deepEqual(buildTaskPacket(f.project()).task.stages, ["content-analysis", "video-narrative"]);
  f.planning();
  assert.equal(f.project().state.stages["video-narrative"].review.kind, "gate-1");
  const packet = buildTaskPacket(f.project());
  assert.deepEqual(packet.task.stages, ["narration-script", "storyboard"]);
  assert.deepEqual(packet.context.writePaths, [`videos/${f.slug}/narration-script.md`, `videos/${f.slug}/storyboard.json`, `videos/${f.slug}/storyboard-assets/*`]);
  assert.equal(packet.task.nextStage, "gate-2");
  assert.equal(packet.context.constraints.some(text => /必须.*原型|schemaVersion 2/.test(text)), false);
});

test("Gate 2 reviews text plans and freezes the exact version without dynamic evidence or TTS", async t => {
  const f = fixture(t); f.converge();
  const review = storyboardReview(f.project());
  assert.equal(review.ready, true);
  assert.equal(validateStage(f.project(), "gate-2").length, 0);
  const workspace = await getProjectWorkspace(f.slug);
  assert.deepEqual(workspace.storyboardReview, review);
  assert.throws(() => approveGate(f.project(), "gate-2"), { code: "storyboard-review-stale" });
  approveGate(f.project(), "gate-2", { reviewVersion: review.reviewVersion });
  assert.equal(f.project().state.currentStage, "tts");
  assert.deepEqual(frozenStoryboardIssues(f.project()), []);
  assert.equal(fs.existsSync(path.join(f.materials, "tts-script.json")), false);
  const frozen = JSON.parse(fs.readFileSync(path.join(f.project().files.directory, "prototype-baseline.json"), "utf8"));
  assert.equal(frozen.kind, "storyboard-baseline");
  assert.deepEqual(frozen.eventIds, ["task-start"]);
});

test("stale approval fails before side effects; changed visual plan invalidates Gate 2 and downstream", t => {
  const f = fixture(t); f.converge();
  const version = storyboardReview(f.project()).reviewVersion;
  f.board.scenes[0].layout = "任务左侧，校验结果右侧"; f.writeBoard();
  assert.throws(() => approveGate(f.project(), "gate-2", { reviewVersion: version }), { code: "storyboard-review-stale" });
  assert.equal(f.project().state.currentStage, "gate-2");
  assert.equal(fs.existsSync(path.join(f.project().files.directory, "prototype-baseline.json")), false);
  const refreshed = loadProject(f.slug);
  assert.equal(refreshed.state.currentStage, "storyboard");
  assert.equal(refreshed.state.stages.tts.status, "invalidated");
});

test("source, narration, style and diagram changes are bound to the reviewed fingerprint", t => {
  const f = fixture(t); f.converge();
  const version = storyboardReview(f.project()).reviewVersion;
  for (const file of [path.join(f.materials, "source.md"), path.join(f.materials, "narration-script.md"), path.join(f.workspace, "styles/current/STYLE.md")]) {
    const original = fs.readFileSync(file); fs.appendFileSync(file, "\n新内容\n");
    assert.notEqual(storyboardReview(f.project()).reviewVersion, version);
    fs.writeFileSync(file, original);
  }
  fs.writeFileSync(path.join(f.materials, "state.png"), "test-image");
  f.board.scenes[0].diagrams = [{ path: "state.png", caption: "关键状态" }]; f.writeBoard();
  const imageVersion = storyboardReview(f.project()).reviewVersion;
  fs.writeFileSync(path.join(f.materials, "state.png"), "new-test-image");
  assert.notEqual(storyboardReview(f.project()).reviewVersion, imageVersion);
});

test("Schema and semantic checks reject malformed IDs, missing narration, unproven text, stale anchors and unsafe assets", t => {
  const f = fixture(t); f.converge();
  const invalid = [
    board => { board.scenes.push(structuredClone(board.scenes[0])); },
    board => { board.scenes[0].narrationRef = "02"; },
    board => { board.scenes[0].narration = "另一份全文"; },
    board => { board.scenes[0].elements[0].text = "无依据文案"; },
    board => { board.scenes[0].events[0].trigger.anchor = "没有说过"; },
    board => { board.scenes[0].events[0].before = board.scenes[0].events[0].after; },
    board => { board.scenes[0].assets = ["../outside.png"]; },
    board => { board.scenes[0].events[0].atSeconds = 2; },
    board => { board.scenes[0].sourceRefs[0].path = "videos/other/source.md"; },
    board => { board.scenes = "invalid"; },
  ];
  for (const mutate of invalid) { const board = structuredClone(f.board); mutate(board); f.writeBoard(board); assert.equal(storyboardReview(f.project()).ready, false); }
  f.writeBoard(); fs.renameSync(path.join(f.materials, "narration-script.md"), path.join(f.materials, "saved-narration.md"));
  assert.equal(storyboardReview(f.project()).ready, false);
});

test("reviewed diagram symlinks and scripts are refused", t => {
  const f = fixture(t); f.converge();
  fs.writeFileSync(path.join(f.materials, "unsafe.html"), "<script>alert(1)</script>");
  f.board.scenes[0].diagrams = [{ path: "unsafe.html", caption: "invalid" }]; f.writeBoard();
  assert.equal(storyboardReview(f.project()).ready, false);
  fs.symlinkSync(path.join(f.materials, "source.md"), path.join(f.materials, "link.png"));
  f.board.scenes[0].diagrams[0].path = "link.png"; f.writeBoard();
  assert.equal(storyboardReview(f.project()).ready, false);
});

test("frozen dependencies block downstream starts even without refresh", t => {
  const f = fixture(t); f.converge();
  approveGate(f.project(), "gate-2", { reviewVersion: storyboardReview(f.project()).reviewVersion });
  fs.appendFileSync(path.join(f.materials, "narration-script.md"), "补充一句。\n");
  assert.throws(() => runStage(f.project(), "tts"), /Gate 2/);
  assert.equal(f.project().state.stages.tts.attempts, 0);
  assert.equal(loadProject(f.slug).state.currentStage, "narration-script");
});

test("semantic events resolve real cue IDs, segments and frames; mismatched subtitles fail closed", t => {
  const f = fixture(t); f.converge();
  const timing = { scenes: [{ sceneId: "01", segments: [{ segmentId: "01-01", cues: [{ id: "cue-1", segmentId: "01-01", text: "任务从等待", startFrame: 0, startSeconds: 0 }, { id: "cue-2", segmentId: "01-01", text: "进入制作，校验通过后完成", startFrame: 45, startSeconds: 1.5 }] }] }] };
  assert.deepEqual(storyboardTimingEvents(f.project(), timing)[0].events[0], { id: "task-start", cueId: "cue-2", segmentId: "01-01", atFrame: 45, atSeconds: 1.5 });
  timing.scenes[0].segments[0].cues[1].text = "错误字幕";
  assert.throws(() => storyboardTimingEvents(f.project(), timing), /未完整对应/);
});

test("Gate 2 rejection returns to convergence task and completed projects remain read only", t => {
  const f = fixture(t); f.converge();
  rejectGate(f.project(), "gate-2", "narration-script", "Scene 01／task-start 需要解释校验结果");
  assert.deepEqual(buildTaskPacket(f.project()).task.stages, ["narration-script", "storyboard"]);
  const project = f.project(); project.state.currentStage = "completed"; writeJson(project.files.state, project.state);
  const before = fs.readFileSync(project.files.state, "utf8");
  assert.throws(() => claimDialogueTask(f.slug), { code: "completed-project-readonly" });
  loadProject(f.slug); storyboardReview(f.project());
  assert.equal(fs.readFileSync(project.files.state, "utf8"), before);
});

test("CLI and Web share reviewVersion and Web approval rejects stale versions", async t => {
  const f = fixture(t); f.converge();
  const cli = JSON.parse(execFileSync(process.execPath, [path.join(repository, "harness/src/cli.mjs"), "storyboard-review", f.slug, "--json"], { encoding: "utf8", env: process.env }));
  const server = createWebServer({ port: 0, remoteJobMonitor: { start() {}, stop() {}, async poll() {} } });
  await server.listen(); t.after(() => server.close());
  const base = `http://127.0.0.1:${server.server.address().port}/api/projects/${f.slug}`;
  const review = (await (await fetch(`${base}/storyboard-review`)).json()).review;
  assert.equal(cli.reviewVersion, review.reviewVersion);
  const post = body => fetch(`${base}/action`, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(body) });
  const stale = await post({ action: "approve", gate: "gate-2", reviewVersion: "old" });
  assert.equal(stale.status, 400);
  const approved = await post({ action: "approve", gate: "gate-2", reviewVersion: review.reviewVersion });
  assert.equal(approved.status, 200);
  assert.equal(f.project().state.currentStage, "tts");
});

test("shared review blocks nonspoken narration and unfinished prerequisites in CLI and HTTP", async t => {
  const f = fixture(t); f.converge();
  fs.appendFileSync(path.join(f.materials, "narration-script.md"), "制作备注：这里暂不朗读。\n");
  const raw = storyboardReview(f.project());
  assert.equal(raw.ready, true);
  const packet = buildStoryboardReview(f.project());
  assert.equal(packet.ready, false);
  assert.ok(packet.issues.some(issue => issue.code === "internal-narration-text"));
  let cli;
  try { execFileSync(process.execPath, [path.join(repository, "harness/src/cli.mjs"), "storyboard-review", f.slug, "--json"], { encoding: "utf8", env: process.env }); assert.fail("invalid narration must fail review"); }
  catch (error) { assert.equal(error.status, 1); cli = JSON.parse(error.stdout); }
  const server = createWebServer({ port: 0, remoteJobMonitor: { start() {}, stop() {}, async poll() {} } });
  await server.listen(); t.after(() => server.close());
  const base = `http://127.0.0.1:${server.server.address().port}/api/projects/${f.slug}`;
  const review = (await (await fetch(`${base}/storyboard-review`)).json()).review;
  assert.deepEqual(cli, review);
  assert.equal(review.ready, false);
  const response = await fetch(`${base}/action`, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ action: "approve", gate: "gate-2", reviewVersion: review.reviewVersion }) });
  assert.equal(response.status, 400);
  assert.equal(fs.existsSync(path.join(f.project().files.directory, "prototype-baseline.json")), false);
});

test("review page renders ordered narration/cards safely without prototype playback", t => {
  const f = fixture(t); f.converge();
  const review = storyboardReview(f.project()); review.scenes[0].focus = "<script>bad</script>";
  const html = storyboardPanel(review);
  assert.match(html, /任务从等待进入制作/);
  assert.match(html, /task-start/);
  assert.match(html, /&lt;script&gt;/);
  assert.doesNotMatch(html, /<script>|<iframe|<video/);
});

test("batch shares planning and convergence tasks and waits at Gate 2", async t => {
  const f = fixture(t); const queued = [];
  const batch = createBatch({ type: "to-gate-2", slugs: [f.slug] });
  await runBatch(batch.id, { queueAgentJob(id) { queued.push(id); } });
  assert.equal(queued.length, 1);
  const { getAgentJob, runAgentJob } = await import("../src/agent-jobs.mjs");
  let job = getAgentJob(queued[0]);
  assert.deepEqual(job.task.task.stages, ["content-analysis", "video-narrative"]);
  await runAgentJob(job.id, { executor: { async run() { for (const name of ["content-analysis.md", "video-narrative.md"]) fs.writeFileSync(path.join(f.materials, name), planningDocuments[name]); return { summary: "批量策划" }; } } });
  await runBatch(batch.id, { queueAgentJob(id) { queued.push(id); } });
  job = getAgentJob(queued[1]); assert.deepEqual(job.task.task.stages, ["narration-script", "storyboard"]);
  await runAgentJob(job.id, { executor: { async run() { fs.writeFileSync(path.join(f.materials, "narration-script.md"), "## Scene 01\n任务从等待进入制作，校验通过后完成。\n"); f.writeBoard(); return { summary: "批量分镜" }; } } });
  await runBatch(batch.id, { queueAgentJob() { assert.fail("no more production before approval"); } });
  assert.equal(getBatch(batch.id).items[0].status, "waiting-gate");
  assert.equal(f.project().state.currentStage, "gate-2");
});

test("new contract traverses TTS, real timing mappings, Remotion task, isolated package and Gate 3", async t => {
  const f = await downstreamFixture(t);
  const finished = completeDialogueTask(f.remotionJob.id, "模拟 Remotion 产物，仅验证消费契约。");
  assert.equal(finished.status, "succeeded");
  assert.equal(f.project().state.currentStage, "gate-3");
  assert.deepEqual(validateStage(f.project(), "gate-3"), []);
  assert.match(buildTaskPacket(f.project()).task.manualChecks.join(" "), /正常速度试听/);
  const manifest = JSON.parse(fs.readFileSync(path.join(f.workspace, `local/render-input/${f.slug}/render-input.json`), "utf8"));
  assert.equal(manifest.productionContract, "storyboard-v1");
  assert.equal(manifest.productionBaseline.reviewVersion, storyboardReview(f.project()).reviewVersion);
  assert.deepEqual(validateCurrentRenderInput(f.project()), []);
  approveGate(f.project(), "gate-3");
  assert.equal(f.project().state.currentStage, "render");
  assert.equal(f.project().state.stages["subtitle-timeline"].review.gate, "gate-3");
  assert.equal(fs.existsSync(path.join(f.materials, "visual-prototype.html")), false);
});

test("missing, stale or wrong Event/Cue mappings block Remotion; input package rejects changed review dependencies", async t => {
  const f = await downstreamFixture(t);
  prepareRenderInputEntry(f.project());
  assert.deepEqual(validateRemotionAlignment(f.project()), []);
  const invalid = structuredClone(f.alignment); invalid.scenes[0].storyboardEvents[0].cueId = "cue-1";
  f.write(`videos/${f.slug}/remotion-alignment.json`, invalid);
  assert.ok(validateRemotionAlignment(f.project()).some(issue => issue.code === "storyboard-event-binding-invalid"));
  invalid.scenes[0].storyboardEvents = []; f.write(`videos/${f.slug}/remotion-alignment.json`, invalid);
  assert.ok(validateRemotionAlignment(f.project()).some(issue => issue.code === "storyboard-event-mismatch"));
  fs.appendFileSync(path.join(f.workspace, "styles/current/STYLE.md"), "\n变更风格\n");
  assert.throws(() => prepareRenderInputEntry(f.project()), { code: "storyboard-baseline-stale" });
});

test("background Remotion input and Agent prompt consume storyboard schema 3 instead of prototype schema 2", t => {
  const f = fixture(t); f.converge();
  const input = buildRemotionExecutionInput(f.project(), { id: "task", context: {} });
  assert.equal(input.productionContract, "storyboard-v1");
  assert.match(input.constraints.join(" "), /schemaVersion 3/);
  assert.doesNotMatch(input.constraints.join(" "), /Visual Prototype|schemaVersion 2/);
  assert.match(buildRemotionAgentPrompt(input), /冻结的 Storyboard/);
});

function oldMigrationFixture(t) {
  const f = fixture(t);
  const slug = "old-migration-fixture";
  const materials = path.join(f.workspace, "videos", slug); fs.mkdirSync(materials);
  fs.writeFileSync(path.join(materials, "source.md"), "# Source\n任务调度。\n");
  initializeProject(slug, { productionContract: "unified-v1", prototypeBaseline: null });
  const project = () => loadProject(slug, { refresh: false });
  runStage(project(), "source");
  const planning = claimDialogueTask(slug);
  for (const [file, content] of Object.entries(planningDocuments)) fs.writeFileSync(path.join(materials, file), content);
  completeDialogueTask(planning.id, "旧策划制作");
  const narration = claimDialogueTask(slug);
  fs.writeFileSync(path.join(materials, "narration-script.md"), "## Scene 01\n任务调度。\n");
  completeDialogueTask(narration.id, "旧纯口播");
  return { ...f, slug, materials, project };
}

test("explicit migration retains old records and pure narration, creates storyboard task and requires a new Gate 2", t => {
  const f = oldMigrationFixture(t);
  const old = f.project();
  const plan = prepareStoryboardMigration(f.slug);
  assert.equal(f.project().config.productionContract, "unified-v1");
  const result = startStoryboardMigration(f.slug, plan.migrationVersion);
  assert.equal(result.currentStage, "storyboard");
  assert.equal(f.project().state.stages["gate-2"].review, null);
  assert.equal(f.project().state.stages["narration-script"].order, 3);
  assert.equal(fs.existsSync(path.join(f.materials, "scene-script.md")), true);
  const journal = JSON.parse(fs.readFileSync(path.join(old.files.directory, "storyboard-migration.json"), "utf8"));
  assert.deepEqual(journal.previous.state, old.state);
  assert.equal(startStoryboardMigration(f.slug, plan.migrationVersion).resumed, true);
  assert.deepEqual(claimDialogueTask(f.slug).stages, ["storyboard"]);
});

test("migration rejects stale plans, active producers, downstream projects and completed videos", t => {
  const f = oldMigrationFixture(t); const plan = prepareStoryboardMigration(f.slug);
  fs.appendFileSync(path.join(f.materials, "source.md"), "新依据\n");
  assert.throws(() => startStoryboardMigration(f.slug, plan.migrationVersion), { code: "storyboard-migration-stale" });
  fs.writeFileSync(path.join(f.materials, "source.md"), "# Source\n任务调度。\n");
  const task = claimDialogueTask(f.slug);
  assert.throws(() => prepareStoryboardMigration(f.slug), /持有项目/);
  const lock = path.join(f.project().files.directory, "production-task.lock.json");
  // Simulate the old producer releasing its lock, without making any production output.
  fs.renameSync(lock, `${lock}.test-released`);
  const project = f.project(); project.state.currentStage = "tts"; writeJson(project.files.state, project.state);
  assert.throws(() => prepareStoryboardMigration(f.slug), /仅支持 Gate 2/);
  project.state.currentStage = "completed"; writeJson(project.files.state, project.state);
  assert.throws(() => prepareStoryboardMigration(f.slug), { code: "completed-project-readonly" });
  assert.ok(task.id);
});

test("migration journal resumes an interrupted state/artifact/config handoff", t => {
  const f = oldMigrationFixture(t); const plan = prepareStoryboardMigration(f.slug);
  startStoryboardMigration(f.slug, plan.migrationVersion);
  const project = f.project(); const file = path.join(project.files.directory, "storyboard-migration.json");
  const journal = JSON.parse(fs.readFileSync(file, "utf8")); journal.status = "applying";
  writeJson(file, journal); writeJson(project.files.config, journal.previous.config); writeJson(project.files.artifacts, journal.previous.artifacts);
  assert.throws(f.project, { code: "production-contract-state-mismatch" });
  startStoryboardMigration(f.slug, plan.migrationVersion);
  assert.equal(f.project().state.currentStage, "storyboard");
  assert.equal(f.project().config.productionContract, "storyboard-v1");
});

test("migration CLI and Web actions expose the same impact version without starting production", async t => {
  const f = oldMigrationFixture(t);
  const cli = JSON.parse(execFileSync(process.execPath, [path.join(repository, "harness/src/cli.mjs"), "storyboard-migration", f.slug, "prepare"], { env: process.env, encoding: "utf8" }));
  const service = createProjectActionService({});
  const web = await service.execute({ slug: f.slug, action: "prepare-storyboard-migration" });
  assert.deepEqual(cli, web.result);
  assert.equal("snapshot" in cli, false);
  await service.execute({ slug: f.slug, action: "start-storyboard-migration", migrationVersion: cli.migrationVersion });
  assert.equal(f.project().state.currentStage, "storyboard");
});

test("exact narration occurrence survives punctuation normalization when locating real subtitle cues", t => {
  const f = fixture(t); f.converge();
  fs.writeFileSync(path.join(f.materials, "narration-script.md"), "## Scene 01\n等待进入。等待，进入。\n");
  f.board.scenes[0].events[0].trigger.anchor = "等待，进入"; f.writeBoard();
  const timing = { scenes: [{ sceneId: "01", segments: [{ cues: [{ id: "first", segmentId: "01-01", text: "等待进入", startFrame: 0, startSeconds: 0 }, { id: "second", segmentId: "01-01", text: "等待进入", startFrame: 30, startSeconds: 1 }] }] }] };
  assert.equal(storyboardTimingEvents(f.project(), timing)[0].events[0].cueId, "second");
});
