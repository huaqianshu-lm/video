#!/usr/bin/env node

import fs from "node:fs";
import http from "node:http";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { getProjectFile, getProjectPrototype, listProjectFiles } from "./project-files.mjs";
import { getVideoProject, listVideoProjects } from "./project-view.mjs";
import { findActiveJob, listAllJobs, listJobs } from "./jobs.mjs";
import { requireGitHubActionsConfig } from "./github-config.mjs";
import { diagnoseGitHubActions } from "./diagnostics.mjs";
import { createRemoteJobMonitor } from "./remote-jobs.mjs";
import { assertRemoteRenderDeliveryInputs, prepareRemoteRenderInputs, validateRemoteRenderInputs } from "./remote-executor.mjs";
import { buildGitRenderCommitPlan, commitAndPushRenderDelivery, validateGitRenderDelivery } from "./git-delivery.mjs";
import { artifactManifestFor } from "./artifacts.mjs";
import { approveGate, rejectGate, resumeProject, retryStage, runStage, validateStage } from "./runner.mjs";
import { validateProjectStage } from "./validation.mjs";
import { buildNextAction, buildProjectReport } from "./reports.mjs";
import { buildTaskPacket } from "./context.mjs";
import { buildProjectPlan } from "./plans.mjs";
import { applySeriesStyle, initializeProject, loadProject, reopenGate3ForSeriesCover } from "./storage.mjs";
import { HARNESS_VERSION } from "./stages.mjs";
import { STAGE_DEFINITIONS } from "./stages.mjs";
import { createAgentExecutorFromEnv } from "./agent-executor.mjs";
import { createTtsExecutorFromEnv } from "./tts-executor.mjs";
import { createRemotionExecutorFromEnv } from "./remotion-executor.mjs";
import { importSourceProject, MAX_SOURCE_BYTES } from "./source-import.mjs";
import {
  createAgentJob,
  getAgentJob,
  listAgentJobs,
  recoverInterruptedAgentJobs,
  retryAgentJob,
  runAgentJob,
} from "./agent-jobs.mjs";
import { buildAlignmentView } from "./remotion-alignment.mjs";
import {
  approveTtsQc,
  approveTtsQcForProject,
  approveSmokeQc,
  batchDefinitions,
  createBatch,
  findActiveBatchForProject,
  getBatch,
  getBatchForView,
  listBatchesForView,
  retryFailedBatchItems,
  runBatch,
  stopBatchesAfterGateRejection,
} from "./batches.mjs";
import {
  completeRemotionTask,
  blockRemotionTask,
  ensureRemotionTask,
  getRemotionTask,
  listRemotionTasks,
  retryRemotionTask,
  runRemotionTask,
  startRemotionTask,
  recoverInterruptedRemotionTasks,
} from "./remotion-tasks.mjs";
import {
  MAX_COVER_BYTES,
  getSeries,
  listSeries,
  saveSeries,
  saveSeriesCover,
  seriesAssetPath,
} from "./series-assets.mjs";

const moduleDirectory = path.dirname(fileURLToPath(import.meta.url));
const webDirectory = path.resolve(moduleDirectory, "../web");
const defaultHost = "127.0.0.1";
const defaultPort = 4173;

const contentTypes = Object.freeze({
  ".css": "text/css; charset=utf-8",
  ".html": "text/html; charset=utf-8",
  ".jpg": "image/jpeg",
  ".jpeg": "image/jpeg",
  ".js": "text/javascript; charset=utf-8",
  ".png": "image/png",
  ".webp": "image/webp",
});

function send(response, statusCode, body, contentType = "text/plain; charset=utf-8") {
  response.writeHead(statusCode, {
    "Content-Type": contentType,
    "Content-Length": Buffer.byteLength(body),
    "Cache-Control": "no-store",
  });
  response.end(body);
}

function sendJson(response, statusCode, value) {
  send(response, statusCode, `${JSON.stringify(value)}\n`, "application/json; charset=utf-8");
}

function staticFileForUrl(urlPath) {
  const relativePath = urlPath === "/" ? "index.html" : urlPath.slice(1);
  if (!relativePath || relativePath.includes("\\") || relativePath.split("/").includes("..")) {
    return null;
  }

  const filePath = path.resolve(webDirectory, relativePath);
  if (filePath !== webDirectory && !filePath.startsWith(`${webDirectory}${path.sep}`)) {
    return null;
  }
  return filePath;
}

