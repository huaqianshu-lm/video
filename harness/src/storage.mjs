import fs from "node:fs";
import path from "node:path";
import {
  DEFAULT_WORKFLOW_ID,
  HARNESS_VERSION,
  WORKFLOW_DEFINITIONS,
  createStagesState,
  STAGES,
} from "./stages.mjs";
import { artifactManifestFor } from "./artifacts.mjs";
import { fingerprintStageArtifacts } from "./fingerprints.mjs";
import { resolveStyleId } from "./styles.mjs";

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

export function writeJson(filePath, value) {
  fs.mkdirSync(path.dirname(filePath), { recursive: true });
  fs.writeFileSync(filePath, `${JSON.stringify(value, null, 2)}\n`, "utf8");
}

export function readJson(filePath) {
  return JSON.parse(fs.readFileSync(filePath, "utf8"));
}

export function initializeProject(slug) {
  const files = projectFiles(slug);
  if (fs.existsSync(files.config) || fs.existsSync(files.state) || fs.existsSync(files.artifacts)) {
    throw new Error(`Harness project already exists: ${slug}`);
  }

  const now = new Date().toISOString();
  writeJson(files.config, {
    schemaVersion: 1,
    harnessVersion: HARNESS_VERSION,
    validationPolicy: "strict",
    slug,
    workflow: DEFAULT_WORKFLOW_ID,
    workflowVersion: WORKFLOW_DEFINITIONS[DEFAULT_WORKFLOW_ID].version,
    style: resolveStyleId({}, slug),
    target: "gate-4",
    createdAt: now,
    updatedAt: now,
    workspaceRoot: path.resolve(process.env.HARNESS_WORKSPACE_ROOT ?? repositoryRoot),
    sourceDirectory: `videos/${slug}`,
    remotionDirectory: `src/videos/${slug}`,
  });
  writeJson(files.state, {
    schemaVersion: 1,
    slug,
    currentStage: "source",
    createdAt: now,
    updatedAt: now,
    stages: createStagesState(),
  });
  writeJson(files.artifacts, {
    schemaVersion: 1,
    slug,
    generatedAt: now,
    stages: artifactManifestFor(slug),
  });

  return files;
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

export function refreshProject(project) {
  const changedStages = STAGES.filter((stage) => {
    const item = project.state.stages[stage];
    if (item.status !== "succeeded" || !item.outputFingerprint) return false;
    const currentFingerprint = fingerprintStageArtifacts(project, stage);
    return currentFingerprint !== null && currentFingerprint !== item.outputFingerprint;
  });

  if (changedStages.length === 0) return { changed: false, stage: null };

  const changedStage = changedStages[0];
  const changedIndex = STAGES.indexOf(changedStage);
  const now = new Date().toISOString();
  for (let index = changedIndex; index < STAGES.length; index += 1) {
    const stage = STAGES[index];
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
  return { changed: true, stage: changedStage };
}

export function reopenGate3ForSeriesCover(slug) {
  const files = projectFiles(slug);
  if (!fs.existsSync(files.config) || !fs.existsSync(files.state) || !fs.existsSync(files.artifacts)) return false;
  const project = loadProject(slug, { refresh: false });
  const gateIndex = STAGES.indexOf("gate-3");
  const currentIndex = project.state.currentStage === "completed"
    ? STAGES.length
    : STAGES.indexOf(project.state.currentStage);
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

  for (const stage of STAGES.slice(gateIndex + 1)) {
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
