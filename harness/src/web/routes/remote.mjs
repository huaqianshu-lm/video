import { listAllJobs } from "../../jobs.mjs";
import { diagnoseGitHubActions } from "../../diagnostics.mjs";
import { getAgentJob, listAgentJobs, recoverInterruptedAgentJobs, retryAgentJob } from "../../agent-jobs.mjs";
import { completeRemotionTask, getRemotionTask, listRemotionTasks, recoverInterruptedRemotionTasks, retryRemotionTask, startRemotionTask } from "../../remotion-tasks.mjs";
import { runBatch } from "../../batches.mjs";
import { readJsonBody, sendError, sendJson } from "../http.mjs";

export function createRemoteRoutes({ runtime, diagnose = diagnoseGitHubActions } = {}) {
  return async function handleRemote({ request, response, pathname }) {
    if (pathname === "/api/health" && request.method === "GET") { sendJson(response, 200, { service: "video-production-harness-web", harnessVersion: "0.6.0", status: "ok" }); return true; }
    if (pathname === "/api/jobs" && request.method === "GET") { sendJson(response, 200, { jobs: listAllJobs() }); return true; }
    if (pathname === "/api/agent-jobs" && request.method === "GET") { sendJson(response, 200, { jobs: listAgentJobs() }); return true; }
    if (pathname === "/api/diagnostics/github" && request.method === "GET") { try { sendJson(response, 200, await diagnose()); } catch (error) { sendError(response, 400, { message: error.message, code: error.code ?? "github-diagnostics-failed", issues: error.issues ?? [] }); } return true; }
    const agent = pathname.match(/^\/api\/agent-jobs\/([a-f0-9-]+)(?:\/action)?$/);
    if (agent) {
      const action = pathname.endsWith("/action");
      if (request.method === "GET" && !action) { const job = getAgentJob(agent[1]); if (!job) sendError(response, 404, { message: "Agent Job not found", code: "agent-job-not-found" }); else sendJson(response, 200, { job }); return true; }
      if (request.method === "POST" && action) { try { const body = await readJsonBody(request); if (body.action !== "retry") { sendError(response, 400, { message: `Unknown Agent Job action: ${body.action ?? "missing"}`, code: "unknown-agent-job-action" }); return true; } retryAgentJob(agent[1]); runtime.queueAgentJob(agent[1]); sendJson(response, 202, { job: getAgentJob(agent[1]) }); } catch (error) { sendError(response, 400, { message: error.message, code: error.code, issues: error.issues ?? [] }); } return true; }
      sendError(response, 405, { message: "Method not allowed", code: "method-not-allowed" }); return true;
    }
    if (pathname === "/api/remotion-tasks" && request.method === "GET") { sendJson(response, 200, { tasks: listRemotionTasks() }); return true; }
    const task = pathname.match(/^\/api\/remotion-tasks\/([a-f0-9-]+)(?:\/action)?$/);
    if (task) {
      const actionPath = pathname.endsWith("/action");
      if (request.method === "GET" && !actionPath) { const value = getRemotionTask(task[1]); if (!value) sendError(response, 404, { message: "Remotion task not found", code: "remotion-task-not-found" }); else sendJson(response, 200, { task: value }); return true; }
      if (request.method === "POST" && actionPath) { try { const body = await readJsonBody(request); const value = getRemotionTask(task[1]); if (body.action === "run") { if (!value) throw new Error(`Remotion task not found: ${task[1]}`); if (value.status === "in-progress") { sendJson(response, 202, { task: value }); return true; } if (!["ready", "blocked", "failed"].includes(value.status)) throw new Error(`Remotion task is not runnable: ${value.status}`); if (["blocked", "failed"].includes(value.status)) retryRemotionTask(task[1]); runtime.queueRemotionTask(task[1]); sendJson(response, 202, { task: getRemotionTask(task[1]) }); return true; } let result; if (body.action === "start") result = { task: startRemotionTask(task[1]) }; else if (body.action === "retry") result = { task: retryRemotionTask(task[1]) }; else if (body.action === "complete") { result = completeRemotionTask(task[1]); if (result.completed && result.task.batchId) result.batch = await runBatch(result.task.batchId); } else { sendError(response, 400, { message: `Unknown Remotion task action: ${body.action ?? "missing"}`, code: "unknown-remotion-task-action" }); return true; } sendJson(response, 200, result); } catch (error) { sendError(response, 400, { message: error.message, code: error.code, issues: error.issues ?? [] }); } return true; }
      sendError(response, 405, { message: "Method not allowed", code: "method-not-allowed" }); return true;
    }
    return false;
  };
}

export function recoverRemoteJobs() {
  recoverInterruptedAgentJobs();
  recoverInterruptedRemotionTasks();
}
