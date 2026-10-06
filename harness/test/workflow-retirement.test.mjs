import assert from "node:assert/strict";
import crypto from "node:crypto";
import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import test from "node:test";
import { execFileSync } from "node:child_process";
import { ARCHIVED_WORKFLOW, ARCHIVED_WORKFLOW_ID } from "../src/workflows/archived.mjs";
import { requireWorkflowDefinition, workflowCatalog } from "../src/workflows/registry.mjs";
import { initializeProject, loadProject, assertProjectMutable } from "../src/storage.mjs";
import { importSourceProject } from "../src/source-import.mjs";
import { getVideoProject, listVideoProjects } from "../src/project-view.mjs";
import { getProjectPrototype, listProjectFiles } from "../src/project-files.mjs";
import { createBatch } from "../src/batches.mjs";
import { runSingleStage } from "../src/single-runner.mjs";
import { prepareRenderInput, discoverStudioEntries, validateRenderInputDirectory, writeStudioCatalogEntryPoint } from "../src/render-input.mjs";

const cli = path.resolve(new URL("../src/cli.mjs", import.meta.url).pathname);
const keys = ["HARNESS_WORKSPACE_ROOT", "HARNESS_PROJECTS_DIR", "HARNESS_BATCHES_DIR", "HARNESS_RENDER_INPUT_DIR"];
const hash = bytes => crypto.createHash("sha256").update(bytes).digest("hex");

async function fixture(callback) {
  const root = fs.mkdtempSync(path.join(os.tmpdir(), "workflow-retirement-"));
  const old = Object.fromEntries(keys.map(key => [key, process.env[key]]));
  process.env.HARNESS_WORKSPACE_ROOT = root;
  process.env.HARNESS_PROJECTS_DIR = path.join(root, "projects");
  process.env.HARNESS_BATCHES_DIR = path.join(root, "batches");
  process.env.HARNESS_RENDER_INPUT_DIR = path.join(root, "local/render-input");
  const write = (file, value) => {
    const absolute = path.join(root, file);
    fs.mkdirSync(path.dirname(absolute), { recursive: true });
    fs.writeFileSync(absolute, typeof value === "string" ? value : JSON.stringify(value));
  };
  try { await callback({ root, write }); }
  finally {
    for (const key of keys) old[key] === undefined ? delete process.env[key] : process.env[key] = old[key];
    fs.rmSync(root, { recursive: true, force: true });
  }
}

function archive({ root, write }, currentStage = "completed") {
  const slug = "archived-film";
  const source = `videos/product-promo/${slug}`;
  const remotion = `src/videos/product-promo/${slug}`;
  const config = { slug, workflow: ARCHIVED_WORKFLOW_ID, workflowVersion: 1, workspaceRoot: root,
    sourceDirectory: source, remotionDirectory: remotion, assetArchive: `assets/product-promo/${slug}-assets.zip` };
  const state = { slug, currentStage, stages: Object.fromEntries(ARCHIVED_WORKFLOW.stages.map((stage, order) => [stage, {stage, order, status: "succeeded", attempts: 1, outputs: [], review: null}])) };
  write(`projects/${slug}/project.json`, config);
  write(`projects/${slug}/state.json`, state);
  write(`projects/${slug}/artifacts.json`, { stages: {} });
  const payload = {
    [`${source}/source.md`]: "# Archive\nHistorical source.",
    [`${source}/motion-prototype.html`]: '<section class="scene">Historical preview</section>',
    [`${remotion}/ArchivedVideo.tsx`]: "export const ArchivedVideo = () => null;",
    [`${remotion}/video.config.ts`]: "export const videoConfig = {fps:30,width:1920,height:1080}; export const TotalDurationFrames = () => 900;",
    [config.assetArchive]: "Historical archive bytes",
  };
  const input = `local/render-input/${slug}`;
  const fingerprint = crypto.createHash("sha256");
  const files = Object.keys(payload).sort().map(file => {
    write(file, payload[file]); write(`${input}/${file}`, payload[file]);
    fingerprint.update(`path:${file}\n`).update(payload[file]).update("\n");
    return {path: file, size: Buffer.byteLength(payload[file]), sha256: hash(payload[file])};
  });
  write(`${input}/render-input.json`, {schemaVersion: 1, kind: "video-render-input", videoSlug: slug,
    workflow: ARCHIVED_WORKFLOW_ID, workflowVersion: 1, compositionId: slug,
    entry: {componentPath: `${remotion}/ArchivedVideo.tsx`, componentExport: "ArchivedVideo", configPath: `${remotion}/video.config.ts`, configExport: "videoConfig", durationExport: "TotalDurationFrames"},
    payload: {sourceDirectory: source, remotionDirectory: remotion, assetArchive: config.assetArchive},
    sourceSnapshot: {}, sourceFingerprint: "0".repeat(64), packageFingerprint: fingerprint.digest("hex"), files});
  return { slug, config, state, input: path.join(root, input), protectedFile: `${source}/source.md` };
}

