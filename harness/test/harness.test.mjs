import assert from "node:assert/strict";
import { execFileSync } from "node:child_process";
import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import test from "node:test";
import { createGitHubActionsAdapter, createMockAdapter } from "../src/adapters.mjs";
import { artifactManifestFor } from "../src/artifacts.mjs";
import { buildNextAction, buildProjectReport } from "../src/reports.mjs";
import { buildTaskPacket } from "../src/context.mjs";
import { buildProjectPlan } from "../src/plans.mjs";
import { applySeriesStyle, initializeProject, loadProject, writeJson } from "../src/storage.mjs";
import { approveGate, rejectGate, resumeProject, runStage, validateStage } from "../src/runner.mjs";
import {
  ADAPTER_REQUIRED_STAGES,
  DEFAULT_WORKFLOW_ID,
  GATE_STAGES,
  returnToStages,
  STAGE_DEFINITIONS,
  STAGES,
  WORKFLOW_DEFINITIONS,
} from "../src/stages.mjs";
import { validateProjectStage } from "../src/validation.mjs";
import { buildTtsScript } from "../src/tts-script.mjs";
import { approveSmokeQc, approveTtsQc, approveTtsQcForProject, batchForView, createBatch, retryFailedBatchItems, runBatch } from "../src/batches.mjs";
import { completeRemotionTask, ensureRemotionTask, listRemotionTasks, retryRemotionTask, runRemotionTask, startRemotionTask } from "../src/remotion-tasks.mjs";
import { buildRemotionExecutionInput } from "../src/remotion-executor.mjs";
import { createRemoteRenderExecutor } from "../src/remote-executor.mjs";
import { runSingleStage } from "../src/single-runner.mjs";
import { createJobRecord, updateJob } from "../src/jobs.mjs";
import { adoptExistingProjectToGate2, markHistoricalProjectCompleted } from "../src/adoption.mjs";
import { getSeriesDefinitionForSlug, getStyleDefinition, resolveStyleId } from "../src/styles.mjs";

const repositoryRoot = path.resolve(new URL("../..", import.meta.url).pathname);

function createFixture({ prototypeBaseline = null } = {}) {
  const workspaceRoot = fs.mkdtempSync(path.join(os.tmpdir(), "video-harness-workspace-"));
  const projectsRoot = fs.mkdtempSync(path.join(os.tmpdir(), "video-harness-projects-"));
  const slug = "fixture-video";
  const files = [
    `videos/${slug}/source.md`,
    `videos/${slug}/content-analysis.md`,
    `videos/${slug}/video-narrative.md`,
    `videos/${slug}/scene-script.md`,
    `videos/${slug}/narration-script.md`,
    `videos/${slug}/visual-script.md`,
    `videos/${slug}/visual-prototype.html`,
    `videos/${slug}/tts-script.json`,
    `src/videos/${slug}/generated/audio-manifest.json`,
    `src/videos/${slug}/generated/subtitle-manifest.json`,
    `src/videos/${slug}/generated/timeline-manifest.json`,
    `src/videos/${slug}/video.config.ts`,
    `src/videos/${slug}/FixtureVideo.tsx`,
  ];

  for (const relativePath of files) {
    const absolutePath = path.join(workspaceRoot, relativePath);
    fs.mkdirSync(path.dirname(absolutePath), { recursive: true });
    let content = "fixture\n";
    if (relativePath.endsWith("content-analysis.md")) content = "# Content Analysis\n\n## 核心命题\n验证 Harness。\n\n## 关键关系\n输入、校验和输出。\n\n## 可视觉化内容\n展示阶段状态。\n";
    if (relativePath.endsWith("video-narrative.md")) content = "# Video Narrative\n\n## 叙事目标\n解释流程。\n\n## 叙事原则\n先展示，再验证。\n\n## 整体叙事结构\n从输入到输出。\n";
    if (relativePath.endsWith("scene-script.md")) content = "# Scene Script\n\n## Scene 01｜测试\n\n### 目的\n验证 Harness。\n\n### narrativeRole\n建立流程。\n\n### narrationIntent\n解释测试。\n\n### visualIntent\n展示测试状态。\n\n### visualType\n流程。\n\n### keyOnScreenText\nHarness。\n\n### videoValue\n让流程可检查。\n";
    if (relativePath.endsWith("narration-script.md")) content = "# Narration Script\n\n## Scene 01｜测试\n\n这是测试口播。\n";
    if (relativePath.endsWith("visual-script.md")) content = "# Visual Script\n\n## 全局视觉原则\n保持清晰。\n\n## Scene 01｜测试\n\n### 视觉目标\n展示测试状态。\n\n### 画面结构\n一个状态卡片。\n\n### 动画\n淡入。\n\n### 屏幕文字\nHarness。\n\n### Visual Type\n流程。\n";
    if (relativePath.endsWith("visual-prototype.html")) content = "<!doctype html><main><button>上一幕</button><button>下一幕</button><button>自动播放</button><div id=\"progress\"></div><section class=\"scene\">Scene 01</section></main>\n";
    if (relativePath.endsWith("video.config.ts")) content = "const fps = 30; const subtitleManifest = {}; const timelineManifest = {}; export const videoConfig = { slug: 'fixture-video', format: 'horizontal', width: 1920, height: 1080, fps, scenes: [] };\n";
    if (relativePath.endsWith("tts-script.json")) content = JSON.stringify({
      schemaVersion: "1.0",
      scenes: [{ sceneId: "01", segments: [{ id: "01-01", text: "这是测试口播。" }] }],
    });
    if (relativePath.endsWith("audio-manifest.json")) content = JSON.stringify({
      scenes: [{ sceneId: "01", segments: [{ id: "01-01", duration: 1 }] }],
    });
    if (relativePath.endsWith("subtitle-manifest.json")) content = JSON.stringify({
      scenes: [{ sceneId: "01", segments: [{ segmentId: "01-01", cues: [{ start: 0, end: 0.9, text: "这是测试口播" }] }] }],
    });
    if (relativePath.endsWith("timeline-manifest.json")) content = JSON.stringify({
      duration: 1,
      scenes: [{
        sceneId: "01",
        offset: 0,
        duration: 1,
        end: 1,
        segments: [{ segmentId: "01-01", offset: 0, duration: 1, end: 1 }],
      }],
    });
    fs.writeFileSync(absolutePath, `${content}\n`, "utf8");
  }

  process.env.HARNESS_PROJECTS_DIR = projectsRoot;
  process.env.HARNESS_WORKSPACE_ROOT = workspaceRoot;
  process.env.HARNESS_TTS_PROJECT_DIR = path.resolve(repositoryRoot, "..", "tts");
  initializeProject(slug, { prototypeBaseline });
  return { slug, projectsRoot };
}

function loadFixture(slug) {
  return loadProject(slug);
}

function snapshotTree(roots) {
  const entries = [];
  function visit(root, current) {
    if (!fs.existsSync(current)) return;
    for (const entry of fs.readdirSync(current).sort()) {
      const absolutePath = path.join(current, entry);
      const relativePath = path.relative(root, absolutePath);
      const stat = fs.statSync(absolutePath);
      if (stat.isDirectory()) visit(root, absolutePath);
      else entries.push(`${relativePath}:${stat.size}:${stat.mtimeMs}`);
    }
  }
  for (const root of roots) visit(root, root);
  return entries.sort();
}

test("defines one canonical workflow for all 15 production stages", () => {
  assert.equal(STAGES.length, 15);
  assert.deepEqual(Object.keys(STAGE_DEFINITIONS), STAGES);
  assert.deepEqual(Object.keys(WORKFLOW_DEFINITIONS), [DEFAULT_WORKFLOW_ID]);
  assert.deepEqual(WORKFLOW_DEFINITIONS.default.stages, STAGES);
  assert.deepEqual([...GATE_STAGES], ["gate-2", "gate-3", "gate-4"]);
  assert.deepEqual([...ADAPTER_REQUIRED_STAGES], ["smoke-render", "render"]);
  assert.equal(STAGE_DEFINITIONS["narration-script"].artifacts[0], "videos/{slug}/narration-script.md");
  assert.equal(STAGE_DEFINITIONS["gate-3"].label, "Gate 3：Remotion 预览确认");
  assert.equal(STAGE_DEFINITIONS["gate-3"].kind, "gate");
  assert.equal(STAGE_DEFINITIONS["gate-3"].requiresApproval, true);
  assert.equal(STAGE_DEFINITIONS["gate-3"].previousStage, "remotion");
  assert.equal(STAGE_DEFINITIONS["gate-3"].nextStage, "smoke-render");
  assert.equal(STAGE_DEFINITIONS.render.artifacts[0], "out/{slug}.mp4");
  for (const stage of STAGES) {
    const definition = STAGE_DEFINITIONS[stage];
    assert.equal(typeof definition.contract.objective, "string");
    assert.ok(definition.contract.executor);
    assert.ok(definition.contract.validation.length > 0);
    assert.deepEqual(definition.contract.outputArtifacts, definition.artifacts);
    assert.equal(definition.contract.nextStage, definition.nextStage);
  }
});

