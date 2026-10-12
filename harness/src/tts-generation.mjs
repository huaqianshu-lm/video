import crypto from "node:crypto";
import fs from "node:fs";
import path from "node:path";
import { writeJson } from "./storage.mjs";

function invalid(message) {
  throw Object.assign(new Error(`TTS 生成记录无效：${message}`), { code: "tts-generation-invalid" });
}

function digest(bytes) {
  return crypto.createHash("sha256").update(bytes).digest("hex");
}

export function ttsScriptFingerprint(root, slug) {
  return digest(fs.readFileSync(path.join(root, "videos", slug, "tts-script.json")));
}

export function ttsGenerationOutputs(root, slug) {
  const base = `src/videos/${slug}/generated`;
  const files = [];
  function collect(relative) {
    const absolute = path.join(root, relative);
    const stat = fs.lstatSync(absolute);
    if (stat.isSymbolicLink()) invalid("产物不能为符号链接");
    if (stat.isDirectory()) {
      for (const name of fs.readdirSync(absolute).sort()) collect(`${relative}/${name}`);
    } else {
      if (!stat.isFile() || stat.size === 0) invalid(`产物为空或不是文件：${relative}`);
      files.push({ path: relative, sha256: digest(fs.readFileSync(absolute)) });
    }
  }
  for (const item of ["audio-manifest.json", "subtitle-manifest.json", "timeline-manifest.json", "audio", "subtitles"]) collect(`${base}/${item}`);
  if (!files.some(file => file.path.startsWith(`${base}/audio/`))) invalid("缺少实际音频");
  if (!files.some(file => file.path.startsWith(`${base}/subtitles/`))) invalid("缺少实际字幕");
  return files;
}

function recordPath(slug, task) {
  if (!/^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(slug) || !/^[a-zA-Z0-9-]+$/.test(task?.id ?? "") || !Number.isInteger(task.attempt) || task.attempt < 1) invalid("任务标识或执行次数不合法");
  return `local/tts-generation/${slug}/${task.id}-${task.attempt}.json`;
}

export function readTtsGenerationRecord(root, job) {
  const relativePath = recordPath(job.slug, { id: job.id, attempt: job.attempts });
  const absolutePath = path.join(root, relativePath);
  if (!fs.existsSync(absolutePath)) return null;
  return { path: relativePath, ...JSON.parse(fs.readFileSync(absolutePath, "utf8")) };
}

export function saveTtsGenerationRecord({ root, slug, task, inputFingerprint, startedAt, cacheDirectory }) {
  const currentInput = ttsScriptFingerprint(root, slug);
  if (currentInput !== inputFingerprint) invalid("生成期间冻结输入发生变化");
  const outputs = ttsGenerationOutputs(root, slug);
  const record = {
    schemaVersion: 1, producer: "tts-harness-adapter", videoId: slug,
    taskId: task.id, attempt: task.attempt, taskInputFingerprint: task.inputFingerprint,
    taskStartedAt: task.startedAt, startedAt, completedAt: new Date().toISOString(),
    inputFingerprint, outputFingerprint: digest(JSON.stringify(outputs)), outputs, cacheDirectory,
  };
  const relativePath = recordPath(slug, task);
  writeJson(path.join(root, relativePath), record);
  return { path: relativePath, ...record };
}

export function validateTtsGenerationRecord(project, job, record) {
  const root = project.config.workspaceRoot;
  const expectedPath = recordPath(job.slug, { id: job.id, attempt: job.attempts });
  if (!record || record.path !== expectedPath) invalid("没有本次任务的成功记录");
  const { path: relativePath, ...saved } = record;
  const persisted = JSON.parse(fs.readFileSync(path.join(root, relativePath), "utf8"));
  if (JSON.stringify(saved) !== JSON.stringify(persisted)) invalid("回传记录与落盘记录不一致");
  if (record.schemaVersion !== 1 || record.producer !== "tts-harness-adapter" || record.videoId !== job.slug || record.taskId !== job.id || record.attempt !== job.attempts || record.taskInputFingerprint !== job.inputFingerprint || record.taskStartedAt !== job.startedAt) invalid("记录不属于本次任务执行");
  const times = [job.startedAt, record.startedAt, record.completedAt].map(Date.parse);
  if (times.some(value => !Number.isFinite(value)) || times[1] < times[0] || times[2] < times[1] || times[2] > Date.now()) invalid("生成时间不在本次执行范围内");
  if (record.inputFingerprint !== ttsScriptFingerprint(root, job.slug)) invalid("冻结输入不匹配");
  const outputs = ttsGenerationOutputs(root, job.slug);
  if (record.outputFingerprint !== digest(JSON.stringify(outputs)) || JSON.stringify(record.outputs) !== JSON.stringify(outputs)) invalid("生成产物字节不匹配");
  return true;
}
