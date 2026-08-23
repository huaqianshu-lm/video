import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { matchesArtifactPath } from "./artifact-paths.mjs";
import { projectFiles, loadProject } from "./storage.mjs";
import { buildNextAction, buildProjectReport } from "./reports.mjs";
import { STAGES, STAGE_DEFINITIONS } from "./stages.mjs";

const repositoryRoot = path.resolve(new URL("../..", import.meta.url).pathname);
const videosRoot = path.join(repositoryRoot, "videos");
const remotionRoot = path.join(repositoryRoot, "src", "videos");

function directorySlugs(directory) {
  if (!fs.existsSync(directory)) return [];
  return fs.readdirSync(directory, { withFileTypes: true })
    .filter((entry) => entry.isDirectory() && /^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(entry.name))
    .map((entry) => entry.name);
}

function sequenceForSlug(slug) {
  const sourcePath = path.join(videosRoot, slug, "source.md");
  if (!fs.existsSync(sourcePath)) return null;
  const firstLine = fs.readFileSync(sourcePath, "utf8").split(/\r?\n/, 1)[0];
  const match = firstLine.match(/^#\s+(\d+)\s+·/);
  return match ? Number(match[1]) : null;
}

function compareVideoSlugs(left, right) {
  const leftSequence = sequenceForSlug(left);
  const rightSequence = sequenceForSlug(right);
  if (leftSequence !== null && rightSequence !== null && leftSequence !== rightSequence) {
    return leftSequence - rightSequence;
  }
  if (leftSequence !== null) return -1;
  if (rightSequence !== null) return 1;
  return left.localeCompare(right);
}

function allVideoSlugs() {
  return [...new Set([
    ...directorySlugs(videosRoot),
    ...directorySlugs(remotionRoot),
  ])].sort(compareVideoSlugs);
}

function projectIdentity(slug) {
  return {
    slug,
    sequence: sequenceForSlug(slug),
  };
}

function artifactPaths(slug, stage) {
  return STAGE_DEFINITIONS[stage].artifacts.map((artifact) => artifact.replaceAll("{slug}", slug));
}

function artifactPresence(slug, stage) {
  return artifactPaths(slug, stage).map((relativePath) => ({
    path: relativePath,
    present: matchesArtifactPath(repositoryRoot, relativePath),
  }));
}

function stageView(definition, stateItem, artifacts) {
  return {
    stage: definition.stage,
    order: definition.order,
    kind: definition.kind,
    objective: definition.objective,
    requiresApproval: definition.requiresApproval,
    status: stateItem?.status ?? "missing",
    attempts: stateItem?.attempts ?? 0,
    outputCount: stateItem?.outputs?.length ?? 0,
    error: stateItem?.error ?? null,
    invalidatedBy: stateItem?.invalidatedBy ?? null,
    updatedAt: stateItem?.updatedAt ?? null,
    artifacts,
    manualChecks: definition.manualChecks,
  };
}

function buildUninitializedView(slug) {
  const stages = STAGES.map((stage) => {
    const definition = STAGE_DEFINITIONS[stage];
    const artifacts = artifactPresence(slug, stage);
    const hasArtifacts = artifacts.length > 0 && artifacts.every((artifact) => artifact.present);
    return stageView(
      definition,
      { status: artifacts.length === 0 ? "pending" : hasArtifacts ? "available" : "missing" },
      artifacts,
    );
  });
  const artifactStages = stages.filter((stage) => stage.artifacts.length > 0);
  const availableStages = artifactStages.filter((stage) => stage.status === "available");

  return {
    ...projectIdentity(slug),
    initialized: false,
    status: "uninitialized",
    statusLabel: "未初始化 Harness",
    currentStage: null,
    progress: artifactStages.length === 0 ? 0 : Math.round((availableStages.length / artifactStages.length) * 100),
    succeededCount: availableStages.length,
    stageCount: STAGES.length,
    sourceDirectory: `videos/${slug}`,
    remotionDirectory: `src/videos/${slug}`,
    next: {
      action: "initialize",
      message: "先初始化 Harness 项目状态，才能使用阶段控制和 Gate 操作。",
      requiresUser: false,
      issues: [],
      manualChecks: [],
    },
    stages,
  };
}

function buildInitializedView(slug) {
  const project = loadProject(slug, { refresh: false });
  const report = buildProjectReport(project);
  const stages = STAGES.map((stage) => {
    const definition = STAGE_DEFINITIONS[stage];
    const reportItem = report.stages.find((item) => item.stage === stage);
    return stageView(definition, project.state.stages[stage], artifactPresence(slug, stage), reportItem);
  });
  const succeededCount = stages.filter((stage) => stage.status === "succeeded").length;

  return {
    ...projectIdentity(slug),
    initialized: true,
    status: project.state.currentStage === "completed" ? "completed" : project.state.stages[project.state.currentStage].status,
    statusLabel: project.state.currentStage === "completed" ? "已完成" : project.state.currentStage,
    currentStage: project.state.currentStage,
    progress: Math.round((succeededCount / STAGES.length) * 100),
    succeededCount,
    stageCount: STAGES.length,
    sourceDirectory: project.config.sourceDirectory,
    remotionDirectory: project.config.remotionDirectory,
    next: buildNextAction(project),
    stages,
  };
}

export function getVideoProject(slug) {
  if (!allVideoSlugs().includes(slug)) return null;
  const files = projectFiles(slug);
  if (!fs.existsSync(files.config) || !fs.existsSync(files.state) || !fs.existsSync(files.artifacts)) {
    return buildUninitializedView(slug);
  }

  try {
    return buildInitializedView(slug);
  } catch (error) {
    return {
      ...buildUninitializedView(slug),
      status: "invalid",
      statusLabel: "Harness 状态异常",
      next: {
        action: "inspect",
        message: error instanceof Error ? error.message : String(error),
        requiresUser: false,
        issues: [{ severity: "error", message: error instanceof Error ? error.message : String(error) }],
        manualChecks: [],
      },
    };
  }
}

export function listVideoProjects() {
  return allVideoSlugs().map((slug) => getVideoProject(slug));
}
