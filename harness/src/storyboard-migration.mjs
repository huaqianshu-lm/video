import crypto from "node:crypto";
import fs from "node:fs";
import path from "node:path";
import { assertProjectMutable, loadProject, projectFiles, readJson, writeJson } from "./storage.mjs";
import { acquireProductionTask, activeProductionTask, releaseProductionTask } from "./production-lock.mjs";
import { productionContract } from "./production-contract.mjs";
import { createWorkflowStagesState, workflowStageIndex } from "./workflows/registry.mjs";
import { artifactManifestFor } from "./artifacts.mjs";
import { validateStage } from "./runner.mjs";
import { fingerprintStageArtifacts } from "./fingerprints.mjs";

const migrationFile = files => path.join(files.directory, "storyboard-migration.json");

export function prepareStoryboardMigration(slug) {
  const project = loadProject(slug, { refresh: false });
  assertProjectMutable(project, "准备 Storyboard 迁移");
  if (activeProductionTask(project)) throw new Error("制作任务仍持有项目，请先结束或恢复同一任务");
  if (productionContract(project) === "storyboard-v1") throw new Error("项目已使用 Storyboard 契约");
  const index = workflowStageIndex(project, project.state.currentStage);
  if (index < 0 || index > workflowStageIndex(project, "gate-2")) throw new Error("迁移入口仅支持 Gate 2 及此前的项目；下游项目请创建独立副本");
  const snapshot = { config: project.config, state: project.state, artifacts: project.artifacts, fingerprints: Object.fromEntries(Object.keys(project.state.stages).map(stage => [stage, fingerprintStageArtifacts(project, stage)])) };
  const migrationVersion = crypto.createHash("sha256").update(JSON.stringify(snapshot)).digest("hex");
  return {
    kind: "storyboard-migration-plan", slug, from: productionContract(project), to: "storyboard-v1", migrationVersion,
    retained: ["现有视频资料", "既有 Agent／Job／任务记录", "旧阶段与 Gate 审核快照"],
    invalidated: ["旧 Gate 2 批准", "后续阶段与审核"],
    outputs: ["storyboard.json", "重新审核当前口播与分镜"],
    writePaths: [project.files.config, project.files.state, project.files.artifacts, migrationFile(project.files)],
    snapshot,
  };
}

export function storyboardMigrationPlanView(plan) {
  const { snapshot, ...view } = plan;
  return view;
}

// A persisted journal lets resume finish the same migration after any write.
// No videos, historical task records or source files are overwritten by migration.
export function startStoryboardMigration(slug, migrationVersion) {
  const files = projectFiles(slug);
  const file = migrationFile(files);
  let journal = fs.existsSync(file) ? readJson(file) : null;
  let project;
  if (journal && journal.migrationVersion === migrationVersion) {
    project = { files, config: readJson(files.config), state: readJson(files.state), artifacts: readJson(files.artifacts) };
    assertProjectMutable(project, "恢复 Storyboard 迁移");
    if (journal.status === "applied") {
      if (activeProductionTask(project)?.id === journal.taskId) releaseProductionTask(project, journal.taskId);
      return { status: "applied", slug, migrationVersion, currentStage: project.state.currentStage, resumed: true };
    }
  } else {
    const plan = prepareStoryboardMigration(slug);
    if (!migrationVersion || migrationVersion !== plan.migrationVersion) throw Object.assign(new Error("迁移计划缺失或已过期，请重新查看影响清单"), { code: "storyboard-migration-stale" });
    project = loadProject(slug, { refresh: false });
    const config = { ...project.config, productionContract: "storyboard-v1", validationPolicy: "strict", updatedAt: new Date().toISOString() };
    const migrated = { ...project, config, state: { ...project.state, stages: createWorkflowStagesState({ config }) } };
    const reusable = ["source", "content-analysis", "video-narrative", "narration-script"];
    for (const stage of reusable) {
      if (project.state.stages[stage]?.status !== "succeeded" || fingerprintStageArtifacts(project, stage) !== project.state.stages[stage].outputFingerprint || validateStage({ ...project, config: { ...project.config, validationPolicy: "strict" } }, stage).some(issue => issue.severity !== "warning")) break;
      migrated.state.stages[stage] = { ...project.state.stages[stage], order: migrated.state.stages[stage].order, review: stage === "video-narrative" ? { kind: "gate-1", decision: "approved", internal: true, migrated: true } : null, outputFingerprint: fingerprintStageArtifacts(migrated, stage) };
    }
    const stages = Object.keys(migrated.state.stages);
    const currentStage = stages.find(stage => migrated.state.stages[stage].status !== "succeeded");
    migrated.state.currentStage = currentStage;
    migrated.state.stages[currentStage].status = "ready";
    for (const stage of stages.slice(stages.indexOf(currentStage) + 1)) migrated.state.stages[stage].status = "invalidated";
    const baselineFile = path.join(files.directory, "prototype-baseline.json");
    journal = { schemaVersion: 1, migrationVersion, taskId: `migration-${migrationVersion}`, status: "prepared", startedAt: new Date().toISOString(), previous: plan.snapshot, previousBaseline: fs.existsSync(baselineFile) ? readJson(baselineFile) : null, config, state: migrated.state, artifacts: { ...project.artifacts, stages: artifactManifestFor(migrated) } };
    writeJson(file, journal);
  }
  if (journal.status === "prepared") {
    const current = { config: project.config, state: project.state, artifacts: project.artifacts, fingerprints: Object.fromEntries(Object.keys(project.state.stages).map(stage => [stage, fingerprintStageArtifacts(project, stage)])) };
    if (JSON.stringify(current) !== JSON.stringify(journal.previous)) throw Object.assign(new Error("迁移准备后项目资料已变化，请重新生成计划"), { code: "storyboard-migration-stale" });
  }
  acquireProductionTask(project, { id: journal.taskId, stage: project.state.currentStage, mode: "storyboard-migration" });
  journal.status = "applying";
  writeJson(file, journal);
  writeJson(files.state, journal.state);
  writeJson(files.artifacts, journal.artifacts);
  writeJson(files.config, journal.config);
  journal.status = "applied"; journal.completedAt = new Date().toISOString(); writeJson(file, journal);
  const migrated = loadProject(slug, { refresh: false });
  releaseProductionTask(migrated, journal.taskId);
  return { status: "applied", slug, migrationVersion, currentStage: migrated.state.currentStage, requiresNewGate2: true };
}
