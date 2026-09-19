import assert from "node:assert/strict";
import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import test from "node:test";
import { approveGate, rejectGate, runStage, validateStage } from "../src/runner.mjs";
import { getVideoProject } from "../src/project-view.mjs";
import { buildAlignmentView } from "../src/remotion-alignment.mjs";
import { prepareRenderInput, prepareRenderInputEntry, packageRenderInput, validateCurrentRenderInput, validateRenderInputDirectory } from "../src/render-input.mjs";
import { validateRemoteRenderInputs } from "../src/remote-executor.mjs";
import { initializeProject, loadProject } from "../src/storage.mjs";
import { getWorkflowDefinition, requireWorkflowDefinition, workflowPaths, workflowStages } from "../src/workflows/registry.mjs";

const ENVIRONMENT_KEYS = [
  "HARNESS_PROJECTS_DIR",
  "HARNESS_WORKSPACE_ROOT",
  "HARNESS_RENDER_INPUT_DIR",
  "HARNESS_SERIES_DIR",
  "HARNESS_SERIES_ASSETS_DIR",
];

function withEnvironment(root, callback) {
  const previous = Object.fromEntries(ENVIRONMENT_KEYS.map((key) => [key, process.env[key]]));
  process.env.HARNESS_PROJECTS_DIR = path.join(root, "projects");
  process.env.HARNESS_WORKSPACE_ROOT = path.join(root, "workspace");
  process.env.HARNESS_RENDER_INPUT_DIR = path.join(root, "render-input");
  process.env.HARNESS_SERIES_DIR = path.join(root, "series");
  process.env.HARNESS_SERIES_ASSETS_DIR = path.join(root, "series-assets");
  try {
    return callback({ workspaceRoot: process.env.HARNESS_WORKSPACE_ROOT });
  } finally {
    for (const key of ENVIRONMENT_KEYS) {
      if (previous[key] === undefined) delete process.env[key];
      else process.env[key] = previous[key];
    }
  }
}

function write(root, relativePath, content) {
  const filePath = path.join(root, relativePath);
  fs.mkdirSync(path.dirname(filePath), { recursive: true });
  fs.writeFileSync(filePath, content, "utf8");
  return filePath;
}

function sceneScript() {
  return [1, 2, 3, 4].map((number) => `## Scene ${String(number).padStart(2, "0")}：Scene ${number}
sceneId: scene-${String(number).padStart(2, "0")}
title: Scene ${number}
purpose: 让受众理解第 ${number} 个传播任务
narrativeRole: 推进产品证明
visualIntent: 通过状态变化证明产品价值
visualType: UI Simulation
keyOnScreenText: screen-${String(number).padStart(2, "0")}: 受资料支持的短文案
videoValue: 用时间和运动展示状态变化
evidence: 产品资料中的界面和能力记录
`).join("\n");
}

function visualScript() {
  return [1, 2, 3, 4].map((number) => `## Scene ${String(number).padStart(2, "0")}：Scene ${number}
sceneId: scene-${String(number).padStart(2, "0")}
visualIntent: 通过界面状态变化证明产品价值
visualEvents: 出现、聚焦、状态改变
screenText: screen-${String(number).padStart(2, "0")}: 受资料支持的短文案
assets: asset-${number}
videoValue: 运动过程比静态画面更能证明这一点
`).join("\n");
}

function prototype() {
  const scenes = [1, 2, 3, 4].map((number) => `<section class="scene" data-scene="scene-${String(number).padStart(2, "0")}"><span class="eyebrow">SCENE ${String(number).padStart(2, "0")}</span><h1>Scene ${number}</h1><div class="content">状态变化</div></section>`).join("\n");
  return `<!doctype html><html><head><style>
.shell{width:min(1420px,96vw)} .toolbar{margin-bottom:14px} .stage{aspect-ratio:16 / 9} .scene{padding:5.2% 6% 13.8%} .caption{left:8%;right:8%;bottom:4.2%} .progress{display:flex} .meta{display:flex;justify-content:space-between}
</style></head><body><main class="shell"><header class="toolbar"><span>Promo</span><div class="controls"><button>上一幕</button><button>下一幕</button><button>自动播放</button></div></header><div class="stage">${scenes}<div class="caption">当前节奏</div></div><div class="progress"><button>1</button></div><div class="meta"><span>Scene 01</span><span>4</span></div></main></body></html>`;
}

