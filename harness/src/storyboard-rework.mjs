import crypto from "node:crypto";
import fs from "node:fs";
import path from "node:path";
import { assertProjectMutable, loadProject, projectFiles, readJson, writeJson } from "./storage.mjs";
import { acquireProductionTask, activeProductionTask, releaseProductionTask } from "./production-lock.mjs";
import { usesCurrentProduction, STORYBOARD_PRODUCTION_CONTRACT, CURRENT_STORYBOARD_SCHEMA_VERSION } from "./production-contract.mjs";
import {storyboardImplementationFingerprint} from './storyboard-implementation.mjs';
import { workflowStages, createWorkflowStagesState } from "./workflows/registry.mjs";
import { validateProjectStage } from "./validation.mjs";
import { fingerprintStageArtifacts } from "./fingerprints.mjs";
import { artifactManifestFor } from "./artifacts.mjs";
import { listAgentJobs } from "./agent-jobs.mjs";
import { listRemotionTasks } from "./remotion-tasks.mjs";
import { listJobs } from "./jobs.mjs";
import { stopBatchesAfterGateRejection, batchReworkScope, getBatch } from "./batches.mjs";

const hash = value => crypto.createHash("sha256").update(JSON.stringify(value)).digest("hex");
const journalPath = (files, version) => path.join(files.directory, "storyboard-rework", `${version}.json`);
const fingerprints = project => Object.fromEntries(workflowStages(project).map(stage => [stage, fingerprintStageArtifacts(project, stage)]));
const error = (code, message) => Object.assign(new Error(message), { code });

function requireIdle(project) {
  if (activeProductionTask(project)) throw error("storyboard-rework-busy", "项目仍有执行锁，请恢复或结束同一任务");
  if (listAgentJobs({ slug: project.config.slug }).some(j => ["queued", "running"].includes(j.status))
    || listRemotionTasks({ slug: project.config.slug }).some(t => ["ready", "in-progress"].includes(t.status))
    || listJobs(project.config.slug).some(j => !["succeeded", "failed", "timeout"].includes(j.status))) throw error("storyboard-rework-busy", "存在活动或未对账任务，不能开始返工");
}

export function prepareStoryboardRework(slug, { returnTo = "storyboard", reason, dataVersion = null } = {}) {
  const project = loadProject(slug, { refresh: false });
  assertProjectMutable(project, "准备分镜返工", { allowRework: true });
  requireIdle(project);
  if (!reason?.trim() || !["narration-script", "storyboard", "remotion"].includes(returnTo)) throw error("storyboard-rework-input", "返工需要具体原因和口播／分镜／Remotion 返回阶段");
  const current = usesCurrentProduction(project);
  const targetVersion = dataVersion ?? CURRENT_STORYBOARD_SCHEMA_VERSION;
  if (targetVersion !== CURRENT_STORYBOARD_SCHEMA_VERSION) throw error("storyboard-rework-version", "返工仅使用当前分镜契约，不提供版本选择");
  if (!current && returnTo === "remotion") throw error("storyboard-rework-input", "旧设计不符合当前规则，必须先返工口播／分镜，不能只重做实现");
  const targetConfig = { ...project.config, productionContract: STORYBOARD_PRODUCTION_CONTRACT, storyboardSchemaVersion: targetVersion, validationPolicy: "strict" };
  const stages = workflowStages({ config: targetConfig });
  if (current && stages.indexOf(returnTo) > stages.indexOf(project.state.currentStage)) throw error("storyboard-rework-input", "不能通过返工跳到下游阶段");
  // Preserve only verified common upstream work. Missing or changed inputs must
  // be rebuilt by normal tasks rather than promoted by changing a version field.
  if (!current) {
    for (const stage of stages.slice(0, stages.indexOf(returnTo))) {
      const item = project.state.stages[stage];
      if (item?.status !== "succeeded" || !item.outputFingerprint || item.outputFingerprint !== fingerprintStageArtifacts(project, stage)
        || validateProjectStage({ ...project, config: { ...project.config, validationPolicy: "strict" } }, stage).some(issue => issue.severity !== "warning")) {
        returnTo = stage;
        break;
      }
    }
  }
  const previousVersion = project.config.storyboardSchemaVersion ?? 1;
  const baselineFile = path.join(project.files.directory, "prototype-baseline.json");
  const previous = { config: project.config, state: project.state, artifacts: project.artifacts, fingerprints: fingerprints(project), baseline: fs.existsSync(baselineFile) ? readJson(baselineFile) : null, batches: batchReworkScope(slug) };
  const options = { returnTo, reason: reason.trim(), dataVersion: targetVersion };
  const reworkVersion = hash({ slug, options, previous });
  return { kind: "storyboard-rework-plan", slug, reworkVersion, ...options, fromDataVersion: previousVersion,
    invalidated: stages.slice(stages.indexOf(returnTo)), retained: ["既有视频资料与音视频", "历史 Gate／阶段／基线快照", "原 Agent／Job／任务记录"],
    currentRulesRequired: !current,
    requiresHumanGate: returnTo === "remotion" ? ["gate-3", "gate-4"] : ["gate-2", "gate-3", "gate-4"],
    batchIds: previous.batches.map(b => b.batch.id), writePaths: [project.files.config, project.files.state, project.files.artifacts, journalPath(project.files, reworkVersion), ...previous.batches.map(b => b.path)], previous };
}

export function storyboardReworkPlanView({ previous, ...view }) { return view; }

