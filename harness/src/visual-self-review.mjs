import crypto from "node:crypto";
import fs from "node:fs";
import path from "node:path";
import { workflowForProject, workflowPaths, workflowStageDefinition, workflowStageIndex } from "./workflows/registry.mjs";

export function visualSelfReviewPath(project) {
  return `${workflowPaths(project).sourceDirectory}/visual-self-review.json`;
}

export function validateVisualSelfReview(project, stage) {
  if (project.state?.currentStage === "completed") return [];
  const index = workflowStageIndex(project, stage);
  if (index < workflowStageIndex(project, "gate-2") || index > workflowStageIndex(project, "gate-3")) return [];
  const relativePath = visualSelfReviewPath(project);
  const issues = [];
  const fail = (reason) => issues.push({ stage, code: "invalid-visual-self-review", path: relativePath, severity: "error", message: `视觉自检阻断：${reason}` });
  const root = path.resolve(project.config.workspaceRoot);
  let review;
  try {
    review = JSON.parse(fs.readFileSync(path.join(root, relativePath), "utf8"));
  } catch {
    fail("visual-self-review.json 缺失或 JSON 无效");
    return issues;
  }
  if (!review || typeof review !== "object" || Array.isArray(review)) {
    fail("记录必须为 JSON 对象");
    return issues;
  }
  const workflow = workflowForProject(project);
  if (review.schemaVersion !== 1 || review.videoSlug !== project.config.slug || review.workflow !== workflow.id) fail("schema、视频标识或 Workflow 不匹配");
  if (typeof review.reviewedAt !== "string" || !Number.isFinite(Date.parse(review.reviewedAt))) fail("缺少有效 reviewedAt");
  const prototypeStage = "visual-prototype";
  for (const [sourceStage, field] of [["visual-script", "visualScriptFingerprint"], [prototypeStage, "prototypeFingerprint"]]) {
    const sourcePath = workflowStageDefinition(project, sourceStage).artifacts[0].replaceAll("{slug}", project.config.slug);
    try {
      const hash = crypto.createHash("sha256").update(fs.readFileSync(path.join(root, sourcePath))).digest("hex");
      if (review[field] !== hash) fail(`${field} 已过期`);
    } catch {
      fail(`${sourceStage} 资料不可读`);
    }
  }
  const evidence = new Map();
  const sourceRoot = path.resolve(root, workflowPaths(project).sourceDirectory);
  let realSourceRoot;
  try { realSourceRoot = fs.realpathSync(sourceRoot); }
  catch { fail("视频资料目录不可读"); return issues; }
  for (const item of Array.isArray(review.evidence) ? review.evidence : []) {
    if (!item || typeof item.id !== "string" || !item.id.trim() || evidence.has(item.id)) {
      fail("证据 ID 缺失或重复"); continue;
    }
    if (typeof item.kind !== "string" || !item.kind.trim() || typeof item.path !== "string" || !item.path.trim() || path.isAbsolute(item.path) || item.path.includes("\\") || item.path.split("/").includes("..")) {
      fail(`证据 ${item.id} 路径或类型无效`); continue;
    }
    try {
      const target = fs.realpathSync(path.resolve(sourceRoot, item.path));
      const relative = path.relative(realSourceRoot, target);
      const stat = fs.statSync(target);
      if (relative.startsWith("..") || path.isAbsolute(relative) || !stat.isFile() || stat.size === 0) throw new Error("invalid evidence");
      evidence.set(item.id, item);
    } catch {
      fail(`证据 ${item.id} 不存在、为空或越界`);
    }
  }
  const profilePrefix = "TUTORIAL";
  for (const [field, ids] of [["checks", Array.from({ length: 6 }, (_, i) => `VC-${i + 1}`)], ["workflowChecks", Array.from({ length: 4 }, (_, i) => `${profilePrefix}-${i + 1}`)]]) {
    const checks = Array.isArray(review[field]) ? review[field] : [];
    for (const id of ids) {
      const matches = checks.filter((check) => check?.id === id);
      const check = matches[0];
      if (matches.length !== 1 || check.status !== "passed" || typeof check.note !== "string" || !check.note.trim() || !Array.isArray(check.evidenceIds) || check.evidenceIds.length === 0 || check.evidenceIds.some((key) => !evidence.has(key))) fail(`${id} 缺失、未通过或证据无效`);
    }
  }
  return issues;
}