function makeFixture(root, slug = "promo-fixture") {
  const { workspaceRoot } = { workspaceRoot: path.join(root, "workspace") };
  const base = `videos/product-promo/${slug}`;
  write(workspaceRoot, `${base}/source.md`, `# 产品资料
产品名称：Promo Fixture
一句话定义：用清晰界面表达产品价值
目标受众：需要快速理解产品的访客
核心价值：让价值被看见
CTA：访问产品入口
素材：Logo、界面截图、结果图
来源：用户提供的本地测试资料，授权状态已确认
`);
  initializeProject(slug, { workflow: "product-promo-v1", workflowVersion: 1 });
  write(workspaceRoot, `${base}/promo-brief.md`, `# Promo Brief
目标受众：需要快速理解产品的访客
观看平台：网站首页和社交平台
传播目标：让观众记住产品价值
核心价值：让价值被看见
核心卖点：可演示的界面状态变化
CTA：访问产品入口
时长：20～30 秒
不可说：未确认的数据和承诺
`);
  write(workspaceRoot, `${base}/creative-concept.md`, `# Creative Concept
开头钩子：用状态变化制造注意力
核心视觉概念：从问题到结果的界面聚焦
叙事节奏：钩子、产品、证明、结果、CTA
视觉证明方式：界面操作和状态变化
动效边界：动效只用于传递信息
素材路线：使用已登记的本地素材
音乐：暂不使用音乐和音效
`);
  write(workspaceRoot, `${base}/scene-script.md`, sceneScript());
  write(workspaceRoot, `${base}/visual-script.md`, visualScript());
  write(workspaceRoot, `${base}/motion-prototype.html`, prototype());
  for (const [index, name] of ["logo.svg", "dashboard.png", "result.png", "cta.png"].entries()) {
    write(workspaceRoot, `public/local-assets/${slug}/${name}`, `fixture-asset-${index}\n`);
  }
  write(workspaceRoot, `${base}/asset-manifest.json`, JSON.stringify({
    schemaVersion: 1,
    slug,
    assets: [
      { id: "asset-1", path: "logo.svg", type: "logo", source: "用户提供 Logo", scenes: ["scene-01"] },
      { id: "asset-2", path: "dashboard.png", type: "screenshot", source: "用户提供界面截图", scenes: ["scene-02"] },
      { id: "asset-3", path: "result.png", type: "image", source: "用户提供结果图", scenes: ["scene-03"] },
      { id: "asset-4", path: "cta.png", type: "image", source: "用户提供 CTA 画面", scenes: ["scene-04"] },
    ],
  }, null, 2) + "\n");
  write(workspaceRoot, `${base}/visual-timeline.json`, JSON.stringify({
    schemaVersion: 1,
    slug,
    fps: 30,
    width: 1920,
    height: 1080,
    durationInFrames: 600,
    scenes: [1, 2, 3, 4].map((number) => {
      const startFrame = (number - 1) * 150;
      const sceneId = `scene-${String(number).padStart(2, "0")}`;
      return {
        sceneId,
        startFrame,
        endFrame: startFrame + 150,
        assetIds: [`asset-${number}`],
        screenTextIds: [`screen-${String(number).padStart(2, "0")}`],
        beats: [
          { id: `beat-${number}-a`, startFrame, endFrame: startFrame + 75, event: "出现", assetIds: [`asset-${number}`], screenTextIds: [`screen-${String(number).padStart(2, "0")}`] },
          { id: `beat-${number}-b`, startFrame: startFrame + 75, endFrame: startFrame + 150, event: "状态改变", assetIds: [`asset-${number}`], screenTextIds: [`screen-${String(number).padStart(2, "0")}`] },
        ],
        transitions: number < 4 ? [{ id: `transition-${number}`, atFrame: startFrame + 145, type: "cut" }] : [],
      };
    }),
    audio: { music: [], sfx: [] },
  }, null, 2) + "\n");
  return loadProject(slug, { refresh: false });
}

