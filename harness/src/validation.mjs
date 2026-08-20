import fs from "node:fs";
import path from "node:path";

function matchesWildcard(root, relativePath) {
  const parts = relativePath.split("/");
  const wildcardIndex = parts.findIndex((part) => part.includes("*"));
  if (wildcardIndex === -1) {
    return fs.existsSync(path.join(root, relativePath));
  }

  const directory = path.join(root, ...parts.slice(0, wildcardIndex));
  if (!fs.existsSync(directory) || !fs.statSync(directory).isDirectory()) {
    return false;
  }

  const pattern = new RegExp(
    `^${parts[wildcardIndex].split("*").map((part) => part.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")).join(".*")}$`,
  );
  return fs.readdirSync(directory).some((entry) => pattern.test(entry));
}

export function validateStageArtifacts(project, stage) {
  const entries = project.artifacts.stages[stage] ?? [];
  const workspaceRoot = project.config.workspaceRoot;
  return entries
    .filter((entry) => !matchesWildcard(workspaceRoot, entry.path))
    .map((entry) => ({
      code: "missing-artifact",
      stage,
      path: entry.path,
      message: `Required artifact is missing: ${entry.path}`,
    }));
}
