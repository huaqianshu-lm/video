import { escapeHtml } from "../../shared/html.js";
import { labelFor, statusLabels } from "../../shared/labels.js";

const batchLabels = { "to-gate-2": "批量到 Gate 2", "to-tts": "批量完成 TTS", "to-remotion": "批量完成 Remotion", "to-render": "批量渲染" };

function projectOption(project, selected) {
  const slug = escapeHtml(project.slug);
  const inputId = `batch-project-select-${slug}`;
  return `<article class="batch-project-option"><label class="batch-project-select" for="${inputId}"><input id="${inputId}" type="checkbox" data-batch-project-select="${slug}"${selected ? " checked" : ""} /><span>选择</span></label><div class="batch-project-option-copy"><strong>${slug}</strong><small>当前阶段：${escapeHtml(project.currentStage ?? "尚未初始化")} · ${escapeHtml(labelFor(project.status, statusLabels))}</small><small>${escapeHtml(project.next?.message ?? "暂无下一步说明")}</small></div><button class="button button-secondary batch-project-open" type="button" data-batch-project-open="${slug}">查看详情</button></article>`;
}

export function createBatchCreationView({ elements, api, onCreateBatch, onCreated, onOpenProject } = {}) {
  let mounted = false;
  let projects = [];
  let selectedSlugs = new Set();
  let submitting = false;
  let listHandler;
  let openProjectHandler;
  let actionsHandler;
  let refreshPromise = null;

  function updateSelection() {
    const count = selectedSlugs.size;
    elements.selectionState.textContent = `已选择 ${count} 个视频。`;
    elements.state.textContent = count === 0 ? "请先选择视频，再选择批量目标。" : `已选择 ${count} 个视频，可选择批量目标。`;
    elements.actions.querySelectorAll("[data-batch-type]").forEach((button) => { button.disabled = count === 0 || submitting; });
  }

  function render() {
    const selectable = projects.filter((project) => project.currentStage !== "completed");
    elements.listState.hidden = selectable.length > 0;
    elements.listState.textContent = projects.length === 0 ? "暂时没有发现视频项目。" : "所有视频项目都已完成，暂无可加入批次的项目。";
    elements.list.innerHTML = selectable.map((project) => projectOption(project, selectedSlugs.has(project.slug))).join("");
    updateSelection();
  }

  async function refresh() {
    if (refreshPromise) return refreshPromise;
    elements.listState.hidden = false;
    elements.listState.textContent = "正在读取视频项目……";
    refreshPromise = api.getProjects().then((nextProjects) => {
      projects = nextProjects;
      selectedSlugs = new Set([...selectedSlugs].filter((slug) => projects.some((project) => project.slug === slug && project.currentStage !== "completed")));
      render();
    }).catch((error) => {
      elements.listState.hidden = false;
      elements.listState.textContent = `读取失败：${error.message}`;
      elements.list.innerHTML = "";
    }).finally(() => { refreshPromise = null; });
    return refreshPromise;
  }

  async function create(type) {
    if (submitting || selectedSlugs.size === 0) return;
    const count = selectedSlugs.size;
    if (!(globalThis.window?.confirm?.(`确认对 ${count} 个视频执行${batchLabels[type]}吗？`) ?? true)) return;
    submitting = true;
    updateSelection();
    elements.state.textContent = "正在创建批次……";
    try {
      await onCreateBatch?.(type, [...selectedSlugs]);
      selectedSlugs.clear();
      await onCreated?.();
    } catch (error) {
      elements.state.textContent = `创建批次失败：${error.message}`;
    } finally {
      submitting = false;
      updateSelection();
    }
  }

  function mount() {
    if (mounted) return;
    mounted = true;
    listHandler = (event) => {
      const input = event.target.closest?.("[data-batch-project-select]");
      if (!input) return;
      if (input.checked) selectedSlugs.add(input.dataset.batchProjectSelect);
      else selectedSlugs.delete(input.dataset.batchProjectSelect);
      updateSelection();
    };
    openProjectHandler = (event) => {
      const button = event.target.closest?.("[data-batch-project-open]");
      if (button) onOpenProject?.(button.dataset.batchProjectOpen);
    };
    actionsHandler = (event) => {
      const button = event.target.closest?.("[data-batch-type]");
      if (button) void create(button.dataset.batchType);
    };
    elements.list.addEventListener("change", listHandler);
    elements.list.addEventListener("click", openProjectHandler);
    elements.actions.addEventListener("click", actionsHandler);
  }

  return {
    mount,
    unmount() {
      if (!mounted) return;
      mounted = false;
      elements.list.removeEventListener("change", listHandler);
      elements.list.removeEventListener("click", openProjectHandler);
      elements.actions.removeEventListener("click", actionsHandler);
    },
    refresh,
    clearSelection() { selectedSlugs.clear(); updateSelection(); },
  };
}