function serveStatic(response, urlPath) {
  const filePath = staticFileForUrl(urlPath);
  if (!filePath || !fs.existsSync(filePath) || !fs.statSync(filePath).isFile()) {
    send(response, 404, "Not found\n");
    return;
  }

  const extension = path.extname(filePath);
  const contentType = contentTypes[extension] ?? "application/octet-stream";
  const body = fs.readFileSync(filePath);
  response.writeHead(200, {
    "Content-Type": contentType,
    "Content-Length": body.length,
    "Cache-Control": "no-store",
  });
  response.end(body);
}

function serveFile(response, filePath) {
  const body = fs.readFileSync(filePath);
  response.writeHead(200, {
    "Content-Type": contentTypes[path.extname(filePath).toLowerCase()] ?? "application/octet-stream",
    "Content-Length": body.length,
    "Cache-Control": "no-store",
  });
  response.end(body);
}

function readBody(request, maximumBytes) {
  return new Promise((resolve, reject) => {
    const chunks = [];
    let size = 0;
    request.on("data", (chunk) => {
      size += chunk.length;
      if (size > maximumBytes) {
        reject(new Error("Request body is too large"));
        request.destroy();
        return;
      }
      chunks.push(chunk);
    });
    request.on("end", () => resolve(Buffer.concat(chunks)));
    request.on("error", reject);
  });
}

async function serveSeriesApi(response, request, pathname) {
  if (request.method === "GET" && pathname === "/api/series") {
    sendJson(response, 200, { series: listSeries() });
    return true;
  }

  if (request.method === "POST" && pathname === "/api/series") {
    const body = await readJsonBody(request);
    const previous = getSeries(body.id);
    const series = saveSeries({
      id: body.id,
      title: body.title,
      style: body.style,
      coverDurationFrames: body.coverDurationFrames,
      videos: body.videos,
      confirmVideoRemoval: body.confirmVideoRemoval === true,
    });
    const updatedProjects = series.videos
      .filter((slug) => !previous?.videos.includes(slug))
      .map((slug) => ({ slug, ...applySeriesStyle(slug, series.style) }))
      .filter((result) => result.changed);
    sendJson(response, 200, { series, updatedProjects });
    return true;
  }

  const coverMatch = pathname.match(/^\/api\/series\/([a-z0-9]+(?:-[a-z0-9]+)*)\/cover$/);
  if (coverMatch && request.method === "PUT") {
    const contentType = String(request.headers["content-type"] ?? "").split(";", 1)[0].trim().toLowerCase();
    const body = await readBody(request, MAX_COVER_BYTES);
    const result = saveSeriesCover(coverMatch[1], body, contentType);
    const reopenedProjects = result.series.videos.filter((slug) => reopenGate3ForSeriesCover(slug));
    sendJson(response, 200, { ...result, reopenedProjects });
    return true;
  }

  const match = pathname.match(/^\/api\/series\/([a-z0-9]+(?:-[a-z0-9]+)*)$/);
  if (match && request.method === "GET") {
    const series = getSeries(match[1]);
    if (!series) {
      sendJson(response, 404, { error: "Series not found" });
      return true;
    }
    sendJson(response, 200, { series });
    return true;
  }

  return false;
}

