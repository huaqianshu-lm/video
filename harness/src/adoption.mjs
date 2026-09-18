import fs from "node:fs";
import path from "node:path";
import { artifactManifestFor } from "./artifacts.mjs";
import { fingerprintStageArtifacts } from "./fingerprints.mjs";
import { assertProjectMutable, projectFiles, initializeProject, loadProject, writeJson } from "./storage.mjs";
import {
  workflowStageDefinition,
  workflowStageIndex,
  workflowStages,
} from "./workflows/registry.mjs";
import { matchesArtifactPath } from "./artifact-paths.mjs";
import { validateProjectStage, validateStageArtifacts } from "./validation.mjs";

const repositoryRoot = path.resolve(new URL("../..", import.meta.url).pathname);
const ADOPTABLE_TARGET = "gate-2";
const LAST_ADOPTED_STAGE = "visual-prototype";

function workspaceRoot() {
  return path.resolve(process.env.HARNESS_WORKSPACE_ROOT ?? repositoryRoot);
}

function candidateProject(slug) {
  return {
    config: {
      slug,
      workspaceRoot: workspaceRoot(),
      validationPolicy: "strict",
      workflow: "default",
      workflowVersion: 2,
    },
    artifacts: { stages: artifactManifestFor(slug) },
    state: { stages: {} },
  };
}

function requiredArtifactIssues(project) {
  const stages = workflowStages(project);
  return stages
    .slice(0, workflowStageIndex(project, LAST_ADOPTED_STAGE) + 1)
    .flatMap((stage) => validateStageArtifacts(project, stage));
}

function downstreamArtifactIssues(project) {
  const stages = workflowStages(project);
  return stages
    .slice(workflowStageIndex(project, ADOPTABLE_TARGET) + 1)
    .flatMap((stage) => (project.artifacts.stages[stage] ?? [])
      .filter((entry) => matchesArtifactPath(project.config.workspaceRoot, entry.path))
      .map((entry) => ({
        code: "downstream-artifact-present",
        stage,
        path: entry.path,
        message: `Gate 2 后已有产物，不能接管到 Gate 2：${entry.path}`,
      })));
}

function isFreshInitializedProject(project) {
  if (project.config.adoption || project.config.historical) return false;
  if (project.state.currentStage === "completed") return false;

  const stages = workflowStages(project);
  const lastAdoptedIndex = workflowStageIndex(project, LAST_ADOPTED_STAGE);
  return stages.every((stage, index) => {
    const item = project.state.stages[stage];
    if (!item || item.outputs.length > 0 || item.review || item.error || item.invalidatedBy) return false;
    if (index === 0) return ["ready", "succeeded"].includes(item.status);
    if (index <= lastAdoptedIndex) return ["pending", "ready"].includes(item.status);
    return item.status === "pending";
  });
}

function completeGate2Adoption(project, method) {
  assertProjectMutable(project, "接管视频项目");
  const files = project.files;
  const now = new Date().toISOString();
  project.config.adoption = {
    method,
    targetStage: ADOPTABLE_TARGET,
    adoptedAt: now,
  };
  project.config.updatedAt = now;

  const stages = workflowStages(project);
  const adoptedStages = stages.slice(0, workflowStageIndex(project, LAST_ADOPTED_STAGE) + 1);
  for (const stage of adoptedStages) {
    const item = project.state.stages[stage];
    item.status = "succeeded";
    item.attempts = 0;
    item.outputs = [];
    item.review = null;
    item.error = null;
    item.invalidatedBy = null;
    item.outputFingerprint = fingerprintStageArtifacts(project, stage);
    item.updatedAt = now;
  }

  project.state.currentStage = ADOPTABLE_TARGET;
  project.state.updatedAt = now;
  project.state.stages[ADOPTABLE_TARGET].status = "waiting";
  project.state.stages[ADOPTABLE_TARGET].updatedAt = now;
  writeJson(files.config, project.config);
  writeJson(files.state, project.state);
  writeJson(files.artifacts, project.artifacts);

  return {
    slug: project.state.slug,
    targetStage: ADOPTABLE_TARGET,
    status: project.state.stages[ADOPTABLE_TARGET].status,
    state: files.state,
    adoptedStages: adoptedStages.length,
  };
}

