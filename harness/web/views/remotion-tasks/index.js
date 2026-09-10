import { escapeHtml } from "../../shared/html.js";
import { labelFor, remotionTaskStatusLabels } from "../../shared/labels.js";

function remotionError(task) {
  const message = task.error?.message ?? "未提供错误详情";
  const stderr = String(task.error?.stderr ?? "").trim();
  return stderr ? `${message} · 详细原因：${stderr.split(/\r?\n/).filter(Boolean).slice(-3).join(" ")}` : message;
}

function taskCard(task) {
  const failed = ["blocked", "failed"].includes(task.status);
  const action = ["ready", "blocked", "failed"].includes(task.status)
    ? `<button class="button button-secondary" type="button" aria-describedby="remotion-task-action-reason-${escapeHtml(task.id)}" data-remotion-task-action="run" data-task-id="${escapeHtml(task.id)}">${task.status === "ready" ? "执行 Agent" : "重试 Agent"}</button>`
    : task.status === "in-progress"
      ? `<button class="button button-secondary" type="button" aria-describedby="remotion-task-action-reason-${escapeHtml(task.id)}" data-remotion-task-action="complete" data-task-id="${escapeHtml(task.id)}">提交完成校验</button>`
      : "";
  return `<article class="batch-card remotion-task-card"><div class="batch-card-heading"><div><p class="eyebrow">${escapeHtml(task.kind ?? "REMOTION")}</p><h3>${escapeHtml(task.slug)}</h3></div><span class="batch-card-status"><span class="status status-${escapeHtml(task.status)}">${escapeHtml(labelFor(task.status, remotionTaskStatusLabels))}</span>${action}</span></div><p class="batch-description${failed ? " remotion-task-error" : ""}">${escapeHtml(failed ? `Remotion ${task.status === "blocked" ? "已阻塞" : "执行失败"}：${remotionError(task)}` : "根据 Visual Script、原型、音频、字幕和 Timeline 生成 Remotion 配置与主组件。")}</p><span id="remotion-task-action-reason-${escapeHtml(task.id)}" class="visually-hidden">操作提交中时按钮暂不可用，请等待服务端返回结果。</span><div class="batch-meta"><span>${escapeHtml(task.id)}</span><span>批次：${escapeHtml(task.batchId ?? "—")}</span><span>${task.outputArtifacts?.length ?? 0} 项输出</span></div></article>`;
}

export function createRemotionTasksView({ elements, api, refreshButton, onRefreshProjects, getActiveProject, onOpenProject } = {}) {
  let mounted = false;
  let refreshPromise = null;
  let refreshHandler;
  let taskListHandler;
  const pendingTasks = new Set();

  function renderTasks(tasks) {
    if (!tasks.length) {
      elements.taskList.className = "batch-list loading-state";
      elements.taskList.textContent = "暂无 Remotion 制作任务。";
      return;
    }
    elements.taskList.className = "batch-list remotion-task-grid";
    elements.taskList.innerHTML = tasks.map(taskCard).join("");
  }

  async function refresh() {
    if (refreshPromise) return refreshPromise;
    refreshPromise = (async () => {
      try {
        const result = await api.getRemotionTasks();
        renderTasks(Array.isArray(result) ? result : result?.tasks ?? []);
      } catch (error) {
        elements.taskList.className = "batch-list error-state";
        elements.taskList.textContent = `读取 Remotion 制作任务失败：${error.message}`;
      } finally {
        refreshPromise = null;
      }
    })();
    return refreshPromise;
  }

  async function taskAction(actionName, id) {
    if (pendingTasks.has(id)) return;
    pendingTasks.add(id);
    const buttons = [...elements.taskList.querySelectorAll("[data-remotion-task-action]")].filter((button) => button.dataset.taskId === id);
    buttons.forEach((button) => { button.disabled = true; button.textContent = "提交中……"; });
    try {
      const result = await api.runRemotionTaskAction(id, { action: actionName });
      await refresh();
      await onRefreshProjects?.();
      const activeProject = getActiveProject?.();
      if (activeProject?.slug) await onOpenProject?.(activeProject.slug);
      return result;
    } catch (error) {
      globalThis.window?.alert?.(`Remotion 制作任务操作失败：${error.message}`);
    } finally {
      buttons.forEach((button) => { if (button.isConnected) button.disabled = false; });
      pendingTasks.delete(id);
    }
  }

  function mount() {
    if (mounted) return;
    mounted = true;
    taskListHandler = (event) => {
      const button = event.target.closest?.("[data-remotion-task-action]");
      if (button) void taskAction(button.dataset.remotionTaskAction, button.dataset.taskId);
    };
    elements.taskList.addEventListener("click", taskListHandler);
    refreshHandler = () => void refresh();
    refreshButton?.addEventListener("click", refreshHandler);
    void refresh();
  }

  return {
    mount,
    unmount() {
      if (!mounted) return;
      mounted = false;
      elements.taskList.removeEventListener("click", taskListHandler);
      refreshButton?.removeEventListener("click", refreshHandler);
      pendingTasks.clear();
    },
    refresh,
  };
}
