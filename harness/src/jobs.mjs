import crypto from "node:crypto";
import fs from "node:fs";
import path from "node:path";
import { projectDirectory, projectsRoot, readJson, writeJson } from "./storage.mjs";

const activeStatuses = new Set(["queued", "dispatching", "waiting-config", "waiting-run", "running"]);

function jobsDirectory(slug) {
  return path.join(projectDirectory(slug), "jobs");
}

function jobPath(slug, id) {
  return path.join(jobsDirectory(slug), `${id}.json`);
}

function saveJob(job) {
  writeJson(jobPath(job.slug, job.id), job);
  return job;
}

export function updateJob(slug, id, patch) {
  const job = readJson(jobPath(slug, id));
  return saveJob({ ...job, ...patch, updatedAt: new Date().toISOString() });
}

export function getJob(slug, id) {
  const filePath = jobPath(slug, id);
  return fs.existsSync(filePath) ? readJson(filePath) : null;
}

export function listAllJobs() {
  const root = projectsRoot();
  if (!fs.existsSync(root)) return [];
  return fs.readdirSync(root, { withFileTypes: true })
    .filter((entry) => entry.isDirectory())
    .flatMap((entry) => listJobs(entry.name));
}

export function createJobRecord({ slug, stage, metadata = {} }) {
  const now = new Date().toISOString();
  return saveJob({
    id: crypto.randomUUID(),
    slug,
    stage,
    status: "queued",
    result: null,
    error: null,
    ...metadata,
    createdAt: now,
    updatedAt: now,
    startedAt: null,
    completedAt: null,
    lastCheckedAt: null,
    nextCheckAt: null,
  });
}

export function listJobs(slug) {
  const directory = jobsDirectory(slug);
  if (!fs.existsSync(directory)) return [];
  return fs.readdirSync(directory)
    .filter((entry) => entry.endsWith(".json"))
    .map((entry) => readJson(path.join(directory, entry)))
    .sort((left, right) => right.createdAt.localeCompare(left.createdAt));
}

export function findActiveJob(slug, stage) {
  return listJobs(slug).find((job) => job.stage === stage && activeStatuses.has(job.status)) ?? null;
}

export function createJob({ slug, stage, run }) {
  if (typeof run !== "function") throw new Error("Job requires a run function");
  const now = new Date().toISOString();
  const job = saveJob({
    id: crypto.randomUUID(),
    slug,
    stage,
    status: "queued",
    result: null,
    error: null,
    createdAt: now,
    updatedAt: now,
    startedAt: null,
    completedAt: null,
  });

  const done = (async () => {
    updateJob(slug, job.id, { status: "running", startedAt: new Date().toISOString() });
    try {
      const result = await run();
      return updateJob(slug, job.id, {
        status: "succeeded",
        result,
        completedAt: new Date().toISOString(),
      });
    } catch (error) {
      return updateJob(slug, job.id, {
        status: "failed",
        error: { message: error instanceof Error ? error.message : String(error) },
        completedAt: new Date().toISOString(),
      });
    }
  })();

  return { job, done };
}
