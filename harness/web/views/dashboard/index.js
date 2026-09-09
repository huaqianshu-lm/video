import { escapeHtml } from "../../shared/html.js";
import { labelFor, statusLabels } from "../../shared/labels.js";

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

function projectCard(project) {
  return `<article class="project-card"><div class="card-heading"><div class="project-label"><span class="project-sequence" aria-label="原文件序号 ${escapeHtml(sequence(project))}">${escapeHtml(sequence(project))}</span><p class="card-kicker">VIDEO PROJECT</p></div>${statusMarkup(project)}</div><h3 class="project-name">${escapeHtml(project.slug)}</h3><p class="card-stage">当前阶段：${escapeHtml(project.currentStage ?? "尚未初始化")}</p><div class="progress-track"><span style="width: ${project.progress}%"></span></div><div class="card-meta"><span>${project.succeededCount}/${project.stageCount} 个阶段</span><span>${project.progress}%</span></div><p class="card-next">${escapeHtml(project.next.message)}</p><button class="button button-primary project-open" type="button" data-slug="${escapeHtml(project.slug)}">查看详情</button></article>`;
}

function attentionCard(project) {
  return `<article class="attention-project-card"><div class="card-heading"><div class="project-label"><span class="project-sequence" aria-label="原文件序号 ${escapeHtml(sequence(project))}">${escapeHtml(sequence(project))}</span><p class="card-kicker">VIDEO PROJECT</p></div>${statusMarkup(project)}</div><h3 class="project-name">${escapeHtml(project.slug)}</h3><p class="card-stage">当前阶段：${escapeHtml(project.currentStage ?? "尚未初始化")} · ${project.progress}%</p><p class="card-next">${escapeHtml(project.next.message)}</p><button class="button button-secondary project-open" type="button" data-slug="${escapeHtml(project.slug)}">查看详情</button></article>`;
}

export function createDashboardView({ elements, api, store, refreshButton, onOpenProject, onData } = {}) {
  let mounted = false;
  let refreshHandler;
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
    container.querySelectorAll(".project-open").forEach((button) => {
      const handler = () => onOpenProject?.(button.dataset.slug);
      button.addEventListener("click", handler);
      dynamicCleanup.push(() => button.removeEventListener("click", handler));
    });
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
      return;
    }
    elements.projectGrid.innerHTML = projects.map(projectCard).join("");
    bindProjectEvents(elements.projectGrid);
    bindProjectEvents(elements.attentionProjectGrid);
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
    refreshHandler = () => void refresh();
    elements.refreshButton?.addEventListener("click", refreshHandler);
    void refresh();
  }

  return { mount, unmount() { if (!mounted) return; mounted = false; elements.refreshButton?.removeEventListener("click", refreshHandler); dynamicCleanup.splice(0).forEach((cleanup) => cleanup()); }, refresh, clearSelection() {}, setSeriesProjects() {} };
}
