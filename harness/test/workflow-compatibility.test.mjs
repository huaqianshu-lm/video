import assert from "node:assert/strict";
import { execFileSync } from "node:child_process";
import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import test from "node:test";
import { buildTaskPacket } from "../src/context.mjs";
import { buildProjectPlan } from "../src/plans.mjs";
import { buildNextAction, buildProjectReport } from "../src/reports.mjs";
import {
  assetArchiveRelativePath,
  packageVideoAssets,
} from "../src/asset-bundler.mjs";
import {
  createStageState,
  createStagesState,
  DEFAULT_WORKFLOW_ID,
  GATE_STAGES,
  getWorkflowDefinition as getLegacyWorkflowDefinition,
  RETIRED_STAGE_DEFINITIONS,
  STAGE_DEFINITIONS,
  STAGES,
  stagesForProjectView,
  WORKFLOW_DEFINITIONS,
} from "../src/stages.mjs";
import {
  DEFAULT_WORKFLOW_ID as FORMAL_WORKFLOW_ID,
  LEGACY_WORKFLOW_ID,
  allWorkflowDefinitions,
  getWorkflowDefinition,
  requireWorkflowDefinition,
} from "../src/workflows/registry.mjs";
import { getVideoProject } from "../src/project-view.mjs";
import {
  initializeProject,
  loadProject,
  writeJson,
} from "../src/storage.mjs";
import {
  packageRenderInput,
  prepareRenderInput,
  renderInputDirectory,
  writeRenderEntryPoint,
} from "../src/render-input.mjs";

const repositoryRoot = path.resolve(new URL("../..", import.meta.url).pathname);
const cliPath = path.join(repositoryRoot, "harness/src/cli.mjs");
const ENVIRONMENT_KEYS = [
  "HARNESS_PROJECTS_DIR",
  "HARNESS_WORKSPACE_ROOT",
  "HARNESS_RENDER_INPUT_DIR",
  "HARNESS_SERIES_DIR",
  "HARNESS_SERIES_ASSETS_DIR",
];

function withHarnessEnvironment(root, callback) {
  const previous = Object.fromEntries(ENVIRONMENT_KEYS.map((key) => [key, process.env[key]]));
  process.env.HARNESS_PROJECTS_DIR = path.join(root, "projects");
  process.env.HARNESS_WORKSPACE_ROOT = path.join(root, "workspace");
  process.env.HARNESS_RENDER_INPUT_DIR = path.join(root, "render-input");
  process.env.HARNESS_SERIES_DIR = path.join(root, "series");
  process.env.HARNESS_SERIES_ASSETS_DIR = path.join(root, "series-assets");
  try {
    return callback({
      projectsRoot: process.env.HARNESS_PROJECTS_DIR,
      workspaceRoot: process.env.HARNESS_WORKSPACE_ROOT,
    });
  } finally {
    for (const key of ENVIRONMENT_KEYS) {
      if (previous[key] === undefined) delete process.env[key];
      else process.env[key] = previous[key];
    }
  }
}

function writeFile(root, relativePath, content) {
  const filePath = path.join(root, relativePath);
  fs.mkdirSync(path.dirname(filePath), { recursive: true });
  fs.writeFileSync(filePath, content, "utf8");
  return filePath;
}

function createLegacyProjectFixture(root, slug = "compatibility-video") {
  const workspaceRoot = path.join(root, "workspace");
  writeFile(workspaceRoot, `videos/${slug}/source.md`, "# Compatibility fixture\n");
  initializeProject(slug);
  return loadProject(slug, { refresh: false });
}

function runCli(args, environment) {
  return execFileSync(process.execPath, [cliPath, ...args], {
    cwd: repositoryRoot,
    env: { ...process.env, ...environment },
    encoding: "utf8",
  });
}

