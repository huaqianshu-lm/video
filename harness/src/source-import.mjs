import fs from "node:fs";
import path from "node:path";
import { initializeProject, projectDirectory } from "./storage.mjs";
import { getSeries, listSeries, saveSeries } from "./series-assets.mjs";
import { getStyleDefinition } from "./styles.mjs";

const repositoryRoot = path.resolve(new URL("../..", import.meta.url).pathname);
export const MAX_SOURCE_BYTES = 10 * 1024 * 1024;
export const SOURCE_EXTENSIONS = Object.freeze([".md", ".markdown", ".txt"]);

function workspaceRoot() {
  return path.resolve(process.env.HARNESS_WORKSPACE_ROOT ?? repositoryRoot);
}

function sourceSlugFromFilename(filename) {
  const basename = path.basename(filename ?? "");
  const extension = path.extname(basename).toLowerCase();
  const stem = extension ? basename.slice(0, -extension.length) : basename;
  return stem
    .normalize("NFKD")
    .toLowerCase()
    .replace(/['’]/g, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

export function normalizeSourceSlug(slug, filename) {
  const candidate = String(slug ?? "").trim().toLowerCase() || sourceSlugFromFilename(filename);
  if (!candidate) {
    const error = new Error("无法从文件名生成视频 slug，请手动填写只包含小写字母、数字和连字符的 slug");
    error.code = "source-slug-required";
    throw error;
  }
  if (!/^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(candidate)) {
    const error = new Error("视频 slug 只能包含小写字母、数字和连字符");
    error.code = "source-slug-invalid";
    throw error;
  }
  return candidate;
}

function validateSourceFilename(filename) {
  const basename = path.basename(String(filename ?? "")).trim();
  const extension = path.extname(basename).toLowerCase();
  if (!basename || !SOURCE_EXTENSIONS.includes(extension)) {
    const error = new Error("原文件只支持 Markdown 或纯文本格式（.md、.markdown、.txt）");
    error.code = "source-file-type-invalid";
    throw error;
  }
  return basename;
}

function validateSourceContent(content) {
  const buffer = Buffer.isBuffer(content) ? content : Buffer.from(content ?? "");
  if (buffer.length === 0) {
    const error = new Error("原文件不能为空");
    error.code = "source-file-empty";
    throw error;
  }
  if (buffer.length > MAX_SOURCE_BYTES) {
    const error = new Error("原文件不能超过 10 MB");
    error.code = "source-file-too-large";
    throw error;
  }
  try {
    new TextDecoder("utf-8", { fatal: true }).decode(buffer);
  } catch {
    const error = new Error("原文件必须是 UTF-8 文本");
    error.code = "source-file-encoding-invalid";
    throw error;
  }
  return buffer;
}

function selectedSeriesForImport(seriesId, slug) {
  const normalizedId = String(seriesId ?? "").trim();
  if (!normalizedId) return null;
  const series = getSeries(normalizedId);
  if (!series) {
    const error = new Error(`找不到所选系列：${normalizedId}`);
    error.code = "source-series-not-found";
    throw error;
  }
  if (!getStyleDefinition(series.style)) {
    const error = new Error(`系列 ${series.id} 配置了未知风格：${series.style}`);
    error.code = "source-series-style-invalid";
    throw error;
  }
  const existing = listSeries().find((item) => item.id !== series.id && item.videos.includes(slug));
  if (existing) {
    const error = new Error(`视频 ${slug} 已归入系列 ${existing.id}，不能重复归属`);
    error.code = "source-series-conflict";
    throw error;
  }
  return series;
}

export function importSourceProject({ slug, filename, content, seriesId = null }) {
  const safeFilename = validateSourceFilename(filename);
  const normalizedSlug = normalizeSourceSlug(slug, safeFilename);
  const selectedSeries = selectedSeriesForImport(seriesId, normalizedSlug);
  const sourceDirectory = path.join(workspaceRoot(), "videos", normalizedSlug);
  const harnessDirectory = projectDirectory(normalizedSlug);
  if (fs.existsSync(sourceDirectory) || fs.existsSync(harnessDirectory)) {
    const error = new Error(`视频项目已存在，拒绝覆盖：${normalizedSlug}`);
    error.code = "source-project-exists";
    throw error;
  }

  const sourceContent = validateSourceContent(content);
  const videosRoot = path.dirname(sourceDirectory);
  const sourcePath = path.join(sourceDirectory, "source.md");
  const temporaryPath = path.join(videosRoot, `.${normalizedSlug}.source-${process.pid}-${Date.now()}.tmp`);
  let initialized = false;
  fs.mkdirSync(sourceDirectory, { recursive: true });
  try {
    fs.writeFileSync(temporaryPath, sourceContent);
    fs.renameSync(temporaryPath, sourcePath);
    const files = initializeProject(normalizedSlug, { style: selectedSeries?.style ?? null });
    initialized = true;
    if (selectedSeries && !selectedSeries.videos.includes(normalizedSlug)) {
      saveSeries({ ...selectedSeries, videos: [...selectedSeries.videos, normalizedSlug] });
    }
    return {
      slug: normalizedSlug,
      sourcePath: path.relative(workspaceRoot(), sourcePath),
      originalFilename: safeFilename,
      series: selectedSeries ? { id: selectedSeries.id, title: selectedSeries.title, style: selectedSeries.style } : null,
      files,
    };
  } catch (error) {
    if (fs.existsSync(temporaryPath)) fs.rmSync(temporaryPath);
    if (initialized && fs.existsSync(harnessDirectory)) fs.rmSync(harnessDirectory, { recursive: true, force: true });
    if (fs.existsSync(sourcePath)) fs.rmSync(sourcePath);
    if (fs.existsSync(sourceDirectory) && fs.readdirSync(sourceDirectory).length === 0) fs.rmdirSync(sourceDirectory);
    throw error;
  }
}