export function inspectAdoptionCandidate(slug) {
  const files = projectFiles(slug);
  const hasHarnessState = [files.config, files.state, files.artifacts].some((file) => fs.existsSync(file));
  const project = candidateProject(slug);
  const issues = [
    ...requiredArtifactIssues(project),
    ...validateProjectStage(project, LAST_ADOPTED_STAGE),
    ...downstreamArtifactIssues(project),
  ];
  return {
    slug,
    targetStage: ADOPTABLE_TARGET,
    issues,
    eligible: issues.length === 0 && !hasHarnessState,
  };
}

export function adoptExistingProjectToGate2(slug) {
  const files = projectFiles(slug);
  const existingFiles = [files.config, files.state, files.artifacts].filter((file) => fs.existsSync(file));
  if (existingFiles.length > 0) {
    if (existingFiles.length !== 3) throw new Error(`Harness project has incomplete state files: ${slug}`);
    const project = loadProject(slug, { refresh: false });
    if (!isFreshInitializedProject(project)) {
      throw new Error(`Harness project already has progress or an adoption record: ${slug}`);
    }
    const inspection = inspectAdoptionCandidate(slug);
    if (inspection.issues.length > 0) {
      const details = inspection.issues.map((item) => `${item.code}: ${item.message}`).join("；");
      throw new Error(`Cannot adopt ${slug} to Gate 2：${details}`);
    }
    return completeGate2Adoption(project, "existing-artifacts-after-init");
  }

  const inspection = inspectAdoptionCandidate(slug);
  if (!inspection.eligible) {
    const details = inspection.issues.map((item) => `${item.code}: ${item.message}`).join("；");
    throw new Error(`Cannot adopt ${slug} to Gate 2${details ? `：${details}` : ""}`);
  }

  initializeProject(slug, { prototypeBaseline: null });
  const project = loadProject(slug, { refresh: false });
  return completeGate2Adoption(project, "existing-artifacts");
}

export function markHistoricalProjectCompleted(slug, reason = "user-confirmed-historical-completion") {
  const files = projectFiles(slug);
  const existingFiles = [files.config, files.state, files.artifacts].filter((file) => fs.existsSync(file));
  if (existingFiles.length > 0 && existingFiles.length < 3) {
    throw new Error(`Harness project has incomplete state files: ${slug}`);
  }
  if (existingFiles.length === 0) initializeProject(slug);

  const project = loadProject(slug, { refresh: false });
  assertProjectMutable(project, "标记视频为已完成");
  const now = new Date().toISOString();
  project.config.historical = {
    completed: true,
    method: "user-confirmed-existing-render",
    completedAt: now,
    reason,
  };
  project.config.updatedAt = now;

  for (const stage of workflowStages(project)) {
    const item = project.state.stages[stage];
    item.status = "succeeded";
    item.attempts = 0;
    item.outputs = [];
    item.error = null;
    item.invalidatedBy = null;
    item.outputFingerprint = workflowStageDefinition(project, stage)?.kind === "gate" || stage === "render"
      ? null
      : fingerprintStageArtifacts(project, stage);
    item.review = workflowStageDefinition(project, stage)?.kind === "gate"
      ? {
        decision: "approved",
        reviewedAt: now,
        source: "historical-user-confirmed",
      }
      : null;
    item.updatedAt = now;
  }

  project.state.currentStage = "completed";
  project.state.updatedAt = now;
  writeJson(files.config, project.config);
  writeJson(files.artifacts, project.artifacts);
  writeJson(files.state, project.state);

  return {
    slug,
    currentStage: project.state.currentStage,
    status: "completed",
    historical: true,
    completedStages: workflowStages(project).length,
  };
}
