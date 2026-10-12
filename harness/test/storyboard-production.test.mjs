import assert from "node:assert/strict";
import fs from "node:fs";
import os from "node:os";
import crypto from "node:crypto";
import path from "node:path";
import { execFileSync } from "node:child_process";
import test from "node:test";
import { planningDocuments } from "./helpers/planning-fixture.mjs";
import { initializeProject, loadProject, writeJson } from "../src/storage.mjs";
import { runStage, approveGate, rejectGate, validateStage, retryStage } from "../src/runner.mjs";
import { claimDialogueTask, completeDialogueTask, failAgentTask } from "../src/agent-jobs.mjs";
import {ensureRemotionTask, startRemotionTask, completeRemotionTask, getRemotionTask} from '../src/remotion-tasks.mjs';
import { buildTaskPacket } from "../src/context.mjs";
import { workflowStages } from "../src/workflows/registry.mjs";
import { storyboardReview, storyboardTimingEvents, storyboardImplementationTiming, frozenStoryboardIssues, storyboardBaseline } from "../src/storyboard.mjs";
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
import { prepareStoryboardRework, startStoryboardRework } from "../src/storyboard-rework.mjs";
import { storyboardDesignReferences, STORYBOARD_DESIGN_REFERENCES, STORYBOARD_SHARED_REFERENCES, STORYBOARD_QUALITY_CHECKS } from "../src/storyboard-design.mjs";
import { fingerprintTaskInputs } from "../src/fingerprints.mjs";
import {buildStoryboardImplementationReview, validateStoryboardImplementation, runtimeFiles, storyboardViewingRanges} from '../src/storyboard-implementation.mjs';
import {renderRequiredPaths} from '../src/git-delivery.mjs';
import {renderEntryPointSource, renderStudioCatalogSource, discoverStudioEntries, validateRenderInputDirectory, writeRenderEntryPoint} from '../src/render-input.mjs';

const repository = path.resolve(new URL("../..", import.meta.url).pathname);

function fixture(t, { dataVersion = 3, shotCount = 1, transitionMechanism = "cut" } = {}) {
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
  initializeProject(slug, { productionContract: "storyboard-v1", storyboardSchemaVersion: dataVersion });
  const project = () => loadProject(slug, { refresh: false });
  runStage(project(), "source");
  if (dataVersion === 3) for (const file of [...STORYBOARD_DESIGN_REFERENCES, ...STORYBOARD_SHARED_REFERENCES]) {
    fs.mkdirSync(path.dirname(path.join(workspace,file)),{recursive:true});fs.copyFileSync(path.join(repository,file),path.join(workspace,file));
  }
  const board = JSON.parse(fs.readFileSync(path.join(repository, `templates/video-production/storyboard${dataVersion === 3 ? "-v3" : ""}.json`), "utf8"));
  if (shotCount === 2) {
    const scene=board.scenes[0], first=scene.shots[0], second=structuredClone(first);
    second.id='s01-shot02';second.start={type:'cue',anchor:'校验通过后完成',occurrence:1};second.purpose='观察独立结果，不再把结果与请求混为一个对象';second.composition='以结果为中心的近景，请求保留为参照';second.framing='结果近景';second.entryState='制作中的请求延续，等待形成结果';
    first.visibleElementIds=['task-root','task-request'];first.end={type:'next-shot',shotId:second.id};first.transitionToNext={target:{type:'shot',id:second.id},mechanism:transitionMechanism,reason:'从输入任务转到结果观察',retainedElementIds:['task-root','task-request'],exitingElementIds:[]};
    scene.shots.push(second);scene.events[1].shotId=second.id;
  }
  board.videoSlug = slug; board.scenes[0].sourceRefs[0].path = `videos/${slug}/source.md`;
  const writeBoard = value => fs.writeFileSync(path.join(materials, "storyboard.json"), JSON.stringify(value ?? board));
  const writeAudit = () => {
    const review=storyboardReview(project());
    const audit={schemaVersion:2,kind:"storyboard-design-audit",ruleVersion:"storyboard-execution-quality-v2",videoSlug:slug,inputVersion:review.designInputVersion,storyboardFingerprint:review.storyboardFingerprint,narrationFingerprint:review.narrationFingerprint,
      checks:board.scenes.flatMap(s=>s.events.flatMap(e=>STORYBOARD_QUALITY_CHECKS.map(checkId=>({sceneId:s.id,eventId:e.id,checkId,result:"pass",elementIds:e.execution.elements,evidence:`${slug}/source.md 与 ${e.id} 的区间关系`,note:"隔离测试的方案审计，不代表实际观看或视觉质量通过"}))))};
    audit.shotChecks=board.scenes.flatMap(s=>s.shots.map(shot=>({sceneId:s.id,shotId:shot.id,result:'pass',elementIds:shot.visibleElementIds,purposeComposition:'隔离方案：取景显示请求与结果',objectContinuity:'隔离方案：保持对象身份',transitionBenefit:'隔离方案：完成后结束',timingSource:'隔离方案：首尾真实 Scene',implementation:'隔离方案：独立 JSX',evidence:'源资料与镜头字段',note:'模拟审计，不是实际验收'})));
    fs.writeFileSync(path.join(materials,"storyboard-design-audit.json"),JSON.stringify(audit));return audit;
  };
  const planning = () => {
    const job = claimDialogueTask(slug);
    for (const name of ["content-analysis.md", "video-narrative.md"]) fs.writeFileSync(path.join(materials, name), planningDocuments[name]);
    return completeDialogueTask(job.id, "制作分析与叙事。");
  };
  const converge = () => {
    planning(); const job = claimDialogueTask(slug);
    fs.writeFileSync(path.join(materials, "narration-script.md"), "# Narration Script\n\n## Scene 01\n任务从等待进入制作，校验通过后完成。\n");
    writeBoard(); if(dataVersion===3)writeAudit(); completeDialogueTask(job.id, "口播与分镜共同收敛。");
    runStage(project(), "gate-2");
  };
  return { root, workspace, slug, materials, project, board, writeBoard, writeAudit, planning, converge };
}

