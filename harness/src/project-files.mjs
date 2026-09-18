import fs from "node:fs";
import path from "node:path";
import { getVideoProject } from "./project-view.mjs";
import { workflowForProject, workflowStageDefinitions } from "./workflows/registry.mjs";

const repositoryRoot = path.resolve(new URL("../..", import.meta.url).pathname);

function workspaceRoot() {
  return path.resolve(process.env.HARNESS_WORKSPACE_ROOT ?? repositoryRoot);
}

function pathEntry(relativePath, stage, label, kind = "document", workspace = workspaceRoot()) {
  const absolutePath = path.resolve(workspace, relativePath);
  return {
    path: relativePath,
    stage,
    label,
    kind,
    present: fs.existsSync(absolutePath) && fs.statSync(absolutePath).isFile(),
  };
}

function expandArtifactPath(relativePath, workspace) {
  const parts = relativePath.split("/");
  const wildcardIndex = parts.findIndex((part) => part.includes("*"));
  if (wildcardIndex < 0) return [relativePath];
  const directory = path.join(workspace, ...parts.slice(0, wildcardIndex));
  if (!fs.existsSync(directory) || !fs.statSync(directory).isDirectory()) return [relativePath];
  const pattern = new RegExp(`^${parts[wildcardIndex].split("*").map((part) => part.replace(/[.*+?^${}()|[\\]\\\\]/g, "\\\\$&")).join(".*")}$`);
  return fs.readdirSync(directory)
    .filter((entry) => pattern.test(entry))
    .sort()
    .map((entry) => path.posix.join(...parts.slice(0, wildcardIndex), entry, ...parts.slice(wildcardIndex + 1)));
}

function fileLabel(stage, relativePath) {
  const labels = {
    source: "原始内容",
    "content-analysis": "内容分析",
    "video-narrative": "视频叙事",
    "promo-brief": "Promo Brief",
    "creative-concept": "Creative Concept",
    "scene-script": "Scene 脚本",
    "narration-script": "口播稿",
    "visual-script": "视觉脚本",
    "visual-prototype": "视觉原型",
    "motion-prototype": "Motion Prototype",
    "tts": "TTS 输入",
    "subtitle-timeline": "音频／字幕／Timeline Manifest",
    "asset-preparation": "Asset Manifest",
    "visual-timeline": "Visual Timeline",
    remotion: "Remotion 产物",
  };
  if (relativePath.endsWith("video.config.ts")) return "Remotion 配置";
  if (relativePath.endsWith("remotion-alignment.json")) return "Remotion 对齐清单";
  if (relativePath.endsWith("audio-manifest.json")) return "音频 Manifest";
  if (relativePath.endsWith("subtitle-manifest.json")) return "字幕 Manifest";
  if (relativePath.endsWith("timeline-manifest.json")) return "Timeline Manifest";
  return labels[stage] ?? relativePath.split("/").at(-1);
}

function projectConfigForView(projectView, slug) {
  return {
    slug,
    workflow: projectView.workflow ?? "default",
    workflowVersion: projectView.workflowVersion ?? 2,
    workspaceRoot: workspaceRoot(),
    sourceDirectory: projectView.sourceDirectory,
    remotionDirectory: projectView.remotionDirectory,
  };
}

export function listProjectFiles(slug) {
  const projectView = getVideoProject(slug);
  if (!projectView) return null;
  const config = projectConfigForView(projectView, slug);
  const definitions = workflowStageDefinitions({ config });
  const entries = [];
  const seen = new Set();
  for (const [stage, definition] of Object.entries(definitions)) {
    for (const template of definition.artifacts ?? []) {
      for (const relativePath of expandArtifactPath(template.replaceAll("{slug}", slug), config.workspaceRoot)) {
        if (relativePath.startsWith("out/") || seen.has(relativePath)) continue;
        seen.add(relativePath);
        const kind = relativePath.startsWith(config.remotionDirectory) ? "remotion" : relativePath.endsWith("manifest.json") ? "manifest" : "document";
        entries.push(pathEntry(relativePath, stage, fileLabel(stage, relativePath), kind, config.workspaceRoot));
      }
    }
  }
  return entries;
}

export function getProjectFile(slug, relativePath) {
  const entry = listProjectFiles(slug)?.find((item) => item.path === relativePath);
  if (!entry || !entry.present) return null;

  const absolutePath = path.resolve(workspaceRoot(), entry.path);
  return {
    ...entry,
    content: fs.readFileSync(absolutePath, "utf8"),
  };
}

export function getProjectPrototype(slug) {
  const project = getVideoProject(slug);
  if (!project) return null;
  const stage = workflowForProject({ config: { workflow: project.workflow, workflowVersion: project.workflowVersion } }).timelineMode === "visual-beats"
    ? "motion-prototype"
    : "visual-prototype";
  const prototype = listProjectFiles(slug)?.find((item) => item.stage === stage && item.present && item.path.endsWith(".html"));
  return prototype ? getProjectFile(slug, prototype.path) : null;
}
