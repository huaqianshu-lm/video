import { escapeHtml } from "../../shared/html.js";
import { batchItemStatusLabels, batchStatusLabels, batchTypeLabels, labelFor, remotionTaskStatusLabels } from "../../shared/labels.js";

function remotionError(task) {
  const message = task.error?.message ?? "未提供错误详情";
  const stderr = String(task.error?.stderr ?? "").trim();
  return stderr ? `${message} · 详细原因：${stderr.split(/\r?\n/).filter(Boolean).slice(-3).join(" ")}` : message;
}

export function createBatchView({ elements, api, refreshButton, onRefreshProjects, getActiveProject, onOpenProject } = {}) {
  let mounted = false;
  let refreshPromise = null;
  let refreshHandler;
  let batchListHandler;
  let taskListHandler;
  const pendingActions = new Set();
  const pendingTasks = new Set();

  function summaryElement() {
    return elements.summary ?? globalThis.document?.getElementById?.("batch-summary") ?? null;
  }

  function renderSummary({ batches, tasks, batchesError = null, tasksError = null } = {}) {
    const summary = summaryElement();
    if (!summary) return;
    summary.innerHTML = `<span><strong>${batchesError ? "—" : batches.length}</strong><small>批次记录</small></span><span><strong>${tasksError ? "—" : tasks.length}</strong><small>Remotion 制作任务</small></span>${batchesError || tasksError ? `<p class="summary-error">${escapeHtml([batchesError, tasksError].filter(Boolean).join("；"))}</p>` : ""}`;
  }

  function itemCard(batch, item) {
    const project = item.currentProject; const status = project?.status ?? item.status; const message = project?.message ?? item.message;
    const action = item.status === "waiting-tts-qc" && project?.ttsQcApproved !== true ? `<button class="button button-secondary" type="button" data-batch-action="approve-tts-qc" data-batch-id="${escapeHtml(batch.id)}" data-slug="${escapeHtml(item.slug)}">确认 TTS 质检</button>` : item.status === "waiting-smoke-qc" ? `<button class="button button-secondary" type="button" data-batch-action="approve-smoke-qc" data-batch-id="${escapeHtml(batch.id)}" data-slug="${escapeHtml(item.slug)}">确认 Smoke 检查</button>` : "";
    return `<li class="batch-item"><span><strong>${escapeHtml(item.slug)}</strong><small>${escapeHtml(message ?? "")}</small></span><span class="batch-item-actions"><span class="stage-status status status-${escapeHtml(status)}">${escapeHtml(labelFor(status, batchItemStatusLabels))}</span>${action}</span></li>`;
  }

  function renderBatches(batches) {
    if (!batches.length) { elements.batchList.className = "batch-list loading-state"; elements.batchList.textContent = "暂无批次记录。"; return; }
    elements.batchList.className = "batch-list";
    elements.batchList.innerHTML = batches.map((batch) => `<article class="batch-card"><div class="batch-card-heading"><div><p class="eyebrow">${escapeHtml(labelFor(batch.type, batchTypeLabels))}</p><h3>${escapeHtml(batch.label)}</h3></div><span class="batch-card-status"><span class="status status-${escapeHtml(batch.status)}">${escapeHtml(labelFor(batch.status, batchStatusLabels))}</span>${batch.status === "completed-with-errors" ? `<button class="button button-secondary" type="button" data-batch-action="retry-failed" data-batch-id="${escapeHtml(batch.id)}">重试失败项目</button>` : ""}</span></div><p class="batch-description">${escapeHtml(batch.description ?? "暂无批次说明")}</p><div class="batch-meta"><span>${escapeHtml(batch.id)}</span><span>目标：${escapeHtml(batch.targetStage ?? "—")}</span><span>${batch.summary?.total ?? batch.items?.length ?? 0} 个视频</span></div><ul class="batch-items">${(batch.items ?? []).map((item) => itemCard(batch, item)).join("") || "<li class=\"loading-state\">此批次暂无项目项。</li>"}</ul></article>`).join("");
  }

  function renderTasks(tasks) {
    if (!tasks.length) { elements.taskList.className = "batch-list loading-state"; elements.taskList.textContent = "暂无 Remotion 制作任务。"; return; }
    elements.taskList.className = "batch-list";
    elements.taskList.innerHTML = tasks.map((task) => { const failed = ["blocked", "failed"].includes(task.status); return `<article class="batch-card"><div class="batch-card-heading"><div><p class="eyebrow">${escapeHtml(task.kind ?? "REMOTION")}</p><h3>${escapeHtml(task.slug)}</h3></div><span class="batch-card-status"><span class="status status-${escapeHtml(task.status)}">${escapeHtml(labelFor(task.status, remotionTaskStatusLabels))}</span>${["ready", "blocked", "failed"].includes(task.status) ? `<button class="button button-secondary" type="button" aria-describedby="remotion-task-action-reason-${escapeHtml(task.id)}" data-remotion-task-action="run" data-task-id="${escapeHtml(task.id)}">${task.status === "ready" ? "执行 Agent" : "重试 Agent"}</button>` : ""}${task.status === "in-progress" ? `<button class="button button-secondary" type="button" aria-describedby="remotion-task-action-reason-${escapeHtml(task.id)}" data-remotion-task-action="complete" data-task-id="${escapeHtml(task.id)}">提交完成校验</button>` : ""}</span></div><p class="batch-description${failed ? " remotion-task-error" : ""}">${escapeHtml(failed ? `Remotion ${task.status === "blocked" ? "已阻塞" : "执行失败"}：${remotionError(task)}` : "根据 Visual Script、原型、音频、字幕和 Timeline 生成 Remotion 配置与主组件。")}</p><span id="remotion-task-action-reason-${escapeHtml(task.id)}" class="visually-hidden">操作提交中时按钮暂不可用，请等待服务端返回结果。</span><div class="batch-meta"><span>${escapeHtml(task.id)}</span><span>批次：${escapeHtml(task.batchId ?? "—")}</span><span>${task.outputArtifacts?.length ?? 0} 项输出</span></div></article>`; }).join("");
  }

  async function refresh() {
    if (refreshPromise) return refreshPromise;
    refreshPromise = (async () => {
      try {
        const [batchesResult, tasksResult] = await Promise.allSettled([api.getBatches(), api.getRemotionTasks()]);
        const batches = batchesResult.status === "fulfilled" ? batchesResult.value.batches ?? [] : [];
        const tasks = tasksResult.status === "fulfilled" ? tasksResult.value ?? [] : [];
        if (batchesResult.status === "fulfilled") renderBatches(batches);
        else { elements.batchList.className = "batch-list error-state"; elements.batchList.textContent = `读取批次失败：${batchesResult.reason.message}`; }
        if (tasksResult.status === "fulfilled") renderTasks(tasks);
        else { elements.taskList.className = "batch-list error-state"; elements.taskList.textContent = `读取 Remotion 制作任务失败：${tasksResult.reason.message}`; }
        renderSummary({ batches, tasks, batchesError: batchesResult.status === "rejected" ? `批次：${batchesResult.reason.message}` : null, tasksError: tasksResult.status === "rejected" ? `Remotion 任务：${tasksResult.reason.message}` : null });
      }
      finally { refreshPromise = null; }
    })();
    return refreshPromise;
  }

  async function action(action, id, slug = null, button = null) {
    const key = `${action}:${id}:${slug ?? ""}`;
    if (pendingActions.has(key)) return;
    pendingActions.add(key);
    if (button) button.disabled = true;
    try { await api.runBatchAction(id, { action, slug }); await refresh(); await onRefreshProjects?.(); }
    catch (error) { window.alert(`批次操作失败：${error.message}`); }
    finally { if (button?.isConnected) button.disabled = false; pendingActions.delete(key); }
  }

  async function taskAction(actionName, id) {
    if (pendingTasks.has(id)) return;
    pendingTasks.add(id);
    const buttons = [...document.querySelectorAll(`[data-remotion-task-action][data-task-id="${CSS.escape(id)}"]`)];
    buttons.forEach((button) => { button.disabled = true; button.textContent = "提交中……"; });
    try { const result = await api.runRemotionTaskAction(id, { action: actionName }); await refresh(); await onRefreshProjects?.(); if (getActiveProject?.()?.slug) await onOpenProject?.(getActiveProject().slug); return result; }
    catch (error) { window.alert(`Remotion 制作任务操作失败：${error.message}`); }
    finally { buttons.forEach((button) => { if (button.isConnected) button.disabled = false; }); pendingTasks.delete(id); }
  }

  function mount() {
    if (mounted) return; mounted = true;
    batchListHandler = (event) => { const button = event.target.closest("[data-batch-action]"); if (button) void action(button.dataset.batchAction, button.dataset.batchId, button.dataset.slug, button); };
    taskListHandler = (event) => { const button = event.target.closest("[data-remotion-task-action]"); if (button) void taskAction(button.dataset.remotionTaskAction, button.dataset.taskId); };
    elements.batchList.addEventListener("click", batchListHandler);
    elements.taskList.addEventListener("click", taskListHandler);
    refreshHandler = () => void refresh();
    refreshButton?.addEventListener("click", refreshHandler);
    void refresh();
  }
  return { mount, unmount() { if (!mounted) return; mounted = false; elements.batchList.removeEventListener("click", batchListHandler); elements.taskList.removeEventListener("click", taskListHandler); refreshButton?.removeEventListener("click", refreshHandler); pendingActions.clear(); pendingTasks.clear(); }, refresh, create: async (type, slugs) => { await api.createBatch({ type, slugs }); await refresh(); await onRefreshProjects?.(); } };
}