async function downstreamFixture(t, {dataVersion = 3, shotCount = 1, transitionMechanism = "cut"} = {}) {
  const f = fixture(t, {dataVersion, shotCount, transitionMechanism}); f.converge();
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
  write(`${generated}/subtitle-manifest.json`, { videoId: f.slug, scenes: [{ sceneId: "01", segments: [{ segmentId: "01-01", cues: [{ id: "cue-1", start: 0, end: 1, text: dataVersion === 3 ? "任务从等待进入制作" : "任务从等待" }, { id: "cue-2", start: 1, end: 2.9, text: dataVersion === 3 ? "校验通过后完成" : "进入制作，校验通过后完成" }] }] }] });
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
  if (dataVersion === 3) {
    const metadata = buildStoryboardImplementationReview(f.project());
    const boardScene = f.board.scenes[0], times = storyboardTimingEvents(f.project(), plan)[0].events;
    Object.assign(alignment, metadata.alignment);
    const previous = JSON.parse(JSON.stringify({
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
  })).scenes[0];
    alignment.timing = {fps:30,totalDurationSeconds:plan.durationSeconds,totalDurationFrames:plan.durationFrames,sources:{ttsScript:`videos/${f.slug}/tts-script.json`,audioManifest:`${generated}/audio-manifest.json`,subtitleManifest:`${generated}/subtitle-manifest.json`,timelineManifest:`${generated}/timeline-manifest.json`}};
    Object.assign(alignment.scenes[0], previous, {startFrame:scene.startFrame,endFrame:scene.endFrame,
      events:metadata.alignment.scenes[0].events, screenText:boardScene.elements.filter(e=>e.text).map(e=>e.text),
      visualEvents:times.map(e=>e.id),
      animationEvents:times.map(e=>({event:e.id,source:{type:'cue',id:e.cueId},atSeconds:e.atSeconds,atFrame:e.atFrame})),
      visualBindings:times.map(e=>({id:e.id,source:{type:'cue',id:e.cueId},atFrame:e.atFrame})),
      visualElements:boardScene.elements.map(e=>({id:e.id,screenText:e.text,bindingId:times[0].id})),
      storyboardEvents:times.map(e=>({...e,bindingId:e.id})),
    });
  }

  if (dataVersion === 3) alignment.scenes[0].shots = alignment.scenes[0].shots.map((shot,i) => ({...shot,implementationFiles:[component],implementationSymbols:['Scene01'],transition:{target:f.board.scenes[0].shots[i].transitionToNext.target,mechanism:f.board.scenes[0].shots[i].transitionToNext.mechanism,startFrame:shot.endFrame-(f.board.scenes[0].shots[i].transitionToNext.mechanism==='cut'?0:3),endFrame:shot.endFrame+(f.board.scenes[0].shots[i].transitionToNext.mechanism==='cut'?0:3),visibleElementIds:[...new Set([...f.board.scenes[0].shots[i].visibleElementIds,...(f.board.scenes[0].shots[i+1]?.visibleElementIds ?? [])])]}}));
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
  assert.deepEqual(packet.context.writePaths, [`videos/${f.slug}/narration-script.md`, `videos/${f.slug}/storyboard.json`, `videos/${f.slug}/storyboard-design-audit.json`, `videos/${f.slug}/storyboard-assets/*`]);
  assert.equal(packet.task.nextStage, "gate-2");
  assert.equal(packet.context.constraints.some(text => /必须.*HTML.*原型/.test(text)), false);
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
  assert.deepEqual(frozen.eventIds, f.board.scenes.flatMap(scene => scene.events.map(event => event.id)));
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
  const f = fixture(t,{shotCount:2}); f.converge();
  const cli = JSON.parse(execFileSync(process.execPath, [path.join(repository, "harness/src/cli.mjs"), "storyboard-review", f.slug, "--json"], { encoding: "utf8", env: process.env }));
  const server = createWebServer({ port: 0, remoteJobMonitor: { start() {}, stop() {}, async poll() {} } });
  await server.listen(); t.after(() => server.close());
  const base = `http://127.0.0.1:${server.server.address().port}/api/projects/${f.slug}`;
  const review = (await (await fetch(`${base}/storyboard-review`)).json()).review;
  assert.equal(cli.reviewVersion, review.reviewVersion);
  assert.deepEqual(cli.scenes[0].shots.map(s=>s.id),["s01-shot01","s01-shot02"]);
  assert.deepEqual(cli.scenes[0].shots,review.scenes[0].shots);
  assert.match(storyboardPanel(review),/Shot s01-shot02/);
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
  assert.equal(raw.ready, false); // Changed narration also invalidates its design audit.
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
  const f = fixture(t,{shotCount:2}); const queued = [];
  const batch = createBatch({ type: "to-gate-2", slugs: [f.slug] });
  await runBatch(batch.id, { queueAgentJob(id) { queued.push(id); } });
  assert.equal(queued.length, 1);
  const { getAgentJob, runAgentJob } = await import("../src/agent-jobs.mjs");
  let job = getAgentJob(queued[0]);
  assert.deepEqual(job.task.task.stages, ["content-analysis", "video-narrative"]);
  await runAgentJob(job.id, { executor: { async run() { for (const name of ["content-analysis.md", "video-narrative.md"]) fs.writeFileSync(path.join(f.materials, name), planningDocuments[name]); return { summary: "批量策划" }; } } });
  await runBatch(batch.id, { queueAgentJob(id) { queued.push(id); } });
  job = getAgentJob(queued[1]); assert.deepEqual(job.task.task.stages, ["narration-script", "storyboard"]);
  await runAgentJob(job.id, { executor: { async run() { fs.writeFileSync(path.join(f.materials, "narration-script.md"), "## Scene 01\n任务从等待进入制作，校验通过后完成。\n"); f.writeBoard(); f.writeAudit(); return { summary: "批量分镜" }; } } });
  await runBatch(batch.id, { queueAgentJob() { assert.fail("no more production before approval"); } });
  assert.equal(getBatch(batch.id).items[0].status, "waiting-gate");
  assert.equal(f.project().state.currentStage, "gate-2");
});