test("initializes explicit workflow, style, and target project configuration", () => {
  const { slug } = createFixture({ prototypeBaseline: "codex-v1" });
  const project = loadFixture(slug);
  assert.equal(project.config.workflow, "default");
  assert.equal(project.config.workflowVersion, 1);
  assert.equal(project.config.style, "current");
  assert.equal(project.config.prototypeBaseline, "codex-v1");
  assert.equal(project.config.target, "gate-4");
  assert.equal(project.config.harnessVersion, "0.6.0");
});

test("resolves the Codex series style and exposes dedicated style definitions", () => {
  assert.equal(getSeriesDefinitionForSlug("02-core-concepts")?.style, "codex");
  assert.equal(resolveStyleId({ style: "current" }, "02-core-concepts"), "codex");
  assert.equal(getStyleDefinition("codex")?.path, "styles/codex/STYLE.md");
  assert.equal(getStyleDefinition("claude-code")?.path, "styles/current/STYLE.md");
});

test("adds the style-specific prototype baseline to the visual prototype task packet", () => {
  const { slug } = createFixture();
  const project = loadFixture(slug);
  project.config.style = "codex";
  project.state.currentStage = "visual-prototype";
  const packet = buildTaskPacket(project);
  assert.deepEqual(packet.context.referencePaths, [
    "styles/codex/STYLE.md",
    "videos/01-what-is-codex/visual-prototype.html",
  ]);
  assert.ok(packet.context.readPaths.includes("styles/codex/STYLE.md"));
  assert.ok(packet.context.readPaths.includes("videos/01-what-is-codex/visual-prototype.html"));
  assert.match(packet.context.constraints.join("\n"), /shell、toolbar、stage、section\.scene、caption、controls、progress 和 meta/);
});

test("requires the immutable Codex prototype shell and layout contract", () => {
  const { slug } = createFixture({ prototypeBaseline: "codex-v1" });
  const project = loadFixture(slug);
  const prototypePath = path.join(project.config.workspaceRoot, `videos/${slug}/visual-prototype.html`);
  const baseline = fs.readFileSync(new URL("../../videos/01-what-is-codex/visual-prototype.html", import.meta.url), "utf8");
  fs.writeFileSync(prototypePath, baseline, "utf8");
  const validIssues = validateStage(loadFixture(slug), "visual-prototype");
  assert.equal(validIssues.some((item) => item.code === "prototype-baseline-format-mismatch"), false);
  assert.equal(validIssues.some((item) => item.code === "prototype-baseline-layout-mismatch"), false);

  fs.writeFileSync(prototypePath, "<main><div class=\"stage\"><section class=\"scene\"></section></div></main>\n", "utf8");
  const invalidIssues = validateStage(loadFixture(slug), "visual-prototype");
  assert.equal(invalidIssues.some((item) => item.code === "prototype-baseline-format-mismatch"), true);
  assert.equal(invalidIssues.some((item) => item.code === "prototype-baseline-layout-mismatch"), true);
});

test("requires one upper-left baseline title block in every prototype scene", () => {
  const { slug } = createFixture({ prototypeBaseline: "codex-v1" });
  const project = loadFixture(slug);
  const prototypePath = path.join(project.config.workspaceRoot, `videos/${slug}/visual-prototype.html`);
  const baseline = fs.readFileSync(new URL("../../videos/01-what-is-codex/visual-prototype.html", import.meta.url), "utf8");
  fs.writeFileSync(prototypePath, baseline, "utf8");
  const validIssues = validateStage(loadFixture(slug), "visual-prototype");
  assert.equal(validIssues.some((item) => item.code === "prototype-baseline-scene-title-mismatch"), false);
  assert.equal(validIssues.some((item) => item.code === "prototype-baseline-scene-title-layout-mismatch"), false);

  const missingTitle = baseline.replace(
    '<div class="eyebrow">Scene 04 · Routing</div>\n        <h1>三扇门在本机，一扇门去云端</h1>',
    '<div class="eyebrow">Scene 04 · Routing</div>',
  );
  fs.writeFileSync(prototypePath, missingTitle, "utf8");
  const missingTitleIssues = validateStage(loadFixture(slug), "visual-prototype");
  assert.equal(missingTitleIssues.some((item) => item.code === "prototype-baseline-scene-title-mismatch"), true);

  const centeredTitle = baseline.replace("</style>", ".scene h1 { text-align: center; }\n    </style>");
  fs.writeFileSync(prototypePath, centeredTitle, "utf8");
  const centeredTitleIssues = validateStage(loadFixture(slug), "visual-prototype");
  assert.equal(centeredTitleIssues.some((item) => item.code === "prototype-baseline-scene-title-layout-mismatch"), true);
});

test("restarts an existing project from Visual Script when its series style changes", () => {
  const { slug } = createFixture();
  const project = loadFixture(slug);
  project.state.currentStage = "visual-prototype";
  for (const stage of ["visual-script", "visual-prototype"]) {
    project.state.stages[stage].status = "succeeded";
    project.state.stages[stage].outputFingerprint = `${stage}-fingerprint`;
  }
  writeJson(project.files.config, project.config);
  writeJson(project.files.state, project.state);

  const result = applySeriesStyle(slug, "codex");
  const updated = loadFixture(slug);
  assert.deepEqual(result, { changed: true, restartedAt: "visual-script" });
  assert.equal(updated.config.style, "codex");
  assert.equal(updated.state.currentStage, "visual-script");
  assert.equal(updated.state.stages["visual-script"].status, "ready");
  assert.equal(updated.state.stages["visual-prototype"].status, "invalidated");
});

test("adopts an existing prototype-only project into a waiting Gate 2 state", () => {
  const workspaceRoot = fs.mkdtempSync(path.join(os.tmpdir(), "video-harness-adoption-workspace-"));
  const projectsRoot = fs.mkdtempSync(path.join(os.tmpdir(), "video-harness-adoption-projects-"));
  const slug = "adoption-video";
  const files = {
    "source.md": "# Source\n\n内容。\n",
    "content-analysis.md": "# Content Analysis\n\n## 核心命题\n内容。\n\n## 关键关系\n关系。\n\n## 可视觉化内容\n状态。\n",
    "video-narrative.md": "# Video Narrative\n\n## 叙事目标\n解释。\n\n## 叙事原则\n清晰。\n\n## 整体叙事结构\n开始到结束。\n",
    "scene-script.md": "# Scene Script\n\n## Scene 01｜测试\n\n### 目的\n验证。\n\n### narrativeRole\n建立。\n\n### narrationIntent\n解释。\n\n### visualIntent\n展示。\n\n### visualType\n流程。\n\n### keyOnScreenText\n状态。\n\n### videoValue\n可见。\n",
    "narration-script.md": "# Narration Script\n\n## Scene 01｜测试\n\n这是测试口播。\n",
    "visual-script.md": "# Visual Script\n\n## 全局视觉原则\n清晰。\n\n## Scene 01｜测试\n\n### 视觉目标\n展示。\n\n### 画面结构\n卡片。\n\n### 动画\n淡入。\n\n### 屏幕文字\n状态。\n\n### Visual Type\n流程。\n",
    "visual-prototype.html": "<!doctype html><main><button>上一幕</button><button>下一幕</button><button>自动播放</button><div id=\"progress\"></div><section class=\"scene\">Scene 01</section></main>\n",
  };
  for (const [file, content] of Object.entries(files)) {
    const absolutePath = path.join(workspaceRoot, `videos/${slug}`, file);
    fs.mkdirSync(path.dirname(absolutePath), { recursive: true });
    fs.writeFileSync(absolutePath, content, "utf8");
  }
  process.env.HARNESS_PROJECTS_DIR = projectsRoot;
  process.env.HARNESS_WORKSPACE_ROOT = workspaceRoot;

  const result = adoptExistingProjectToGate2(slug);
  const project = loadProject(slug, { refresh: false });
  assert.equal(result.status, "waiting");
  assert.equal(project.state.currentStage, "gate-2");
  assert.equal(project.state.stages["gate-2"].status, "waiting");
  assert.equal(project.state.stages["gate-2"].review, null);
  assert.ok(project.state.stages["visual-prototype"].outputFingerprint);
  assert.equal(project.config.adoption.method, "existing-artifacts");
});

