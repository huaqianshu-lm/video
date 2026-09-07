import { escapeHtml } from "../../shared/html.js";
import { labelFor, statusLabels } from "../../shared/labels.js";

const batchLabels = { "to-gate-2": "批量到 Gate 2", "to-tts": "批量完成 TTS", "to-remotion": "批量完成 Remotion", "to-render": "批量渲染" };

function sequence(project) {
  return project.sequence === null || project.sequence === undefined ? "—" : String(project.sequence).padStart(2, "0");
}

function attentionType(project) {
  const status = project?.status;
  if (["waiting", "waiting-gate", "waiting-tts-qc", "waiting-smoke-qc"].includes(status)) return "waiting";
  if (["failed", "blocked", "invalidated", "missing", "invalid", "timeout"].includes(status) || project?.next?.action === "fix-validation-issues") return "failure";
  if (["running", "queued", "dispatching", "in-progress", "submitted", "waiting-run"].includes(status) || project?.next?.action === "wait") return "running";
  return null;
}

function statusMarkup(project) {
  return `<span class="status status-${escapeHtml(project.status)}">${escapeHtml(labelFor(project.status, statusLabels))}</span>`;
}

function projectCard(project, selected) {
  const selectable = project.currentStage !== "completed";
  const selectReasonId = `project-select-reason-${project.slug}`;
  const selectReason = selectable ? "" : `<span id="${escapeHtml(selectReasonId)}" class="visually-hidden">项目已完成，不能加入新的批次。</span>`;
  return `<article class="project-card"><div class="card-heading"><div class="project-label"><label class="project-select" title="选择加入批次"><input type="checkbox" data-project-select="${escapeHtml(project.slug)}"${selectable ? "" : ` disabled aria-describedby="${escapeHtml(selectReasonId)}"`}${selected ? " checked" : ""} /><span>选择</span>${selectReason}</label><span class="project-sequence" aria-label="原文件序号 ${escapeHtml(sequence(project))}">${escapeHtml(sequence(project))}</span><p class="card-kicker">VIDEO PROJECT</p></div>${statusMarkup(project)}</div><h3 class="project-name">${escapeHtml(project.slug)}</h3><p class="card-stage">当前阶段：${escapeHtml(project.currentStage ?? "尚未初始化")}</p><div class="progress-track"><span style="width: ${project.progress}%"></span></div><div class="card-meta"><span>${project.succeededCount}/${project.stageCount} 个阶段</span><span>${project.progress}%</span></div><p class="card-next">${escapeHtml(project.next.message)}</p><button class="button button-primary project-open" type="button" data-slug="${escapeHtml(project.slug)}">查看详情</button></article>`;
}

function attentionCard(project) {
  return `<article class="attention-project-card"><div class="card-heading"><div class="project-label"><span class="project-sequence" aria-label="原文件序号 ${escapeHtml(sequence(project))}">${escapeHtml(sequence(project))}</span><p class="card-kicker">VIDEO PROJECT</p></div>${statusMarkup(project)}</div><h3 class="project-name">${escapeHtml(project.slug)}</h3><p class="card-stage">当前阶段：${escapeHtml(project.currentStage ?? "尚未初始化")} · ${project.progress}%</p><p class="card-next">${escapeHtml(project.next.message)}</p><button class="button button-secondary project-open" type="button" data-slug="${escapeHtml(project.slug)}">查看详情</button></article>`;
}