test("executable Shot version three task completion and Gate 2 bind the complete design audit", t => {
  const f=fixture(t,{dataVersion:3});f.planning();
  const packet=buildTaskPacket(f.project());
  assert.ok(packet.context.writePaths.includes(`videos/${f.slug}/storyboard-design-audit.json`));
  assert.ok(packet.context.readPaths.includes("templates/video-production/storyboard-v3.schema.json"));
  assert.ok(packet.context.readPaths.includes("docs/VIDEO-PRODUCTION-RULES.md"));
  assert.ok(packet.context.readPaths.includes("templates/video-production/tutorial-motion-recipe.md"));
  assert.ok(packet.context.constraints.some(text => text.includes("审美与感官") && text.includes("未观看保持 pending")));
  const job=claimDialogueTask(f.slug);
  fs.writeFileSync(path.join(f.materials,"narration-script.md"),"## Scene 01\n任务从等待进入制作，校验通过后完成。\n");f.writeBoard();
  assert.equal(storyboardReview(f.project()).ready,false);
  f.writeAudit();assert.equal(storyboardReview(f.project()).ready,true);
  completeDialogueTask(job.id,"隔离测试的纯口播、可执行分镜和设计审计");runStage(f.project(),"gate-2");
  const review=storyboardReview(f.project());approveGate(f.project(),"gate-2",{reviewVersion:review.reviewVersion});
  const baseline=getPrototypeBaseline(f.project());
  assert.equal(baseline.schemaVersion,5);assert.equal(baseline.storyboardSchemaVersion,3);assert.equal(baseline.designAuditFingerprint,review.designAuditFingerprint);
  const html=storyboardPanel(review);assert.match(html,/对象与生命周期/);assert.match(html,/task-result/);assert.match(html,/SQ-10/);assert.doesNotMatch(html,/\[object Object\]/);
  assert.match(html,/审美与感官/);assert.match(html,/14\.4/);
  assert.ok(validateRemotionAlignment(f.project()).length);
});

test("failed, duplicate, omitted and stale audit checks prevent Gate 2 approval",t=>{
  const f=fixture(t,{dataVersion:3});f.converge();
  const auditFile=path.join(f.materials,"storyboard-design-audit.json");const original=f.writeAudit();
  for(const mutate of [a=>a.checks[0].result="fail",a=>a.checks.pop(),a=>a.checks.push(a.checks[0]),a=>a.inputVersion="a".repeat(64)]){
    const audit=structuredClone(original);mutate(audit);fs.writeFileSync(auditFile,JSON.stringify(audit));
    const review=storyboardReview(f.project());assert.equal(review.ready,false);
    assert.throws(()=>approveGate(f.project(),"gate-2",{reviewVersion:review.reviewVersion}),/阻断/);
    assert.notEqual(f.project().state.stages["gate-2"].review?.decision,"approved");
  }
});

test("quality-rule changes invalidate the claimed task input rather than accepting old output",t=>{
  const f=fixture(t,{dataVersion:3});f.planning();const job=claimDialogueTask(f.slug);
  for (const reference of ["docs/STORYBOARD-EXECUTION-QUALITY.md", "docs/VIDEO-PRODUCTION-RULES.md", "templates/video-production/tutorial-motion-recipe.md"]) {
    const before=fingerprintTaskInputs(f.project(),["narration-script","storyboard"]);
    const designBefore=storyboardReview(f.project()).designInputVersion;
    fs.appendFileSync(path.join(f.workspace,reference),"\nChanged isolated rule\n");
    assert.notEqual(fingerprintTaskInputs(f.project(),["narration-script","storyboard"]),before);
    assert.notEqual(storyboardReview(f.project()).designInputVersion,designBefore);
  }
  assert.throws(()=>completeDialogueTask(job.id,"旧规则产物"),{code:"production-input-changed"});
});

test("same Cue events and insufficient real action duration fail Shot version three timing",t=>{
  const f=fixture(t,{dataVersion:3});f.converge();
  const timing={scenes:[{sceneId:"01",startFrame:0,endFrame:120,segments:[{cues:[{id:"one",segmentId:"01-01",text:"任务从等待进入制作，校验通过后完成。",startFrame:0,startSeconds:0}]}]}]};
  assert.throws(()=>storyboardTimingEvents(f.project(),timing),/同 Cue/);
  timing.scenes[0].segments[0].cues=[{id:"first",segmentId:"01-01",text:"任务从等待进入制作",startFrame:0,startSeconds:0},{id:"second",segmentId:"01-01",text:"校验通过后完成",startFrame:60,startSeconds:2}];
  assert.equal(storyboardTimingEvents(f.project(),timing)[0].events.length,2);
  timing.scenes[0].segments[0].cues[1].startFrame=5;
  assert.throws(()=>storyboardTimingEvents(f.project(),timing),/区间重叠/);
});