test("repairs a freshly initialized prototype-only project without overwriting downstream state", () => {
  const workspaceRoot = fs.mkdtempSync(path.join(os.tmpdir(), "video-harness-initialized-adoption-workspace-"));
  const projectsRoot = fs.mkdtempSync(path.join(os.tmpdir(), "video-harness-initialized-adoption-projects-"));
  const slug = "initialized-adoption-video";
  const files = {
    "source.md": "# Source\n\n内容。\n",
    "content-analysis.md": "# Content Analysis\n\n## 核心命题\n内容。\n\n## 关键关系\n关系。\n\n## 可视觉化内容\n状态。\n",
    "video-narrative.md": "# Video Narrative\n\n## 叙事目标\n解释。\n\n## 叙事原则\n清晰。\n\n## 整体叙事结构\n开始到结束。\n",
    "scene-script.md": "# Scene Script\n\n## Scene 01｜测试\n\n### 目的\n验证。\n\n### narrativeRole\n建立。\n\n### narrationIntent\n解释。\n\n### visualIntent\n展示。\n\n### visualType\n流程。\n\n### keyOnScreenText\n状态。\n\n### videoValue\n可见。\n",
    "narration-script.md": "# Narration Script\n\n## Scene 01｜测试\n\n这是测试口播。\n",
    "visual-script.md": "# Visual Script\n\n## 全局视觉原则\n清晰。\n\n## Scene 01｜测试\n\n### 视觉目标\n展示。\n\n### 画面结构\n卡片。\n\n### 动画\n淡入。\n\n### 屏幕文字\n状态。\n\n### Visual Type\n流程。\n",
    "visual-prototype.html": "<!doctype html><main><button>上一幕</button><button>下一幕</button><button>自动播放</button><div id=\"progress\"></div><section class=\"scene\">Scene 01</section></main>\n",
  };
  for (const [file, content] of Object.entries(files)) {
    const absolutePath = path.join(workspaceRoot, `videos/${slug}`, file);
    fs.mkdirSync(path.dirname(absolutePath), { recursive: true });
    fs.writeFileSync(absolutePath, content, "utf8");
  }
  process.env.HARNESS_PROJECTS_DIR = projectsRoot;
  process.env.HARNESS_WORKSPACE_ROOT = workspaceRoot;

  initializeProject(slug, { prototypeBaseline: null });
  const initialized = loadProject(slug, { refresh: false });
  initialized.state.stages.source.status = "succeeded";
  initialized.state.stages.source.outputFingerprint = "existing-source-fingerprint";
  initialized.state.currentStage = "content-analysis";
  initialized.state.stages["content-analysis"].status = "ready";
  fs.writeFileSync(initialized.files.state, `${JSON.stringify(initialized.state, null, 2)}\n`, "utf8");

  const result = adoptExistingProjectToGate2(slug);
  const project = loadProject(slug, { refresh: false });
  assert.equal(result.status, "waiting");
  assert.equal(project.state.currentStage, "gate-2");
  assert.equal(project.state.stages["gate-2"].status, "waiting");
  assert.equal(project.config.adoption.method, "existing-artifacts-after-init");
  assert.equal(Object.values(project.state.stages).filter((item) => item.status === "succeeded").length, 7);
});

test("marks a user-confirmed historical render as completed without current validation", () => {
  const workspaceRoot = fs.mkdtempSync(path.join(os.tmpdir(), "video-harness-historical-workspace-"));
  const projectsRoot = fs.mkdtempSync(path.join(os.tmpdir(), "video-harness-historical-projects-"));
  const slug = "historical-video";
  process.env.HARNESS_PROJECTS_DIR = projectsRoot;
  process.env.HARNESS_WORKSPACE_ROOT = workspaceRoot;

  const result = markHistoricalProjectCompleted(slug);
  const project = loadProject(slug, { refresh: false });
  assert.equal(result.status, "completed");
  assert.equal(project.state.currentStage, "completed");
  assert.equal(project.config.historical.method, "user-confirmed-existing-render");
  assert.equal(Object.values(project.state.stages).filter((item) => item.status === "succeeded").length, 15);
  assert.equal(project.state.stages["gate-4"].review.decision, "approved");
  assert.equal(project.state.stages.render.outputFingerprint, null);
});

test("builds a single-stage context task packet with bounded read and write paths", () => {
  const { slug } = createFixture();
  const project = loadFixture(slug);
  runStage(project, "source");

  const packet = buildTaskPacket(loadFixture(slug));
  assert.equal(packet.kind, "video-stage-task");
  assert.equal(packet.project.currentStage, "content-analysis");
  assert.equal(packet.task.executor, "agent");
  assert.deepEqual(packet.task.inputStages, ["source"]);
  assert.deepEqual(packet.task.currentValidationIssues, []);
  assert.deepEqual(packet.context.readPaths, [`videos/${slug}/source.md`]);
  assert.deepEqual(packet.context.writePaths, [`videos/${slug}/content-analysis.md`]);
  assert.deepEqual(packet.context.style, {
    id: "current",
    version: 1,
    path: "styles/current/STYLE.md",
    description: "深色、克制、教程型的 16:9 横屏视频视觉基线。",
  });
  assert.equal(packet.task.fallbackStage, "source");
  assert.match(packet.task.commands.execute, new RegExp(`run ${slug} content-analysis`));
  assert.equal(packet.context.constraints.length, 3);
});

test("keeps read-only context and plan commands from refreshing persisted state", () => {
  const { slug } = createFixture();
  const project = loadFixture(slug);
  runStage(project, "source");
  const sourcePath = path.join(project.config.workspaceRoot, `videos/${slug}/source.md`);
  const statePath = path.join(project.files.directory, "state.json");
  fs.appendFileSync(sourcePath, "changed\n", "utf8");

  const before = fs.readFileSync(statePath, "utf8");
  const cliPath = path.join(repositoryRoot, "harness/src/cli.mjs");
  const env = { ...process.env };
  execFileSync(process.execPath, [cliPath, "context", slug], { cwd: repositoryRoot, env, encoding: "utf8" });
  execFileSync(process.execPath, [cliPath, "plan", slug, "--until", "visual-prototype"], { cwd: repositoryRoot, env, encoding: "utf8" });

  assert.equal(fs.readFileSync(statePath, "utf8"), before);
  assert.equal(loadProject(slug, { refresh: false }).state.currentStage, "content-analysis");
});

test("reports wildcard artifacts only when a matching file exists", () => {
  const workspaceRoot = fs.mkdtempSync(path.join(os.tmpdir(), "video-harness-wildcard-workspace-"));
  const slug = "wildcard-video";
  const remotionDirectory = path.join(workspaceRoot, `src/videos/${slug}`);
  fs.mkdirSync(remotionDirectory, { recursive: true });
  const project = {
    config: {
      workspaceRoot,
      workflow: "default",
      workflowVersion: 1,
      style: "current",
      target: "gate-4",
      harnessVersion: "0.6.0",
      sourceDirectory: `videos/${slug}`,
      remotionDirectory: `src/videos/${slug}`,
    },
    state: {
      slug,
      currentStage: "remotion",
      stages: { remotion: { status: "ready" } },
    },
    artifacts: { stages: artifactManifestFor(slug) },
  };

  const missingPacket = buildTaskPacket(project);
  const wildcardOutput = missingPacket.task.outputArtifacts.find((item) => item.path.endsWith("*Video.tsx"));
  assert.equal(wildcardOutput.exists, false);

  fs.writeFileSync(path.join(remotionDirectory, "WildcardVideo.tsx"), "fixture\n", "utf8");
  const presentPacket = buildTaskPacket(project);
  const presentOutput = presentPacket.task.outputArtifacts.find((item) => item.path.endsWith("*Video.tsx"));
  assert.equal(presentOutput.exists, true);
});

test("builds a read-only plan through an explicit target stage", () => {
  const { slug } = createFixture();
  const project = loadFixture(slug);
  const plan = buildProjectPlan(project, "visual-prototype");

  assert.equal(plan.kind, "video-stage-plan");
  assert.equal(plan.target.stage, "visual-prototype");
  assert.equal(plan.target.order, 6);
  assert.equal(plan.target.overridden, true);
  assert.deepEqual(plan.stages.map((item) => item.stage), [
    "source",
    "content-analysis",
    "video-narrative",
    "scene-script",
    "narration-script",
    "visual-script",
    "visual-prototype",
  ]);
  assert.equal(plan.project.configuredTarget, "gate-4");
  assert.equal(loadFixture(slug).config.target, "gate-4");
  assert.throws(() => buildProjectPlan(project, "not-a-stage"), /Unknown target stage/);
});

test("rejects source-reference words in narration before TTS", () => {
  const { slug } = createFixture();
  const project = loadFixture(slug);
  const narrationPath = path.join(project.config.workspaceRoot, `videos/${slug}/narration-script.md`);
  fs.writeFileSync(narrationPath, "## Scene 01｜测试\n\n这篇文章会告诉你怎么做。\n", "utf8");

  const issues = validateStage(loadFixture(slug), "narration-script");
  assert.equal(issues.some((item) => item.code === "forbidden-source-reference"), true);
  assert.equal(issues[0].path, `videos/${slug}/narration-script.md`);
});

test("checks TTS coverage and timeline segment alignment", () => {
  const { slug } = createFixture();
  const project = loadFixture(slug);
  const ttsPath = path.join(project.config.workspaceRoot, `videos/${slug}/tts-script.json`);
  fs.writeFileSync(ttsPath, JSON.stringify({
    schemaVersion: "1.0",
    scenes: [{ sceneId: "01", segments: [{ id: "01-01", text: "另一段口播。" }] }],
  }), "utf8");

  const issues = validateStage(loadFixture(slug), "subtitle-timeline");
  assert.equal(issues.some((item) => item.code === "tts-narration-mismatch"), true);
  assert.equal(issues.some((item) => item.code === "segment-id-mismatch"), false);
});

