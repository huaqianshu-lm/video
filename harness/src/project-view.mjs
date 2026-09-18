import fs from "node:fs";
import path from "node:path";
import { matchesArtifactPath } from "./artifact-paths.mjs";
import { projectFiles, loadProject } from "./storage.mjs";
import { buildNextAction, buildProjectReport } from "./reports.mjs";
import {
  allWorkflowDefinitions,
  retiredStageDefinition,
  stagesForWorkflowProjectView,
  workflowForProject,
  workflowStageDefinition,
  workflowPaths,
  workflowStages,
} from "./workflows/registry.mjs";
import { resolveStyleId } from "./styles.mjs";

const repositoryRoot = path.resolve(new URL("../..", import.meta.url).pathname);

function workspaceRoot() {
  return path.resolve(process.env.HARNESS_WORKSPACE_ROOT ?? repositoryRoot);
}

function videosRoot() {
  return path.join(workspaceRoot(), "videos");
}

function remotionRoot() {
  return path.join(workspaceRoot(), "src", "videos");
}

function directorySlugs(directory) {
  if (!fs.existsSync(directory)) return [];
  return fs.readdirSync(directory, { withFileTypes: true })
    .filter((entry) => entry.isDirectory() && /^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(entry.name))
    .map((entry) => entry.name);
}

function workflowNamespaces() {
  return new Set(Object.values(allWorkflowDefinitions())
    .map((definition) => definition.pathNamespace)
    .filter(Boolean));
}

function sourceCandidates(slug) {
  return [
    path.join(videosRoot(), slug, "source.md"),
    ...Object.values(allWorkflowDefinitions())
      .filter((definition) => definition.pathNamespace)
      .map((definition) => path.join(videosRoot(), definition.pathNamespace, slug, "source.md")),
  ];
}

function sequenceForSlug(slug) {
  const sourcePath = sourceCandidates(slug).find((candidate) => fs.existsSync(candidate));
  if (!sourcePath) return null;
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
  const namespaces = workflowNamespaces();
  const namespacedSlugs = [...namespaces].flatMap((namespace) => [
    ...directorySlugs(path.join(videosRoot(), namespace)),
    ...directorySlugs(path.join(remotionRoot(), namespace)),
  ]);
  return [...new Set([
    ...directorySlugs(videosRoot()).filter((slug) => !namespaces.has(slug)),
    ...directorySlugs(remotionRoot()).filter((slug) => !namespaces.has(slug)),
    ...namespacedSlugs,
  ])].sort(compareVideoSlugs);
}

function projectIdentity(slug) {
  return {
    slug,
    sequence: sequenceForSlug(slug),
  };
}

function artifactPaths(slug, stage, workflowInput = { config: { workflow: "default", workflowVersion: 2 } }) {
  const definition = workflowStageDefinition(workflowInput, stage)
    ?? retiredStageDefinition(stage);
  return (definition?.artifacts ?? []).map((artifact) => artifact.replaceAll("{slug}", slug));
}

function remoteArtifactPresent(stage, stateItem, slug) {
  if (stage !== "render") return false;
  return (stateItem?.outputs ?? []).some((output) =>
    output.artifactName === slug
    && (output.artifacts ?? []).some((artifact) =>
      artifact.name === slug
      && artifact.expired === false
      && artifact.id
      && artifact.sizeInBytes > 0,
    ),
  );
}

function artifactPresence(slug, stage, stateItem = null, workflowInput = null) {
  const config = workflowInput?.config ?? workflowInput ?? {};
  const root = config.workspaceRoot ?? workspaceRoot();
  return artifactPaths(slug, stage, workflowInput ?? { config: { workflow: "default", workflowVersion: 2 } }).map((relativePath) => ({
    path: relativePath,
    present: matchesArtifactPath(root, relativePath) || remoteArtifactPresent(stage, stateItem, slug),
  }));
}

function stageView(definition, stateItem, artifacts) {
  return {
    stage: definition.stage,
    label: definition.label,
    order: definition.order,
    kind: definition.kind,
    objective: definition.objective,
    requiresApproval: definition.requiresApproval,
    status: stateItem?.status ?? "missing",
    attempts: stateItem?.attempts ?? 0,
    outputCount: stateItem?.outputs?.length ?? 0,
    outputs: stateItem?.outputs ?? [],
    remote: stateItem?.remote ?? null,
    review: stateItem?.review ?? null,
    error: stateItem?.error ?? null,
    invalidatedBy: stateItem?.invalidatedBy ?? null,
    updatedAt: stateItem?.updatedAt ?? null,
    artifacts,
    manualChecks: definition.manualChecks,
  };
}

function projectWorkflowInput(slug) {
  const configPath = projectFiles(slug).config;
  if (fs.existsSync(configPath)) {
    try {
      return { config: JSON.parse(fs.readFileSync(configPath, "utf8")) };
    } catch {
      return { config: { workflow: "default", workflowVersion: 2, slug } };
    }
  }
  const promoDefinition = Object.values(allWorkflowDefinitions()).find((definition) => definition.pathNamespace
    && fs.existsSync(path.join(videosRoot(), definition.pathNamespace, slug)));
  return promoDefinition
    ? { config: { workflow: promoDefinition.id, workflowVersion: promoDefinition.version, slug } }
    : { config: { workflow: "default", workflowVersion: 2, slug } };
}

function buildUninitializedView(slug) {
  const workflow = projectWorkflowInput(slug);
  workflow.config.workspaceRoot = workspaceRoot();
  const workflowStagesForView = workflowStages(workflow);
  const stages = workflowStagesForView.map((stage) => {
    const definition = workflowStageDefinition(workflow, stage);
    const artifacts = artifactPresence(slug, stage, null, workflow);
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
    stageCount: workflowStagesForView.length,
    workflow: workflow.config.workflow,
    workflowVersion: workflow.config.workflowVersion,
    timelineMode: workflowForProject(workflow).timelineMode,
    audioMode: workflowForProject(workflow).audioMode,
    batchSupported: workflowForProject(workflow).batchSupported !== false,
    ...workflowPaths(workflow, slug),
    style: resolveStyleId({}, slug),
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
  const project = loadProject(slug, { refresh: true });
  const report = buildProjectReport(project);
  const displayStages = stagesForWorkflowProjectView(project);
  const stages = displayStages.map((stage) => {
    const definition = workflowStageDefinition(project, stage) ?? retiredStageDefinition(stage);
    const reportItem = report.stages.find((item) => item.stage === stage);
    return stageView(definition, project.state.stages[stage], artifactPresence(slug, stage, project.state.stages[stage], project), reportItem);
  });
  const succeededCount = stages.filter((stage) => stage.status === "succeeded").length;

  return {
    ...projectIdentity(slug),
    initialized: true,
    status: project.state.currentStage === "completed" ? "completed" : project.state.stages[project.state.currentStage].status,
    statusLabel: project.state.currentStage === "completed" ? "已完成" : project.state.currentStage,
    currentStage: project.state.currentStage,
    progress: Math.round((succeededCount / stages.length) * 100),
    succeededCount,
    stageCount: stages.length,
    sourceDirectory: project.config.sourceDirectory,
    remotionDirectory: project.config.remotionDirectory,
    assetArchive: project.config.assetArchive,
    renderInputDirectory: project.config.renderInputDirectory,
    workflow: project.config.workflow,
    workflowVersion: project.config.workflowVersion,
    timelineMode: workflowForProject(project).timelineMode,
    audioMode: workflowForProject(project).audioMode,
    batchSupported: workflowForProject(project).batchSupported !== false,
    style: resolveStyleId(project.config, slug),
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
