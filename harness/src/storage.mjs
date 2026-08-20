import fs from "node:fs";
import path from "node:path";
import { HARNESS_VERSION, createStagesState } from "./stages.mjs";
import { artifactManifestFor } from "./artifacts.mjs";

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
    slug,
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

export function loadProject(slug) {
  const files = projectFiles(slug);
  if (!fs.existsSync(files.config) || !fs.existsSync(files.state) || !fs.existsSync(files.artifacts)) {
    throw new Error(`Harness project is not initialized: ${slug}`);
  }
  return {
    files,
    config: readJson(files.config),
    state: readJson(files.state),
    artifacts: readJson(files.artifacts),
  };
}