test("registers the promo Workflow with namespaced paths and exact stages", () => {
  const definition = getWorkflowDefinition("product-promo-v1");
  assert.equal(definition.id, "product-promo-v1");
  assert.equal(definition.pathMode, "namespaced");
  assert.deepEqual([...workflowStages({ config: { workflow: definition.id, workflowVersion: 1 } })], [
    "source", "promo-brief", "creative-concept", "scene-script", "visual-script", "motion-prototype", "gate-2",
    "asset-preparation", "visual-timeline", "remotion", "gate-3", "render", "gate-4",
  ]);
  assert.deepEqual(workflowPaths({ config: { workflow: definition.id, workflowVersion: 1, slug: "launch" } }), {
    sourceDirectory: "videos/product-promo/launch",
    remotionDirectory: "src/videos/product-promo/launch",
    assetArchive: "assets/product-promo/launch-assets.zip",
    renderInputDirectory: "local/render-input/launch",
    renderOutput: "out/launch.mp4",
  });
});

test("runs the promo fixture to Gate 2 without creating any TTS stage or artifact", () => {
  const root = fs.mkdtempSync(path.join(os.tmpdir(), "video-promo-workflow-"));
  withEnvironment(root, ({ workspaceRoot }) => {
    const slug = "promo-fixture";
    let project = makeFixture(root, slug);
    for (const stage of ["source", "promo-brief", "creative-concept", "scene-script", "visual-script", "motion-prototype"]) {
      const result = runStage(project, stage);
      assert.equal(result.status, "succeeded");
      project = loadProject(slug, { refresh: false });
    }
    assert.deepEqual(validateStage(project, "gate-2"), []);
    assert.equal(runStage(project, "gate-2").status, "waiting");
    project = loadProject(slug, { refresh: false });
    const approval = approveGate(project, "gate-2");
    assert.equal(approval.nextStage, "asset-preparation");
    project = loadProject(slug, { refresh: false });
    assert.equal(project.config.workflow, "product-promo-v1");
    assert.equal(project.state.currentStage, "asset-preparation");
    assert.deepEqual(Object.keys(project.state.stages), workflowStages(project));
    assert.equal(fs.existsSync(path.join(workspaceRoot, `videos/${slug}/tts-script.json`)), false);
    assert.equal(fs.existsSync(path.join(workspaceRoot, `videos/product-promo/${slug}/narration-script.md`)), false);
    const view = getVideoProject(slug);
    assert.equal(view.workflow, "product-promo-v1");
    assert.equal(view.stageCount, 13);
    assert.equal(view.stages.some((stage) => stage.stage === "tts"), false);
    assert.equal(view.next.currentStage, "asset-preparation");
  });
});

test("returns a promo project to the selected Gate 2 stage without crossing Workflow boundaries", () => {
  const root = fs.mkdtempSync(path.join(os.tmpdir(), "video-promo-gate-rejection-"));
  withEnvironment(root, () => {
    const slug = "promo-gate-rejection";
    let project = makeFixture(root, slug);
    for (const stage of ["source", "promo-brief", "creative-concept", "scene-script", "visual-script", "motion-prototype"]) {
      assert.equal(runStage(project, stage).status, "succeeded");
      project = loadProject(slug, { refresh: false });
    }
    assert.equal(runStage(project, "gate-2").status, "waiting");
    project = loadProject(slug, { refresh: false });
    const result = rejectGate(project, "gate-2", "visual-script", "需要重新调整宣传片视觉证明方式");
    assert.equal(result.returnTo, "visual-script");
    project = loadProject(slug, { refresh: false });
    assert.equal(project.state.currentStage, "visual-script");
    assert.equal(project.state.stages["visual-script"].status, "ready");
    assert.equal(project.state.stages["motion-prototype"].status, "pending");
    assert.equal(project.state.stages["gate-2"].review.decision, "rejected");
    assert.equal(Object.hasOwn(project.state.stages, "subtitle-timeline"), false);
  });
});