test("derives TTS Script from narration paragraphs", () => {
  const script = buildTtsScript("fixture-video", "## Scene 01｜测试\n\n第一段口播。\n\n第二段口播。\n");
  assert.deepEqual(script, {
    schemaVersion: "1.0",
    videoId: "fixture-video",
    scenes: [{
      sceneId: "01",
      segments: [
        { id: "01-01", text: "第一段口播。" },
        { id: "01-02", text: "第二段口播。" },
      ],
    }],
  });
});

test("does not derive Markdown separators as TTS segments", () => {
  const script = buildTtsScript("fixture-video", "## Scene 01｜测试\n\n第一段口播。\n\n---\n");
  assert.deepEqual(script.scenes[0].segments, [{ id: "01-01", text: "第一段口播。" }]);
});

test("uses the canonical TTS cleaner for Markdown presentation syntax", () => {
  const script = buildTtsScript(
    "fixture-video",
    "## Scene 01｜测试\n\n> 这是 **第一** 段，见 [官方说明](https://example.com)。\n\n### 视觉说明\n\n---\n\n这是第二段。\n",
  );
  assert.deepEqual(script.scenes[0].segments, [
    { id: "01-01", text: "这是 第一 段，见 官方说明。" },
    { id: "01-02", text: "这是第二段。" },
  ]);
});

test("rejects non-spoken Markdown separators in an existing TTS Script", () => {
  const { slug } = createFixture();
  const project = loadFixture(slug);
  const ttsPath = path.join(project.config.workspaceRoot, `videos/${slug}/tts-script.json`);
  fs.writeFileSync(ttsPath, JSON.stringify({
    schemaVersion: "1.0",
    scenes: [{ sceneId: "01", segments: [{ id: "01-01", text: "---" }] }],
  }), "utf8");

  const issues = validateStage(loadFixture(slug), "tts");
  assert.equal(issues.some((item) => item.code === "internal-tts-text"), true);
});

test("automatically creates and validates TTS Script when Gate 2 is approved", () => {
  const { slug } = createFixture();
  const project = loadFixture(slug);
  const ttsPath = path.join(project.config.workspaceRoot, `videos/${slug}/tts-script.json`);
  fs.rmSync(ttsPath);

  for (const stage of [
    "source",
    "content-analysis",
    "video-narrative",
    "scene-script",
    "narration-script",
    "visual-script",
    "visual-prototype",
  ]) {
    runStage(project, stage);
  }
  runStage(project, "gate-2");

  const result = approveGate(project, "gate-2");
  assert.deepEqual(result.ttsScript, {
    created: true,
    path: `videos/${slug}/tts-script.json`,
    sceneCount: 1,
  });
  assert.equal(fs.existsSync(ttsPath), true);
  assert.equal(loadFixture(slug).state.currentStage, "tts");
  assert.equal(loadFixture(slug).state.stages.tts.status, "ready");
  assert.deepEqual(validateStage(loadFixture(slug), "tts"), []);
  assert.equal(buildNextAction(loadFixture(slug)).action, "run-stage");
});

test("runs the Gate 2 batch independently and stops every video at Gate 2", async () => {
  const { slug } = createFixture();
  const batchRoot = fs.mkdtempSync(path.join(os.tmpdir(), "video-harness-batches-"));
  process.env.HARNESS_BATCHES_DIR = batchRoot;

  const batch = createBatch({ type: "to-gate-2", slugs: [slug] });
  const result = await runBatch(batch.id);

  assert.equal(result.status, "waiting");
  assert.equal(result.items[0].status, "waiting-gate");
  assert.equal(result.items[0].phase, "gate-2");
  assert.equal(loadFixture(slug).state.currentStage, "gate-2");
  assert.equal(loadFixture(slug).state.stages["gate-2"].status, "waiting");
});

test("does not enter TTS quality review before audio, subtitle, and Timeline artifacts exist", async () => {
  const { slug } = createFixture();
  const batchRoot = fs.mkdtempSync(path.join(os.tmpdir(), "video-harness-batches-"));
  process.env.HARNESS_BATCHES_DIR = batchRoot;
  const project = loadFixture(slug);
  runToGate2(project);
  approveGate(loadFixture(slug), "gate-2");
  for (const relativePath of [
    `src/videos/${slug}/generated/audio-manifest.json`,
    `src/videos/${slug}/generated/subtitle-manifest.json`,
    `src/videos/${slug}/generated/timeline-manifest.json`,
  ]) fs.rmSync(path.join(project.config.workspaceRoot, relativePath));

  const batch = createBatch({ type: "to-tts", slugs: [slug] });
  const result = await runBatch(batch.id);
  assert.equal(result.items[0].status, "failed");
  assert.equal(result.items[0].phase, "subtitle-timeline");
  assert.equal(loadFixture(slug).state.currentStage, "subtitle-timeline");
  assert.equal(loadFixture(slug).state.stages["subtitle-timeline"].status, "failed");
});

test("creates a resumable Remotion production task when batch inputs are ready but code is missing", async () => {
  const { slug } = createFixture();
  const batchRoot = fs.mkdtempSync(path.join(os.tmpdir(), "video-harness-batches-"));
  const taskRoot = fs.mkdtempSync(path.join(os.tmpdir(), "video-harness-remotion-tasks-"));
  process.env.HARNESS_BATCHES_DIR = batchRoot;
  process.env.HARNESS_REMOTION_TASKS_DIR = taskRoot;
  const project = loadFixture(slug);
  const workspaceRoot = project.config.workspaceRoot;
  const remotionFiles = [
    `src/videos/${slug}/video.config.ts`,
    `src/videos/${slug}/FixtureVideo.tsx`,
  ].map((relativePath) => ({
    relativePath,
    content: fs.readFileSync(path.join(workspaceRoot, relativePath), "utf8"),
  }));

  runToGate2(project);
  approveGate(loadFixture(slug), "gate-2");
  const ttsBatch = createBatch({ type: "to-tts", slugs: [slug] });
  await runBatch(ttsBatch.id);
  approveTtsQc(ttsBatch.id, slug);
  for (const { relativePath } of remotionFiles) fs.rmSync(path.join(workspaceRoot, relativePath));

  const remotionBatch = createBatch({ type: "to-remotion", slugs: [slug] });
  const paused = await runBatch(remotionBatch.id);
  assert.equal(paused.status, "waiting");
  assert.equal(paused.items[0].status, "waiting-remotion-task");
  assert.equal(listRemotionTasks().length, 1);
  const task = listRemotionTasks()[0];
  assert.equal(task.batchId, remotionBatch.id);
  assert.deepEqual(task.outputArtifacts.map((item) => item.path), [
    `src/videos/${slug}/video.config.ts`,
    `src/videos/${slug}/*Video.tsx`,
  ]);

  startRemotionTask(task.id);
  for (const { relativePath, content } of remotionFiles) {
    const absolutePath = path.join(workspaceRoot, relativePath);
    fs.mkdirSync(path.dirname(absolutePath), { recursive: true });
    fs.writeFileSync(absolutePath, content, "utf8");
  }
  const completed = completeRemotionTask(task.id);
  assert.equal(completed.completed, true);
  const resumed = await runBatch(remotionBatch.id);
  assert.equal(resumed.items[0].status, "waiting-gate");
  assert.equal(loadFixture(slug).state.currentStage, "gate-3");
});

test("runs a single Remotion executor and validates its generated files before completion", async () => {
  const { slug } = createFixture();
  const project = loadFixture(slug);
  runToGate2(project);
  approveGate(loadFixture(slug), "gate-2");
  runStage(loadFixture(slug), "tts");
  runStage(loadFixture(slug), "subtitle-timeline");

  const ready = loadFixture(slug);
  ready.state.stages["subtitle-timeline"].review = {
    kind: "tts-qc",
    decision: "approved",
    reviewedAt: new Date().toISOString(),
  };
  ready.state.currentStage = "remotion";
  ready.state.stages.remotion.status = "ready";
  fs.writeFileSync(ready.files.state, `${JSON.stringify(ready.state, null, 2)}\n`, "utf8");

  const workspaceRoot = ready.config.workspaceRoot;
  const generatedFiles = [
    `src/videos/${slug}/video.config.ts`,
    `src/videos/${slug}/FixtureVideo.tsx`,
  ].map((relativePath) => ({
    relativePath,
    content: fs.readFileSync(path.join(workspaceRoot, relativePath), "utf8"),
  }));
  for (const { relativePath } of generatedFiles) fs.rmSync(path.join(workspaceRoot, relativePath));

  const task = ensureRemotionTask({ slug });
  const packet = buildRemotionExecutionInput(loadFixture(slug), task);
  assert.equal(packet.kind, "video-remotion-execution");
  assert.equal(packet.taskId, task.id);
  assert.deepEqual(packet.outputArtifacts.map((item) => item.path), [
    `src/videos/${slug}/video.config.ts`,
    `src/videos/${slug}/*Video.tsx`,
  ]);

  const result = await runRemotionTask(task.id, {
    executor: {
      async run({ project: current }) {
        for (const { relativePath, content } of generatedFiles) {
          const absolutePath = path.join(current.config.workspaceRoot, relativePath);
          fs.mkdirSync(path.dirname(absolutePath), { recursive: true });
          fs.writeFileSync(absolutePath, content, "utf8");
        }
        return { executor: "test-remotion-agent" };
      },
    },
  });

  assert.equal(result.completed, true);
  assert.equal(result.task.status, "completed");
  assert.equal(loadFixture(slug).state.currentStage, "remotion");
  assert.equal(loadFixture(slug).state.stages.remotion.status, "ready");
});