async function serveApi(response, pathname, search, remoteJobMonitor, diagnose) {
  if (pathname === "/api/agent-jobs") {
    sendJson(response, 200, { jobs: listAgentJobs() });
    return true;
  }

  if (pathname === "/api/jobs") {
    sendJson(response, 200, { jobs: listAllJobs() });
    return true;
  }

  if (pathname === "/api/diagnostics/github") {
    sendJson(response, 200, await diagnose());
    return true;
  }

  if (pathname === "/api/projects") {
    sendJson(response, 200, { projects: listVideoProjects() });
    return true;
  }

  const projectMatch = pathname.match(/^\/api\/projects\/([a-z0-9]+(?:-[a-z0-9]+)*)$/);
  if (projectMatch) {
    let project = getVideoProject(projectMatch[1]);
    if (!project) {
      sendJson(response, 404, { error: "Video project not found" });
      return true;
    }
    if (project.initialized) {
      await remoteJobMonitor.poll();
      project = getVideoProject(projectMatch[1]);
    }
    sendJson(response, 200, { project });
    return true;
  }

  const filesMatch = pathname.match(/^\/api\/projects\/([a-z0-9]+(?:-[a-z0-9]+)*)\/files$/);
  if (filesMatch) {
    const files = listProjectFiles(filesMatch[1]);
    if (!files) {
      sendJson(response, 404, { error: "Video project not found" });
      return true;
    }
    sendJson(response, 200, { files });
    return true;
  }

  const fileMatch = pathname.match(/^\/api\/projects\/([a-z0-9]+(?:-[a-z0-9]+)*)\/file$/);
  if (fileMatch) {
    const requestedPath = new URLSearchParams(search).get("path");
    const file = requestedPath ? getProjectFile(fileMatch[1], requestedPath) : null;
    if (!file) {
      sendJson(response, 404, { error: "Project file not found or not allowed" });
      return true;
    }
    sendJson(response, 200, { file });
    return true;
  }

  const jobsMatch = pathname.match(/^\/api\/projects\/([a-z0-9]+(?:-[a-z0-9]+)*)\/jobs$/);
  if (jobsMatch) {
    const project = getVideoProject(jobsMatch[1]);
    if (!project) {
      sendJson(response, 404, { error: "Video project not found" });
      return true;
    }
    sendJson(response, 200, {
      jobs: listJobs(jobsMatch[1]),
      activeJob: project.currentStage ? findActiveJob(jobsMatch[1], project.currentStage) : null,
    });
    return true;
  }

  const agentJobsMatch = pathname.match(/^\/api\/projects\/([a-z0-9]+(?:-[a-z0-9]+)*)\/agent-jobs$/);
  if (agentJobsMatch) {
    if (!getVideoProject(agentJobsMatch[1])) {
      sendJson(response, 404, { error: "Video project not found" });
      return true;
    }
    sendJson(response, 200, { jobs: listAgentJobs({ slug: agentJobsMatch[1] }) });
    return true;
  }

  const alignmentMatch = pathname.match(/^\/api\/projects\/([a-z0-9]+(?:-[a-z0-9]+)*)\/alignment$/);
  if (alignmentMatch) {
    const projectView = getVideoProject(alignmentMatch[1]);
    if (!projectView?.initialized) {
      sendJson(response, 404, { error: "Initialized video project not found" });
      return true;
    }
    sendJson(response, 200, { alignment: buildAlignmentView(loadProject(alignmentMatch[1], { refresh: false })) });
    return true;
  }

  return false;
}

async function serveSourceImportApi(response, request, pathname, search) {
  if (request.method !== "PUT" || pathname !== "/api/projects/import") return false;

  try {
    const body = await readBody(request, MAX_SOURCE_BYTES);
    const query = new URLSearchParams(search);
    const result = importSourceProject({
      slug: query.get("slug"),
      filename: query.get("filename"),
      content: body,
      seriesId: query.get("seriesId"),
    });
    sendJson(response, 201, { result, project: getVideoProject(result.slug) });
  } catch (error) {
    sendJson(response, error?.code === "source-project-exists" ? 409 : 400, {
      error: error instanceof Error ? error.message : String(error),
      code: error?.code ?? "source-import-failed",
    });
  }
  return true;
}

async function serveBatchApi(response, request, pathname) {
  if (request.method === "GET" && pathname === "/api/batches") {
    sendJson(response, 200, { definitions: batchDefinitions(), batches: listBatchesForView() });
    return true;
  }

  if (request.method === "POST" && pathname === "/api/batches") {
    const body = await readJsonBody(request);
    const batch = createBatch({ type: body.type, slugs: body.slugs });
    void runBatch(batch.id, { queueAgentJob: request.queueAgentJob }).catch(() => {});
    sendJson(response, 202, { batch: getBatchForView(batch.id) });
    return true;
  }

  const match = pathname.match(/^\/api\/batches\/([a-f0-9-]+)$/);
  if (match && request.method === "GET") {
    const batch = getBatch(match[1]);
    if (!batch) {
      sendJson(response, 404, { error: "Batch not found" });
      return true;
    }
    sendJson(response, 200, { batch: getBatchForView(match[1]) });
    return true;
  }

  const actionMatch = pathname.match(/^\/api\/batches\/([a-f0-9-]+)\/action$/);
  if (actionMatch && request.method === "POST") {
    const id = actionMatch[1];
    const body = await readJsonBody(request);
    if (!getBatch(id)) {
      sendJson(response, 404, { error: "Batch not found" });
      return true;
    }
    if (body.action === "approve-tts-qc") approveTtsQc(id, body.slug);
    if (body.action === "approve-smoke-qc") approveSmokeQc(id, body.slug);
    if (body.action === "retry-failed") retryFailedBatchItems(id);
    if (!["run", "resume", "approve-tts-qc", "approve-smoke-qc", "retry-failed"].includes(body.action)) {
      sendJson(response, 400, { error: `Unknown batch action: ${body.action ?? "missing"}` });
      return true;
    }
    void runBatch(id, { queueAgentJob: request.queueAgentJob }).catch(() => {});
    sendJson(response, 202, { batch: getBatchForView(id) });
    return true;
  }

  return false;
}