function createRenderInputFixture(root, slug = "compatibility-render") {
  const workspaceRoot = path.join(root, "workspace");
  writeFile(workspaceRoot, `videos/${slug}/source.md`, "# Render compatibility fixture\n");
  writeFile(workspaceRoot, `src/videos/${slug}/FixtureVideo.tsx`, "export const FixtureVideo = () => null;\n");
  writeFile(
    workspaceRoot,
    `src/videos/${slug}/video.config.ts`,
    `export const videoConfig = { slug: "${slug}", fps: 30, width: 1920, height: 1080 };\n`,
  );
  writeFile(
    workspaceRoot,
    `src/videos/${slug}/generated/audio-manifest.json`,
    JSON.stringify({
      videoId: slug,
      scenes: [{
        sceneId: "scene-01",
        segments: [{ id: "segment-01", file: "audio/scene-01/01-01.mp3" }],
      }],
    }) + "\n",
  );
  writeFile(
    workspaceRoot,
    `src/videos/${slug}/generated/subtitle-manifest.json`,
    JSON.stringify({
      videoId: slug,
      scenes: [{ sceneId: "scene-01", file: "subtitles/captions.vtt" }],
    }) + "\n",
  );
  writeFile(
    workspaceRoot,
    `src/videos/${slug}/generated/timeline-manifest.json`,
    JSON.stringify({ videoId: slug, scenes: [{ sceneId: "scene-01" }] }) + "\n",
  );
  writeFile(workspaceRoot, `public/local-assets/${slug}/audio/scene-01/01-01.mp3`, "audio\n");
  writeFile(workspaceRoot, `public/local-assets/${slug}/subtitles/captions.vtt`, "WEBVTT\n");
  writeFile(
    workspaceRoot,
    `public/local-assets/${slug}/subtitles/captions.srt`,
    "1\n00:00:00,000 --> 00:00:00,100\nFixture\n",
  );
  return { slug, workspaceRoot, project: { config: { slug, workspaceRoot } } };
}

test("keeps the legacy default workflow at the exact 14-stage snapshot", () => {
  const expectedStages = [
    "source",
    "content-analysis",
    "video-narrative",
    "scene-script",
    "narration-script",
    "visual-script",
    "visual-prototype",
    "gate-2",
    "tts",
    "subtitle-timeline",
    "remotion",
    "gate-3",
    "render",
    "gate-4",
  ];

  assert.deepEqual(STAGES, expectedStages);
  assert.deepEqual(Object.keys(createStagesState()), expectedStages);
  assert.deepEqual(Object.keys(STAGE_DEFINITIONS), expectedStages);
  assert.deepEqual(WORKFLOW_DEFINITIONS[DEFAULT_WORKFLOW_ID].stages, expectedStages);
  assert.deepEqual([...GATE_STAGES], ["gate-2", "gate-3", "gate-4"]);
  assert.equal(createStageState("source", 0).status, "ready");
  assert.equal(createStageState("content-analysis", 1).status, "pending");
  assert.equal(STAGE_DEFINITIONS.render.nextStage, "gate-4");
  assert.equal(STAGE_DEFINITIONS["gate-3"].fallbackStage, "remotion");
});

test("resolves the formal narrated Workflow through one Registry and fails closed for unknown versions", () => {
  assert.deepEqual(Object.keys(allWorkflowDefinitions()), [FORMAL_WORKFLOW_ID, "product-promo-v1"]);
  assert.equal(getWorkflowDefinition(FORMAL_WORKFLOW_ID).id, "narrated-tutorial-v1");
  assert.equal(getWorkflowDefinition(LEGACY_WORKFLOW_ID).id, "narrated-tutorial-v1");
  assert.equal(getWorkflowDefinition(undefined).id, "narrated-tutorial-v1");
  assert.equal(requireWorkflowDefinition({ workflow: LEGACY_WORKFLOW_ID, workflowVersion: 1 }).id, "narrated-tutorial-v1");
  assert.throws(
    () => requireWorkflowDefinition({ workflow: "unknown-workflow", workflowVersion: 1 }),
    (error) => error.code === "unknown-workflow",
  );
  assert.throws(
    () => requireWorkflowDefinition({ workflow: FORMAL_WORKFLOW_ID }),
    (error) => error.code === "workflow-version-missing",
  );
});