export function startStoryboardRework(slug, reworkVersion, options = {}) {
  if (!/^[a-f0-9]{64}$/.test(reworkVersion ?? "")) throw error("storyboard-rework-stale", "缺少有效返工计划版本");
  const files = projectFiles(slug), file = journalPath(files, reworkVersion);
  let journal = fs.existsSync(file) ? readJson(file) : null;
  let project = journal && journal.status !== "applied"
    ? { files, config: readJson(files.config), state: readJson(files.state), artifacts: readJson(files.artifacts) }
    : loadProject(slug, { refresh: false });
  assertProjectMutable(project, "执行分镜返工", { allowRework: true });
  if (journal && (journal.slug !== slug || journal.reworkVersion !== reworkVersion)) throw error("storyboard-rework-stale", "返工记录与计划不一致");
  if (!journal) {
    const plan = prepareStoryboardRework(slug, options);
    if (plan.reworkVersion !== reworkVersion) throw error("storyboard-rework-stale", "返工计划已过期或范围改变，请重新查看清单");
    const now = new Date().toISOString();
    const config = { ...project.config, productionContract: STORYBOARD_PRODUCTION_CONTRACT, storyboardSchemaVersion: plan.dataVersion, validationPolicy: "strict", productionRevision: (project.config.productionRevision ?? 0) + 1, updatedAt: now };
    const state = structuredClone(project.state);
    if (plan.currentRulesRequired) {
      state.stages = createWorkflowStagesState({ config });
      for (const stage of workflowStages({ config }).slice(0, workflowStages({ config }).indexOf(plan.returnTo))) {
        state.stages[stage] = { ...project.state.stages[stage], order: state.stages[stage].order };
      }
    }
    for (const stage of plan.invalidated) {
      const old = state.stages[stage];
      state.stages[stage] = { ...old, status: stage === plan.returnTo ? "ready" : "invalidated", review: null, outputs: [], error: null, outputFingerprint: null,
        invalidatedBy: stage === plan.returnTo ? null : "storyboard-rework", rebuildBaselineFingerprint: null, updatedAt: now };
    }
    if (plan.returnTo === "remotion") {
      state.stages.remotion.invalidatedBy = "gate-3-rejected";
      state.stages.remotion.rebuildBaselineFingerprint = project.state.stages.remotion.outputFingerprint;
      const implementation = storyboardImplementationFingerprint(project);
      if (implementation) state.stages.remotion.rebuildImplementationFingerprint = implementation;
    }
    state.currentStage = plan.returnTo; state.updatedAt = now;
    journal = { schemaVersion: 1, slug, reworkVersion, taskId: `storyboard-rework-${reworkVersion}`, status: "prepared", options: { returnTo: plan.returnTo, reason: plan.reason, dataVersion: plan.dataVersion }, previous: plan.previous,
      config, state, artifacts: { ...project.artifacts, stages: artifactManifestFor({ ...project, config }) }, startedAt: now };
    writeJson(file, journal);
  }
  if (journal.status === "applied") {
    if (activeProductionTask(project)?.id === journal.taskId) releaseProductionTask(project, journal.taskId);
    return { status: "applied", slug, reworkVersion, currentStage: project.state.currentStage, resumed: true };
  }
  if (journal.status === "prepared" && JSON.stringify(batchReworkScope(slug)) !== JSON.stringify(journal.previous.batches)) throw error("storyboard-rework-stale", "返工计划的批次范围已变化");
  // Recovery must also respect a member that became completed after an interrupted
  // write; check before touching this project's state or any shared batch record.
  for (const entry of journal.previous.batches) {
    const batch = getBatch(entry.batch.id);
    if (!batch) throw error("storyboard-rework-conflict", "返工批次记录缺失，拒绝继续覆盖");
    for (const item of batch.items) assertProjectMutable(item.slug, "恢复分镜返工的批次", { allowRework: true });
  }
  // Only our own intermediate writes are allowed when recovering. A conflicting
  // edit must never be replaced by the persisted target snapshot.
  for (const [key, filename] of [["config", files.config], ["state", files.state], ["artifacts", files.artifacts]]) {
    const current = readJson(filename);
    if (![journal.previous[key], journal[key]].some(value => JSON.stringify(current) === JSON.stringify(value))) throw error("storyboard-rework-conflict", "返工期间状态或配置改变，拒绝覆盖新记录");
  }
  if (JSON.stringify(fingerprints({ ...project, config: journal.previous.config, state: journal.previous.state })) !== JSON.stringify(journal.previous.fingerprints)) throw error("storyboard-rework-stale", "返工准备后制作资料已变化");
  if (!activeProductionTask(project)) requireIdle(project);
  acquireProductionTask(project, { id: journal.taskId, stage: project.state.currentStage, mode: "storyboard-rework" });
  journal.status = "applying"; writeJson(file, journal);
  writeJson(files.state, journal.state); writeJson(files.artifacts, journal.artifacts); writeJson(files.config, journal.config);
  if (!journal.stoppedBatchIds) {
    journal.stoppedBatchIds = stopBatchesAfterGateRejection({ slug, gate: journal.options.returnTo === "remotion" ? "gate-3" : "gate-2", returnTo: journal.options.returnTo, reason: journal.options.reason, allTypes: true, batchIds: journal.previous.batches.map(b => b.batch.id) });
    writeJson(file, journal);
  }
  journal.status = "applied"; journal.completedAt = new Date().toISOString(); writeJson(file, journal);
  project = loadProject(slug, { refresh: false }); releaseProductionTask(project, journal.taskId);
  return { status: "applied", slug, reworkVersion, currentStage: project.state.currentStage, storyboardSchemaVersion: journal.config.storyboardSchemaVersion, requiresNewHumanReview: true };
}