test("Shot version three execution plan binds the human frozen design and task runtime inputs",t=>{
  const f=fixture(t,{dataVersion:3});f.converge();
  const timing={scenes:[{sceneId:"01",startFrame:0,endFrame:120,segments:[{cues:[
    {id:"first",segmentId:"01-01",text:"任务从等待进入制作",startFrame:0,startSeconds:0},
    {id:"second",segmentId:"01-01",text:"校验通过后完成",startFrame:60,startSeconds:2},
  ]}]}]};
  assert.throws(()=>storyboardImplementationTiming(f.project(),timing),/未按当前版本通过 Gate 2/);
  const review=storyboardReview(f.project());approveGate(f.project(),"gate-2",{reviewVersion:review.reviewVersion});
  const plan=storyboardImplementationTiming(f.project(),timing);
  assert.equal(plan.reviewVersion,review.reviewVersion);assert.equal(plan.storyboardFingerprint,review.storyboardFingerprint);
  assert.deepEqual(plan.elements.map(e=>[e.id,e.start,e.end]),[["task-root",0,120],["task-request",0,72],["task-result",72,120]]);
  const changed=structuredClone(timing);changed.scenes[0].segments[0].cues[1].startFrame=70;
  assert.notEqual(storyboardImplementationTiming(f.project(),changed).timingFingerprint,plan.timingFingerprint);
  const before=fingerprintTaskInputs(f.project(),["remotion"]);
  fs.appendFileSync(path.join(f.workspace,STORYBOARD_SHARED_REFERENCES[0]),'\n// isolated runtime change\n');
  assert.notEqual(fingerprintTaskInputs(f.project(),["remotion"]),before);
  for(const file of STORYBOARD_SHARED_REFERENCES){fs.mkdirSync(path.dirname(path.join(f.workspace,file)),{recursive:true});fs.copyFileSync(path.join(repository,file),path.join(f.workspace,file));}
  assert.equal(fingerprintTaskInputs(f.project(),["remotion"]),before);
  const generated=`src/videos/${f.slug}/generated`;
  const manifests={
    "audio-manifest.json":{videoId:f.slug,scenes:[{sceneId:"01",segments:[{id:"01-01",file:"audio/01.mp3",duration:4}]}]},
    "subtitle-manifest.json":{videoId:f.slug,scenes:[{sceneId:"01",segments:[{segmentId:"01-01",cues:[{id:"first",start:0,end:1.8,text:"任务从等待进入制作"},{id:"second",start:2,end:4,text:"校验通过后完成"}]}]}]},
    "timeline-manifest.json":{videoId:f.slug,duration:4,scenes:[{sceneId:"01",offset:0,duration:4,end:4,segments:[{segmentId:"01-01",offset:0,duration:4,end:4}]}]},
  };
  for(const [file,value] of Object.entries(manifests)){const target=path.join(f.workspace,generated,file);fs.mkdirSync(path.dirname(target),{recursive:true});fs.writeFileSync(target,JSON.stringify(value));}
  const taskProject=f.project();taskProject.state.currentStage="remotion";taskProject.state.stages.remotion.status="ready";
  const packet=buildTaskPacket(taskProject);
  assert.equal(packet.context.storyboardTimingError,undefined);
  assert.equal(packet.context.storyboardTimingPlan.reviewVersion,review.reviewVersion);
  assert.deepEqual(packet.context.storyboardTimingPlan.elements.map(e=>[e.id,e.start,e.end]),plan.elements.map(e=>[e.id,e.start,e.end]));
  assert.ok(packet.context.readPaths.includes("src/lib/timing.ts"));
  const input=buildRemotionExecutionInput(taskProject,{id:"isolated-v2",...packet.task,context:packet.context});
  assert.ok(input.constraints.some(text=>text.includes("Agent")));
  assert.ok(!input.constraints.some(text=>text.includes("必须以 Gate 2 冻结的 Storyboard")&&text.includes("schemaVersion 3")));
  fs.appendFileSync(path.join(f.materials,"source.md"),"\nChanged isolated source\n");
  assert.throws(()=>storyboardImplementationTiming(f.project(),timing),/未按当前版本通过 Gate 2/);
});

function isolatedViewing(f) {
  const {alignment, timing} = buildStoryboardImplementationReview(f.project());
  const ranges = storyboardViewingRanges(f.alignment);
  // Explicitly fictional evidence in an isolated fixture; never production acceptance.
  f.write(`videos/${f.slug}/remotion-viewing-evidence.json`, {
    schemaVersion: 2, kind: 'storyboard-viewing-evidence', slug: f.slug,
    reviewVersion: alignment.reviewVersion, storyboardFingerprint: alignment.storyboardFingerprint,
    timingFingerprint: alignment.timingFingerprint, implementationFingerprint: alignment.implementationFingerprint,
    viewer: 'isolated-test-only', viewedAt: new Date().toISOString(), unresolved: [],
    scenes: alignment.scenes.map(scene => ({sceneId: scene.sceneId, startFrame: scene.startFrame, endFrame: scene.endFrame, method: 'studio-playback', result: 'pass', note: '模拟字段，仅验证契约'})),
    checks: alignment.scenes.flatMap(scene => scene.events.map(event => ({sceneId: scene.sceneId, eventId: event.id, startFrame: event.startFrame, endFrame: event.completeFrame,
      method: 'studio-playback', result: 'pass', boundariesChecked: true, note: '模拟字段，仅验证契约'}))),
    shots:ranges.shots.map(s=>({...s,method:'studio-playback',result:'pass',note:'隔离模拟镜头，非实际观看'})),
    boundaries:ranges.boundaries.map(s=>({...s,method:'studio-playback',result:'pass',note:'隔离模拟交界，非实际观看'})),
    listening: {normalSpeed: true, result: 'pass', startFrame: 0, endFrame: timing.durationFrames, note: '模拟字段，不是真实试听'},
  });
}

test('claiming dialogue and background tasks leaves authored JSX untouched and requires human viewing', async t => {
  const f = await downstreamFixture(t, {dataVersion: 3});
  const component = path.join(f.workspace, `src/videos/${f.slug}/StoryboardVideo.tsx`);
  const original = fs.readFileSync(component, 'utf8');
  assert.equal(f.remotionJob.task.context.storyboardViewingTemplate, undefined);
  assert.deepEqual(validateStoryboardImplementation(f.project()), []);
  assert.ok(validateStoryboardImplementation(f.project(), {requireViewing:true}).length);
  failAgentTask(f.remotionJob.id, 'isolated test'); retryStage(f.project(), 'remotion');
  const task = ensureRemotionTask({slug:f.slug}); startRemotionTask(task.id);
  assert.equal(fs.readFileSync(component,'utf8'), original);
  assert.equal(getRemotionTask(task.id).context.storyboardViewingTemplate, undefined);
});

test('authored JSX changes invalidate review fingerprints without requiring a generated source tree', async t => {
  const f = await downstreamFixture(t, {dataVersion:3});
  f.write(`src/videos/${f.slug}/StoryboardVideo.tsx`, 'const Scene01 = () => null; export const StoryboardVideo = () => <section><h1>任务</h1></section>;');
  assert.ok(validateStoryboardImplementation(f.project()).some(i=>i.code==='storyboard-implementation-stale'));
  const metadata=buildStoryboardImplementationReview(f.project());
  Object.assign(f.alignment, {...metadata.alignment, scenes:f.alignment.scenes});
  f.write(`videos/${f.slug}/remotion-alignment.json`,f.alignment);
  assert.deepEqual(validateStoryboardImplementation(f.project()),[]);
  isolatedViewing(f);
  f.write(`src/videos/${f.slug}/generated/audio/scene-01/01-01.mp3`, 'changed audio');
  assert.ok(validateStoryboardImplementation(f.project(),{requireViewing:true}).some(i=>i.code==='storyboard-viewing-stale'));
});