test("keeps the retired Smoke Render record as a read-only display projection", () => {
  const stages = Object.fromEntries([
    ...STAGES,
    "smoke-render",
  ].map((stage, index) => [stage, {
    stage,
    status: stage === "smoke-render" ? "ready" : "succeeded",
    order: index,
    attempts: 0,
    outputs: [],
    review: null,
    error: null,
    invalidatedBy: null,
    updatedAt: null,
  }]));
  const project = {
    config: { workflow: DEFAULT_WORKFLOW_ID, workflowVersion: 1 },
    state: { slug: "legacy-smoke", currentStage: "smoke-render", stages },
    artifacts: { stages: {} },
  };

  const displayStages = stagesForProjectView(project);
  const next = buildNextAction(project);
  const report = buildProjectReport(project);
  assert.equal(displayStages.length, 15);
  assert.equal(displayStages[12], "smoke-render");
  assert.equal(RETIRED_STAGE_DEFINITIONS["smoke-render"].kind, "retired");
  assert.equal(next.action, "inspect");
  assert.equal(next.readOnly, true);
  assert.equal(next.legacy, true);
  assert.equal(report.next.readOnly, true);
});

test("interprets a missing workflow as the legacy default without changing persisted config", () => {
  const root = fs.mkdtempSync(path.join(os.tmpdir(), "video-workflow-missing-"));
  try {
    withHarnessEnvironment(root, ({ workspaceRoot }) => {
      const project = createLegacyProjectFixture(root, "missing-workflow");
      delete project.config.workflow;
      writeJson(project.files.config, project.config);

      const reloaded = loadProject("missing-workflow", { refresh: false });
      const effective = getLegacyWorkflowDefinition(reloaded.config.workflow);
      const packet = buildTaskPacket(reloaded);
      assert.equal(effective, WORKFLOW_DEFINITIONS[DEFAULT_WORKFLOW_ID]);
      assert.equal(packet.project.workflow, undefined);
      assert.equal(packet.task.stage, "source");
      assert.equal(reloaded.config.sourceDirectory, "videos/missing-workflow");
      assert.equal(workspaceRoot, reloaded.config.workspaceRoot);
      assert.equal(reloaded.config.workflow, undefined);
    });
  } finally {
    fs.rmSync(root, { recursive: true, force: true });
  }
});

test("keeps CLI next, report, context, and plan outputs on the legacy contract", () => {
  const root = fs.mkdtempSync(path.join(os.tmpdir(), "video-workflow-cli-"));
  try {
    withHarnessEnvironment(root, ({ projectsRoot, workspaceRoot }) => {
      const project = createLegacyProjectFixture(root, "cli-compatibility");
      const environment = {
        HARNESS_PROJECTS_DIR: projectsRoot,
        HARNESS_WORKSPACE_ROOT: workspaceRoot,
      };
      const next = JSON.parse(runCli(["next", project.state.slug, "--json"], environment));
      const report = JSON.parse(runCli(["report", project.state.slug, "--json"], environment));
      const context = JSON.parse(runCli(["context", project.state.slug], environment));
      const plan = JSON.parse(runCli(["plan", project.state.slug, "--until", "visual-prototype", "--json"], environment));

      assert.deepEqual({
        currentStage: next.currentStage,
        status: next.status,
        action: next.action,
      }, { currentStage: "source", status: "ready", action: "run-stage" });
      assert.equal(report.schemaVersion, 1);
      assert.equal(report.currentStage, "source");
      assert.equal(report.stages.length, 14);
      assert.equal(context.kind, "video-stage-task");
      assert.equal(context.project.currentStage, "source");
      assert.equal(context.task.stage, "source");
      assert.deepEqual(context.context.readPaths, []);
      assert.deepEqual(context.context.writePaths, ["videos/cli-compatibility/source.md"]);
      assert.equal(plan.target.stage, "visual-prototype");
      assert.equal(plan.target.order, 6);
      assert.deepEqual(plan.stages.map((item) => item.stage), STAGES.slice(0, 7));
    });
  } finally {
    fs.rmSync(root, { recursive: true, force: true });
  }
});

