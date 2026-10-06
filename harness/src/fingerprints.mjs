import { storyboardReview } from "./storyboard.mjs";
import crypto from "node:crypto";
import fs from "node:fs";
import path from "node:path";
import { workflowStageDefinition } from "./workflows/registry.mjs";
import { usesUnifiedProduction, usesStoryboardProduction } from "./production-contract.mjs";

function expandArtifactPaths(root, relativePath) {
  const parts = relativePath.split("/");
  const wildcardIndex = parts.findIndex((part) => part.includes("*"));
  if (wildcardIndex === -1) return [relativePath];

  const directory = path.join(root, ...parts.slice(0, wildcardIndex));
  if (!fs.existsSync(directory) || !fs.statSync(directory).isDirectory()) return [relativePath];

  const pattern = new RegExp(
    `^${parts[wildcardIndex].split("*").map((part) => part.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")).join(".*")}$`,
  );
  return fs.readdirSync(directory)
    .filter((entry) => pattern.test(entry))
    .sort()
    .map((entry) => path.posix.join(...parts.slice(0, wildcardIndex), entry, ...parts.slice(wildcardIndex + 1)));
}

function hashFile(hash, root, relativePath) {
  const absolutePath = path.join(root, relativePath);
  hash.update(`path:${relativePath}\n`);
  if (!fs.existsSync(absolutePath) || !fs.statSync(absolutePath).isFile()) {
    hash.update("missing\n");
    return;
  }
  hash.update(fs.readFileSync(absolutePath));
  hash.update("\n");
}

function hashDirectory(hash, root, relativePath) {
  const directory = path.join(root, relativePath);
  if (!fs.existsSync(directory)) { hash.update(`missing-directory:${relativePath}\n`); return; }
  if (fs.lstatSync(directory).isSymbolicLink()) { hash.update(`symlink:${relativePath}\n`); return; }
  for (const entry of fs.readdirSync(directory).sort()) {
    const child = path.posix.join(relativePath, entry);
    const stat = fs.lstatSync(path.join(root, child));
    if (stat.isSymbolicLink()) hash.update(`symlink:${child}\n`);
    else if (stat.isDirectory()) hashDirectory(hash, root, child);
    else if (stat.isFile()) hashFile(hash, root, child);
  }
}

export function fingerprintStageArtifacts(project, stage) {
  if (usesStoryboardProduction(project) && stage === "storyboard") return storyboardReview(project).reviewVersion;
  const templates = workflowStageDefinition(project, stage)?.artifacts ?? [];
  if (templates.length === 0) return null;

  const hash = crypto.createHash("sha256");
  for (const template of templates) {
    const relativePath = template.replaceAll("{slug}", project.config.slug);
    for (const expandedPath of expandArtifactPaths(project.config.workspaceRoot, relativePath)) {
      hashFile(hash, project.config.workspaceRoot, expandedPath);
    }
  }
  if (usesUnifiedProduction(project) && stage === "subtitle-timeline") {
    for (const directory of ["audio", "subtitles"]) hashDirectory(hash, project.config.workspaceRoot, `${project.config.remotionDirectory}/generated/${directory}`);
  }
  if (usesUnifiedProduction(project) && stage === "remotion") {
    const directory = path.join(project.config.workspaceRoot, project.config.remotionDirectory);
    if (fs.existsSync(directory)) for (const file of fs.readdirSync(directory).sort()) {
      if (/\.(tsx?|json)$/.test(file)) hashFile(hash, project.config.workspaceRoot, `${project.config.remotionDirectory}/${file}`);
    }
  }
  return hash.digest("hex");
}

export function fingerprintTaskInputs(project, stages) {
  const first = workflowStageDefinition(project, stages[0]).order;
  const inputs = Object.entries(project.state.stages)
    .filter(([stage, item]) => item.order < first && !stages.includes(stage))
    .map(([stage, item]) => [stage, fingerprintStageArtifacts(project, stage), item.review]);
  const hash = crypto.createHash("sha256").update(JSON.stringify({ config: project.config, inputs }));
  if (usesUnifiedProduction(project)) {
    hashFile(hash, project.config.workspaceRoot, `${project.config.sourceDirectory}/cover.json`);
    const cover = project.config.seriesSelection;
    if (cover?.mode === "series" && /^local-assets\/[a-z0-9-]+\/cover\/[a-f0-9]{64}\.(png|jpg|webp)$/.test(cover.src ?? "")) hashFile(hash, project.config.workspaceRoot, `public/${cover.src}`);
  }
  return hash.digest("hex");
}