test('authored component exports and dependencies are preserved in single, catalog and packaged preview', async t => {
  const f=await downstreamFixture(t,{dataVersion:3});
  const prepared=prepareRenderInputEntry(f.project());
  assert.equal(prepared.manifest.storyboardSchemaVersion,3);
  assert.deepEqual(validateCurrentRenderInput(f.project()),[]);
  assert.match(renderEntryPointSource(prepared.manifest),/StoryboardVideo/);
  const catalog=discoverStudioEntries(f.workspace,{projectsDirectory:process.env.HARNESS_PROJECTS_DIR});
  assert.ok(catalog.entries.some(e=>e.slug===f.slug));
  assert.match(renderStudioCatalogSource(catalog.entries),/StoryboardVideo/);
  const missing=structuredClone(prepared.manifest); delete missing.storyboardSchemaVersion;
  fs.writeFileSync(path.join(prepared.directory,'render-input.json'),JSON.stringify(missing));
  assert.ok(validateRenderInputDirectory(prepared.directory).length);
});

test('authored implementation reaches human Gate 3 only after all timing and viewing checks', async t => {
 const f=await downstreamFixture(t,{dataVersion:3});
 prepareRenderInputEntry(f.project());
 assert.throws(()=>completeDialogueTask(f.remotionJob.id,'isolated incomplete viewing'),/校验/);
 isolatedViewing(f);
 prepareRenderInputEntry(f.project());
 assert.deepEqual(validateRemotionAlignment(f.project()),[]);
 const done=completeDialogueTask(f.remotionJob.id,'isolated contract checks, no real viewing');
 assert.equal(done.status,'succeeded');
 assert.equal(f.project().state.currentStage,'gate-3');
 assert.notEqual(f.project().state.stages['gate-3'].status,'succeeded');
});

test('independent JSX component exports and recursive local imports are accepted and packaged', async t => {
 const f=await downstreamFixture(t,{dataVersion:3});
 fs.unlinkSync(path.join(f.workspace,`src/videos/${f.slug}/StoryboardVideo.tsx`));
 f.write(`src/components/FixtureVisual.tsx`,"export const FixtureVisual = () => <div>任务</div>;");
 f.write(`src/videos/${f.slug}/LessonVideo.tsx`,"import {FixtureVisual} from '../../components/FixtureVisual';\nconst Scene01 = () => <FixtureVisual />;\nexport const LessonVideo = () => <Scene01 />;");
 const review=buildStoryboardImplementationReview(f.project());
 Object.assign(f.alignment,{...review.alignment,scenes:f.alignment.scenes});
 f.alignment.scenes[0].implementationFiles=[`src/videos/${f.slug}/LessonVideo.tsx`];
 f.alignment.scenes[0].shots[0].implementationFiles=[`src/videos/${f.slug}/LessonVideo.tsx`];
 f.write(`videos/${f.slug}/remotion-alignment.json`,f.alignment);
 const prepared=prepareRenderInputEntry(f.project(),{componentFile:'LessonVideo.tsx',componentExport:'LessonVideo'});
 assert.equal(prepared.manifest.entry.componentExport,'LessonVideo');
 assert.ok(fs.existsSync(path.join(prepared.directory,'src/components/FixtureVisual.tsx')));
 assert.deepEqual(validateCurrentRenderInput(f.project()),[]);
 f.write('src/components/FixtureVisual.tsx',"export const FixtureVisual = () => <div>变化</div>;");
 assert.ok(validateStoryboardImplementation(f.project()).some(i=>i.code==='storyboard-implementation-stale'));
});

test('old generated alignment and package audio mismatches remain blocked', async t => {
  const f=await downstreamFixture(t,{dataVersion:3});
  const old=structuredClone(f.alignment);old.kind='storyboard-execution-alignment';
  f.write(`videos/${f.slug}/remotion-alignment.json`,old);
  assert.ok(validateStoryboardImplementation(f.project()).some(i=>i.code==='storyboard-implementation-stale'));
  f.write(`videos/${f.slug}/remotion-alignment.json`,f.alignment);
  const prepared=prepareRenderInputEntry(f.project());
  fs.writeFileSync(path.join(prepared.directory,`src/videos/${f.slug}/generated/audio/scene-01/01-01.mp3`),'different bytes');
  assert.ok(validateRenderInputDirectory(prepared.directory).some(i=>/音频|audio|指纹|fingerprint|不一致/.test(i)));
});

function approvedRenderFixture(t) {
  // Isolated state fixture for post-approval rework, never production acceptance.
  const f=fixture(t); f.converge(); approveGate(f.project(),'gate-2',{reviewVersion:storyboardReview(f.project()).reviewVersion});
  const p=f.project();
  for (const stage of ['tts','subtitle-timeline','tts-quality','remotion','gate-3']) {
    if (p.state.stages[stage]) p.state.stages[stage].status='succeeded';
  }
  p.state.stages['gate-3'].review={decision:'approved',reviewedAt:new Date().toISOString()};
  p.state.currentStage='render'; if(p.state.stages.render)p.state.stages.render.status='ready';
  writeJson(p.files.state,p.state); return f;
}