test("keeps the Web UI project projection at 14 stages for a legacy project", () => {
  const root = fs.mkdtempSync(path.join(os.tmpdir(), "video-workflow-project-view-"));
  try {
    withHarnessEnvironment(root, () => {
      const project = createLegacyProjectFixture(root, "project-view-compatibility");
      const view = getVideoProject(project.state.slug);
      assert.equal(view.initialized, true);
      assert.equal(view.currentStage, "source");
      assert.equal(view.stageCount, 14);
      assert.equal(view.stages.length, 14);
      assert.deepEqual(view.stages.map((stage) => stage.stage), STAGES);
      assert.equal(view.sourceDirectory, "videos/project-view-compatibility");
      assert.equal(view.remotionDirectory, "src/videos/project-view-compatibility");
    });
  } finally {
    fs.rmSync(root, { recursive: true, force: true });
  }
});

test("keeps narrated asset, isolated input, and temporary Studio entry contracts", () => {
  const root = fs.mkdtempSync(path.join(os.tmpdir(), "video-workflow-render-input-"));
  try {
    withHarnessEnvironment(root, ({ workspaceRoot }) => {
      const fixture = createRenderInputFixture(root);
      const assetResult = packageVideoAssets(fixture.project);
      assert.equal(assetResult.archiveRelativePath, "assets/compatibility-render-assets.zip");
      assert.equal(assetArchiveRelativePath(fixture.project), "assets/compatibility-render-assets.zip");

      const prepared = prepareRenderInput(fixture.project);
      const packaged = packageRenderInput(workspaceRoot, fixture.slug);
      const manifest = JSON.parse(fs.readFileSync(path.join(prepared.directory, "render-input.json"), "utf8"));
      assert.equal(prepared.status, "prepared");
      assert.equal(renderInputDirectory(workspaceRoot, fixture.slug), prepared.directory);
      assert.deepEqual(manifest.payload, {
        sourceDirectory: "videos/compatibility-render",
        remotionDirectory: "src/videos/compatibility-render",
        assetArchive: "assets/compatibility-render-assets.zip",
      });
      assert.equal(
        packaged.archivePath,
        path.join(root, "render-input", "compatibility-render.zip"),
      );
      assert.match(packaged.archiveSha256, /^[a-f0-9]{64}$/);

      const entryPath = path.join(workspaceRoot, "src", "RenderInputRoot.tsx");
      const entry = writeRenderEntryPoint(path.join(prepared.directory, "render-input.json"), entryPath);
      const entrySource = fs.readFileSync(entryPath, "utf8");
      assert.equal(entry.compositionId, "compatibility-render");
      assert.match(entrySource, /\.\/videos\/compatibility-render\/FixtureVideo/);
      assert.match(entrySource, /\.\/videos\/compatibility-render\/video\.config/);
      assert.equal(fs.existsSync(path.join(workspaceRoot, "src", "Root.tsx")), false);
    });
  } finally {
    fs.rmSync(root, { recursive: true, force: true });
  }
});

test("keeps concrete video paths out of the tracked capability repository", () => {
  const tracked = execFileSync("git", [
    "ls-files",
    "--",
    "videos/**",
    "src/videos/**",
    "assets/**",
    "series/**",
    "local/**",
    "out/**",
  ], { cwd: repositoryRoot, encoding: "utf8" });
  assert.equal(tracked, "");

  const rootSource = fs.readFileSync(path.join(repositoryRoot, "src/Root.tsx"), "utf8");
  assert.match(rootSource, /TemplateVideo/);
  assert.doesNotMatch(rootSource, /src\/videos|videos\//);
});