test("runs a promo project from Gate 2 through Gate 3 without entering narrated stages", () => {
  const root = fs.mkdtempSync(path.join(os.tmpdir(), "video-promo-gate3-"));
  withEnvironment(root, ({ workspaceRoot }) => {
    const slug = "promo-gate3";
    let project = makeFixture(root, slug);
    for (const stage of ["source", "promo-brief", "creative-concept", "scene-script", "visual-script", "motion-prototype"]) {
      assert.equal(runStage(project, stage).status, "succeeded");
      project = loadProject(slug, { refresh: false });
    }
    assert.equal(runStage(project, "gate-2").status, "waiting");
    project = loadProject(slug, { refresh: false });
    assert.equal(approveGate(project, "gate-2").nextStage, "asset-preparation");
    project = loadProject(slug, { refresh: false });
    assert.equal(runStage(project, "asset-preparation").nextStage, "visual-timeline");
    project = loadProject(slug, { refresh: false });
    assert.equal(runStage(project, "visual-timeline").nextStage, "remotion");

    const base = `videos/product-promo/${slug}`;
    const remotionBase = `src/videos/product-promo/${slug}`;
    write(workspaceRoot, `${remotionBase}/PromoVideo.tsx`, "export const PromoVideo = () => null;\n");
    write(workspaceRoot, `${remotionBase}/video.config.ts`, `import visualTimeline from '../../../../videos/product-promo/${slug}/visual-timeline.json';\nexport const videoConfig = {slug: '${slug}', fps: 30, width: 1920, height: 1080};\nexport const TotalDurationFrames = () => visualTimeline.durationInFrames;\n`);
    project = loadProject(slug, { refresh: false });
    const baseline = JSON.parse(fs.readFileSync(path.join(project.files.directory, "prototype-baseline.json"), "utf8"));
    const timeline = JSON.parse(fs.readFileSync(path.join(workspaceRoot, `${base}/visual-timeline.json`), "utf8"));
    write(workspaceRoot, `${remotionBase}/remotion-alignment.json`, `${JSON.stringify({
      schemaVersion: 1,
      slug,
      timelinePath: `${base}/visual-timeline.json`,
      visualScriptFingerprint: baseline.visualScript.fingerprint,
      prototypeFingerprint: baseline.visualPrototype.fingerprint,
      scenes: timeline.scenes.map((scene) => ({
        sceneId: scene.sceneId,
        startFrame: scene.startFrame,
        endFrame: scene.endFrame,
        assetIds: scene.assetIds,
        beats: scene.beats.map((beat) => ({beatId: beat.id})),
        transitions: scene.transitions.map((transition) => ({transitionId: transition.id})),
        screenText: scene.screenTextIds.map((id) => ({id, text: `text-${id}`})),
        implementationFiles: [`${remotionBase}/PromoVideo.tsx`],
      })),
    }, null, 2)}\n`);
    project = loadProject(slug, { refresh: false });
    prepareRenderInputEntry(project);
    project = loadProject(slug, { refresh: false });
    assert.equal(runStage(project, "remotion").nextStage, "gate-3");
    project = loadProject(slug, { refresh: false });
    assert.equal(runStage(project, "gate-3").status, "waiting");
    project = loadProject(slug, { refresh: false });
    assert.equal(approveGate(project, "gate-3").nextStage, "render");
    project = loadProject(slug, { refresh: false });
    assert.equal(project.state.currentStage, "render");
    assert.equal(Object.hasOwn(project.state.stages, "tts"), false);
    assert.equal(Object.hasOwn(project.state.stages, "subtitle-timeline"), false);
  });
});