test("post-approval CLI and HTTP prepare share a read-only rework version; start archives Gate facts",async t=>{
  const f=approvedRenderFixture(t), statePath=f.project().files.state;
  const before=fs.readFileSync(statePath,"utf8"), source=fs.readFileSync(path.join(f.materials,"storyboard.json"),"utf8");
  const options={returnTo:"storyboard",reason:"设计反馈：请求和结果需区分",dataVersion:3};
  const cli=JSON.parse(execFileSync(process.execPath,[path.join(repository,"harness/src/cli.mjs"),"storyboard-rework",f.slug,"prepare","--return-to","storyboard","--reason",options.reason,"--storyboard-schema-version","3"],{env:process.env,encoding:"utf8"}));
  const service=createProjectActionService({});const web=await service.execute({slug:f.slug,action:"prepare-storyboard-rework",returnTo:options.returnTo,reason:options.reason,storyboardSchemaVersion:3});
  assert.deepEqual(cli,web.result);assert.equal(fs.readFileSync(statePath,"utf8"),before);
  const taskInputs=fingerprintTaskInputs(f.project(),["remotion"]);
  await service.execute({slug:f.slug,action:"start-storyboard-rework",returnTo:options.returnTo,reason:options.reason,storyboardSchemaVersion:3,reworkVersion:cli.reworkVersion});
  const p=f.project();assert.equal(p.state.currentStage,"storyboard");assert.equal(p.config.storyboardSchemaVersion,3);assert.equal(p.state.stages["gate-2"].status,"invalidated");assert.equal(p.state.stages["gate-3"].status,"invalidated");
  assert.notEqual(fingerprintTaskInputs(p,["remotion"]),taskInputs);assert.equal(fs.readFileSync(path.join(f.materials,"storyboard.json"),"utf8"),source);
  const journal=JSON.parse(fs.readFileSync(path.join(p.files.directory,"storyboard-rework",cli.reworkVersion+".json")));
  assert.equal(journal.previous.state.stages["gate-2"].review.decision,"approved");assert.equal(journal.previous.state.stages["gate-3"].review.decision,"approved");
  assert.equal(startStoryboardRework(f.slug,cli.reworkVersion).resumed,true);
});

test("stale rework plans, silent downgrades and implementation-only design upgrades are rejected",t=>{
  const f=approvedRenderFixture(t);const options={returnTo:"storyboard",reason:"新设计",dataVersion:3};const plan=prepareStoryboardRework(f.slug,options);
  fs.appendFileSync(path.join(f.materials,"source.md"),"\n新资料\n");const before=fs.readFileSync(f.project().files.state,"utf8");
  assert.throws(()=>startStoryboardRework(f.slug,plan.reworkVersion,options),/过期/);assert.equal(fs.readFileSync(f.project().files.state,"utf8"),before);
  assert.equal(prepareStoryboardRework(f.slug,{returnTo:"remotion",reason:"只修实现"}).returnTo,"remotion");
  assert.throws(()=>prepareStoryboardRework(f.slug,{...options,dataVersion:99}),{code:"storyboard-rework-version"});
});

test("completed post-approval rework remains permanently read-only",t=>{
  const f=approvedRenderFixture(t),p=f.project();p.state.currentStage="completed";writeJson(p.files.state,p.state);const before=fs.readFileSync(p.files.state,"utf8");
  assert.throws(()=>prepareStoryboardRework(f.slug,{reason:"反馈"}),/永久只读/);
  assert.throws(()=>startStoryboardRework(f.slug,"a".repeat(64),{reason:"反馈"}),/永久只读/);
  assert.equal(fs.readFileSync(p.files.state,"utf8"),before);assert.equal(fs.existsSync(path.join(p.files.directory,"storyboard-rework")),false);
});

test("rework resumes its own partial writes but never replaces conflicting later state",t=>{
  const f=approvedRenderFixture(t),options={returnTo:"storyboard",reason:"升级",dataVersion:3},plan=prepareStoryboardRework(f.slug,options);
  startStoryboardRework(f.slug,plan.reworkVersion,options);const p=f.project(),file=path.join(p.files.directory,"storyboard-rework",plan.reworkVersion+".json");
  const journal=JSON.parse(fs.readFileSync(file));journal.status="applying";writeJson(file,journal);writeJson(p.files.state,journal.previous.state);
  assert.equal(startStoryboardRework(f.slug,plan.reworkVersion).status,"applied");assert.equal(f.project().state.currentStage,"storyboard");
  journal.status="applying";writeJson(file,journal);const conflict=f.project().state;conflict.updatedAt="conflicting-edit";writeJson(p.files.state,conflict);
  assert.throws(()=>startStoryboardRework(f.slug,plan.reworkVersion),/拒绝覆盖/);assert.equal(f.project().state.updatedAt,"conflicting-edit");
});

test("rework binds and stops affected batches of every production type", t => {
  const f = approvedRenderFixture(t);
  const batches = ["to-gate-2", "to-tts", "to-remotion", "to-render"].map(type => {
    const batch = createBatch({ type, slugs: [f.slug] });
    batch.items[0].status = "waiting-config";
    writeJson(path.join(process.env.HARNESS_BATCHES_DIR, `${batch.id}.json`), batch);
    return batch;
  });
  const options = { reason: "隔离测试的批准后设计反馈", dataVersion: 3 };
  const plan = prepareStoryboardRework(f.slug, options);
  assert.deepEqual(new Set(plan.batchIds), new Set(batches.map(b => b.id)));
  for (const batch of batches) assert.ok(plan.writePaths.includes(path.join(process.env.HARNESS_BATCHES_DIR, `${batch.id}.json`)));
  startStoryboardRework(f.slug, plan.reworkVersion, options);
  for (const batch of batches) assert.equal(getBatch(batch.id).items[0].status, "failed");
});

test("changed batch scope invalidates rework before production state writes", t => {
  const f = approvedRenderFixture(t), options = { reason: "隔离测试" };
  const plan = prepareStoryboardRework(f.slug, options), before = fs.readFileSync(f.project().files.state, "utf8");
  const batch = createBatch({ type: "to-remotion", slugs: [f.slug] });
  batch.items[0].status = "queued";
  writeJson(path.join(process.env.HARNESS_BATCHES_DIR, `${batch.id}.json`), batch);
  assert.throws(() => startStoryboardRework(f.slug, plan.reworkVersion, options), { code: "storyboard-rework-stale" });
  assert.equal(fs.readFileSync(f.project().files.state, "utf8"), before);
});

