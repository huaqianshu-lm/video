import { escapeHtml } from "../../shared/html.js";
import { labelFor, statusLabels } from "../../shared/labels.js";

const batchLabels = { "to-gate-2": "批量到 Gate 2", "to-tts": "批量完成 TTS", "to-remotion": "批量完成 Remotion", "to-render": "批量渲染" };

function sequence(project) {
  return project.sequence === null || project.sequence === undefined ? "—" : String(project.sequence).padStart(2, "0");
}

function projectCard(project, selected) {
  const selectable = project.currentStage !== "completed";
  return `<article class="project-card"><div class="card-heading"><div class="project-label"><label class="project-select" title="选择加入批次"><input type="checkbox" data-project-select="${escapeHtml(project.slug)}"${selectable ? "" : " disabled"}${selected ? " checked" : ""} /><span>选择</span></label><span class="project-sequence" aria-label="原文件序号 ${escapeHtml(sequence(project))}">${escapeHtml(sequence(project))}</span><p class="card-kicker">VIDEO PROJECT</p></div><span class="status status-${escapeHtml(project.status)}">${escapeHtml(labelFor(project.status, statusLabels))}</span></div><h3 class="project-name">${escapeHtml(project.slug)}</h3><div class="progress-track"><span style="width: ${project.progress}%"></span></div><div class="card-meta"><span>${project.succeededCount}/${project.stageCount} 个阶段</span><span>${project.progress}%</span></div><p class="card-next">${escapeHtml(project.next.message)}</p><button class="button button-primary project-open" type="button" data-slug="${escapeHtml(project.slug)}">查看详情</button></article>`;
}

export function createDashboardView({ elements, api, store, onOpenProject, onCreateBatch, onData } = {}) {
  let mounted = false;
  let selectedSlugs = new Set();

  function updateSelection() {
    const count = selectedSlugs.size;
    elements.batchSelectionState.textContent = `已选择 ${count} 个视频`;
    elements.batchButtons.forEach((button) => { button.disabled = count === 0; });
  }

  function render(projects) {
    elements.projectListState.hidden = projects.length > 0;
    if (projects.length === 0) {
      elements.projectListState.textContent = "暂时没有发现视频项目。";
      elements.projectGrid.innerHTML = "";
      updateSelection();
      return;
    }
    elements.projectGrid.innerHTML = projects.map((project) => projectCard(project, selectedSlugs.has(project.slug))).join("");
    elements.projectGrid.querySelectorAll("[data-project-select]").forEach((input) => input.addEventListener("change", () => {
      if (input.checked) selectedSlugs.add(input.dataset.projectSelect);
      else selectedSlugs.delete(input.dataset.projectSelect);
      updateSelection();
    }));
    elements.projectGrid.querySelectorAll(".project-open").forEach((button) => button.addEventListener("click", () => onOpenProject?.(button.dataset.slug)));
    updateSelection();
  }

  async function refresh() {
    elements.projectListState.hidden = false;
    elements.projectListState.textContent = "正在读取视频项目……";
    try {
      const [projects, series, jobs] = await Promise.all([api.getProjects(), api.getSeries(), api.getJobs()]);
      store?.setState({ projects, series, jobs });
      render(projects);
      onData?.({ projects, series, jobs });
    } catch (error) {
      elements.projectListState.textContent = `读取失败：${error.message}`;
      elements.projectGrid.innerHTML = "";
    }
  }

  function mount() {
    if (mounted) return;
    mounted = true;
    elements.batchButtons.forEach((button) => button.addEventListener("click", () => {
      const type = button.dataset.batchType;
      if (selectedSlugs.size > 0 && window.confirm(`确认对 ${selectedSlugs.size} 个视频执行${batchLabels[type]}吗？`)) {
        void onCreateBatch?.(type, [...selectedSlugs]).then(() => { selectedSlugs.clear(); updateSelection(); });
      }
    }));
    void refresh();
  }

  return { mount, unmount() { mounted = false; }, refresh, clearSelection() { selectedSlugs.clear(); updateSelection(); }, setSeriesProjects() {} };
}
