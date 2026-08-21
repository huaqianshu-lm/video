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
import { initializeProject, loadProject } from "../src/storage.mjs";
import { approveGate, rejectGate, resumeProject, runStage, validateStage } from "../src/runner.mjs";
import {
  ADAPTER_REQUIRED_STAGES,
  DEFAULT_WORKFLOW_ID,
  GATE_STAGES,
  STAGE_DEFINITIONS,
  STAGES,
  WORKFLOW_DEFINITIONS,
} from "../src/stages.mjs";
import { validateProjectStage } from "../src/validation.mjs";

const repositoryRoot = path.resolve(new URL("../..", import.meta.url).pathname);

function createFixture() {
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
  initializeProject(slug);
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
  const { slug } = createFixture();
  const project = loadFixture(slug);
  assert.equal(project.config.workflow, "default");
  assert.equal(project.config.workflowVersion, 1);
  assert.equal(project.config.style, "current");
  assert.equal(project.config.target, "gate-4");
  assert.equal(project.config.harnessVersion, "0.4.0");
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
      harnessVersion: "0.4.0",
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
  assert.equal(gateAction.manualChecks.length, 3);

  const report = buildProjectReport(loadFixture(slug));
  assert.equal(report.stages.length, 15);
  assert.equal(report.next.action, "approve-or-reject-gate");
});

function runToGate3(project) {
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
  approveGate(project, "gate-2");
  runStage(project, "tts");
  runStage(project, "subtitle-timeline");
  runStage(project, "remotion");
  runStage(project, "gate-3");
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