test("records a failed single Remotion executor without claiming generated code", async () => {
  const { slug } = createFixture();
  const project = loadFixture(slug);
  runToGate3(project);
  const remotionFiles = [
    `src/videos/${slug}/video.config.ts`,
    `src/videos/${slug}/FixtureVideo.tsx`,
  ];
  const current = loadFixture(slug);
  current.state.currentStage = "remotion";
  current.state.stages.remotion.status = "ready";
  current.state.stages["gate-3"].status = "pending";
  fs.writeFileSync(current.files.state, `${JSON.stringify(current.state, null, 2)}\n`, "utf8");
  for (const relativePath of remotionFiles) fs.rmSync(path.join(current.config.workspaceRoot, relativePath));
  const task = ensureRemotionTask({ slug });

  const result = await runRemotionTask(task.id, {
    executor: {
      run() {
        const error = new Error("Agent provider unavailable");
        error.code = "agent-provider-unavailable";
        throw error;
      },
    },
  });

  assert.equal(result.completed, false);
  assert.equal(result.task.status, "failed");
  assert.equal(result.task.error.code, "agent-provider-unavailable");
  assert.equal(loadFixture(slug).state.currentStage, "remotion");
  assert.equal(loadFixture(slug).state.stages.remotion.status, "ready");
});

test("runs the single-stage path from TTS through Remotion to remote render submission", async () => {
  const { slug } = createFixture();
  const project = loadFixture(slug);
  runToGate2(project);
  approveGate(loadFixture(slug), "gate-2");

  await runSingleStage(loadFixture(slug), "tts");
  await runSingleStage(loadFixture(slug), "subtitle-timeline", {
    ttsExecutor: { run: async () => ({ executor: "test-tts" }) },
  });

  const ready = loadFixture(slug);
  ready.state.stages["subtitle-timeline"].review = {
    kind: "tts-qc",
    decision: "approved",
    reviewedAt: new Date().toISOString(),
  };
  ready.state.currentStage = "remotion";
  ready.state.stages.remotion.status = "ready";
  fs.writeFileSync(ready.files.state, `${JSON.stringify(ready.state, null, 2)}\n`, "utf8");

  const workspaceRoot = ready.config.workspaceRoot;
  const remotionFiles = [
    `src/videos/${slug}/video.config.ts`,
    `src/videos/${slug}/FixtureVideo.tsx`,
  ].map((relativePath) => ({
    relativePath,
    content: fs.readFileSync(path.join(workspaceRoot, relativePath), "utf8"),
  }));
  for (const { relativePath } of remotionFiles) fs.rmSync(path.join(workspaceRoot, relativePath));

  const remotionResult = await runSingleStage(loadFixture(slug), "remotion", {
    remotionExecutor: {
      async run({ project: current }) {
        for (const { relativePath, content } of remotionFiles) {
          const absolutePath = path.join(current.config.workspaceRoot, relativePath);
          fs.mkdirSync(path.dirname(absolutePath), { recursive: true });
          fs.writeFileSync(absolutePath, content, "utf8");
        }
        return { executor: "test-remotion-agent" };
      },
    },
  });
  assert.equal(remotionResult.completed, true);
  assert.equal(loadFixture(slug).state.currentStage, "gate-3");
  assert.equal(loadFixture(slug).state.stages["gate-3"].status, "waiting");

  approveGate(loadFixture(slug), "gate-3");
  const remoteCalls = [];
  const remoteResult = await runSingleStage(loadFixture(slug), "smoke-render", {
    remoteExecutor: createRemoteRenderExecutor({
      validateInputs() {},
      monitor: {
        submit(input) {
          remoteCalls.push(input);
          return { id: "single-pipeline-job", status: "queued", ...input };
        },
      },
    }),
  });
  assert.equal(remoteResult.deferred, true);
  assert.deepEqual(remoteCalls, [{ slug, stage: "smoke-render" }]);
});

test("supports TTS quality approval from a single project and resumes its TTS batch", async () => {
  const { slug } = createFixture();
  const batchRoot = fs.mkdtempSync(path.join(os.tmpdir(), "video-harness-batches-"));
  process.env.HARNESS_BATCHES_DIR = batchRoot;
  const project = loadFixture(slug);
  runToGate2(project);
  approveGate(loadFixture(slug), "gate-2");

  const ttsBatch = createBatch({ type: "to-tts", slugs: [slug] });
  const waiting = await runBatch(ttsBatch.id);
  assert.equal(waiting.items[0].status, "waiting-tts-qc");

  const result = await approveTtsQcForProject(slug);
  assert.equal(result.project.state.stages["subtitle-timeline"].review.decision, "approved");
  assert.equal(result.batches[0].items[0].status, "succeeded");
});

test("projects one current video status into every batch view", async () => {
  const { slug } = createFixture();
  const batchRoot = fs.mkdtempSync(path.join(os.tmpdir(), "video-harness-batches-"));
  process.env.HARNESS_BATCHES_DIR = batchRoot;
  const project = loadFixture(slug);
  runToGate2(project);
  approveGate(loadFixture(slug), "gate-2");

  const ttsBatch = createBatch({ type: "to-tts", slugs: [slug] });
  await runBatch(ttsBatch.id);
  approveTtsQc(ttsBatch.id, slug);

  const completedBatch = batchForView({
    id: "completed-batch",
    items: [{ slug, status: "succeeded", message: "批次目标已完成。" }],
  });
  const staleBatch = batchForView({
    id: "stale-batch",
    items: [{ slug, status: "waiting-tts-qc", message: "等待 TTS 质检。" }],
  });

  assert.equal(completedBatch.items[0].currentProject.status, "ready");
  assert.equal(staleBatch.items[0].currentProject.status, "ready");
  assert.equal(completedBatch.items[0].currentProject.currentStage, "remotion");
  assert.deepEqual(completedBatch.items[0].currentProject, staleBatch.items[0].currentProject);
});

test("splits TTS, Remotion, and render batches at their human checkpoints", async () => {
  const { slug } = createFixture();
  const batchRoot = fs.mkdtempSync(path.join(os.tmpdir(), "video-harness-batches-"));
  process.env.HARNESS_BATCHES_DIR = batchRoot;
  const project = loadFixture(slug);
  runToGate2(project);
  approveGate(loadFixture(slug), "gate-2");

  const ttsBatch = createBatch({ type: "to-tts", slugs: [slug] });
  const paused = await runBatch(ttsBatch.id);
  assert.equal(paused.status, "waiting");
  assert.equal(paused.items[0].status, "waiting-tts-qc");
  assert.equal(loadFixture(slug).state.currentStage, "remotion");

  approveTtsQc(ttsBatch.id, slug);
  const remotionBatch = createBatch({ type: "to-remotion", slugs: [slug] });
  const remotionResult = await runBatch(remotionBatch.id);
  assert.equal(remotionResult.items[0].status, "waiting-gate");
  assert.equal(remotionResult.items[0].phase, "gate-3");
  assert.equal(loadFixture(slug).state.currentStage, "gate-3");
  assert.equal(loadFixture(slug).state.stages["gate-3"].status, "waiting");

  approveGate(loadFixture(slug), "gate-3");
  const renderBatch = createBatch({ type: "to-render", slugs: [slug] });
  const smoke = createMockAdapter();
  const render = createMockAdapter();
  const smokeResult = await runBatch(renderBatch.id, { adapters: { "smoke-render": smoke, render } });
  assert.equal(smokeResult.items[0].status, "waiting-smoke-qc");
  assert.equal(loadFixture(slug).state.currentStage, "render");

  approveSmokeQc(renderBatch.id, slug);
  const renderResult = await runBatch(renderBatch.id, { adapters: { "smoke-render": smoke, render } });
  assert.equal(renderResult.items[0].status, "waiting-gate");
  assert.equal(renderResult.items[0].phase, "gate-4");
  assert.equal(loadFixture(slug).state.currentStage, "gate-4");
  assert.equal(loadFixture(slug).state.stages["gate-4"].status, "waiting");
  assert.deepEqual(smoke.calls, [{ stage: "smoke-render", slug }]);
  assert.deepEqual(render.calls, [{ stage: "render", slug }]);
});

