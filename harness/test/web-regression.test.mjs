import test from "node:test";
import assert from "node:assert/strict";
import crypto from "node:crypto";
import fs from "node:fs";
import path from "node:path";
import { artifactManifestFor } from "../src/artifacts.mjs";
import { getProjectFile, listProjectFiles } from "../src/project-files.mjs";
import { getVideoProject, listVideoProjects } from "../src/project-view.mjs";
import { validateProjectStage } from "../src/validation.mjs";
import { allWorkflowDefinitions, workflowStages } from "../src/workflows/registry.mjs";

const repositoryRoot = path.resolve(new URL("../..", import.meta.url).pathname);

function directorySlugs(directory) {
  if (!fs.existsSync(directory)) return [];
  return fs.readdirSync(directory, { withFileTypes: true })
    .filter((entry) => entry.isDirectory() && /^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(entry.name))
    .map((entry) => entry.name);
}

const workflowNamespaces = new Set(Object.values(allWorkflowDefinitions())
  .map((definition) => definition.pathNamespace)
  .filter(Boolean));

const realVideoSlugs = [...new Set([
  ...directorySlugs(path.join(repositoryRoot, "videos")).filter((slug) => !workflowNamespaces.has(slug)),
  ...directorySlugs(path.join(repositoryRoot, "src", "videos")).filter((slug) => !workflowNamespaces.has(slug)),
  ...[...workflowNamespaces].flatMap((namespace) => [
    ...directorySlugs(path.join(repositoryRoot, "videos", namespace)),
    ...directorySlugs(path.join(repositoryRoot, "src", "videos", namespace)),
  ]),
])].sort();

function videoRoots(slug) {
  const namespace = [...workflowNamespaces].find((candidate) =>
    fs.existsSync(path.join(repositoryRoot, "videos", candidate, slug))
    || fs.existsSync(path.join(repositoryRoot, "src", "videos", candidate, slug)),
  );
  const relativePath = namespace ? path.join(namespace, slug) : slug;
  return [
    path.join(repositoryRoot, "videos", relativePath),
    path.join(repositoryRoot, "src", "videos", relativePath),
  ];
}

function snapshotTree(root) {
  if (!fs.existsSync(root)) return null;
  const hash = crypto.createHash("sha256");
  const files = [];
  function visit(directory) {
    for (const entry of fs.readdirSync(directory, { withFileTypes: true }).sort((left, right) => left.name.localeCompare(right.name))) {
      const absolutePath = path.join(directory, entry.name);
      if (entry.isDirectory()) visit(absolutePath);
      else if (entry.isFile()) {
        const relativePath = path.relative(root, absolutePath);
        const content = fs.readFileSync(absolutePath);
        hash.update(relativePath);
        hash.update(content);
        files.push(relativePath);
      }
    }
  }
  visit(root);
  return { files, digest: hash.digest("hex") };
}

test("Web UI data readers pass read-only regression for real video projects", () => {
  const roots = realVideoSlugs.flatMap(videoRoots);
  const before = roots.map(snapshotTree);
  const projects = listVideoProjects();
  const listedSlugs = projects.map((project) => project.slug);

  assert.deepEqual([...listedSlugs].sort(), realVideoSlugs);
  const sequences = projects.map((project) => project.sequence);
  const sortedSequences = [...sequences].sort((left, right) => {
    if (left === null) return 1;
    if (right === null) return -1;
    return left - right;
  });
  assert.deepEqual(sequences, sortedSequences);

  for (const slug of realVideoSlugs) {
    assert.ok(listedSlugs.includes(slug), `${slug} is missing from project list`);
    const project = getVideoProject(slug);
    assert.equal(project.slug, slug);
    assert.ok(project.sequence === null || typeof project.sequence === "number");
    const config = JSON.parse(fs.readFileSync(path.join(repositoryRoot, "harness", "projects", slug, "project.json"), "utf8"));
    const state = JSON.parse(fs.readFileSync(path.join(repositoryRoot, "harness", "projects", slug, "state.json"), "utf8"));
    const expectedStageCount = config.workflowVersion < 2 && state.stages["smoke-render"]
      ? 15
      : workflowStages({ config }).length;
    assert.equal(project.stages.length, expectedStageCount);

    const files = listProjectFiles(slug).filter((file) => file.present);
    assert.ok(files.some((file) => file.path.endsWith("source.md")));
    assert.ok(getProjectFile(slug, files[0].path)?.content);

    const legacyProject = {
      config: { slug, workspaceRoot: repositoryRoot, validationPolicy: "legacy" },
      artifacts: { stages: artifactManifestFor(slug) },
    };
    const issues = ["scene-script", "narration-script", "tts", "subtitle-timeline", "visual-prototype", "remotion"]
      .flatMap((stage) => validateProjectStage(legacyProject, stage));
    assert.ok(Array.isArray(issues));
  }

  assert.deepEqual(roots.map(snapshotTree), before);
});
