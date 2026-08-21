#!/usr/bin/env node

import fs from "node:fs";
import http from "node:http";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { getProjectFile, getProjectPrototype, listProjectFiles } from "./project-files.mjs";
import { getVideoProject, listVideoProjects } from "./project-view.mjs";
import { createJob, findActiveJob, listJobs } from "./jobs.mjs";
import { createGitHubActionsAdapterFromEnv } from "./adapters.mjs";
import { artifactManifestFor } from "./artifacts.mjs";
import { approveGate, rejectGate, resumeProject, retryStage, runStage, validateStage } from "./runner.mjs";
import { validateProjectStage } from "./validation.mjs";
import { buildNextAction, buildProjectReport } from "./reports.mjs";
import { buildTaskPacket } from "./context.mjs";
import { buildProjectPlan } from "./plans.mjs";
import { initializeProject, loadProject } from "./storage.mjs";
import { HARNESS_VERSION } from "./stages.mjs";

const moduleDirectory = path.dirname(fileURLToPath(import.meta.url));
const webDirectory = path.resolve(moduleDirectory, "../web");
const defaultHost = "127.0.0.1";
const defaultPort = 4173;

const contentTypes = Object.freeze({
  ".css": "text/css; charset=utf-8",
  ".html": "text/html; charset=utf-8",
  ".js": "text/javascript; charset=utf-8",
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

function serveApi(response, pathname, search) {
  if (pathname === "/api/projects") {
    sendJson(response, 200, { projects: listVideoProjects() });
    return true;
  }

  const projectMatch = pathname.match(/^\/api\/projects\/([a-z0-9]+(?:-[a-z0-9]+)*)$/);
  if (projectMatch) {
    const project = getVideoProject(projectMatch[1]);
    if (!project) {
      sendJson(response, 404, { error: "Video project not found" });
      return true;
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
    if (!getVideoProject(jobsMatch[1])) {
      sendJson(response, 404, { error: "Video project not found" });
      return true;
    }
    sendJson(response, 200, { jobs: listJobs(jobsMatch[1]) });
    return true;
  }

  return false;
}

function readJsonBody(request) {
  return new Promise((resolve, reject) => {
    const chunks = [];
    let size = 0;
    request.on("data", (chunk) => {
      size += chunk.length;
      if (size > 1_000_000) {
        reject(new Error("Request body is too large"));
        request.destroy();
        return;
      }
      chunks.push(chunk);
    });
    request.on("end", () => {
      if (chunks.length === 0) {
        resolve({});
        return;
      }
      try {
        resolve(JSON.parse(Buffer.concat(chunks).toString("utf8")));
      } catch {
        reject(new Error("Request body must be valid JSON"));
      }
    });
    request.on("error", reject);
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

  if (action === "remote-run") {
    const stage = body.stage;
    if (stage !== "smoke-render" && stage !== "render") {
      sendJson(response, 400, { error: "remote-run only supports smoke-render and render" });
      return true;
    }
    const activeJob = findActiveJob(slug, stage);
    if (activeJob) {
      sendJson(response, 409, { error: "A remote job for this stage is already running", job: activeJob });
      return true;
    }
    const { job } = createJob({
      slug,
      stage,
      run: async () => {
        const project = loadProject(slug, { refresh: true });
        const adapter = createGitHubActionsAdapterFromEnv();
        return runStage(project, stage, { adapters: { [stage]: adapter } });
      },
    });
    sendJson(response, 202, { result: { action, status: "queued" }, job });
    return true;
  }

  const project = loadProject(slug, { refresh: true });
  let result;
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
    case "run":
      result = await runStage(project, body.stage, { adapters: {} });
      break;
    case "approve":
      result = approveGate(project, body.gate ?? body.stage);
      break;
    case "reject":
      result = rejectGate(project, body.gate ?? body.stage, body.returnTo, body.reason);
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

  sendJson(response, 200, { result, project: getVideoProject(slug) });
  return true;
}

async function handleRequest(request, response, host) {
  const requestUrl = new URL(request.url ?? "/", `http://${host}`);
  const isAction = request.method === "POST" && requestUrl.pathname.endsWith("/action");
  if (request.method !== "GET" && request.method !== "HEAD" && !isAction) {
    send(response, 405, "Method not allowed\n");
    return;
  }

  if (isAction && await serveAction(response, request, requestUrl.pathname)) {
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

  if (requestUrl.pathname.startsWith("/api/") && serveApi(response, requestUrl.pathname, requestUrl.search)) {
    return;
  }

  if (requestUrl.pathname.startsWith("/preview/") && servePrototype(response, requestUrl.pathname)) {
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

export function createWebServer({ host = defaultHost, port = defaultPort } = {}) {
  const server = http.createServer((request, response) => {
    handleRequest(request, response, host).catch((error) => {
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
        server.listen(port, host);
      });
    },
    close() {
      return new Promise((resolve, reject) => {
        if (!server.listening) {
          resolve();
          return;
        }
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