async function serveRemotionTaskApi(response, request, pathname) {
  if (request.method === "GET" && pathname === "/api/remotion-tasks") {
    sendJson(response, 200, { tasks: listRemotionTasks() });
    return true;
  }

  const match = pathname.match(/^\/api\/remotion-tasks\/([a-f0-9-]+)$/);
  if (match && request.method === "GET") {
    const task = getRemotionTask(match[1]);
    if (!task) {
      sendJson(response, 404, { error: "Remotion task not found" });
      return true;
    }
    sendJson(response, 200, { task });
    return true;
  }

  const actionMatch = pathname.match(/^\/api\/remotion-tasks\/([a-f0-9-]+)\/action$/);
  if (actionMatch && request.method === "POST") {
    const body = await readJsonBody(request);
    const id = actionMatch[1];
    try {
      let result;
      if (body.action === "run") {
        const task = getRemotionTask(id);
        if (!task) throw new Error(`Remotion task not found: ${id}`);
        if (task.status === "in-progress") {
          sendJson(response, 202, { task });
          return true;
        }
        if (!["ready", "blocked", "failed"].includes(task.status)) throw new Error(`Remotion task is not runnable: ${task.status}`);
        if (["blocked", "failed"].includes(task.status)) retryRemotionTask(id);
        request.queueRemotionTask(id);
        sendJson(response, 202, { task: getRemotionTask(id) });
        return true;
      } else if (body.action === "start") result = { task: startRemotionTask(id) };
      else if (body.action === "retry") result = { task: retryRemotionTask(id) };
      else if (body.action === "complete") {
        result = completeRemotionTask(id);
        if (result.completed && result.task.batchId) {
          result.batch = await runBatch(result.task.batchId);
        }
      } else {
        sendJson(response, 400, { error: `Unknown Remotion task action: ${body.action ?? "missing"}` });
        return true;
      }
      sendJson(response, 200, result);
    } catch (error) {
      sendJson(response, 400, {
        error: error instanceof Error ? error.message : String(error),
        issues: error.issues ?? [],
      });
    }
    return true;
  }

  return false;
}

async function serveAgentJobApi(response, request, pathname) {
  const match = pathname.match(/^\/api\/agent-jobs\/([a-f0-9-]+)$/);
  if (match && request.method === "GET") {
    const job = getAgentJob(match[1]);
    if (!job) sendJson(response, 404, { error: "Agent Job not found" });
    else sendJson(response, 200, { job });
    return true;
  }

  const actionMatch = pathname.match(/^\/api\/agent-jobs\/([a-f0-9-]+)\/action$/);
  if (actionMatch && request.method === "POST") {
    const body = await readJsonBody(request);
    const id = actionMatch[1];
    try {
      if (body.action !== "retry") {
        sendJson(response, 400, { error: `Unknown Agent Job action: ${body.action ?? "missing"}` });
        return true;
      }
      retryAgentJob(id);
      request.queueAgentJob(id);
      sendJson(response, 202, { job: getAgentJob(id) });
    } catch (error) {
      sendJson(response, 400, { error: error instanceof Error ? error.message : String(error) });
    }
    return true;
  }
  return false;
}

function readJsonBody(request) {
  return readBody(request, 1_000_000).then((body) => {
    if (body.length === 0) return {};
    try {
      return JSON.parse(body.toString("utf8"));
    } catch {
      throw new Error("Request body must be valid JSON");
    }
  });
}

