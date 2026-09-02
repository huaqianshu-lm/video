const batchPattern = /^\/api\/batches(?:\/([a-f0-9-]+)(?:\/action)?)?$/;

import { batchDefinitions, createBatch, getBatch, getBatchForView, listBatchesForView, approveTtsQc, approveSmokeQc, retryFailedBatchItems, runBatch } from "../../batches.mjs";
import { readJsonBody, sendError, sendJson } from "../http.mjs";

export function createBatchRoutes({ runtime } = {}) {
  return async function handleBatches({ request, response, pathname }) {
    const route = matchBatchRoute(request.method, pathname);
    if (!route) return false;
    if (!route.id && request.method === "GET") { sendJson(response, 200, { definitions: batchDefinitions(), batches: listBatchesForView() }); return true; }
    if (!route.id && request.method === "POST") { try { const body = await readJsonBody(request); const batch = createBatch({ type: body.type, slugs: body.slugs }); void runBatch(batch.id, { queueAgentJob: runtime.queueAgentJob }).catch(() => {}); sendJson(response, 202, { batch: getBatchForView(batch.id) }); } catch (error) { sendError(response, 400, { message: error.message, code: error.code, issues: error.issues ?? [] }); } return true; }
    if (!route.id) { sendError(response, 405, { message: "Method not allowed", code: "method-not-allowed" }); return true; }
    if (request.method === "GET" && !route.action) { const batch = getBatch(route.id); if (!batch) sendError(response, 404, { message: "Batch not found", code: "batch-not-found" }); else sendJson(response, 200, { batch: getBatchForView(route.id) }); return true; }
    if (request.method === "POST" && route.action) { try { const body = await readJsonBody(request); if (!getBatch(route.id)) { sendError(response, 404, { message: "Batch not found", code: "batch-not-found" }); return true; } if (body.action === "approve-tts-qc") approveTtsQc(route.id, body.slug); if (body.action === "approve-smoke-qc") approveSmokeQc(route.id, body.slug); if (body.action === "retry-failed") retryFailedBatchItems(route.id); if (!["run", "resume", "approve-tts-qc", "approve-smoke-qc", "retry-failed"].includes(body.action)) { sendError(response, 400, { message: `Unknown batch action: ${body.action ?? "missing"}`, code: "unknown-batch-action" }); return true; } void runBatch(route.id, { queueAgentJob: runtime.queueAgentJob }).catch(() => {}); sendJson(response, 202, { batch: getBatchForView(route.id) }); } catch (error) { sendError(response, 400, { message: error.message, code: error.code, issues: error.issues ?? [] }); } return true; }
    sendError(response, 405, { message: "Method not allowed", code: "method-not-allowed" }); return true;
  };
}

export function matchBatchRoute(method, pathname) {
  const match = pathname.match(batchPattern);
  if (!match) return null;
  return { method, id: match[1] ?? null, action: pathname.endsWith("/action") };
}
