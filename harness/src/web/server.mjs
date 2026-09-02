#!/usr/bin/env node

import fs from "node:fs";
import http from "node:http";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { createAgentExecutorFromEnv } from "../agent-executor.mjs";
import { createRemotionExecutorFromEnv } from "../remotion-executor.mjs";
import { createRemoteJobMonitor } from "../remote-jobs.mjs";
import { createTtsExecutorFromEnv } from "../tts-executor.mjs";
import { createRuntime } from "./runtime.mjs";
import { send, sendError } from "./http.mjs";
import { getProjectPrototype } from "../project-files.mjs";
import { seriesAssetPath } from "../series-assets.mjs";
import { createBatchRoutes } from "./routes/batches.mjs";
import { createProjectRoutes } from "./routes/projects.mjs";
import { createRemoteRoutes, recoverRemoteJobs } from "./routes/remote.mjs";
import { createSeriesRoutes } from "./routes/series.mjs";

const moduleDirectory = path.dirname(fileURLToPath(import.meta.url));
const webDirectory = path.resolve(moduleDirectory, "../../web");
const defaultHost = "127.0.0.1";
const defaultPort = 4173;
const contentTypes = Object.freeze({ ".css": "text/css; charset=utf-8", ".html": "text/html; charset=utf-8", ".jpg": "image/jpeg", ".jpeg": "image/jpeg", ".js": "text/javascript; charset=utf-8", ".png": "image/png", ".webp": "image/webp" });

function fileForUrl(urlPath) {
  const relativePath = urlPath === "/" ? "index.html" : urlPath.slice(1);
  if (!relativePath || relativePath.includes("\\") || relativePath.split("/").includes("..")) return null;
  const filePath = path.resolve(webDirectory, relativePath);
  return filePath === webDirectory || filePath.startsWith(`${webDirectory}${path.sep}`) ? filePath : null;
}

function serveStatic(response, urlPath) {
  const filePath = fileForUrl(urlPath);
  if (!filePath || !fs.existsSync(filePath) || !fs.statSync(filePath).isFile()) { send(response, 404, "Not found\n"); return; }
  const body = fs.readFileSync(filePath); response.writeHead(200, { "Content-Type": contentTypes[path.extname(filePath)] ?? "application/octet-stream", "Content-Length": body.length, "Cache-Control": "no-store" }); response.end(body);
}

function servePreview(response, pathname) {
  const match = pathname.match(/^\/preview\/([a-z0-9]+(?:-[a-z0-9]+)*)$/);
  if (!match) return false;
  const prototype = getProjectPrototype(match[1]);
  if (!prototype) send(response, 404, "Visual Prototype not found\n"); else { response.writeHead(200, { "Content-Type": "text/html; charset=utf-8", "Content-Length": Buffer.byteLength(prototype.content), "Cache-Control": "no-store" }); response.end(prototype.content); }
  return true;
}

function serveSeriesAsset(response, pathname) {
  const match = pathname.match(/^\/series-assets\/([a-z0-9]+(?:-[a-z0-9]+)*)\/(cover\.(?:png|jpg|webp))$/);
  if (!match) return false;
  const filePath = seriesAssetPath(match[1], match[2]);
  if (!filePath) send(response, 404, "Series asset not found\n"); else { const body = fs.readFileSync(filePath); response.writeHead(200, { "Content-Type": contentTypes[path.extname(filePath)] ?? "application/octet-stream", "Content-Length": body.length, "Cache-Control": "no-store" }); response.end(body); }
  return true;
}

export function createWebServer({
  host = defaultHost,
  port = defaultPort,
  remoteJobMonitor = createRemoteJobMonitor(),
  diagnose,
  agentExecutorFactory = (stage) => stage === "subtitle-timeline" ? createTtsExecutorFromEnv() : createAgentExecutorFromEnv(),
  remotionExecutorFactory = () => createRemotionExecutorFromEnv(),
} = {}) {
  recoverRemoteJobs();
  const runtime = createRuntime({ remoteJobMonitor, agentExecutorFactory, remotionExecutorFactory });
  const handlers = [
    createProjectRoutes({ runtime, remoteJobMonitor }),
    createBatchRoutes({ runtime }),
    createSeriesRoutes({ runtime }),
    createRemoteRoutes({ runtime, diagnose }),
  ];
  const server = http.createServer((request, response) => {
    const requestUrl = new URL(request.url ?? "/", `http://${host}`);
    (async () => {
      for (const handle of handlers) if (await handle({ request, response, pathname: requestUrl.pathname, search: requestUrl.search })) return;
      if (request.method !== "GET" && request.method !== "HEAD") { sendError(response, 405, { message: "Method not allowed", code: "method-not-allowed" }); return; }
      if (servePreview(response, requestUrl.pathname) || serveSeriesAsset(response, requestUrl.pathname)) return;
      serveStatic(response, requestUrl.pathname);
    })().catch((error) => { if (response.headersSent) response.destroy(error); else sendError(response, 400, { message: error.message, code: error.code ?? "web-request-failed", issues: error.issues ?? [] }); });
  });
  return {
    server,
    listen() { return new Promise((resolve, reject) => { const onError = (error) => { server.off("listening", onListening); reject(error); }; const onListening = () => { server.off("error", onError); remoteJobMonitor.start(); resolve(server); }; server.once("error", onError); server.once("listening", onListening); server.listen(port, host); }); },
    close() { remoteJobMonitor.stop(); return new Promise((resolve, reject) => { if (!server.listening) { resolve(); return; } server.closeIdleConnections?.(); server.close((error) => error ? reject(error) : resolve()); }); },
  };
}

if (process.argv[1] && path.resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  const webServer = createWebServer({ host: process.env.HARNESS_WEB_HOST ?? defaultHost, port: Number(process.env.HARNESS_WEB_PORT ?? defaultPort) }); await webServer.listen(); console.log(`Video Harness Web UI: http://${process.env.HARNESS_WEB_HOST ?? defaultHost}:${process.env.HARNESS_WEB_PORT ?? defaultPort}`);
}