async function serveAction(response, request, pathname) {
  const match = pathname.match(/^\/api\/projects\/([a-z0-9]+(?:-[a-z0-9]+)*)\/action$/);
  if (!match) return false;

  const slug = match[1];
  const projectView = getVideoProject(slug);
  if (!projectView) {
    sendJson(response, 404, { error: "Video project not found" });
    return true;
  }

  const body = await readJsonBody(request);
  const action = body.action;
  if (action === "initialize") {
    if (projectView.initialized) {
      sendJson(response, 409, { error: "Harness project is already initialized" });
      return true;
    }
    const files = initializeProject(slug);
    sendJson(response, 200, { result: { action, status: "initialized", files }, project: getVideoProject(slug) });
    return true;
  }

  if (action === "legacy-validate") {
    const stage = body.stage ?? "remotion";
    const legacyProject = {
      config: {
        slug,
        workspaceRoot: path.resolve(moduleDirectory, "../.."),
        validationPolicy: "legacy",
      },
      artifacts: { stages: artifactManifestFor(slug) },
    };
    const stages = body.stage ? [stage] : ["scene-script", "narration-script", "tts", "subtitle-timeline", "visual-prototype", "remotion"];
    const issues = stages.flatMap((item) => validateProjectStage(legacyProject, item));
    sendJson(response, 200, {
      result: { action, readOnly: true, validationPolicy: "legacy", stages, issues },
      project: projectView,
    });
    return true;
  }

  if (!projectView.initialized) {
    if (action === "next") {
      sendJson(response, 200, { result: projectView.next, project: projectView });
      return true;
    }
    sendJson(response, 409, { error: "Initialize the Harness project before this action" });
    return true;
  }

  if (action === "find-historical") {
    const stage = body.stage;
    if (stage !== "smoke-render" && stage !== "render") {
      sendJson(response, 400, { error: "find-historical only supports smoke-render and render" });
      return true;
    }
    try {
      requireGitHubActionsConfig();
      const candidates = await request.remoteJobMonitor.findHistorical({ slug, stage });
      sendJson(response, 200, { result: { action, stage, candidates }, project: getVideoProject(slug) });
    } catch (error) {
      sendJson(response, 400, {
        error: error instanceof Error ? error.message : String(error),
        code: error.code ?? "historical-recovery-failed",
        issues: error.issues ?? [],
      });
    }
    return true;
  }

  if (action === "adopt-historical") {
    const stage = body.stage;
    if ((stage !== "smoke-render" && stage !== "render") || body.runId === undefined || body.runId === null) {
      sendJson(response, 400, { error: "adopt-historical requires smoke-render/render and runId" });
      return true;
    }
    try {
      requireGitHubActionsConfig();
      const job = await request.remoteJobMonitor.adoptHistorical({ slug, stage, runId: body.runId });
      sendJson(response, 200, { result: { action, stage, status: "succeeded" }, job, project: getVideoProject(slug) });
    } catch (error) {
      sendJson(response, 400, {
        error: error instanceof Error ? error.message : String(error),
        code: error.code ?? "historical-adoption-failed",
        issues: error.issues ?? [],
      });
    }
    return true;
  }

  if (action === "run-to-gate-2") {
    const activeBatch = findActiveBatchForProject("to-gate-2", slug);
    const batch = activeBatch ?? createBatch({ type: "to-gate-2", slugs: [slug] });
    void runBatch(batch.id, { queueAgentJob: request.queueAgentJob }).catch(() => {});
    sendJson(response, 202, {
      result: { action, status: activeBatch ? "already-running" : "queued" },
      batch: getBatchForView(batch.id),
    });
    return true;
  }

  if (action === "remote-run") {
    const stage = body.stage;
    if (stage !== "smoke-render" && stage !== "render") {
      sendJson(response, 400, { error: "remote-run only supports smoke-render and render" });
      return true;
    }
    try {
      requireGitHubActionsConfig();
    } catch (error) {
      sendJson(response, 400, {
        error: error instanceof Error ? error.message : String(error),
        code: error.code ?? "github-config-invalid",
        issues: error.issues ?? [],
      });
      return true;
    }
    const activeJob = findActiveJob(slug, stage);
    if (activeJob) {
      sendJson(response, 200, { result: { action, status: "already-running" }, job: activeJob });
      return true;
    }
    try {
      const renderProject = loadProject(slug, { refresh: true });
      prepareRemoteRenderInputs(renderProject);
      const inputIssues = validateRemoteRenderInputs(renderProject);
      if (inputIssues.length > 0) {
        const error = new Error(`远程渲染输入预检失败：${inputIssues.join("；")}`);
        error.code = "remote-render-inputs-invalid";
        error.issues = inputIssues;
        throw error;
      }
      let delivery = null;
      const deliveryIssues = validateGitRenderDelivery(renderProject);
      if (deliveryIssues.length > 0) {
        if (stage !== "smoke-render" || body.commitAndPush !== true || body.confirmDelivery !== true) {
          if (stage === "smoke-render" && body.commitAndPush !== true) {
            const commitPlan = buildGitRenderCommitPlan(renderProject);
            sendJson(response, 200, {
              result: { action, status: "needs-confirmation" },
              error: `远程渲染交付预检失败：${deliveryIssues.join("；")}`,
              code: "git-render-commit-confirmation-required",
              issues: deliveryIssues,
              commitPlan,
              project: getVideoProject(slug),
            });
            return true;
          }
          const error = new Error(`远程渲染交付预检失败：${deliveryIssues.join("；")}`);
          error.code = "remote-render-delivery-invalid";
          error.issues = deliveryIssues;
          throw error;
        }
        delivery = commitAndPushRenderDelivery(renderProject);
        const refreshedProject = loadProject(slug, { refresh: true });
        assertRemoteRenderDeliveryInputs(refreshedProject);
      } else {
        assertRemoteRenderDeliveryInputs(renderProject);
      }
      const job = request.remoteJobMonitor.submit({ slug, stage });
      sendJson(response, 202, { result: { action, status: "queued", delivery }, job });
    } catch (error) {
      sendJson(response, 400, {
        error: error instanceof Error ? error.message : String(error),
        code: error.code ?? "remote-render-submit-failed",
        issues: error.issues ?? [],
      });
    }
    return true;
  }

  if (action === "prepare-remote-render") {
    const stage = body.stage ?? projectView.currentStage;
    if (stage !== "smoke-render" && stage !== "render") {
      sendJson(response, 400, { error: "prepare-remote-render only supports smoke-render and render" });
      return true;
    }
    const renderProject = loadProject(slug, { refresh: true });
    try {
      const preparation = prepareRemoteRenderInputs(renderProject);
      assertRemoteRenderDeliveryInputs(renderProject);
      sendJson(response, 200, {
        result: { action, status: "ready", preparation },
        project: getVideoProject(slug),
      });
    } catch (error) {
      if (error?.code === "remote-render-delivery-invalid") {
        sendJson(response, 200, {
          result: { action, status: "blocked" },
          error: error.message,
          code: error.code,
          issues: error.issues ?? [],
          project: getVideoProject(slug),
        });
        return true;
      }
      sendJson(response, 400, {
        error: error instanceof Error ? error.message : String(error),
        code: error.code ?? "remote-render-preparation-failed",
        issues: error.issues ?? [],
        project: getVideoProject(slug),
      });
    }
    return true;
  }

  const project = loadProject(slug, { refresh: true });
  let result;
  let responseStatus = 200;
  switch (action) {
    case "validate":
      result = { action, stage: body.stage ?? project.state.currentStage, issues: validateStage(project, body.stage) };
      break;
    case "next":
      result = buildNextAction(project);
      break;
    case "report":
      result = buildProjectReport(project);
      break;
    case "context":
      result = buildTaskPacket(project);
      break;
    case "plan":
      if (!body.until) throw new Error("plan requires until");
      result = buildProjectPlan(project, body.until);
      break;
    case "run": {
      const stage = body.stage ?? project.state.currentStage;
      if (STAGE_DEFINITIONS[stage]?.executor === "agent") {
        if (stage === "remotion") {
          const remotionIssues = validateStage(project, "remotion");
          const requiresRebuild = project.state.stages.remotion.invalidatedBy === "gate-3-rejected";
          if (remotionIssues.length === 0 && !requiresRebuild) {
            const stageResult = runStage(project, "remotion", { adapters: {} });
            const gateResult = runStage(loadProject(slug, { refresh: true }), "gate-3", { adapters: {} });
            sendJson(response, 200, { result: { action, status: "succeeded", stageResult, gateResult }, project: getVideoProject(slug) });
            return true;
          }
          const task = ensureRemotionTask({ slug, batchId: null });
          request.queueRemotionTask(task.id);
          sendJson(response, 202, { result: { action, status: "queued", taskId: task.id }, task });
          return true;
        }
        const job = createAgentJob({ slug, stage });
        request.queueAgentJob(job.id);
        sendJson(response, 202, { result: { action, status: "queued", jobId: job.id }, job });
        return true;
      }
      result = await runStage(project, stage, { adapters: {} });
      break;
    }
    case "approve":
      if ((body.gate ?? body.stage) === "gate-3") {
        const latestRemotionTask = listRemotionTasks({ slug })[0];
        if (latestRemotionTask && latestRemotionTask.status !== "completed") {
          throw new Error("Gate 3 暂无可验证的新 Remotion 产物，请先执行或重试 Agent 并完成产物校验。");
        }
      }
      result = approveGate(project, body.gate ?? body.stage);
      break;
    case "approve-tts-qc":
      result = await approveTtsQcForProject(slug);
      break;
    case "reject":
      result = rejectGate(project, body.gate ?? body.stage, body.returnTo, body.reason);
      if (result.stage === "gate-2") {
        result.stoppedBatchIds = stopBatchesAfterGateRejection({
          slug,
          gate: result.stage,
          returnTo: result.returnTo,
          reason: result.reason,
        });
      }
      if (result.stage === "gate-3" && result.returnTo === "remotion") {
        const task = ensureRemotionTask({ slug, batchId: null });
        result = {
          ...result,
          status: task.status === "in-progress" ? "already-running" : "queued",
          taskId: task.id,
        };
        if (task.status !== "in-progress") request.queueRemotionTask(task.id);
        responseStatus = 202;
      }
      break;
    case "retry":
      result = retryStage(project, body.stage);
      break;
    case "resume":
      result = resumeProject(project);
      break;
    default:
      sendJson(response, 400, { error: `Unknown action: ${action ?? "missing"}` });
      return true;
  }

  sendJson(response, responseStatus, { result, project: getVideoProject(slug) });
  return true;
}

