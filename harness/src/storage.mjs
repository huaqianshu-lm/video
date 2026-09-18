import fs from "node:fs";
import path from "node:path";
import {
  DEFAULT_WORKFLOW_ID,
  HARNESS_VERSION,
  WORKFLOW_DEFINITIONS,
} from "./stages.mjs";
import {
  createWorkflowStagesState,
  allWorkflowDefinitions,
  getWorkflowDefinition,
  requireWorkflowDefinition,
  workflowPaths,
  workflowStages,
} from "./workflows/registry.mjs";
import { artifactManifestFor } from "./artifacts.mjs";
import { fingerprintStageArtifacts } from "./fingerprints.mjs";
import { resolveStyleId } from "./styles.mjs";
import { validateProjectStage } from "./validation.mjs";

const repositoryRoot = path.resolve(new URL("../..", import.meta.url).pathname);

export function projectsRoot() {
  return path.resolve(process.env.HARNESS_PROJECTS_DIR ?? path.join(repositoryRoot, "harness", "projects"));
}

export function projectDirectory(slug) {
  return path.join(projectsRoot(), slug);
}

export function projectFiles(slug) {
  const directory = projectDirectory(slug);
  return {
    directory,
    config: path.join(directory, "project.json"),
    state: path.join(directory, "state.json"),
    artifacts: path.join(directory, "artifacts.json"),
  };
}

function completedProjectError(slug, operation = "修改") {
  const error = new Error(`视频 ${slug} 已完成并永久只读，禁止${operation}。`);
  error.code = "completed-project-readonly";
  error.slug = slug;
  error.operation = operation;
  return error;
}

function projectSlugForPath(filePath) {
  const root = path.resolve(projectsRoot());
  const relative = path.relative(root, path.resolve(filePath));
  if (!relative || relative.startsWith("..") || path.isAbsolute(relative)) return null;
  const [slug] = relative.split(path.sep);
  return slug || null;
}

function existingProjectState(slug) {
  if (!slug) return null;
  const statePath = projectFiles(slug).state;
  if (!fs.existsSync(statePath) || !fs.statSync(statePath).isFile()) return null;
  try {
    return readJson(statePath);
  } catch {
    return null;
  }
}

export function isCompletedProject(projectOrSlug) {
  const slug = typeof projectOrSlug === "string"
    ? projectOrSlug
    : projectOrSlug?.config?.slug ?? projectOrSlug?.state?.slug;
  const inMemoryCompleted = typeof projectOrSlug === "string"
    ? false
    : projectOrSlug?.state?.currentStage === "completed";
  return inMemoryCompleted || existingProjectState(slug)?.currentStage === "completed";
}

export function assertProjectMutable(projectOrSlug, operation = "修改") {
  const slug = typeof projectOrSlug === "string"
    ? projectOrSlug
    : projectOrSlug?.config?.slug ?? projectOrSlug?.state?.slug;
  if (isCompletedProject(projectOrSlug)) throw completedProjectError(slug, operation);
  return projectOrSlug;
}

export function assertProjectSlugMutable(slug, operation = "修改") {
  if (isCompletedProject(slug)) throw completedProjectError(slug, operation);
  return slug;
}

export function writeJson(filePath, value) {
  const slug = projectSlugForPath(filePath);
  if (slug && isCompletedProject(slug)) throw completedProjectError(slug, "写入项目及其相关产物");
  fs.mkdirSync(path.dirname(filePath), { recursive: true });
  fs.writeFileSync(filePath, `${JSON.stringify(value, null, 2)}\n`, "utf8");
}

export function readJson(filePath) {
  return JSON.parse(fs.readFileSync(filePath, "utf8"));
}

