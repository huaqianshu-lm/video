import { escapeHtml } from "../../shared/html.js";
import { batchItemStatusLabels, batchStatusLabels, batchTypeLabels, labelFor } from "../../shared/labels.js";

function itemCard(batch, item) {
  const project = item.currentProject;
  const status = project?.status ?? item.status;
  const message = project?.message ?? item.message;
  const action = item.status === "waiting-tts-qc" && project?.ttsQcApproved !== true
    ? `<button class="button button-secondary" type="button" data-batch-action="approve-tts-qc" data-batch-id="${escapeHtml(batch.id)}" data-slug="${escapeHtml(item.slug)}">确认 TTS 质检</button>`
    : item.status === "waiting-smoke-qc"
      ? `<button class="button button-secondary" type="button" data-batch-action="approve-smoke-qc" data-batch-id="${escapeHtml(batch.id)}" data-slug="${escapeHtml(item.slug)}">确认 Smoke 检查</button>`
      : "";
  return `<article class="batch-item-card"><div class="batch-item-card-heading"><strong>${escapeHtml(item.slug)}</strong><span class="stage-status status status-${escapeHtml(status)}">${escapeHtml(labelFor(status, batchItemStatusLabels))}</span></div><p class="batch-item-message">${escapeHtml(message ?? "暂无服务端消息")}</p><div class="batch-item-actions">${action}</div></article>`;
}

export function createBatchView({ elements, api, refreshButton, onRefreshProjects } = {}) {
  let mounted = false;
  let refreshPromise = null;
  let refreshHandler;
  let batchListHandler;
  const pendingActions = new Set();

  function summaryElement() {
    return elements.summary ?? globalThis.document?.getElementById?.("batch-summary") ?? null;
  }

  function renderSummary(batches, error = null) {
    const summary = summaryElement();
    if (!summary) return;
    summary.innerHTML = `<span><strong>${error ? "—" : batches.length}</strong><small>批次记录</small></span>${error ? `<p class="summary-error">${escapeHtml(`批次：${error}`)}</p>` : ""}`;
  }

  function renderBatches(batches) {
    if (!batches.length) {
      elements.batchList.className = "batch-list loading-state";
      elements.batchList.textContent = "暂无批次记录。";
      return;
    }
    elements.batchList.className = "batch-list batch-record-grid";
    elements.batchList.innerHTML = batches.map((batch) => `<article class="batch-card"><div class="batch-card-heading"><div><p class="eyebrow">${escapeHtml(labelFor(batch.type, batchTypeLabels))}</p><h3>${escapeHtml(batch.label)}</h3></div><span class="batch-card-status"><span class="status status-${escapeHtml(batch.status)}">${escapeHtml(labelFor(batch.status, batchStatusLabels))}</span>${batch.status === "completed-with-errors" ? `<button class="button button-secondary" type="button" data-batch-action="retry-failed" data-batch-id="${escapeHtml(batch.id)}">重试失败项目</button>` : ""}</span></div><p class="batch-description">${escapeHtml(batch.description ?? "暂无批次说明")}</p><div class="batch-meta"><span>${escapeHtml(batch.id)}</span><span>目标：${escapeHtml(batch.targetStage ?? "—")}</span><span>${batch.summary?.total ?? batch.items?.length ?? 0} 个视频</span></div><div class="batch-item-grid">${(batch.items ?? []).map((item) => itemCard(batch, item)).join("") || "<div class=\"loading-state\">此批次暂无项目项。</div>"}</div></article>`).join("");
  }

  async function refresh() {
    if (refreshPromise) return refreshPromise;
    refreshPromise = (async () => {
      try {
        const result = await api.getBatches();
        const batches = result?.batches ?? [];
        renderBatches(batches);
        renderSummary(batches);
      } catch (error) {
        elements.batchList.className = "batch-list error-state";
        elements.batchList.textContent = `读取批次失败：${error.message}`;
        renderSummary([], error.message);
      } finally {
        refreshPromise = null;
      }
    })();
    return refreshPromise;
  }

  async function action(actionName, id, slug = null, button = null) {
    const key = `${actionName}:${id}:${slug ?? ""}`;
    if (pendingActions.has(key)) return;
    pendingActions.add(key);
    if (button) button.disabled = true;
    try {
      await api.runBatchAction(id, { action: actionName, slug });
      await refresh();
      await onRefreshProjects?.();
    } catch (error) {
      globalThis.window?.alert?.(`批次操作失败：${error.message}`);
    } finally {
      if (button?.isConnected) button.disabled = false;
      pendingActions.delete(key);
    }
  }

  function mount() {
    if (mounted) return;
    mounted = true;
    batchListHandler = (event) => {
      const button = event.target.closest?.("[data-batch-action]");
      if (button) void action(button.dataset.batchAction, button.dataset.batchId, button.dataset.slug, button);
    };
    elements.batchList.addEventListener("click", batchListHandler);
    refreshHandler = () => void refresh();
    refreshButton?.addEventListener("click", refreshHandler);
    void refresh();
  }

  return {
    mount,
    unmount() {
      if (!mounted) return;
      mounted = false;
      elements.batchList.removeEventListener("click", batchListHandler);
      refreshButton?.removeEventListener("click", refreshHandler);
      pendingActions.clear();
    },
    refresh,
    create: async (type, slugs) => {
      await api.createBatch({ type, slugs });
      await refresh();
      await onRefreshProjects?.();
    },
  };
}
