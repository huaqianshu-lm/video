import { createApiClient } from "../api/client.js";
import { createPollingRegistry } from "../core/polling.js";
import { createRouter } from "../core/router.js";
import { createStore } from "../core/store.js";
import { createDashboardView } from "./dashboard/index.js";
import { createBatchView } from "./batches/index.js";
import { createBatchCreationView } from "./batches/create.js";
import { createProjectView } from "./project/index.js";
import { createRemotionTasksView } from "./remotion-tasks/index.js";
import { createRemoteJobsView } from "./remote-jobs/index.js";
import { createSeriesView } from "./series/index.js";

function elements() {
  const get = (id) => document.querySelector(`#${id}`);
  return {
    status: get("service-status"), dashboard: get("dashboard-view"), detail: get("detail-view"), projectDetail: get("project-detail"),
    pages: { projects: get("dashboard-view"), batches: get("batches-view"), "batch-create": get("batch-create-view"), "remotion-tasks": get("remotion-tasks-view"), series: get("series-view"), "remote-jobs": get("remote-jobs-view") },
    navLinks: [...document.querySelectorAll("[data-route]")],
    projectGrid: get("project-grid"), projectListState: get("project-list-state"), attentionSummary: get("attention-summary"), attentionProjectsState: get("attention-project-state"), attentionProjectGrid: get("attention-project-grid"),
    batchCreateList: get("batch-project-list"), batchCreateListState: get("batch-project-list-state"), batchCreateSelectionState: get("batch-create-selection-state"), batchCreateState: get("batch-create-state"), batchCreateActions: get("batch-create-view")?.querySelector?.(".batch-create-actions"),
    batchSummary: get("batch-summary"), batchList: get("batch-list"), taskList: get("remotion-task-list"), globalJobs: get("global-jobs-list"), diagnostics: get("github-diagnostics"),
    seriesSelect: get("series-select"), seriesId: get("series-id"), seriesTitle: get("series-title"), seriesStyle: get("series-style"), seriesCoverFrames: get("series-cover-frames"), seriesVideoList: get("series-video-list"), seriesForm: get("series-form"), seriesCoverFile: get("series-cover-file"), seriesCoverPreview: get("series-cover-preview"), seriesState: get("series-state"), newSeries: get("new-series"), uploadSeriesCover: get("upload-series-cover"),
    importForm: get("source-import-form"), importFile: get("source-import-file"), importSlug: get("source-import-slug"), importSeries: get("source-import-series"), importSubmit: get("source-import-submit"), importState: get("source-import-state"),
  };
}

