import { escapeHtml } from "../../shared/html.js";
import { batchItemStatusLabels, batchStatusLabels, batchTypeLabels, labelFor } from "../../shared/labels.js";

function itemCard(batch, item) {
  const project = item.currentProject;
  const status = project?.status ?? item.status;
  const message = project?.message ?? item.message;
  const action = item.status === "waiting-tts-qc" && project?.ttsQcApproved !== true
    ? `<button class="button button-secondary" type="button" data-batch-action="approve-tts-qc" data-batch-id="${escapeHtml(batch.id)}" data-slug="${escapeHtml(item.slug)}">确认 TTS 质检</button>`
    : "";
  return `<article class="batch-item-card"><div class="batch-item-card-heading"><strong>${escapeHtml(item.slug)}</strong><span class="stage-status status status-${escapeHtml(status)}">${escapeHtml(labelFor(status, batchItemStatusLabels))}</span></div><p class="batch-item-message">${escapeHtml(message ?? "暂无服务端消息")}</p><div class="batch-item-actions">${action}</div></article>`;
}

function renderDelivery(batch) {
  if (batch.type !== "to-render") return "";
  const delivery = batch.renderDelivery;
  if (!delivery) {
    return `<section class="batch-render-delivery"><strong>正式渲染交付</strong><p>尚未完成输入包和 Git 交付预检。</p><button class="button button-secondary" type="button" data-batch-action="prepare-render-delivery" data-batch-id="${escapeHtml(batch.id)}">重新预检交付</button></section>`;
  }
  const issueList = [...(delivery.issues ?? []), ...(delivery.confirmationIssues ?? [])];
  const files = delivery.git?.selectedPaths ?? [];
  const bindings = (delivery.videos ?? []).map((video) => `<li><strong>${escapeHtml(video.slug)}</strong> · Composition：${escapeHtml(video.compositionId ?? "—")} · URL：${escapeHtml(video.renderInputUrl ?? "缺失")} · ZIP SHA-256：${escapeHtml(video.renderInputSha256 ?? "缺失")} · fingerprint：${escapeHtml(video.packageFingerprint ?? "缺失")} · 绑定文件 SHA-256：${escapeHtml(video.deliveryBindingSha256 ?? "缺失")} · 分支：${escapeHtml(video.branch ?? "—")} · dispatch ref：${escapeHtml(video.dispatchRef ?? "—")} · commit：${escapeHtml(video.commitSha ?? "尚未提交")} · Job：${escapeHtml(video.remoteJobId ?? "尚未派发")} · Run：${escapeHtml(video.runId ?? "尚未确认")} ${video.runUrl ? `（${escapeHtml(video.runUrl)}）` : ""}</li>`).join("");
  let action = `<button class="button button-secondary" type="button" data-batch-action="prepare-render-delivery" data-batch-id="${escapeHtml(batch.id)}">重新预检交付</button>`;
  if (delivery.status === "needs-confirmation") action = `<button class="button button-primary" type="button" data-batch-action="commit-render-delivery" data-batch-id="${escapeHtml(batch.id)}">确认文件清单并 commit / push</button>`;
  if (delivery.status === "committed") action = `<button class="button button-primary" type="button" data-batch-action="dispatch-render" data-batch-id="${escapeHtml(batch.id)}">确认并开始真实 Render</button>`;
  return `<section class="batch-render-delivery"><div class="batch-render-delivery-heading"><strong>正式渲染交付：${escapeHtml(delivery.status)}</strong>${action}</div>${issueList.length ? `<ul class="batch-render-delivery-issues">${issueList.map((issue) => `<li>${escapeHtml(issue)}</li>`).join("")}</ul>` : ""}<details><summary>查看逐视频绑定和精确提交文件</summary><p>逐视频绑定：</p><ul>${bindings || "<li>暂无绑定记录</li>"}</ul><p>本次精确提交文件：</p><ul>${files.map((file) => `<li data-batch-delivery-path="${escapeHtml(file)}"><code>${escapeHtml(file)}</code></li>`).join("") || "<li>本次没有需要提交的文件</li>"}</ul></details></section>`;
}

export function createBatchView({ elements, api, refreshButton, onRefreshProjects } = {}) {
  let mounted = false;
  let refreshPromise = null;
  let refreshHandler;
  let batchListHandler;
  let renderedBatches = new Map();
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
    renderedBatches = new Map(batches.map((batch) => [batch.id, batch]));
    if (!batches.length) {
      elements.batchList.className = "batch-list loading-state";
      elements.batchList.textContent = "暂无批次记录。";
      return;
    }
    elements.batchList.className = "batch-list batch-record-grid";
    elements.batchList.innerHTML = batches.map((batch) => {
      const resumeConfig = batch.items?.some((item) => item.status === "waiting-config");
      const actions = [];
      if (batch.status === "completed-with-errors") actions.push(`<button class="button button-secondary" type="button" data-batch-action="retry-failed" data-batch-id="${escapeHtml(batch.id)}">重试失败项目</button>`);
      if (resumeConfig) actions.push(`<button class="button button-secondary" type="button" data-batch-action="resume" data-batch-id="${escapeHtml(batch.id)}">重新检查 GitHub 配置</button>`);
      const action = actions.join("");
      return `<article class="batch-card"><div class="batch-card-heading"><div><p class="eyebrow">${escapeHtml(labelFor(batch.type, batchTypeLabels))}</p><h3>${escapeHtml(batch.label)}</h3></div><span class="batch-card-status"><span class="status status-${escapeHtml(batch.status)}">${escapeHtml(labelFor(batch.status, batchStatusLabels))}</span>${action}</span></div><p class="batch-description">${escapeHtml(batch.description ?? "暂无批次说明")}</p><div class="batch-meta"><span>${escapeHtml(batch.id)}</span><span>目标：${escapeHtml(batch.targetStage ?? "—")}</span><span>${batch.summary?.total ?? batch.items?.length ?? 0} 个视频</span></div>${renderDelivery(batch)}<div class="batch-item-grid">${(batch.items ?? []).map((item) => itemCard(batch, item)).join("") || "<div class=\"loading-state\">此批次暂无项目项。</div>"}</div></article>`;
    }).join("");
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
      const body = { action: actionName, slug };
      const batch = renderedBatches.get(id);
      if (actionName === "commit-render-delivery") {
        const confirm = globalThis.window?.confirm;
        const delivery = batch?.renderDelivery;
        if (typeof confirm !== "function" || !delivery?.git?.planId) throw new Error("当前页面无法完成批量交付确认，请重新打开 WebUI");
        if (!confirm("请确认页面展示的逐视频输入绑定和精确 Git 文件清单。")) return;
        if (!confirm("请单独授权为这批视频执行定向 commit。")) return;
        if (!confirm("请单独授权把这次定向提交 push 到目标分支。")) return;
        body.confirmDelivery = true;
        body.confirmCommit = true;
        body.confirmPush = true;
        body.deliveryPlanId = delivery.git.planId;
        body.selectedPaths = delivery.git.selectedPaths;
      }
      if (actionName === "dispatch-render") {
        const confirm = globalThis.window?.confirm;
        if (typeof confirm !== "function" || !confirm("输入包绑定、提交和 push 均已确认。现在授权真实 GitHub Actions Render 吗？")) return;
        body.confirmRender = true;
      }
      await api.runBatchAction(id, body);
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
      renderedBatches.clear();
    },
    refresh,
    create: async (type, slugs) => {
      await api.createBatch({ type, slugs });
      await refresh();
      await onRefreshProjects?.();
    },
  };
}