test("blocks promo assets, timeline gaps, narrated artifacts, and unknown workflow fallback", () => {
  const root = fs.mkdtempSync(path.join(os.tmpdir(), "video-promo-validation-"));
  withEnvironment(root, () => {
    const slug = "promo-validation";
    const project = makeFixture(root, slug);
    assert.throws(() => requireWorkflowDefinition({ workflow: "does-not-exist", workflowVersion: 1 }), (error) => error.code === "unknown-workflow");
    write(project.config.workspaceRoot, `videos/product-promo/${slug}/tts-script.json`, "{}\n");
    let issues = validateStage(project, "source");
    assert.equal(issues.some((item) => item.code === "promo-forbidden-narrated-artifact"), true);
    fs.rmSync(path.join(project.config.workspaceRoot, `videos/product-promo/${slug}/tts-script.json`));
    const timelinePath = path.join(project.config.workspaceRoot, `videos/product-promo/${slug}/visual-timeline.json`);
    const timeline = JSON.parse(fs.readFileSync(timelinePath, "utf8"));
    timeline.scenes[1].startFrame = 151;
    fs.writeFileSync(timelinePath, `${JSON.stringify(timeline)}\n`, "utf8");
    issues = validateStage(project, "visual-timeline");
    assert.equal(issues.some((item) => item.code === "promo-timeline-gap-or-overlap"), true);
    const manifestPath = path.join(project.config.workspaceRoot, `videos/product-promo/${slug}/asset-manifest.json`);
    const manifest = JSON.parse(fs.readFileSync(manifestPath, "utf8"));
    manifest.assets[0].path = "https://example.com/logo.svg";
    fs.writeFileSync(manifestPath, `${JSON.stringify(manifest)}\n`, "utf8");
    issues = validateStage(project, "asset-preparation");
    assert.equal(issues.some((item) => item.code === "invalid-promo-asset-path"), true);
  });
});

test("prepares a namespaced promo asset archive and isolated Render Input without narrated requirements", () => {
  const root = fs.mkdtempSync(path.join(os.tmpdir(), "video-promo-render-input-"));
  withEnvironment(root, ({ workspaceRoot }) => {
    const slug = "promo-render-input";
    makeFixture(root, slug);
    write(workspaceRoot, `videos/product-promo/${slug}/visual-timeline.json`, fs.readFileSync(path.join(workspaceRoot, `videos/product-promo/${slug}/visual-timeline.json`), "utf8"));
    write(workspaceRoot, `src/videos/product-promo/${slug}/PromoVideo.tsx`, "export const PromoVideo = () => null;\n");
    write(workspaceRoot, `src/videos/product-promo/${slug}/video.config.ts`, `import visualTimeline from '../../../../videos/product-promo/${slug}/visual-timeline.json';\nexport const videoConfig = {slug: 'promo-render-input', fps: 30, width: 1920, height: 1080};\nexport const TotalDurationFrames = () => visualTimeline.durationInFrames;\n`);
    const project = loadProject(slug, { refresh: false });
    const prepared = prepareRenderInput(project);
    assert.equal(prepared.manifest.workflow, "product-promo-v1");
    assert.equal(prepared.manifest.payload.sourceDirectory, `videos/product-promo/${slug}`);
    assert.equal(prepared.manifest.payload.remotionDirectory, `src/videos/product-promo/${slug}`);
    assert.equal(prepared.manifest.payload.assetArchive, `assets/product-promo/${slug}-assets.zip`);
    assert.deepEqual(validateRenderInputDirectory(prepared.directory, { expectedSlug: slug }), []);
    assert.deepEqual(validateCurrentRenderInput(project), []);
    assert.deepEqual(validateRemoteRenderInputs(project), []);
    const packaged = packageRenderInput(workspaceRoot, slug);
    assert.match(packaged.archiveSha256, /^[a-f0-9]{64}$/);
    assert.deepEqual(validateRemoteRenderInputs(project), []);
  });
});