export function initializeProject(slug, {
  style = null,
  prototypeBaseline = "codex-v1",
  workflow = DEFAULT_WORKFLOW_ID,
  workflowVersion = null,
} = {}) {
  const files = projectFiles(slug);
  if (fs.existsSync(files.config) || fs.existsSync(files.state) || fs.existsSync(files.artifacts)) {
    throw new Error(`Harness project already exists: ${slug}`);
  }

  const requestedWorkflowVersion = workflowVersion
    ?? (workflow === DEFAULT_WORKFLOW_ID
      ? WORKFLOW_DEFINITIONS[DEFAULT_WORKFLOW_ID].version
      : getWorkflowDefinition(workflow)?.version ?? null);
  const workflowDefinition = requireWorkflowDefinition({
    workflow,
    workflowVersion: requestedWorkflowVersion ?? undefined,
  });
  const workspaceRoot = path.resolve(process.env.HARNESS_WORKSPACE_ROOT ?? repositoryRoot);
  const conflictingWorkflowPath = Object.values(allWorkflowDefinitions())
    .filter((definition) => definition.id !== workflowDefinition.id)
    .flatMap((definition) => {
      const candidate = workflowPaths(definition, slug);
      return [candidate.sourceDirectory, candidate.remotionDirectory];
    })
    .map((relativePath) => path.join(workspaceRoot, relativePath))
    .find((candidate) => fs.existsSync(candidate));
  if (conflictingWorkflowPath) {
    const error = new Error(`视频 slug ${slug} 已被其他 Workflow 使用：${path.relative(workspaceRoot, conflictingWorkflowPath)}`);
    error.code = "workflow-slug-conflict";
    error.slug = slug;
    error.path = path.relative(workspaceRoot, conflictingWorkflowPath);
    throw error;
  }
  const persistedWorkflowVersion = requestedWorkflowVersion ?? workflowDefinition.version;
  const paths = workflowPaths(workflowDefinition, slug);
  const now = new Date().toISOString();
  const config = {
    schemaVersion: 1,
    harnessVersion: HARNESS_VERSION,
    validationPolicy: "strict",
    prototypeBaseline,
    slug,
    workflow,
    workflowVersion: persistedWorkflowVersion,
    style: resolveStyleId(style ? { style } : {}, slug),
    target: workflowDefinition.stages.at(-1),
    createdAt: now,
    updatedAt: now,
    workspaceRoot: path.resolve(process.env.HARNESS_WORKSPACE_ROOT ?? repositoryRoot),
    ...paths,
  };
  writeJson(files.config, {
    ...config,
  });
  writeJson(files.state, {
    schemaVersion: 1,
    slug,
    currentStage: "source",
    createdAt: now,
    updatedAt: now,
    stages: createWorkflowStagesState({ config }),
  });
  writeJson(files.artifacts, {
    schemaVersion: 1,
    slug,
    generatedAt: now,
    stages: artifactManifestFor({ config }),
  });

  return files;
}

export function applySeriesStyle(slug, style) {
  const files = projectFiles(slug);
  if (!fs.existsSync(files.config) || !fs.existsSync(files.state) || !fs.existsSync(files.artifacts)) {
    return { changed: false, restartedAt: null };
  }

  const project = loadProject(slug, { refresh: false });
  const needsBaseline = project.config.prototypeBaseline !== "codex-v1";
  if (project.config.style === style && !needsBaseline) return { changed: false, restartedAt: null };
  assertProjectMutable(project, "应用系列风格");

  const now = new Date().toISOString();
  const stages = workflowStages(project);
  project.config.style = style;
  project.config.prototypeBaseline = "codex-v1";
  project.config.updatedAt = now;
  writeJson(project.files.config, project.config);

  const restartAt = "visual-script";
  const restartIndex = stages.indexOf(restartAt);
  const currentIndex = project.state.currentStage === "completed"
    ? stages.length
    : stages.indexOf(project.state.currentStage);
  if (currentIndex < restartIndex) return { changed: true, restartedAt: null };

  for (const stage of stages.slice(restartIndex)) {
    const item = project.state.stages[stage];
    item.status = stage === restartAt ? "ready" : "invalidated";
    item.error = null;
    item.invalidatedBy = "series-style";
    item.outputs = [];
    item.review = null;
    item.outputFingerprint = null;
    item.updatedAt = now;
  }
  project.state.currentStage = restartAt;
  saveState(project);
  return { changed: true, restartedAt: restartAt };
}

export function loadProject(slug, { refresh = true } = {}) {
  const files = projectFiles(slug);
  if (!fs.existsSync(files.config) || !fs.existsSync(files.state) || !fs.existsSync(files.artifacts)) {
    throw new Error(`Harness project is not initialized: ${slug}`);
  }
  const project = {
    files,
    config: readJson(files.config),
    state: readJson(files.state),
    artifacts: readJson(files.artifacts),
  };
  if (refresh) refreshProject(project);
  return project;
}

function saveState(project) {
  project.state.updatedAt = new Date().toISOString();
  writeJson(project.files.state, project.state);
}