test("removes promo from the production catalog and rejects CLI init and source import before writing", async () => {
  await fixture(({ root }) => {
    assert.deepEqual(workflowCatalog().map(item => item.id), ["narrated-tutorial-v1"]);
    assert.equal(requireWorkflowDefinition("default").id, "narrated-tutorial-v1");
    assert.throws(() => initializeProject("new-promo", {workflow: ARCHIVED_WORKFLOW_ID, workflowVersion: 1}), {code: "workflow-retired"});
    assert.throws(() => importSourceProject({slug: "new-promo", filename: "source.md", content: "# Input", workflow: ARCHIVED_WORKFLOW_ID, workflowVersion: 1}), {code: "workflow-retired"});
    assert.throws(() => execFileSync(process.execPath, [cli, "init", "new-promo", "--workflow", ARCHIVED_WORKFLOW_ID, "--workflow-version", "1"], {env: process.env, stdio: "pipe"}), error => /宣传片生产能力已移除/.test(error.stderr.toString()));
    assert.equal(fs.existsSync(path.join(root, "projects/new-promo")), false);
    assert.equal(fs.existsSync(path.join(root, "videos/new-promo")), false);
  });
});

test("blocks all single-stage, batch and packaging work for an unfinished retired project", async () => {
  await fixture(async data => {
    const { slug } = archive(data, "remotion");
    const project = loadProject(slug, {refresh: false});
    let executed = 0;
    assert.throws(() => assertProjectMutable(project), {code: "workflow-retired"});
    for (const stage of ["source", "subtitle-timeline", "remotion", "render"]) {
      await assert.rejects(runSingleStage(project, stage, {remoteExecutor: {run: () => {executed++;}}}), {code: "workflow-retired"});
    }
    assert.throws(() => createBatch({type: "to-remotion", slugs: [slug]}), {code: "workflow-retired"});
    assert.throws(() => prepareRenderInput(project), {code: "workflow-retired"});
    assert.equal(executed, 0);
    assert.equal(getVideoProject(slug).status, "retired");
    assert.equal(listVideoProjects().length, 1);
    assert.deepEqual(listProjectFiles(slug), []);
  });
});

test("keeps completed archive records, files and Studio preview without changing state or payload", async () => {
  await fixture(data => {
    const a = archive(data);
    const statePath = path.join(data.root, `projects/${a.slug}/state.json`);
    const manifestPath = path.join(a.input, "render-input.json");
    const before = [fs.readFileSync(statePath, "utf8"), fs.readFileSync(manifestPath, "utf8")];
    const project = getVideoProject(a.slug);
    assert.equal(project.status, "completed");
    assert.equal(project.readOnly, true);
    assert.equal(project.stages.length, 13);
    assert.equal(project.batchSupported, false);
    assert.deepEqual(listVideoProjects().map(item => item.slug), [a.slug]);
    assert.ok(listProjectFiles(a.slug).some(file => file.present && file.path.endsWith("source.md")));
    assert.match(getProjectPrototype(a.slug).content, /Historical preview/);
    assert.equal(discoverStudioEntries(data.root).entries[0].slug, a.slug);
    writeStudioCatalogEntryPoint(data.root, path.join(data.root, "src/RenderInputRoot.tsx"));
    assert.match(fs.readFileSync(path.join(data.root, "src/RenderInputRoot.tsx"), "utf8"), /ArchivedVideo/);
    assert.throws(() => prepareRenderInput(loadProject(a.slug, {refresh:false})), {code:"completed-project-readonly"});
    assert.deepEqual([fs.readFileSync(statePath, "utf8"), fs.readFileSync(manifestPath, "utf8")], before);
  });
});

test("rejects archived packages for production and skips corrupt archived preview bytes", async () => {
  await fixture(data => {
    const a = archive(data);
    assert.ok(validateRenderInputDirectory(a.input).some(issue => issue.includes("生产能力已移除")));
    assert.deepEqual(validateRenderInputDirectory(a.input, {archivedPreview: true}), []);
    fs.appendFileSync(path.join(a.input, a.protectedFile), " changed");
    const result = discoverStudioEntries(data.root);
    assert.equal(result.entries.length, 0);
    assert.match(result.skipped[0].reason, /哈希不一致/);
    assert.throws(() => requireWorkflowDefinition({workflow: ARCHIVED_WORKFLOW_ID, workflowVersion: 2}, {archivedPreview: true}), {code:"unsupported-workflow-version"});
  });
});

test("reserves archived slugs when creating or importing tutorials", async () => {
  await fixture(({ root, write }) => {
    write("videos/product-promo/reserved/source.md", "# Historical input");
    assert.throws(() => initializeProject("reserved"), {code:"workflow-slug-conflict"});
    assert.throws(() => importSourceProject({slug:"reserved", filename:"source.md", content:"# Tutorial"}), {code:"source-project-exists"});
    assert.equal(fs.existsSync(path.join(root, "videos/reserved")), false);
    assert.equal(fs.existsSync(path.join(root, "projects/reserved")), false);
  });
});