export function createDashboardView({ elements, api, store, refreshButton, onOpenProject, onCreateBatch, onData } = {}) {
  let mounted = false;
  let selectedSlugs = new Set();
  let batchSubmitting = false;
  let refreshHandler;
  const batchCleanup = [];
  const dynamicCleanup = [];

  function renderSummary(projects) {
    if (!elements.attentionSummary) return;
    if (!projects) {
      elements.attentionSummary.innerHTML = ["waiting", "failure", "running", "total"].map((type) => `<li class="attention-summary-item"><span>${type === "waiting" ? "等待人工" : type === "failure" ? "失败或阻塞" : type === "running" ? "运行中" : "项目总数"}</span><strong data-attention-count="${type}">—</strong></li>`).join("");
      return;
    }
    const counts = { waiting: 0, failure: 0, running: 0 };
    projects.forEach((project) => { const type = attentionType(project); if (type) counts[type] += 1; });
    elements.attentionSummary.innerHTML = [
      ["waiting", "等待人工", counts.waiting],
      ["failure", "失败或阻塞", counts.failure],
      ["running", "运行中", counts.running],
      ["total", "项目总数", projects.length],
    ].map(([type, label, count]) => `<li class="attention-summary-item summary-${type}"><span>${label}</span><strong data-attention-count="${type}">${count}</strong></li>`).join("");
  }

  function bindProjectEvents(container) {
    if (!container) return;
    container.querySelectorAll("[data-project-select]").forEach((input) => {
      const handler = () => {
        if (input.checked) selectedSlugs.add(input.dataset.projectSelect);
        else selectedSlugs.delete(input.dataset.projectSelect);
        updateSelection();
      };
      input.addEventListener("change", handler);
      dynamicCleanup.push(() => input.removeEventListener("change", handler));
    });
    container.querySelectorAll(".project-open").forEach((button) => {
      const handler = () => onOpenProject?.(button.dataset.slug);
      button.addEventListener("click", handler);
      dynamicCleanup.push(() => button.removeEventListener("click", handler));
    });
  }

  function updateSelection() {
    const count = selectedSlugs.size;
    elements.batchSelectionState.textContent = count === 0 ? "已选择 0 个视频。请先选择视频后再发起批量任务。" : `已选择 ${count} 个视频，可选择批次目标。`;
    elements.batchButtons.forEach((button) => { button.disabled = count === 0 || batchSubmitting; });
  }

  function render(projects) {
    dynamicCleanup.splice(0).forEach((cleanup) => cleanup());
    renderSummary(projects);
    const attentionProjects = projects.filter((project) => attentionType(project));
    if (elements.attentionProjectsState) {
      elements.attentionProjectsState.hidden = attentionProjects.length > 0;
      elements.attentionProjectsState.textContent = "当前没有等待处理的项目。";
    }
    if (elements.attentionProjectGrid) elements.attentionProjectGrid.innerHTML = attentionProjects.map(attentionCard).join("");
    elements.projectListState.hidden = projects.length > 0;
    if (projects.length === 0) {
      elements.projectListState.textContent = "暂时没有发现视频项目。";
      elements.projectGrid.innerHTML = "";
      if (elements.attentionProjectsState) {
        elements.attentionProjectsState.hidden = false;
        elements.attentionProjectsState.textContent = "当前没有等待处理的项目。";
      }
      updateSelection();
      return;
    }
    elements.projectGrid.innerHTML = projects.map((project) => projectCard(project, selectedSlugs.has(project.slug))).join("");
    bindProjectEvents(elements.projectGrid);
    bindProjectEvents(elements.attentionProjectGrid);
    updateSelection();
  }

  async function refresh() {
    elements.projectListState.hidden = false;
    elements.projectListState.textContent = "正在读取视频项目……";
    if (elements.attentionProjectsState) {
      elements.attentionProjectsState.hidden = false;
      elements.attentionProjectsState.textContent = "正在读取待处理项目……";
    }
    renderSummary(null);
    try {
      const [projects, series, jobs] = await Promise.all([api.getProjects(), api.getSeries(), api.getJobs()]);
      store?.setState({ projects, series, jobs });
      render(projects);
      onData?.({ projects, series, jobs });
    } catch (error) {
      elements.projectListState.textContent = `读取失败：${error.message}`;
      elements.projectGrid.innerHTML = "";
      if (elements.attentionProjectsState) {
        elements.attentionProjectsState.hidden = false;
        elements.attentionProjectsState.textContent = `读取失败：${error.message}`;
      }
      if (elements.attentionProjectGrid) elements.attentionProjectGrid.innerHTML = "";
    }
  }

  function mount() {
    if (mounted) return;
    mounted = true;
    elements.batchButtons.forEach((button) => button.setAttribute?.("aria-describedby", "batch-selection-state"));
    const batchHandler = async (button) => {
      const type = button.dataset.batchType;
      if (batchSubmitting || selectedSlugs.size === 0 || !window.confirm(`确认对 ${selectedSlugs.size} 个视频执行${batchLabels[type]}吗？`)) return;
      batchSubmitting = true;
      updateSelection();
      try {
        await onCreateBatch?.(type, [...selectedSlugs]);
        selectedSlugs.clear();
      } finally {
        batchSubmitting = false;
        updateSelection();
      }
    };
    elements.batchButtons.forEach((button) => {
      const handler = () => void batchHandler(button);
      button.addEventListener("click", handler);
      batchCleanup.push(() => button.removeEventListener("click", handler));
    });
    refreshHandler = () => void refresh();
    elements.refreshButton?.addEventListener("click", refreshHandler);
    void refresh();
  }

  return { mount, unmount() { if (!mounted) return; mounted = false; batchCleanup.splice(0).forEach((cleanup) => cleanup()); elements.refreshButton?.removeEventListener("click", refreshHandler); dynamicCleanup.splice(0).forEach((cleanup) => cleanup()); }, refresh, clearSelection() { selectedSlugs.clear(); updateSelection(); }, setSeriesProjects() {} };
}