test("mixed completed batch blocks rework without changing any member", t => {
  const f = approvedRenderFixture(t);
  initializeProject("readonly-member");
  const batch = createBatch({ type: "to-remotion", slugs: [f.slug, "readonly-member"] });
  batch.items[0].status = "waiting-config";
  writeJson(path.join(process.env.HARNESS_BATCHES_DIR, `${batch.id}.json`), batch);
  const completed = loadProject("readonly-member", { refresh: false });
  completed.state.currentStage = "completed"; writeJson(completed.files.state, completed.state);
  const paths = [f.project().files.state, completed.files.state, path.join(process.env.HARNESS_BATCHES_DIR, `${batch.id}.json`)];
  const before = paths.map(p => fs.readFileSync(p, "utf8"));
  assert.throws(() => prepareStoryboardRework(f.slug, { reason: "隔离测试" }), { code: "completed-project-readonly" });
  assert.deepEqual(paths.map(p => fs.readFileSync(p, "utf8")), before);
});

test("interrupted rework checks completed batch members again before recovery writes", t => {
  const f = approvedRenderFixture(t);
  initializeProject("later-completed-member");
  const batch = createBatch({ type: "to-remotion", slugs: [f.slug, "later-completed-member"] });
  batch.items[0].status = "waiting-config";
  writeJson(path.join(process.env.HARNESS_BATCHES_DIR, `${batch.id}.json`), batch);
  const options = { reason: "隔离恢复测试", dataVersion: 3 }, plan = prepareStoryboardRework(f.slug, options);
  startStoryboardRework(f.slug, plan.reworkVersion, options);
  const file = path.join(f.project().files.directory, "storyboard-rework", `${plan.reworkVersion}.json`);
  const journal = JSON.parse(fs.readFileSync(file)); journal.status = "applying";
  writeJson(file, journal); writeJson(f.project().files.state, journal.previous.state);
  const other = loadProject("later-completed-member", { refresh: false });
  other.state.currentStage = "completed"; writeJson(other.files.state, other.state);
  const paths = [f.project().files.state, other.files.state, path.join(process.env.HARNESS_BATCHES_DIR, `${batch.id}.json`)];
  const before = paths.map(p => fs.readFileSync(p, "utf8"));
  assert.throws(() => startStoryboardRework(f.slug, plan.reworkVersion), { code: "completed-project-readonly" });
  assert.deepEqual(paths.map(p => fs.readFileSync(p, "utf8")), before);
});


test('multiple shots reach packaged Gate 3 with real Cue boundaries and pending evidence blocks completion', async t => {
  const f=await downstreamFixture(t,{shotCount:2});
  const plan=storyboardImplementationTiming(f.project(),buildRemotionTimingPlanForProject(f.project()));
  assert.deepEqual(plan.shots.map(s=>[s.id,s.startFrame,s.endFrame]),[['s01-shot01',0,30],['s01-shot02',30,90]]);
  const baseline=getPrototypeBaseline(f.project());assert.deepEqual(baseline.shotIds,['s01-shot01','s01-shot02']);assert.equal(baseline.eventShotMap['task-complete'],'s01-shot02');
  prepareRenderInputEntry(f.project());isolatedViewing(f);
  const evidencePath=`videos/${f.slug}/remotion-viewing-evidence.json`, evidence=JSON.parse(fs.readFileSync(path.join(f.workspace,evidencePath)));
  assert.equal(evidence.boundaries.length,1);
  assert.deepEqual(validateStoryboardImplementation(f.project(),{requireViewing:true}),[]);
  for(const mutate of [e=>e.shots[0].result='pending',e=>e.boundaries=[],e=>e.boundaries[0].atFrame=29]) {
    const changed=structuredClone(evidence);mutate(changed);f.write(evidencePath,changed);
    assert.ok(validateStoryboardImplementation(f.project(),{requireViewing:true}).some(i=>i.code==='storyboard-viewing-shots'));
    assert.throws(()=>completeDialogueTask(f.remotionJob.id,'隔离未观看状态'),/校验/);
  }
  f.write(evidencePath,evidence);prepareRenderInputEntry(f.project());
  assert.deepEqual(validateCurrentRenderInput(f.project()),[]);
  completeDialogueTask(f.remotionJob.id,'隔离镜头契约样例，不代表实际审美观看');
  assert.equal(f.project().state.currentStage,'gate-3');assert.notEqual(f.project().state.stages['gate-3'].status,'succeeded');
});

test('Shot design audit, frozen mapping and intra-Cue cut points fail explicitly',t=>{
  const f=fixture(t,{shotCount:2});f.converge();
  const review=storyboardReview(f.project());
  const audit=f.writeAudit();audit.shotChecks.pop();fs.writeFileSync(path.join(f.materials,'storyboard-design-audit.json'),JSON.stringify(audit));
  assert.throws(()=>approveGate(f.project(),'gate-2',{reviewVersion:review.reviewVersion}),/审核|校验|版本/);
  f.writeAudit();approveGate(f.project(),'gate-2',{reviewVersion:storyboardReview(f.project()).reviewVersion});
  const base=getPrototypeBaseline(f.project()), file=path.join(f.project().files.directory,'prototype-baseline.json');
  fs.writeFileSync(file,JSON.stringify({...base,shotIds:['s01-shot01']}));assert.ok(frozenStoryboardIssues(f.project()).length);fs.writeFileSync(file,JSON.stringify(base));
  const timing={scenes:[{sceneId:'01',startFrame:0,endFrame:120,segments:[{cues:[{id:'one',segmentId:'01-01',text:'任务从等待进入制作，校验通过后完成。',startFrame:0,startSeconds:0}]}]}]};
  assert.throws(()=>storyboardTimingEvents(f.project(),timing),/Cue 中间/);
});


test('declared visual overlap keeps logical shots and audio adjacent and binds boundary viewing',async t=>{
  const f=await downstreamFixture(t,{shotCount:2,transitionMechanism:'cross-dissolve'});
  const shot=f.alignment.scenes[0].shots[0];assert.deepEqual([shot.transition.startFrame,shot.transition.endFrame],[27,33]);
  assert.deepEqual(validateStoryboardImplementation(f.project()),[]);
  const valid=structuredClone(f.alignment);
  for(const mutate of [a=>a.scenes[0].shots[0].transition.endFrame=30,a=>a.scenes[0].shots[0].transition.startFrame=-1,a=>a.scenes[0].shots[0].transition.visibleElementIds=['task-root'],a=>a.scenes[0].shots[0].implementationSymbols=['nonexistent']]) {
    const changed=structuredClone(valid);mutate(changed);f.write(`videos/${f.slug}/remotion-alignment.json`,changed);
    assert.ok(validateStoryboardImplementation(f.project()).some(i=>/transition|shots/.test(i.code)));
  }
  f.write(`videos/${f.slug}/remotion-alignment.json`,valid);isolatedViewing(f);
  const evidence=JSON.parse(fs.readFileSync(path.join(f.workspace,`videos/${f.slug}/remotion-viewing-evidence.json`)));
  assert.deepEqual([evidence.boundaries[0].startFrame,evidence.boundaries[0].endFrame],[27,33]);
  assert.deepEqual(validateStoryboardImplementation(f.project(),{requireViewing:true}),[]);
});