test("routes batch TTS and Remotion work through the configured single-video executors", async () => {
  const { slug } = createFixture();
  const batchRoot = fs.mkdtempSync(path.join(os.tmpdir(), "video-harness-batches-"));
  const taskRoot = fs.mkdtempSync(path.join(os.tmpdir(), "video-harness-remotion-tasks-"));
  process.env.HARNESS_BATCHES_DIR = batchRoot;
  process.env.HARNESS_REMOTION_TASKS_DIR = taskRoot;
  runToGate2(loadFixture(slug));
  approveGate(loadFixture(slug), "gate-2");

  const ttsCalls = [];
  const ttsBatch = createBatch({ type: "to-tts", slugs: [slug] });
  const ttsResult = await runBatch(ttsBatch.id, {
    executors: {
      "subtitle-timeline": {
        async run({ project }) {
          ttsCalls.push(project.config.slug);
          return { executor: "test-batch-tts" };
        },
      },
    },
  });
  assert.equal(ttsResult.items[0].status, "waiting-tts-qc");
  assert.deepEqual(ttsCalls, [slug]);

  approveTtsQc(ttsBatch.id, slug);
  const project = loadFixture(slug);
  const workspaceRoot = project.config.workspaceRoot;
  const remotionFiles = [
    `src/videos/${slug}/video.config.ts`,
    `src/videos/${slug}/FixtureVideo.tsx`,
  ].map((relativePath) => ({
    relativePath,
    content: fs.readFileSync(path.join(workspaceRoot, relativePath), "utf8"),
  }));
  for (const { relativePath } of remotionFiles) fs.rmSync(path.join(workspaceRoot, relativePath));

  const remotionCalls = [];
  const remotionBatch = createBatch({ type: "to-remotion", slugs: [slug] });
  const remotionResult = await runBatch(remotionBatch.id, {
    executors: {
      remotion: {
        async run({ project: current }) {
          remotionCalls.push(current.config.slug);
          for (const { relativePath, content } of remotionFiles) {
            const target = path.join(current.config.workspaceRoot, relativePath);
            fs.mkdirSync(path.dirname(target), { recursive: true });
            fs.writeFileSync(target, content, "utf8");
          }
          return { executor: "test-batch-remotion" };
        },
      },
    },
  });
  assert.equal(remotionResult.items[0].status, "waiting-gate");
  assert.deepEqual(remotionCalls, [slug]);
  assert.equal(loadFixture(slug).state.currentStage, "gate-3");
});

test("keeps a batch remote job waiting and does not submit it twice", async () => {
  const { slug } = createFixture();
  const batchRoot = fs.mkdtempSync(path.join(os.tmpdir(), "video-harness-batches-"));
  process.env.HARNESS_BATCHES_DIR = batchRoot;
  runToGate3(loadFixture(slug));
  approveGate(loadFixture(slug), "gate-3");

  let submissions = 0;
  const monitor = { async poll() {}, submit(input) {
    submissions += 1;
    return createJobRecord(input);
  } };
  const remoteExecutor = createRemoteRenderExecutor({ monitor, validateInputs() {} });
  const batch = createBatch({ type: "to-render", slugs: [slug] });
  const first = await runBatch(batch.id, { remoteMonitor: monitor, remoteExecutor });
  assert.equal(first.items[0].status, "waiting-remote");
  assert.equal(submissions, 1);

  const second = await runBatch(batch.id, { remoteMonitor: monitor, remoteExecutor });
  assert.equal(second.items[0].status, "waiting-remote");
  assert.equal(submissions, 1);

  updateJob(slug, first.items[0].remoteJobId, { status: "succeeded", completedAt: new Date().toISOString() });
  const resumed = await runBatch(batch.id, { remoteMonitor: monitor, remoteExecutor });
  assert.equal(resumed.items[0].status, "waiting-smoke-qc");
  assert.equal(submissions, 1);
});

test("retries a failed batch Remotion executor together with its production task", async () => {
  const { slug } = createFixture();
  const batchRoot = fs.mkdtempSync(path.join(os.tmpdir(), "video-harness-batches-"));
  const taskRoot = fs.mkdtempSync(path.join(os.tmpdir(), "video-harness-remotion-tasks-"));
  process.env.HARNESS_BATCHES_DIR = batchRoot;
  process.env.HARNESS_REMOTION_TASKS_DIR = taskRoot;
  runToGate2(loadFixture(slug));
  approveGate(loadFixture(slug), "gate-2");
  const ttsBatch = createBatch({ type: "to-tts", slugs: [slug] });
  await runBatch(ttsBatch.id);
  approveTtsQc(ttsBatch.id, slug);

  const project = loadFixture(slug);
  const workspaceRoot = project.config.workspaceRoot;
  const remotionFiles = [
    `src/videos/${slug}/video.config.ts`,
    `src/videos/${slug}/FixtureVideo.tsx`,
  ].map((relativePath) => ({
    relativePath,
    content: fs.readFileSync(path.join(workspaceRoot, relativePath), "utf8"),
  }));
  for (const { relativePath } of remotionFiles) fs.rmSync(path.join(workspaceRoot, relativePath));

  const remotionBatch = createBatch({ type: "to-remotion", slugs: [slug] });
  const failed = await runBatch(remotionBatch.id, {
    executors: { remotion: { async run() { throw Object.assign(new Error("temporary Agent failure"), { code: "temporary-agent-failure" }); } } },
  });
  assert.equal(failed.items[0].status, "failed");
  assert.equal(listRemotionTasks()[0].status, "failed");

  retryFailedBatchItems(remotionBatch.id);
  const recovered = await runBatch(remotionBatch.id, {
    executors: {
      remotion: {
        async run({ project: current }) {
          for (const { relativePath, content } of remotionFiles) {
            const target = path.join(current.config.workspaceRoot, relativePath);
            fs.mkdirSync(path.dirname(target), { recursive: true });
            fs.writeFileSync(target, content, "utf8");
          }
        },
      },
    },
  });
  assert.equal(recovered.items[0].status, "waiting-gate");
  assert.equal(listRemotionTasks()[0].status, "completed");
});

test("supports legacy read-only validation without weakening strict generation rules", () => {
  const { slug } = createFixture();
  const project = loadFixture(slug);
  const narrationPath = path.join(project.config.workspaceRoot, `videos/${slug}/narration-script.md`);
  fs.writeFileSync(narrationPath, "## Scene 01｜测试\n\n这篇文章只用于旧视频回归。\n", "utf8");

  const strictIssues = validateStage(loadFixture(slug), "narration-script");
  assert.equal(strictIssues.some((item) => item.severity === "error" && item.code === "forbidden-source-reference"), true);
  const legacyProject = loadFixture(slug);
  legacyProject.config.validationPolicy = "legacy";
  const legacyIssues = validateStage(legacyProject, "narration-script");
  assert.equal(legacyIssues.some((item) => item.severity === "warning" && item.code === "forbidden-source-reference"), true);
});

test("blocks malformed production structure and Remotion configuration", () => {
  const { slug } = createFixture();
  const project = loadFixture(slug);
  const root = project.config.workspaceRoot;

  fs.writeFileSync(path.join(root, `videos/${slug}/content-analysis.md`), "# Content Analysis\n\n## 只有标题\n", "utf8");
  const contentIssues = validateStage(loadFixture(slug), "content-analysis");
  assert.equal(contentIssues.some((item) => item.code === "insufficient-headings"), true);
  assert.equal(contentIssues.some((item) => item.code === "missing-structure"), true);

  fs.writeFileSync(path.join(root, `videos/${slug}/scene-script.md`), "# Scene Script\n\n## Scene 01｜测试\n\n没有结构字段。\n", "utf8");
  const sceneIssues = validateStage(loadFixture(slug), "scene-script");
  assert.equal(sceneIssues.some((item) => item.code === "missing-scene-field"), true);

  fs.writeFileSync(path.join(root, `videos/${slug}/visual-prototype.html`), "<main></main>\n", "utf8");
  const prototypeIssues = validateStage(loadFixture(slug), "visual-prototype");
  assert.equal(prototypeIssues.some((item) => item.code === "missing-prototype-scenes"), true);
  assert.equal(prototypeIssues.some((item) => item.code === "missing-prototype-controls"), true);
  assert.equal(prototypeIssues.some((item) => item.code === "missing-prototype-progress"), true);

  fs.writeFileSync(path.join(root, `src/videos/${slug}/video.config.ts`), "export const videoConfig = { width: 1080, height: 1920, fps: 24 };\n", "utf8");
  const remotionIssues = validateStage(loadFixture(slug), "remotion");
  assert.equal(remotionIssues.some((item) => item.code === "invalid-video-size"), true);
  assert.equal(remotionIssues.some((item) => item.code === "invalid-video-fps"), true);
  assert.equal(remotionIssues.some((item) => item.code === "missing-video-scenes"), true);
  assert.equal(remotionIssues.some((item) => item.code === "missing-resource-manifest"), true);
});