export function reconcileCurrentRemotionOutput(project) {
  assertProjectMutable(project, "恢复 Remotion 产物状态");
  const stages = workflowStages(project);
  const remotion = project.state.stages.remotion;
  const gate = project.state.stages["gate-3"];
  const isStaleRemotionState = project.state.currentStage === "remotion"
    && remotion?.status === "ready"
    && remotion.invalidatedBy === null
    && gate?.status === "invalidated"
    && gate.invalidatedBy === "remotion";
  if (!isStaleRemotionState) return { changed: false };

  const issues = validateProjectStage(project, "remotion");
  if (issues.length > 0) return { changed: false, issues };

  const outputFingerprint = fingerprintStageArtifacts(project, "remotion");
  if (!outputFingerprint) return { changed: false, issues: [{ code: "missing-remotion-output-fingerprint", stage: "remotion" }] };

  const now = new Date().toISOString();
  remotion.status = "succeeded";
  remotion.error = null;
  remotion.invalidatedBy = null;
  remotion.rebuildBaselineFingerprint = null;
  remotion.outputs = [];
  remotion.review = null;
  remotion.remote = null;
  remotion.outputFingerprint = outputFingerprint;
  remotion.updatedAt = now;

  gate.status = "waiting";
  gate.outputs = [];
  gate.review = null;
  gate.error = null;
  gate.invalidatedBy = null;
  gate.rebuildBaselineFingerprint = null;
  gate.outputFingerprint = null;
  gate.updatedAt = now;

  for (const stage of stages.slice(stages.indexOf("gate-3") + 1)) {
    const item = project.state.stages[stage];
    item.status = "invalidated";
    item.outputs = [];
    item.review = null;
    item.error = null;
    item.invalidatedBy = "gate-3";
    item.rebuildBaselineFingerprint = null;
    item.outputFingerprint = null;
    item.updatedAt = now;
  }
  project.state.currentStage = "gate-3";
  saveState(project);

  return {
    changed: true,
    stage: "remotion",
    status: "succeeded",
    nextStage: "gate-3",
    outputFingerprint,
  };
}

export function refreshProject(project) {
  if (isCompletedProject(project)) return { changed: false, stage: null, readOnly: true };
  const stages = workflowStages(project);

  const changedStages = stages.filter((stage) => {
    const item = project.state.stages[stage];
    if (item.status !== "succeeded" || !item.outputFingerprint) return false;
    const currentFingerprint = fingerprintStageArtifacts(project, stage);
    return currentFingerprint !== null && currentFingerprint !== item.outputFingerprint;
  });

  if (changedStages.length === 0) {
    const reconciled = reconcileCurrentRemotionOutput(project);
    return reconciled.changed
      ? { changed: true, stage: "remotion", reconciled: true }
      : { changed: false, stage: null };
  }

  const changedStage = changedStages[0];
  const changedIndex = stages.indexOf(changedStage);
  const now = new Date().toISOString();
  for (let index = changedIndex; index < stages.length; index += 1) {
    const stage = stages[index];
    const item = project.state.stages[stage];
    item.status = stage === changedStage ? "ready" : "invalidated";
    item.error = null;
    item.invalidatedBy = stage === changedStage ? null : changedStage;
    item.outputs = [];
    item.review = null;
    item.outputFingerprint = null;
    item.updatedAt = now;
  }
  project.state.currentStage = changedStage;
  saveState(project);
  const reconciled = changedStage === "remotion" ? reconcileCurrentRemotionOutput(project) : { changed: false };
  return { changed: true, stage: changedStage, reconciled: reconciled.changed };
}

export function reopenGate3ForSeriesCover(slug) {
  const files = projectFiles(slug);
  if (!fs.existsSync(files.config) || !fs.existsSync(files.state) || !fs.existsSync(files.artifacts)) return false;
  const project = loadProject(slug, { refresh: false });
  assertProjectMutable(project, "因系列封面重开 Gate 3");
  const stages = workflowStages(project);
  const gateIndex = stages.indexOf("gate-3");
  const currentIndex = project.state.currentStage === "completed"
    ? stages.length
    : stages.indexOf(project.state.currentStage);
  if (currentIndex < gateIndex) return false;

  const now = new Date().toISOString();
  const gate = project.state.stages["gate-3"];
  gate.status = "waiting";
  gate.outputs = [];
  gate.review = null;
  gate.error = null;
  gate.invalidatedBy = "series-cover";
  gate.outputFingerprint = null;
  gate.updatedAt = now;

  for (const stage of stages.slice(gateIndex + 1)) {
    const item = project.state.stages[stage];
    item.status = "invalidated";
    item.outputs = [];
    item.review = null;
    item.error = null;
    item.invalidatedBy = "series-cover";
    item.outputFingerprint = null;
    item.updatedAt = now;
  }
  project.state.currentStage = "gate-3";
  saveState(project);
  return true;
}
