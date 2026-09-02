import { createApiClient } from "../api/client.js";
import { createPollingRegistry } from "../core/polling.js";
import { createRouter } from "../core/router.js";
import { createStore } from "../core/store.js";
import { createDashboardView } from "./dashboard/index.js";
import { createBatchView } from "./batches/index.js";
import { createProjectView } from "./project/index.js";
import { createRemoteJobsView } from "./remote-jobs/index.js";
import { createSeriesView } from "./series/index.js";

function elements() {
  const get = (id) => document.querySelector(`#${id}`);
  return {
    status: get("service-status"), dashboard: get("dashboard-view"), detail: get("detail-view"), projectDetail: get("project-detail"),
    projectGrid: get("project-grid"), projectListState: get("project-list-state"), batchSelectionState: get("batch-selection-state"),
    batchButtons: ["batch-to-gate2", "batch-to-tts", "batch-to-remotion", "batch-to-render"].map(get),
    batchList: get("batch-list"), taskList: get("remotion-task-list"), globalJobs: get("global-jobs-list"), diagnostics: get("github-diagnostics"),
    seriesSelect: get("series-select"), seriesId: get("series-id"), seriesTitle: get("series-title"), seriesStyle: get("series-style"), seriesCoverFrames: get("series-cover-frames"), seriesVideoList: get("series-video-list"), seriesForm: get("series-form"), seriesCoverFile: get("series-cover-file"), seriesCoverPreview: get("series-cover-preview"), seriesState: get("series-state"), newSeries: get("new-series"), uploadSeriesCover: get("upload-series-cover"),
    importForm: get("source-import-form"), importFile: get("source-import-file"), importSlug: get("source-import-slug"), importSeries: get("source-import-series"), importSubmit: get("source-import-submit"), importState: get("source-import-state"),
  };
}

export function startApplication({ api = createApiClient(), store = createStore(), router = createRouter(), polling = createPollingRegistry() } = {}) {
  const ui = elements();
  let projects = [];
  const remote = createRemoteJobsView({ elements: { list: ui.globalJobs, diagnostics: ui.diagnostics }, api });
  const batches = createBatchView({ elements: { batchList: ui.batchList, taskList: ui.taskList }, api, onRefreshProjects: () => dashboard.refresh(), getActiveProject: project.getCurrent, onOpenProject: project.open });
  const series = createSeriesView({ elements: { seriesSelect: ui.seriesSelect, seriesId: ui.seriesId, seriesTitle: ui.seriesTitle, seriesStyle: ui.seriesStyle, seriesCoverFrames: ui.seriesCoverFrames, seriesVideoList: ui.seriesVideoList, seriesForm: ui.seriesForm, seriesCoverFile: ui.seriesCoverFile, seriesCoverPreview: ui.seriesCoverPreview, seriesState: ui.seriesState, newSeries: ui.newSeries, uploadSeriesCover: ui.uploadSeriesCover, importForm: ui.importForm, importFile: ui.importFile, importSlug: ui.importSlug, importSeries: ui.importSeries, importSubmit: ui.importSubmit, importState: ui.importState }, api, getProjects: () => projects, onImported: async (slug) => { await dashboard.refresh(); router.navigate({ name: "project", slug }); } });
  const project = createProjectView({ elements: { container: ui.projectDetail }, api, polling, onBack: () => router.navigate({ name: "projects" }), onRefreshDashboard: () => dashboard.refresh() });
  const dashboard = createDashboardView({ elements: { projectGrid: ui.projectGrid, projectListState: ui.projectListState, batchSelectionState: ui.batchSelectionState, batchButtons: ui.batchButtons }, api, store, onOpenProject: (slug) => router.navigate({ name: "project", slug }), onCreateBatch: batches.create, onData: (data) => { projects = data.projects; series.setProjects(projects); } });

  async function health() {
    try { const result = await api.getHealth(); ui.status.textContent = `服务正常 · Harness ${result.harnessVersion}`; ui.status.className = "status status-ok"; }
    catch (error) { ui.status.textContent = "服务异常"; ui.status.className = "status status-error"; console.error(error); }
  }

  function show(route) {
    const detail = route.name === "project";
    ui.dashboard.hidden = detail; ui.detail.hidden = !detail;
    if (detail) { project.mount(); void project.open(route.slug); }
    else { project.unmount(); dashboard.mount(); series.mount(); batches.mount(); remote.mount(); }
  }

  ui.dashboard.querySelector("#refresh-projects")?.addEventListener("click", () => void dashboard.refresh());
  ui.dashboard.querySelector("#refresh-batches")?.addEventListener("click", () => void batches.refresh());
  ui.dashboard.querySelector("#refresh-jobs-dashboard")?.addEventListener("click", () => void remote.refresh());
  ui.dashboard.querySelector("#check-github-config")?.addEventListener("click", () => void remote.diagnostics());
  ui.detail.querySelector("#back-to-projects")?.addEventListener("click", () => router.navigate({ name: "projects" }));
  router.subscribe((route) => { store.setState({ route }); show(route); });
  const stopRouter = router.start();
  void health();
  return { router, store, views: { dashboard, batches, series, project, remote }, destroy() { stopRouter?.(); project.unmount(); polling.stopAll(); } };
}