export function startApplication({ api = createApiClient(), store = createStore(), router = createRouter(), polling = createPollingRegistry(), ui: injectedUi, views: injectedViews } = {}) {
  const ui = injectedUi ?? elements();
  let projects = [];
  let remote;
  let batches;
  let series;
  let project;
  let dashboard;
  let batchCreate;
  let remotionTasks;
  let projectReturnRoute = { name: "projects" };
  let pendingProjectReturnRoute = null;

  function openProjectFrom(slug, returnRoute) {
    pendingProjectReturnRoute = { ...returnRoute };
    router.navigate({ name: "project", slug });
  }

  if (injectedViews) {
    ({ remote, batches, series, project, dashboard, batchCreate, remotionTasks } = injectedViews);
  } else {
    remote = createRemoteJobsView({ elements: { list: ui.globalJobs, diagnostics: ui.diagnostics }, api, refreshButton: ui.pages?.["remote-jobs"]?.querySelector?.("#refresh-jobs-dashboard"), diagnosticsButton: ui.pages?.["remote-jobs"]?.querySelector?.("#check-github-config") });
    batches = createBatchView({ elements: { summary: ui.batchSummary, batchList: ui.batchList }, api, refreshButton: ui.pages?.batches?.querySelector?.("#refresh-batches"), onRefreshProjects: () => dashboard?.refresh() });
    remotionTasks = createRemotionTasksView({ elements: { taskList: ui.taskList }, api, refreshButton: ui.pages?.["remotion-tasks"]?.querySelector?.("#refresh-remotion-tasks"), onRefreshProjects: () => dashboard?.refresh(), getActiveProject: () => project?.getCurrent?.(), onOpenProject: (slug) => project?.open?.(slug) });
    series = createSeriesView({ elements: { seriesSelect: ui.seriesSelect, seriesId: ui.seriesId, seriesTitle: ui.seriesTitle, seriesStyle: ui.seriesStyle, seriesCoverFrames: ui.seriesCoverFrames, seriesVideoList: ui.seriesVideoList, seriesForm: ui.seriesForm, seriesCoverFile: ui.seriesCoverFile, seriesCoverPreview: ui.seriesCoverPreview, seriesState: ui.seriesState, newSeries: ui.newSeries, uploadSeriesCover: ui.uploadSeriesCover, importForm: ui.importForm, importFile: ui.importFile, importSlug: ui.importSlug, importSeries: ui.importSeries, importSubmit: ui.importSubmit, importState: ui.importState }, api, getProjects: () => projects, onImported: async (slug) => { await dashboard?.refresh(); openProjectFrom(slug, { name: "projects" }); } });
    project = createProjectView({ elements: { container: ui.projectDetail }, api, polling, onBack: () => router.navigate(projectReturnRoute), onRefreshDashboard: () => dashboard?.refresh() });
    if (ui.batchCreateList && ui.batchCreateListState && ui.batchCreateSelectionState && ui.batchCreateState && ui.batchCreateActions) {
      batchCreate = createBatchCreationView({ elements: { list: ui.batchCreateList, listState: ui.batchCreateListState, selectionState: ui.batchCreateSelectionState, state: ui.batchCreateState, actions: ui.batchCreateActions }, api, onCreateBatch: batches.create, onCreated: () => router.navigate({ name: "batches" }), onOpenProject: (slug) => openProjectFrom(slug, { name: "batch-create" }) });
    }
    dashboard = createDashboardView({ elements: { projectGrid: ui.projectGrid, projectListState: ui.projectListState, attentionSummary: ui.attentionSummary, attentionProjectsState: ui.attentionProjectsState, attentionProjectGrid: ui.attentionProjectGrid }, api, store, refreshButton: ui.pages?.projects?.querySelector?.("#refresh-projects") ?? ui.dashboard?.querySelector?.("#refresh-projects"), onOpenProject: (slug) => openProjectFrom(slug, { name: "projects" }), onData: (data) => { projects = data.projects; series.setProjects(projects); } });
  }

  async function health() {
    try { const result = await api.getHealth(); ui.status.textContent = `服务正常 · Harness ${result.harnessVersion}`; ui.status.className = "status status-ok"; }
    catch (error) { ui.status.textContent = "服务异常"; ui.status.className = "status status-error"; console.error(error); }
  }

  function show(route) {
    const detail = route.name === "project";
    if (detail) {
      projectReturnRoute = pendingProjectReturnRoute ?? { name: "projects" };
      pendingProjectReturnRoute = null;
    }
    Object.entries(ui.pages ?? {}).forEach(([name, page]) => { if (page) page.hidden = detail || name !== route.name; });
    ui.navLinks?.forEach((link) => link.setAttribute("aria-current", !detail && (link.dataset.route === route.name || (route.name === "batch-create" && link.dataset.route === "batches")) ? "page" : "false"));
    if (ui.dashboard && !ui.pages) ui.dashboard.hidden = detail;
    if (ui.detail) {
      ui.detail.hidden = !detail;
      if (detail) {
        const detailBack = ui.detail.querySelector?.("#back-to-projects");
        if (detailBack) detailBack.textContent = projectReturnRoute.name === "batch-create" ? "← 返回批量选择" : "← 返回工作台";
      }
    }
    if (detail) { project.mount(); void project.open(route.slug); }
    else project.unmount();
    if (route.name === "batch-create") void batchCreate?.refresh();
  }

  const backButton = ui.detail?.querySelector?.("#back-to-projects");
  const onBack = () => router.navigate(projectReturnRoute);
  backButton?.addEventListener("click", onBack);
  dashboard.mount();
  series.mount();
  batches.mount();
  batchCreate?.mount();
  remotionTasks?.mount();
  remote.mount();
  router.subscribe((route) => { store.setState({ route }); show(route); });
  const stopRouter = router.start();
  void health();
  return { router, store, views: { dashboard, batches, batchCreate, remotionTasks, series, project, remote }, destroy() { stopRouter?.(); backButton?.removeEventListener?.("click", onBack); project.unmount(); dashboard.unmount?.(); batches.unmount?.(); batchCreate?.unmount?.(); remotionTasks?.unmount?.(); series.unmount?.(); remote.unmount?.(); polling.stopAll(); } };
}
