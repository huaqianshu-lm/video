import crypto from "node:crypto";
import fs from "node:fs";
import path from "node:path";
import { STAGE_DEFINITIONS } from "./stages.mjs";

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

export function fingerprintStageArtifacts(project, stage) {
  const templates = STAGE_DEFINITIONS[stage]?.artifacts ?? [];
  if (templates.length === 0) return null;

  const hash = crypto.createHash("sha256");
  for (const template of templates) {
    const relativePath = template.replaceAll("{slug}", project.config.slug);
    for (const expandedPath of expandArtifactPaths(project.config.workspaceRoot, relativePath)) {
      hashFile(hash, project.config.workspaceRoot, expandedPath);
    }
  }
  return hash.digest("hex");
}