async function handleRequest(request, response, host, remoteJobMonitor, diagnose, queueAgentJob, queueRemotionTask) {
  const requestUrl = new URL(request.url ?? "/", `http://${host}`);
  const isAction = request.method === "POST" && requestUrl.pathname.endsWith("/action");
  const isBatchCreate = request.method === "POST" && requestUrl.pathname === "/api/batches";
  const isSeriesWrite = (request.method === "POST" && requestUrl.pathname === "/api/series")
    || (request.method === "PUT" && /^\/api\/series\/[a-z0-9]+(?:-[a-z0-9]+)*\/cover$/.test(requestUrl.pathname));
  const isSourceImport = request.method === "PUT" && requestUrl.pathname === "/api/projects/import";
  if (request.method !== "GET" && request.method !== "HEAD" && !isAction && !isBatchCreate && !isSeriesWrite && !isSourceImport) {
    send(response, 405, "Method not allowed\n");
    return;
  }

  request.remoteJobMonitor = remoteJobMonitor;
  request.queueAgentJob = queueAgentJob;
  request.queueRemotionTask = queueRemotionTask;
  if (requestUrl.pathname.startsWith("/api/agent-jobs") && await serveAgentJobApi(response, request, requestUrl.pathname)) {
    return;
  }
  if (requestUrl.pathname.startsWith("/api/remotion-tasks") && await serveRemotionTaskApi(response, request, requestUrl.pathname)) {
    return;
  }
  if (requestUrl.pathname.startsWith("/api/batches") && await serveBatchApi(response, request, requestUrl.pathname)) {
    return;
  }
  if (isAction && await serveAction(response, request, requestUrl.pathname)) {
    return;
  }
  if (requestUrl.pathname.startsWith("/api/series") && await serveSeriesApi(response, request, requestUrl.pathname)) {
    return;
  }
  if (isSourceImport && await serveSourceImportApi(response, request, requestUrl.pathname, requestUrl.search)) {
    return;
  }

  if (requestUrl.pathname === "/api/health") {
    sendJson(response, 200, {
      service: "video-production-harness-web",
      harnessVersion: HARNESS_VERSION,
      status: "ok",
    });
    return;
  }

  if (requestUrl.pathname.startsWith("/api/") && await serveApi(response, requestUrl.pathname, requestUrl.search, remoteJobMonitor, diagnose)) {
    return;
  }

  if (requestUrl.pathname.startsWith("/preview/") && servePrototype(response, requestUrl.pathname)) {
    return;
  }

  const seriesAssetMatch = requestUrl.pathname.match(/^\/series-assets\/([a-z0-9]+(?:-[a-z0-9]+)*)\/(cover\.(?:png|jpg|webp))$/);
  if (seriesAssetMatch) {
    const filePath = seriesAssetPath(seriesAssetMatch[1], seriesAssetMatch[2]);
    if (!filePath) send(response, 404, "Series asset not found\n");
    else serveFile(response, filePath);
    return;
  }

  serveStatic(response, requestUrl.pathname);
}

