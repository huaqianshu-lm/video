import crypto from "node:crypto";
import fs from "node:fs";
import path from "node:path";
import { readJson, writeJson } from "./storage.mjs";

export const REMOTION_ALIGNMENT_SCHEMA_VERSION = 1;

export function remotionAlignmentPath(project) {
  return `videos/${project.config.slug}/remotion-alignment.json`;
}

export function prototypeBaselinePath(project) {
  return project.files?.directory ? path.join(project.files.directory, "prototype-baseline.json") : null;
}

function hashText(text) {
  return crypto.createHash("sha256").update(text).digest("hex");
}

function readWorkspaceText(project, relativePath) {
  const absolutePath = path.join(project.config.workspaceRoot, relativePath);
  if (!fs.existsSync(absolutePath) || !fs.statSync(absolutePath).isFile()) return null;
  return fs.readFileSync(absolutePath, "utf8");
}

function markdownSceneIds(text) {
  return [...text.matchAll(/^#{1,6}\s+Scene\s+(\d+)/gim)].map((match) => match[1].padStart(2, "0"));
}

function prototypeSceneIds(text) {
  const explicit = [...text.matchAll(/<section\b[^>]*(?:data-scene(?:-id)?|id)=["'][^"']*?(\d+)[^"']*["'][^>]*class=["'][^"']*\bscene\b|<section\b[^>]*class=["'][^"']*\bscene\b[^>]*(?:data-scene(?:-id)?|id)=["'][^"']*?(\d+)[^"']*["']/gi)]
    .map((match) => (match[1] ?? match[2]).padStart(2, "0"));
  if (explicit.length > 0) return explicit;
  return [...text.matchAll(/<section\b[^>]*class=["'][^"']*\bscene\b/gi)]
    .map((_, index) => String(index + 1).padStart(2, "0"));
}

export function buildPrototypeBaseline(project) {
  const visualScriptPath = `videos/${project.config.slug}/visual-script.md`;
  const prototypePath = `videos/${project.config.slug}/visual-prototype.html`;
  const visualScript = readWorkspaceText(project, visualScriptPath);
  const prototype = readWorkspaceText(project, prototypePath);
  if (visualScript === null || prototype === null) {
    throw new Error("Gate 2 无法冻结：Visual Script 或 Visual Prototype 不存在");
  }
  const visualSceneIds = markdownSceneIds(visualScript);
  const prototypeIds = prototypeSceneIds(prototype);
  if (visualSceneIds.length === 0 || visualSceneIds.join(",") !== prototypeIds.join(",")) {
    throw new Error("Gate 2 无法冻结：Visual Script 与 Visual Prototype 的 Scene 不一致");
  }
  return {
    schemaVersion: REMOTION_ALIGNMENT_SCHEMA_VERSION,
    kind: "prototype-baseline",
    slug: project.config.slug,
    frozenAt: new Date().toISOString(),
    visualScript: { path: visualScriptPath, fingerprint: hashText(visualScript) },
    visualPrototype: { path: prototypePath, fingerprint: hashText(prototype) },
    sceneIds: visualSceneIds,
  };
}

export function freezePrototypeBaseline(project) {
  const baseline = buildPrototypeBaseline(project);
  const remotionDirectory = path.join(project.config.workspaceRoot, "src", "videos", project.config.slug);
  const hasExistingImplementation = fs.existsSync(path.join(remotionDirectory, "video.config.ts"))
    && fs.existsSync(remotionDirectory)
    && fs.readdirSync(remotionDirectory).some((entry) => entry.endsWith("Video.tsx"));
  baseline.alignmentRequired = !hasExistingImplementation;
  writeJson(prototypeBaselinePath(project), baseline);
  return baseline;
}

export function getPrototypeBaseline(project) {
  const filePath = prototypeBaselinePath(project);
  return filePath && fs.existsSync(filePath) ? readJson(filePath) : null;
}

export function getRemotionAlignment(project) {
  const relativePath = remotionAlignmentPath(project);
  const absolutePath = path.join(project.config.workspaceRoot, relativePath);
  if (!fs.existsSync(absolutePath) || !fs.statSync(absolutePath).isFile()) return null;
  try {
    return readJson(absolutePath);
  } catch (error) {
    return { parseError: error instanceof Error ? error.message : String(error) };
  }
}

function alignmentIssue(code, message, issuePath = null, severity = "error") {
  return { code, stage: "remotion", path: issuePath, message, severity };
}

export function validateRemotionAlignment(project) {
  const baseline = getPrototypeBaseline(project);
  const relativePath = remotionAlignmentPath(project);
  if (!baseline) {
    return [];
  }

  let current;
  try {
    current = buildPrototypeBaseline(project);
  } catch (error) {
    return [alignmentIssue("prototype-baseline-invalid", error instanceof Error ? error.message : String(error))];
  }
  const issues = [];
  if (current.visualScript.fingerprint !== baseline.visualScript?.fingerprint
    || current.visualPrototype.fingerprint !== baseline.visualPrototype?.fingerprint) {
    issues.push(alignmentIssue("prototype-baseline-stale", "Gate 2 后 Visual Script 或 Visual Prototype 已变化，必须重新确认 Gate 2。"));
  }

  const alignment = getRemotionAlignment(project);
  if (!alignment) {
    if (baseline.alignmentRequired === false) return issues;
    issues.push(alignmentIssue("missing-remotion-alignment", `缺少 Remotion 对齐清单：${relativePath}`, relativePath));
    return issues;
  }
  if (alignment.parseError) {
    issues.push(alignmentIssue("invalid-remotion-alignment-json", `无法解析 Remotion 对齐清单：${alignment.parseError}`, relativePath));
    return issues;
  }
  if (alignment.schemaVersion !== REMOTION_ALIGNMENT_SCHEMA_VERSION || alignment.slug !== project.config.slug) {
    issues.push(alignmentIssue("invalid-remotion-alignment-schema", "Remotion 对齐清单的 schemaVersion 或 slug 无效。", relativePath));
  }
  if (alignment.prototypeFingerprint !== baseline.visualPrototype.fingerprint
    || alignment.visualScriptFingerprint !== baseline.visualScript.fingerprint) {
    issues.push(alignmentIssue("remotion-alignment-fingerprint-mismatch", "Remotion 对齐清单未引用当前 Gate 2 冻结指纹。", relativePath));
  }

  const rootPath = "src/Root.tsx";
  const rootSource = readWorkspaceText(project, rootPath);
  if (rootSource === null || !rootSource.includes(project.config.slug)) {
    issues.push(alignmentIssue("composition-not-registered", `Remotion Composition 未在 ${rootPath} 注册：${project.config.slug}`, rootPath));
  }

  const scenes = Array.isArray(alignment.scenes) ? alignment.scenes : [];
  const actualIds = scenes.map((scene) => String(scene.sceneId ?? "").padStart(2, "0"));
  if (actualIds.join(",") !== baseline.sceneIds.join(",")) {
    issues.push(alignmentIssue("remotion-alignment-scene-mismatch", "Remotion 对齐清单未按顺序覆盖全部 Scene。", relativePath));
  }
  for (const scene of scenes) {
    const sceneId = String(scene.sceneId ?? "").padStart(2, "0");
    if (typeof scene.layout !== "string" || !scene.layout.trim()) {
      issues.push(alignmentIssue("remotion-alignment-layout-missing", `Scene ${sceneId} 缺少布局对齐说明。`, relativePath));
    }
    if (!Array.isArray(scene.visualEvents) || scene.visualEvents.length === 0) {
      issues.push(alignmentIssue("remotion-alignment-events-missing", `Scene ${sceneId} 缺少视觉事件对齐。`, relativePath));
    }
    if (!Array.isArray(scene.screenText)) {
      issues.push(alignmentIssue("remotion-alignment-text-missing", `Scene ${sceneId} 缺少屏幕文字清单。`, relativePath));
    }
    if (!Array.isArray(scene.implementationFiles) || scene.implementationFiles.length === 0) {
      issues.push(alignmentIssue("remotion-alignment-files-missing", `Scene ${sceneId} 缺少实现文件。`, relativePath));
      continue;
    }
    for (const implementationFile of scene.implementationFiles) {
      if (typeof implementationFile !== "string"
        || !implementationFile.startsWith("src/")
        || !fs.existsSync(path.join(project.config.workspaceRoot, implementationFile))) {
        issues.push(alignmentIssue("remotion-alignment-file-not-found", `Scene ${sceneId} 引用的实现文件不存在：${implementationFile}`, relativePath));
      }
    }
  }
  return issues;
}

export function buildAlignmentView(project) {
  const baseline = getPrototypeBaseline(project);
  const alignment = getRemotionAlignment(project);
  return {
    baseline,
    alignment,
    issues: baseline
      ? validateRemotionAlignment(project)
      : [alignmentIssue("prototype-baseline-missing", "该项目在对齐契约启用前已通过 Gate 2，Gate 3 需人工加强核对。", null, "warning")],
    studioUrl: process.env.HARNESS_REMOTION_STUDIO_URL ?? "http://127.0.0.1:3000",
  };
}
