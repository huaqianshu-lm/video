import fs from "node:fs";
import path from "node:path";

export function matchesArtifactPath(root, relativePath) {
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