function servePrototype(response, pathname) {
  const match = pathname.match(/^\/preview\/([a-z0-9]+(?:-[a-z0-9]+)*)$/);
  if (!match) return false;
  const prototype = getProjectPrototype(match[1]);
  if (!prototype) {
    send(response, 404, "Visual Prototype not found\n");
    return true;
  }
  send(response, 200, prototype.content, "text/html; charset=utf-8");
  return true;
}

export function createWebServer({
  host = defaultHost,
  port = defaultPort,
  remoteJobMonitor = createRemoteJobMonitor(),
  diagnose = diagnoseGitHubActions,
  agentExecutorFactory = (stage) => stage === "subtitle-timeline"
    ? createTtsExecutorFromEnv()
    : createAgentExecutorFromEnv(),
  remotionExecutorFactory = () => createRemotionExecutorFromEnv(),
} = {}) {
  recoverInterruptedAgentJobs();
  recoverInterruptedRemotionTasks();
  const queueAgentJob = (id) => {
    void (async () => {
      let executor;
      try {
        const job = getAgentJob(id);
        executor = agentExecutorFactory(job?.stage);
      } catch (error) {
        const unavailableExecutor = {
          async run() {
            throw error;
          },
        };
        const finished = await runAgentJob(id, { executor: unavailableExecutor });
        if (finished.batchId) await runBatch(finished.batchId, { queueAgentJob });
        return;
      }
      const finished = await runAgentJob(id, { executor });
      if (finished.batchId) await runBatch(finished.batchId, { queueAgentJob });
    })().catch(() => {});
  };
  const queueRemotionTask = (id) => {
    void (async () => {
      let executor;
      try {
        executor = remotionExecutorFactory();
      } catch (error) {
        blockRemotionTask(id, error);
        return;
      }
      const taskResult = await runRemotionTask(id, { executor });
      if (!taskResult.completed) return;
      const task = taskResult.task;
      const project = loadProject(task.slug, { refresh: true });
      if (project.state.currentStage === "remotion" && project.state.stages.remotion.status === "ready") {
        await runStage(project, "remotion", { adapters: {} });
        await runStage(loadProject(task.slug, { refresh: true }), "gate-3", { adapters: {} });
      }
      if (task.batchId) await runBatch(task.batchId);
    })().catch(() => {});
  };
  const server = http.createServer((request, response) => {
    handleRequest(request, response, host, remoteJobMonitor, diagnose, queueAgentJob, queueRemotionTask).catch((error) => {
      if (response.headersSent) {
        response.destroy(error);
        return;
      }
      sendJson(response, 400, { error: error instanceof Error ? error.message : String(error) });
    });
  });

  return {
    server,
    listen() {
      return new Promise((resolve, reject) => {
        const onError = (error) => {
          server.off("listening", onListening);
          reject(error);
        };
        const onListening = () => {
          server.off("error", onError);
          resolve(server);
        };
        server.once("error", onError);
        server.once("listening", onListening);
        server.once("listening", () => remoteJobMonitor.start());
        server.listen(port, host);
      });
    },
    close() {
      remoteJobMonitor.stop();
      return new Promise((resolve, reject) => {
        if (!server.listening) {
          resolve();
          return;
        }
        server.closeIdleConnections?.();
        server.close((error) => (error ? reject(error) : resolve()));
      });
    },
  };
}

if (process.argv[1] && path.resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  const port = Number(process.env.HARNESS_WEB_PORT ?? defaultPort);
  const host = process.env.HARNESS_WEB_HOST ?? defaultHost;
  const webServer = createWebServer({ host, port });
  await webServer.listen();
  console.log(`Video Harness Web UI: http://${host}:${port}`);
}