test("does not enter a Gate when its automatic checks fail", () => {
  const { slug } = createFixture();
  const project = loadFixture(slug);
  const prototypePath = path.join(project.config.workspaceRoot, `videos/${slug}/visual-prototype.html`);
  fs.writeFileSync(prototypePath, "<main></main>\n", "utf8");
  project.state.currentStage = "gate-2";
  for (const stage of ["source", "content-analysis", "video-narrative", "scene-script", "narration-script", "visual-script", "visual-prototype"]) {
    project.state.stages[stage].status = "succeeded";
  }
  project.state.stages["gate-2"].status = "ready";

  assert.throws(() => runStage(project, "gate-2"), /artifact validation issue\(s\) in gate-2/);
  assert.equal(loadFixture(slug).state.stages["gate-2"].status, "failed");
  assert.equal(loadFixture(slug).state.stages["gate-2"].error.code, "validation-failed");
});

test("passes read-only regression for four real videos without writing their directories", () => {
  const workspaceRoot = process.cwd();
  const slugs = ["claude-code-how-it-works", "claude-code-first-run", "claude-code-coding-plan", "claude-code-third-party-models"];
  for (const slug of slugs) {
    const roots = [path.join(workspaceRoot, "videos", slug), path.join(workspaceRoot, "src", "videos", slug)];
    const before = snapshotTree(roots);
    const project = {
      config: { slug, workspaceRoot, validationPolicy: "legacy" },
      artifacts: { stages: artifactManifestFor(slug) },
    };
    const issues = ["scene-script", "narration-script", "tts", "subtitle-timeline", "visual-prototype", "remotion"]
      .flatMap((stage) => validateProjectStage(project, stage));
    assert.equal(issues.filter((item) => item.severity === "error").length, 0, `${slug} has structural validation errors`);
    assert.deepEqual(snapshotTree(roots), before, `${slug} changed during read-only validation`);
  }
});

test("invalidates downstream stages when a succeeded artifact changes", () => {
  const { slug } = createFixture();
  const project = loadFixture(slug);
  runToGate3(project);
  approveGate(project, "gate-3");
  runStage(project, "smoke-render", { adapters: { "smoke-render": createMockAdapter() } });
  runStage(project, "render", { adapters: { render: createMockAdapter() } });
  runStage(project, "gate-4");
  approveGate(project, "gate-4");
  assert.equal(loadFixture(slug).state.currentStage, "completed");

  const sourcePath = path.join(project.config.workspaceRoot, `videos/${slug}/source.md`);
  fs.appendFileSync(sourcePath, "\nchanged\n", "utf8");

  const refreshed = loadFixture(slug).state;
  assert.equal(refreshed.currentStage, "source");
  assert.equal(refreshed.stages.source.status, "ready");
  assert.equal(refreshed.stages["content-analysis"].status, "invalidated");
  assert.equal(refreshed.stages["content-analysis"].invalidatedBy, "source");
  assert.equal(refreshed.stages["gate-4"].status, "invalidated");
});

test("reports the next action for a ready stage and a waiting Gate", () => {
  const { slug } = createFixture();
  const project = loadFixture(slug);
  assert.equal(buildNextAction(project).action, "run-stage");

  runToGate3(project);
  const gateAction = buildNextAction(loadFixture(slug));
  assert.equal(gateAction.currentStage, "gate-3");
  assert.equal(gateAction.action, "approve-or-reject-gate");
  assert.equal(gateAction.requiresUser, true);
  assert.equal(gateAction.manualChecks.length, 4);
  assert.equal(gateAction.recommendedReturnTo, "remotion");
  assert.deepEqual(gateAction.returnToStages, returnToStages("gate-3"));
  assert.deepEqual(gateAction.returnToStages.at(-1), { stage: "remotion", label: "Remotion 实现" });

  const report = buildProjectReport(loadFixture(slug));
  assert.equal(report.stages.length, 15);
  assert.equal(report.next.action, "approve-or-reject-gate");
});

test("allows a Remotion task to create its missing alignment output", () => {
  const { slug } = createFixture();
  const project = loadFixture(slug);
  for (const file of ["video.config.ts", "FixtureVideo.tsx"]) {
    fs.rmSync(path.join(project.config.workspaceRoot, "src", "videos", slug, file));
  }
  runToGate2(project);
  approveGate(project, "gate-2");
  runStage(project, "tts");
  runStage(project, "subtitle-timeline");

  const next = buildNextAction(loadFixture(slug));
  assert.equal(next.currentStage, "remotion");
  assert.equal(next.status, "ready");
  assert.equal(next.action, "run-stage");
  assert.equal(validateStage(loadFixture(slug), "remotion").some((issue) => issue.code === "missing-remotion-alignment"), true);
});

test("allows remote render preflight without a local MP4", () => {
  const { slug } = createFixture();
  const project = loadFixture(slug);
  runToGate3(project);
  approveGate(project, "gate-3");
  runStage(project, "smoke-render", { adapters: { "smoke-render": createMockAdapter() } });

  const next = buildNextAction(loadFixture(slug));
  assert.equal(next.currentStage, "render");
  assert.equal(next.action, "run-stage");
  assert.deepEqual(next.issues, []);
  assert.deepEqual(validateStage(loadFixture(slug), "render"), []);
});

function runToGate3(project) {
  runToGate2(project);
  approveGate(project, "gate-2");
  runStage(project, "tts");
  runStage(project, "subtitle-timeline");
  runStage(project, "remotion");
  runStage(project, "gate-3");
}

function runToGate2(project) {
  const preGateStages = [
    "source",
    "content-analysis",
    "video-narrative",
    "scene-script",
    "narration-script",
    "visual-script",
    "visual-prototype",
  ];
  for (const stage of preGateStages) {
    runStage(project, stage);
  }
  runStage(project, "gate-2");
}

test("completes the fixture workflow with mock adapters", () => {
  const { slug } = createFixture();
  const project = loadFixture(slug);
  runToGate3(project);
  approveGate(project, "gate-3");

  const smoke = createMockAdapter();
  runStage(project, "smoke-render", { adapters: { "smoke-render": smoke } });
  const render = createMockAdapter();
  runStage(project, "render", { adapters: { render } });
  runStage(project, "gate-4");
  approveGate(project, "gate-4");

  const finalState = loadFixture(slug).state;
  assert.equal(finalState.currentStage, "completed");
  assert.equal(finalState.stages["gate-4"].status, "succeeded");
  assert.equal(finalState.stages["gate-4"].review.decision, "approved");
  assert.ok(finalState.stages["gate-4"].review.reviewedAt);
  assert.deepEqual(smoke.calls, [{ stage: "smoke-render", slug }]);
  assert.deepEqual(render.calls, [{ stage: "render", slug }]);
});

test("resumes an adapter failure without repeating the failed attempt", () => {
  const { slug } = createFixture();
  const project = loadFixture(slug);
  runToGate3(project);
  approveGate(project, "gate-3");

  const adapter = createMockAdapter({ failOnce: true });
  assert.throws(() => runStage(project, "smoke-render", { adapters: { "smoke-render": adapter } }), /Mock adapter failure/);
  assert.equal(loadFixture(slug).state.stages["smoke-render"].status, "failed");
  assert.equal(loadFixture(slug).state.stages["smoke-render"].attempts, 1);

  assert.deepEqual(resumeProject(loadFixture(slug)), { stage: "smoke-render", status: "ready" });
  runStage(loadFixture(slug), "smoke-render", { adapters: { "smoke-render": adapter } });
  assert.equal(loadFixture(slug).state.stages["smoke-render"].status, "succeeded");
  assert.equal(adapter.calls.length, 2);
});

test("requires an explicit return stage when rejecting a Gate", () => {
  const { slug } = createFixture();
  const project = loadFixture(slug);
  runToGate3(project);

  rejectGate(project, "gate-3", "remotion", "visual mismatch");
  const state = loadFixture(slug).state;
  assert.equal(state.currentStage, "remotion");
  assert.equal(state.stages.remotion.status, "ready");
  assert.equal(state.stages["gate-3"].status, "pending");
  assert.equal(state.stages["gate-3"].error.message, "visual mismatch");
  assert.deepEqual(state.stages["gate-3"].review, {
    decision: "rejected",
    returnTo: "remotion",
    reason: "visual mismatch",
    reviewedAt: state.stages["gate-3"].review.reviewedAt,
  });
});

test("requires new Remotion output after Gate 3 rejection", async () => {
  const { slug } = createFixture();
  const project = loadFixture(slug);
  runToGate3(project);
  const previousFingerprint = loadFixture(slug).state.stages.remotion.outputFingerprint;

  rejectGate(loadFixture(slug), "gate-3", "remotion", "修复白屏和同步问题");
  const rejected = loadFixture(slug);
  assert.equal(rejected.state.stages.remotion.status, "ready");
  assert.equal(rejected.state.stages.remotion.invalidatedBy, "gate-3-rejected");
  assert.equal(rejected.state.stages.remotion.rebuildBaselineFingerprint, previousFingerprint);

  const task = ensureRemotionTask({ slug });
  const result = await runRemotionTask(task.id, {
    executor: { async run() { return { executor: "no-op" }; } },
  });
  assert.equal(result.completed, false);
  assert.equal(result.task.status, "blocked");
  assert.equal(result.task.error.code, "remotion-unchanged-after-gate-rejection");
  assert.equal(loadFixture(slug).state.currentStage, "remotion");
});

