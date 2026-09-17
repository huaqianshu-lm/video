const batchPattern = /^\/api\/batches(?:\/([a-f0-9-]+)(?:\/action)?)?$/;

import { batchDefinitions, commitBatchRenderDelivery, createBatch, getBatch, getBatchForView, listBatchesForView, approveTtsQc, prepareBatchRenderDelivery, retryFailedBatchItems, runBatch } from "../../batches.mjs";
import { readJsonBody, sendError, sendJson } from "../http.mjs";

export function createBatchRoutes({ runtime } = {}) {
  return async function handleBatches({ request, response, pathname }) {
    const route = matchBatchRoute(request.method, pathname);
    if (!route) return false;
    if (!route.id && request.method === "GET") { sendJson(response, 200, { definitions: batchDefinitions(), batches: listBatchesForView() }); return true; }
    if (!route.id && request.method === "POST") {
      try {
        const body = await readJsonBody(request);
        const batch = createBatch({ type: body.type, slugs: body.slugs });
        if (batch.type === "to-render") {
          await prepareBatchRenderDelivery(batch.id, { githubPreflight: runtime.githubPreflight });
          sendJson(response, 200, { batch: getBatchForView(batch.id) });
        } else {
          void runBatch(batch.id, { queueAgentJob: runtime.queueAgentJob, remoteMonitor: runtime.remoteJobMonitor }).catch(() => {});
          sendJson(response, 202, { batch: getBatchForView(batch.id) });
        }
      } catch (error) { sendError(response, 400, { message: error.message, code: error.code, issues: error.issues ?? [] }); }
      return true;
    }
    if (!route.id) { sendError(response, 405, { message: "Method not allowed", code: "method-not-allowed" }); return true; }
    if (request.method === "GET" && !route.action) { const batch = getBatch(route.id); if (!batch) sendError(response, 404, { message: "Batch not found", code: "batch-not-found" }); else sendJson(response, 200, { batch: getBatchForView(route.id) }); return true; }
    if (request.method === "POST" && route.action) {
      try {
        const body = await readJsonBody(request);
        const batch = getBatch(route.id);
        if (!batch) { sendError(response, 404, { message: "Batch not found", code: "batch-not-found" }); return true; }
        if (body.action === "prepare-render-delivery") {
          await prepareBatchRenderDelivery(route.id, { githubPreflight: runtime.githubPreflight });
          sendJson(response, 200, { batch: getBatchForView(route.id) });
          return true;
        }
        if (body.action === "commit-render-delivery") {
          commitBatchRenderDelivery(route.id, {
            confirmDelivery: body.confirmDelivery === true,
            confirmCommit: body.confirmCommit === true,
            confirmPush: body.confirmPush === true,
            deliveryPlanId: body.deliveryPlanId,
            selectedPaths: body.selectedPaths,
          });
          sendJson(response, 200, { batch: getBatchForView(route.id) });
          return true;
        }
        if (body.action === "dispatch-render") {
          if (body.confirmRender !== true) { const error = new Error("真实 GitHub Actions Render 需要单独确认"); error.code = "batch-render-dispatch-confirmation-required"; throw error; }
          if (batch.type !== "to-render" || batch.renderDelivery?.status !== "committed") { const error = new Error("批量渲染交付尚未完成 commit/push，不能派发"); error.code = "batch-render-delivery-not-committed"; throw error; }
          await runBatch(route.id, {
            queueAgentJob: runtime.queueAgentJob,
            remoteMonitor: runtime.remoteJobMonitor,
            requireRenderDeliveryConfirmation: true,
            confirmRender: true,
            githubPreflight: runtime.githubPreflight,
          });
          sendJson(response, 202, { batch: getBatchForView(route.id) });
          return true;
        }
        if (batch.type === "to-render" && ["run", "resume"].includes(body.action)) { const error = new Error("正式批量渲染必须使用 dispatch-render，并单独确认真实 Render"); error.code = "batch-render-dispatch-action-required"; throw error; }
        if (body.action === "approve-tts-qc") approveTtsQc(route.id, body.slug);
        if (body.action === "retry-failed") retryFailedBatchItems(route.id);
        if (!["run", "resume", "approve-tts-qc", "retry-failed"].includes(body.action)) { sendError(response, 400, { message: `Unknown batch action: ${body.action ?? "missing"}`, code: "unknown-batch-action" }); return true; }
        void runBatch(route.id, { queueAgentJob: runtime.queueAgentJob, remoteMonitor: runtime.remoteJobMonitor }).catch(() => {});
        sendJson(response, 202, { batch: getBatchForView(route.id) });
      } catch (error) { sendError(response, 400, { message: error.message, code: error.code, issues: error.issues ?? [] }); }
      return true;
    }
    sendError(response, 405, { message: "Method not allowed", code: "method-not-allowed" }); return true;
  };
}

export function matchBatchRoute(method, pathname) {
  const match = pathname.match(batchPattern);
  if (!match) return null;
  return { method, id: match[1] ?? null, action: pathname.endsWith("/action") };
}