test('historical schema two input remains a read-only preview dependency without enabling old production',async t=>{
  const f=await downstreamFixture(t), prepared=prepareRenderInputEntry(f.project());
  // Build a fictional archived package in isolation. Never migrate a real video.
  const p=f.project();p.config.storyboardSchemaVersion=2;writeJson(p.files.config,p.config);
  const old=JSON.parse(fs.readFileSync(path.join(repository,'templates/video-production/storyboard-v2.json')));old.videoSlug=f.slug;old.scenes[0].sourceRefs[0].path=`videos/${f.slug}/source.md`;
  f.write(`videos/${f.slug}/storyboard.json`,old);
  for(const file of storyboardDesignReferences(p)){fs.mkdirSync(path.dirname(path.join(f.workspace,file)),{recursive:true});fs.copyFileSync(path.join(repository,file),path.join(f.workspace,file));}
  const review=storyboardReview(p);
  f.write(`videos/${f.slug}/storyboard-design-audit.json`,{schemaVersion:1,kind:'storyboard-design-audit',ruleVersion:'storyboard-execution-quality-v1',videoSlug:f.slug,inputVersion:review.designInputVersion,storyboardFingerprint:review.storyboardFingerprint,narrationFingerprint:review.narrationFingerprint,checks:old.scenes.flatMap(scene=>scene.events.flatMap(e=>STORYBOARD_QUALITY_CHECKS.map(checkId=>({sceneId:scene.id,eventId:e.id,checkId,result:'pass',elementIds:e.execution.elements,evidence:'isolated archived design',note:'fictional archive, no actual viewing'}))))});
  const archivedReview=storyboardReview(p);assert.equal(archivedReview.ready,true);
  p.state.stages['gate-2'].review={decision:'approved',reviewVersion:archivedReview.reviewVersion};writeJson(p.files.state,p.state);writeJson(path.join(p.files.directory,'prototype-baseline.json'),storyboardBaseline(p));
  const metadata=buildStoryboardImplementationReview(p), alignment=structuredClone(f.alignment);
  Object.assign(alignment,metadata.alignment);alignment.timing=f.alignment.timing;
  alignment.scenes=metadata.alignment.scenes.map((scene,i)=>{const result={...f.alignment.scenes[i],...scene};delete result.shots;return result;});
  f.write(`videos/${f.slug}/remotion-alignment.json`,alignment);
  assert.deepEqual(validateStoryboardImplementation(p),[]);
  assert.throws(()=>prepareRenderInputEntry(p),{code:'production-rework-required'});
  const packageRoot=prepared.directory;
  fs.cpSync(path.join(f.workspace,`videos/${f.slug}`),path.join(packageRoot,`videos/${f.slug}`),{recursive:true});
  for(const file of storyboardDesignReferences(p)){fs.mkdirSync(path.dirname(path.join(packageRoot,file)),{recursive:true});fs.copyFileSync(path.join(f.workspace,file),path.join(packageRoot,file));}
  const manifest=prepared.manifest;manifest.storyboardSchemaVersion=2;manifest.productionBaseline=storyboardBaseline(p);manifest.storyboardRuntimeFiles=runtimeFiles(p);
  const files=[];function walk(dir){for(const e of fs.readdirSync(dir,{withFileTypes:true})){const absolute=path.join(dir,e.name);if(e.isDirectory())walk(absolute);else if(e.name!=='render-input.json')files.push(path.relative(packageRoot,absolute));}}walk(packageRoot);files.sort();
  const hash=crypto.createHash('sha256');manifest.files=files.map(file=>{const bytes=fs.readFileSync(path.join(packageRoot,file));hash.update(`path:${file}\n`);hash.update(bytes);hash.update('\n');return {path:file,size:bytes.length,sha256:crypto.createHash('sha256').update(bytes).digest('hex')};});manifest.packageFingerprint=hash.digest('hex');
  fs.writeFileSync(path.join(packageRoot,'render-input.json'),JSON.stringify(manifest));
  assert.deepEqual(validateRenderInputDirectory(packageRoot,{archivedPreview:true}),[]);
  assert.match(renderEntryPointSource(manifest),/StoryboardVideo/);
});


test('terminal visual transition ends inside the last shot without extending audio',async t=>{
 const f=await downstreamFixture(t);const original=f.board.scenes[0].shots[0];
 // Isolated rebuild to test a frozen ending effect; no runtime design substitution.
 original.transitionToNext.mechanism='fade-out';f.writeBoard();f.writeAudit();
 const p=f.project(),review=storyboardReview(p);p.state.stages['gate-2'].review={decision:'approved',reviewVersion:review.reviewVersion};writeJson(p.files.state,p.state);writeJson(path.join(p.files.directory,'prototype-baseline.json'),storyboardBaseline(p));
 const metadata=buildStoryboardImplementationReview(p);Object.assign(f.alignment,{...metadata.alignment,scenes:f.alignment.scenes});
 const shot=f.alignment.scenes[0].shots[0];shot.transition={target:{type:'end',id:null},mechanism:'fade-out',startFrame:shot.endFrame-5,endFrame:shot.endFrame,visibleElementIds:original.visibleElementIds};
 f.write(`videos/${f.slug}/remotion-alignment.json`,f.alignment);assert.deepEqual(validateStoryboardImplementation(p),[]);
 shot.transition.endFrame++;f.write(`videos/${f.slug}/remotion-alignment.json`,f.alignment);assert.ok(validateStoryboardImplementation(p).some(i=>i.code==='storyboard-implementation-transition'));
});