test("refreshes a retried Remotion task with the Gate 3 rejection request", async () => {
  const { slug } = createFixture();
  const project = loadFixture(slug);
  runToGate3(project);
  const previousFingerprint = loadFixture(slug).state.stages.remotion.outputFingerprint;

  rejectGate(loadFixture(slug), "gate-3", "remotion", "修复 Scene 01 的重叠并校准字幕入场时间");
  const task = ensureRemotionTask({ slug });
  const blocked = await runRemotionTask(task.id, { executor: { async run() {} } });
  assert.equal(blocked.task.status, "blocked");

  const retried = retryRemotionTask(task.id);
  assert.equal(retried.status, "ready");
  assert.deepEqual(retried.context.rebuildRequest, {
    gate: "gate-3",
    returnTo: "remotion",
    reason: "修复 Scene 01 的重叠并校准字幕入场时间",
    requirement: "必须针对上述驳回原因修改 Remotion 实现，并产生新的 Remotion 产物；不能只重新校验或原样返回现有文件。",
  });
  assert.match(retried.context.constraints.join("\n"), /Gate 3 驳回后的 Remotion 重制任务/);
  assert.equal(retried.context.prototypeBaseline.visualPrototype.fingerprint.length, 64);
  assert.equal(loadFixture(slug).state.stages.remotion.rebuildBaselineFingerprint, previousFingerprint);
});

test("completes a GitHub Actions run and records its artifact metadata", async () => {
  const { slug } = createFixture();
  const responses = [
    { status: 204, ok: true, text: async () => "" },
    {
      status: 200,
      ok: true,
      text: async () => JSON.stringify({
        workflow_runs: [{
          id: 123,
          head_branch: "feat/video-harness-v0.1",
          created_at: "2026-08-20T00:00:01.000Z",
          status: "queued",
          conclusion: null,
          html_url: "https://github.com/example/video/actions/runs/123",
        }],
      }),
    },
    {
      status: 200,
      ok: true,
      text: async () => JSON.stringify({
        id: 123,
        status: "completed",
        conclusion: "success",
        html_url: "https://github.com/example/video/actions/runs/123",
      }),
    },
    {
      status: 200,
      ok: true,
      text: async () => JSON.stringify({
        artifacts: [{ name: `${slug}-smoke-test`, id: 456, size_in_bytes: 789, expired: false }],
      }),
    },
  ];
  const calls = [];
  const adapter = createGitHubActionsAdapter({
    token: "test-token",
    repository: "example/video",
    ref: "feat/video-harness-v0.1",
    now: () => new Date("2026-08-20T00:00:00.000Z"),
    discoveryPollIntervalMs: 0,
    runPollIntervalMs: 0,
    sleepImpl: async () => {},
    fetchImpl: async (url, options) => {
      calls.push({ url, options });
      return responses.shift();
    },
  });

  const project = loadFixture(slug);
  const result = await adapter.run({ stage: "smoke-render", project });

  assert.equal(result.outputs[0].runId, 123);
  assert.deepEqual(result.outputs[0].artifacts, [{
    name: `${slug}-smoke-test`,
    id: 456,
    sizeInBytes: 789,
    expired: false,
    archiveDownloadUrl: undefined,
    createdAt: undefined,
    expiresAt: undefined,
  }]);
  assert.equal(result.outputs[0].artifactName, `${slug}-smoke-test`);
  assert.match(calls[0].url, /actions\/workflows\/smoke-test-video\.yml\/dispatches$/);
  assert.deepEqual(JSON.parse(calls[0].options.body), {
    ref: "feat/video-harness-v0.1",
    inputs: { video_slug: slug, composition_id: slug },
  });
  assert.equal(calls[0].options.headers.Authorization, "Bearer test-token");
});

test("rejects a successful GitHub Actions run without a usable artifact", async () => {
  const { slug } = createFixture();
  const responses = [
    { status: 204, ok: true, text: async () => "" },
    {
      status: 200,
      ok: true,
      text: async () => JSON.stringify({ workflow_runs: [{ id: 789, head_branch: "main", created_at: "2026-08-20T00:00:01.000Z" }] }),
    },
    {
      status: 200,
      ok: true,
      text: async () => JSON.stringify({ id: 789, status: "completed", conclusion: "success" }),
    },
    { status: 200, ok: true, text: async () => JSON.stringify({ artifacts: [] }) },
  ];
  const adapter = createGitHubActionsAdapter({
    token: "test-token",
    repository: "example/video",
    ref: "main",
    now: () => new Date("2026-08-20T00:00:00.000Z"),
    discoveryPollIntervalMs: 0,
    runPollIntervalMs: 0,
    sleepImpl: async () => {},
    fetchImpl: async () => responses.shift(),
  });

  await assert.rejects(() => adapter.run({ stage: "smoke-render", project: loadFixture(slug) }), /did not produce expected artifact/);
});

test("supports non-blocking remote inspection for recovery monitors", async () => {
  const { slug } = createFixture();
  const responses = [
    { status: 200, ok: true, text: async () => JSON.stringify({ id: 321, status: "in_progress", conclusion: null, html_url: "https://github.com/example/video/actions/runs/321" }) },
    { status: 200, ok: true, text: async () => JSON.stringify({ id: 321, status: "completed", conclusion: "success", html_url: "https://github.com/example/video/actions/runs/321" }) },
    { status: 200, ok: true, text: async () => JSON.stringify({ artifacts: [{ name: `${slug}-smoke-test`, id: 654, size_in_bytes: 100, expired: false }] }) },
  ];
  const adapter = createGitHubActionsAdapter({
    token: "test-token",
    repository: "example/video",
    ref: "main",
    fetchImpl: async () => responses.shift(),
  });
  const dispatch = {
    workflow: "smoke-test-video.yml",
    ref: "main",
    slug,
    compositionId: slug,
    dispatchedAt: "2026-08-20T00:00:00.000Z",
    runId: 321,
  };

  const running = await adapter.inspectRun({ stage: "smoke-render", dispatch, runId: 321 });
  assert.equal(running.status, "running");
  assert.equal(running.remote.runId, 321);

  const succeeded = await adapter.inspectRun({ stage: "smoke-render", dispatch, runId: 321 });
  assert.equal(succeeded.status, "succeeded");
  assert.equal(succeeded.result.outputs[0].artifacts[0].id, 654);
});

test("recovers the latest successful render by its matching Artifact", async () => {
  const { slug } = createFixture();
  const responses = [
    { status: 200, ok: true, text: async () => JSON.stringify({ workflow_runs: [] }) },
    {
      status: 200,
      ok: true,
      text: async () => JSON.stringify({
        workflow_runs: [{
          id: 999,
          head_branch: "main",
          created_at: "2026-08-22T00:00:01.000Z",
          status: "completed",
          conclusion: "success",
          html_url: "https://github.com/example/video/actions/runs/999",
        }],
      }),
    },
    {
      status: 200,
      ok: true,
      text: async () => JSON.stringify({
        artifacts: [{ name: slug, id: 777, size_in_bytes: 100, expired: false }],
      }),
    },
  ];
  const adapter = createGitHubActionsAdapter({
    token: "test-token",
    repository: "example/video",
    ref: "main",
    fetchImpl: async () => responses.shift(),
  });

  const inspection = await adapter.inspectRun({
    stage: "render",
    dispatch: {
      workflow: "render-video.yml",
      ref: "main",
      slug,
      compositionId: slug,
      dispatchedAt: "2026-08-23T00:00:00.000Z",
    },
    recoverExisting: true,
  });

  assert.equal(inspection.status, "succeeded");
  assert.equal(inspection.remote.runId, 999);
  assert.equal(inspection.result.outputs[0].artifactName, slug);
});

test("lists successful render Artifacts from other branches for explicit adoption", async () => {
  const { slug } = createFixture();
  const responses = [
    {
      status: 200,
      ok: true,
      text: async () => JSON.stringify({
        workflow_runs: [{
          id: 1001,
          head_branch: "feat/video-production-pending",
          created_at: "2026-08-21T15:14:30.000Z",
          status: "completed",
          conclusion: "success",
          html_url: "https://github.com/example/video/actions/runs/1001",
        }],
      }),
    },
    {
      status: 200,
      ok: true,
      text: async () => JSON.stringify({
        artifacts: [{ name: slug, id: 1002, size_in_bytes: 100, expired: false }],
      }),
    },
  ];
  const adapter = createGitHubActionsAdapter({
    token: "test-token",
    repository: "example/video",
    ref: "feat/video-harness-v0.5",
    fetchImpl: async (url) => {
      assert.doesNotMatch(url, /[?&]branch=/);
      return responses.shift();
    },
  });

  const candidates = await adapter.findSuccessfulRunsWithArtifactOnce({
    workflow: "render-video.yml",
    ref: "feat/video-harness-v0.5",
    slug,
    compositionId: slug,
    dispatchedAt: "2026-08-23T00:00:00.000Z",
  }, { anyBranch: true });

  assert.equal(candidates.length, 1);
  assert.equal(candidates[0].run.id, 1001);
  assert.equal(candidates[0].artifacts[0].name, slug);
});
