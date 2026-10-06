import { ensureRemotionTask } from "../src/remotion-tasks.mjs";
import assert from "node:assert/strict";
import crypto from "node:crypto";
import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import test from "node:test";
import { validateVisualSelfReview } from "../src/visual-self-review.mjs";
import { validateProjectStage } from "../src/validation.mjs";
import { approveGate, rejectGate } from "../src/runner.mjs";
import { createProjectActionService } from "../src/web/services/project-actions.mjs";
import { runSingleStage } from "../src/single-runner.mjs";
import { createBatch, runBatch } from "../src/batches.mjs";
import { buildNextAction } from "../src/reports.mjs";
import { initializeProject, loadProject } from "../src/storage.mjs";

function fixture(workflow = "narrated-tutorial-v1") {
  const root = fs.mkdtempSync(path.join(os.tmpdir(), "visual-review-"));
  process.env.HARNESS_WORKSPACE_ROOT = root;
  process.env.HARNESS_PROJECTS_DIR = path.join(root, "projects");
  initializeProject("sample", {workflow, prototypeBaseline: null});
  const project = loadProject("sample", {refresh: false});
  const directory = path.join(root, project.config.sourceDirectory);
  fs.mkdirSync(directory, {recursive: true});
  fs.writeFileSync(path.join(directory, "source.md"), "# Sample\nInput for a contract test.");
  fs.writeFileSync(path.join(directory, "visual-script.md"), "# Visual Script\n## Scene 01\nCurrent subject changes.");
  const prototype = "visual-prototype.html";
  fs.writeFileSync(path.join(directory, prototype), '<section class="scene" data-scene="01">Subject</section>');
  fs.writeFileSync(path.join(directory, "evidence.md"), "Human viewed opening, middle and closing at normal speed; observed before/action/after.");
  const hash = name => crypto.createHash("sha256").update(fs.readFileSync(path.join(directory, name))).digest("hex");
  const prefix = "TUTORIAL";
  const review = {schemaVersion: 1, videoSlug: "sample", workflow, reviewedAt: "2026-10-03", visualScriptFingerprint: hash("visual-script.md"), prototypeFingerprint: hash(prototype), evidence: [{id: "viewed", kind: "human-review", path: "evidence.md"}], checks: Array.from({length: 6}, (_, i) => ({id: `VC-${i + 1}`, status: "passed", evidenceIds: ["viewed"], note: "Observed"})), workflowChecks: Array.from({length: 4}, (_, i) => ({id: `${prefix}-${i + 1}`, status: "passed", evidenceIds: ["viewed"], note: "Observed"}))};
  const save = () => fs.writeFileSync(path.join(directory, "visual-self-review.json"), JSON.stringify(review));
  save();
  return {project, directory, review, save};
}

test("accepts current tutorial review and rejects incorrect profile checks", () => {
  for (const workflow of ["narrated-tutorial-v1"]) {
    const {project, review, save} = fixture(workflow);
    assert.deepEqual(validateVisualSelfReview(project, "gate-2"), []);
    review.workflowChecks[0].id = "WRONG-1"; save();
    assert.ok(validateVisualSelfReview(project, "gate-2").length);
  }
});

test("blocks stale scripts, failed checks, empty evidence and symlink escape", () => {
  for (const mutate of [
    f => fs.appendFileSync(path.join(f.directory, "visual-script.md"), " changed"),
    f => {f.review.checks[0].status = "failed"; f.save();},
    f => fs.writeFileSync(path.join(f.directory, "evidence.md"), ""),
    f => {fs.writeFileSync(path.join(f.project.config.workspaceRoot, "escape.md"), "Existing outside evidence"); fs.symlinkSync(f.project.config.workspaceRoot, path.join(f.directory, "outside")); f.review.evidence[0].path = "outside/escape.md"; f.save();},
    f => {f.review.evidence[0].path = "../evidence.md"; f.save();},
    f => {f.review.checks.push(f.review.checks[0]); f.save();},
  ]) {
    const f = fixture(); mutate(f);
    assert.ok(validateVisualSelfReview(f.project, "gate-2").length);
  }
});

test("legacy cannot downgrade review errors; waiting approval rechecks before any write", () => {
  const {project, review, save} = fixture();
  project.config.validationPolicy = "legacy";
  project.state.currentStage = "gate-2";
  project.state.stages["gate-2"].status = "waiting";
  review.prototypeFingerprint = "stale"; save();
  const issues = validateProjectStage(project, "gate-2");
  assert.equal(issues.find(item => item.code === "invalid-visual-self-review").severity, "error");
  assert.equal(buildNextAction(project).action, "fix-validation-issues");
  const before = fs.readFileSync(project.files.state, "utf8");
  assert.throws(() => approveGate(project, "gate-2"), /审批阻断/);
  assert.equal(fs.readFileSync(project.files.state, "utf8"), before);
  assert.equal(fs.existsSync(path.join(project.config.workspaceRoot, project.config.sourceDirectory, "tts-script.json")), false);
  assert.ok(validateVisualSelfReview(project, "tts").length);
});

test("upstream stages do not require review and completed projects stay read only", () => {
  const {project, directory} = fixture();
  fs.writeFileSync(path.join(directory, "visual-self-review.json"), "null");
  assert.deepEqual(validateVisualSelfReview(project, "visual-prototype"), []);
  assert.ok(validateVisualSelfReview(project, "gate-2").length);
  project.state.currentStage = "completed";
  assert.deepEqual(validateVisualSelfReview(project, "gate-2"), []);
  assert.throws(() => approveGate(project, "gate-2"), /永久只读/);
});

test("Web action, single Remotion execution and batch checkpoint reject stale reviews", async () => {
  const {project, review, save} = fixture();
  review.prototypeFingerprint = "stale"; save();
  project.state.currentStage = "gate-2";
  project.state.stages["gate-2"].status = "waiting";
  fs.writeFileSync(project.files.state, JSON.stringify(project.state));
  await assert.rejects(() => createProjectActionService({}).execute({slug: "sample", action: "approve", gate: "gate-2"}), /审批阻断/);
  let executed = false;
  project.state.currentStage = "remotion";
  project.state.stages.remotion.status = "ready";
  fs.writeFileSync(project.files.state, JSON.stringify(project.state));
  assert.throws(() => ensureRemotionTask({slug: "sample"}), /视觉自检阻断/);
  project.state.currentStage = "gate-2";
  fs.writeFileSync(project.files.state, JSON.stringify(project.state));
  project.state.currentStage = "remotion";
  await assert.rejects(() => runSingleStage(project, "remotion", {remotionExecutor: {run() {executed = true;}}}), /视觉自检阻断/);
  assert.equal(executed, false);
  process.env.HARNESS_BATCHES_DIR = path.join(project.config.workspaceRoot, "batches");
  const batch = createBatch({type: "to-gate-2", slugs: ["sample"]});
  const result = await runBatch(batch.id);
  assert.equal(result.items[0].status, "failed");
  assert.match(result.items[0].error.message, /视觉自检阻断/);
});

test("a blocked Gate 2 can return to Visual Script with an explicit reason", () => {
  const {project, review, save} = fixture();
  project.state.currentStage = "gate-2";
  project.state.stages["gate-2"].status = "ready";
  review.checks[0].status = "failed"; save();
  rejectGate(project, "gate-2", "visual-script", "主体状态变化不清楚，需要重做");
  assert.equal(project.state.currentStage, "visual-script");
  assert.equal(project.state.stages["visual-script"].status, "ready");
});