test("validates the promo Remotion alignment against the frozen prototype and Visual Timeline", () => {
  const root = fs.mkdtempSync(path.join(os.tmpdir(), "video-promo-remotion-"));
  withEnvironment(root, ({ workspaceRoot }) => {
    const slug = "promo-remotion-contract";
    let project = makeFixture(root, slug);
    for (const stage of ["source", "promo-brief", "creative-concept", "scene-script", "visual-script", "motion-prototype"]) {
      assert.equal(runStage(project, stage).status, "succeeded");
      project = loadProject(slug, { refresh: false });
    }
    assert.equal(runStage(project, "gate-2").status, "waiting");
    project = loadProject(slug, { refresh: false });
    assert.equal(approveGate(project, "gate-2").nextStage, "asset-preparation");

    const base = `videos/product-promo/${slug}`;
    const remotionBase = `src/videos/product-promo/${slug}`;
    write(workspaceRoot, `${remotionBase}/PromoVideo.tsx`, "export const PromoVideo = () => null;\n");
    write(workspaceRoot, `${remotionBase}/video.config.ts`, `import visualTimeline from '../../../../videos/product-promo/${slug}/visual-timeline.json';\nexport const videoConfig = {slug: '${slug}', fps: 30, width: 1920, height: 1080};\nexport const TotalDurationFrames = () => visualTimeline.durationInFrames;\n`);
    project = loadProject(slug, { refresh: false });
    const baseline = JSON.parse(fs.readFileSync(path.join(project.files.directory, "prototype-baseline.json"), "utf8"));
    const timeline = JSON.parse(fs.readFileSync(path.join(workspaceRoot, `${base}/visual-timeline.json`), "utf8"));
    const alignment = {
      schemaVersion: 1,
      slug,
      timelinePath: `${base}/visual-timeline.json`,
      visualScriptFingerprint: baseline.visualScript.fingerprint,
      prototypeFingerprint: baseline.visualPrototype.fingerprint,
      scenes: timeline.scenes.map((scene) => ({
        sceneId: scene.sceneId,
        startFrame: scene.startFrame,
        endFrame: scene.endFrame,
        assetIds: scene.assetIds,
        beats: scene.beats.map((beat) => ({ beatId: beat.id })),
        transitions: scene.transitions.map((transition) => ({ transitionId: transition.id })),
        screenText: scene.screenTextIds.map((id) => ({ id, text: `text-${id}` })),
        implementationFiles: [`${remotionBase}/PromoVideo.tsx`],
      })),
    };
    write(workspaceRoot, `${remotionBase}/remotion-alignment.json`, `${JSON.stringify(alignment, null, 2)}\n`);
    project = loadProject(slug, { refresh: false });
    prepareRenderInputEntry(project);
    project = loadProject(slug, { refresh: false });
    assert.deepEqual(validateStage(project, "remotion"), []);
    assert.deepEqual(buildAlignmentView(project).issues, []);

    fs.rmSync(path.join(workspaceRoot, "src", "RenderInputRoot.tsx"));
    project = loadProject(slug, { refresh: false });
    assert.equal(validateStage(project, "remotion").some((item) => item.code === "render-input-entry-missing"), true);
    prepareRenderInputEntry(project);

    write(workspaceRoot, `${remotionBase}/video.config.ts`, `import visualTimeline from '../../../../videos/product-promo/${slug}/visual-timeline.json';
export const videoConfig = {slug: '${slug}', fps: 30, width: 1920, height: 1080};
const unusedDuration = visualTimeline.durationInFrames;
export const TotalDurationFrames = () => 600; // visualTimeline.durationInFrames
`);
    project = loadProject(slug, { refresh: false });
    assert.equal(validateStage(project, "remotion").some((item) => item.code === "promo-remotion-timeline-source-missing"), true);
    assert.throws(() => prepareRenderInputEntry(project), (error) => error.code === "render-input-validation-failed");

    write(workspaceRoot, `${remotionBase}/video.config.ts`, `import visualTimeline from '../../../../videos/product-promo/${slug}/visual-timeline.json';
export const videoConfig = {slug: '${slug}', fps: 30, width: 1920, height: 1080};
export const TotalDurationFrames = () => visualTimeline.durationInFrames;
`);
    project = loadProject(slug, { refresh: false });
    prepareRenderInputEntry(project);
    project = loadProject(slug, { refresh: false });

    alignment.scenes[0].implementationFiles = ["../outside.tsx"];
    write(workspaceRoot, `${remotionBase}/remotion-alignment.json`, `${JSON.stringify(alignment, null, 2)}\n`);
    project = loadProject(slug, { refresh: false });
    assert.equal(validateStage(project, "remotion").some((item) => item.code === "promo-remotion-file-path-invalid"), true);

    alignment.scenes[0].implementationFiles = [`${remotionBase}/PromoVideo.tsx`];
    alignment.scenes[0].beats.pop();
    write(workspaceRoot, `${remotionBase}/remotion-alignment.json`, `${JSON.stringify(alignment, null, 2)}\n`);
    project = loadProject(slug, { refresh: false });
    assert.equal(validateStage(project, "remotion").some((item) => item.code === "promo-remotion-beat-missing"), true);
  });
});
