const projectPattern = /^\/api\/projects\/([a-z0-9]+(?:-[a-z0-9]+)*)(?:\/(workspace|files|file|jobs|agent-jobs|alignment|action))?$/;

import { getProjectFile, getProjectPrototype, listProjectFiles } from "../../project-files.mjs";
import { getVideoProject, listVideoProjects } from "../../project-view.mjs";
import { findActiveJob, listJobs } from "../../jobs.mjs";
import { listAgentJobs } from "../../agent-jobs.mjs";
import { buildAlignmentView } from "../../remotion-alignment.mjs";
import { loadProject } from "../../storage.mjs";
import { getProjectWorkspace } from "../services/project-workspace.mjs";
import { createProjectActionService } from "../services/project-actions.mjs";
import { readJsonBody, readBody, sendError, sendJson } from "../http.mjs";
import { importSourceProject, MAX_SOURCE_BYTES } from "../../source-import.mjs";

export function createProjectRoutes({ runtime, remoteJobMonitor } = {}) {
  const actionService = createProjectActionService(runtime);
  return async function handleProjects({ request, response, pathname, search }) {
    if (pathname === "/api/projects" && request.method === "GET") { sendJson(response, 200, { projects: listVideoProjects() }); return true; }
    if (pathname === "/api/projects/import" && request.method === "PUT") {
      try {
        const body = await readBody(request, MAX_SOURCE_BYTES); const query = new URLSearchParams(search);
        const result = importSourceProject({ slug: query.get("slug"), filename: query.get("filename"), content: body, seriesId: query.get("seriesId") });
        sendJson(response, 201, { result, project: getVideoProject(result.slug) });
      } catch (error) { sendError(response, error?.code === "source-project-exists" ? 409 : 400, { message: error.message, code: error.code ?? "source-import-failed", issues: error.issues ?? [] }); }
      return true;
    }
    const route = matchProjectRoute(request.method, pathname);
    if (!route) return false;
    if (route.resource === "action") {
      if (request.method !== "POST") { sendError(response, 405, { message: "Method not allowed", code: "method-not-allowed" }); return true; }
      try { const body = await readJsonBody(request); const result = await actionService.execute({ ...body, slug: route.slug }); sendJson(response, result.status ?? 200, { ...result, status: undefined }); }
      catch (error) { sendError(response, error.code === "video-project-not-found" ? 404 : error.code === "project-already-initialized" || error.code === "project-not-initialized" ? 409 : 400, { message: error.message, code: error.code, issues: error.issues ?? [] }); }
      return true;
    }
    if (request.method !== "GET" && request.method !== "HEAD") { sendError(response, 405, { message: "Method not allowed", code: "method-not-allowed" }); return true; }
    if (route.resource === "workspace") { const workspace = await getProjectWorkspace(route.slug, { remoteJobMonitor }); if (!workspace) sendError(response, 404, { message: "Video project not found", code: "video-project-not-found" }); else sendJson(response, 200, workspace); return true; }
    if (route.resource === "detail") { let project = getVideoProject(route.slug); if (!project) sendError(response, 404, { message: "Video project not found", code: "video-project-not-found" }); else { if (project.initialized) { await remoteJobMonitor.poll(); project = getVideoProject(route.slug); } sendJson(response, 200, { project }); } return true; }
    if (route.resource === "files") { const files = listProjectFiles(route.slug); if (!files) sendError(response, 404, { message: "Video project not found", code: "video-project-not-found" }); else sendJson(response, 200, { files }); return true; }
    if (route.resource === "file") { const requestedPath = new URLSearchParams(search).get("path"); const file = requestedPath ? getProjectFile(route.slug, requestedPath) : null; if (!file) sendError(response, 404, { message: "Project file not found or not allowed", code: "project-file-not-found" }); else sendJson(response, 200, { file }); return true; }
    if (route.resource === "jobs") { const project = getVideoProject(route.slug); if (!project) sendError(response, 404, { message: "Video project not found", code: "video-project-not-found" }); else sendJson(response, 200, { jobs: listJobs(route.slug), activeJob: project.currentStage ? findActiveJob(route.slug, project.currentStage) : null }); return true; }
    if (route.resource === "agent-jobs") { if (!getVideoProject(route.slug)) sendError(response, 404, { message: "Video project not found", code: "video-project-not-found" }); else sendJson(response, 200, { jobs: listAgentJobs({ slug: route.slug }) }); return true; }
    if (route.resource === "alignment") { const project = getVideoProject(route.slug); if (!project?.initialized) sendError(response, 404, { message: "Initialized video project not found", code: "initialized-project-not-found" }); else sendJson(response, 200, { alignment: buildAlignmentView(loadProject(route.slug, { refresh: false })) }); return true; }
    return false;
  };
}

export function matchProjectRoute(method, pathname) {
  const match = pathname.match(projectPattern);
  if (!match || match[1] === "import") return null;
  return { method, slug: match[1], resource: match[2] ?? "detail" };
}

export function isProjectRoute(method, pathname, resource) {
  const route = matchProjectRoute(method, pathname);
  return route?.resource === resource;
}
