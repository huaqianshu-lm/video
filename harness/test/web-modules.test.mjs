import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";
import { ApiError, createApiClient } from "../web/api/client.js";
import { createPollingRegistry } from "../web/core/polling.js";
import { createRouter, parseRoute } from "../web/core/router.js";
import { createStore } from "../web/core/store.js";
import { formatError } from "../web/shared/feedback.js";
import { escapeHtml } from "../web/shared/html.js";
import { labelFor } from "../web/shared/labels.js";
import { startApplication } from "../web/views/application.js";
import { createBatchView } from "../web/views/batches/index.js";
import { createDashboardView } from "../web/views/dashboard/index.js";
import { createRemoteJobsView } from "../web/views/remote-jobs/index.js";
import { createSeriesView } from "../web/views/series/index.js";
import { matchProjectRoute } from "../src/web/routes/projects.mjs";
import { matchTaskRoute } from "../src/web/routes/tasks.mjs";
import { isSupportedProjectAction, normalizeProjectAction } from "../src/web/services/project-actions.mjs";
import { createProjectView } from "../web/views/project/index.js";

function deferred() {
  let resolve;
  let reject;
  const promise = new Promise((resolvePromise, rejectPromise) => { resolve = resolvePromise; reject = rejectPromise; });
  return { promise, resolve, reject };
}

async function flush() {
  await Promise.resolve();
  await Promise.resolve();
  await Promise.resolve();
}

function projectCollectionElement() {
  return new FakeElement({
    onInnerHTML: (html, element) => {
      const inputs = [...html.matchAll(/<input[^>]*data-project-select="([^"]+)"[^>]*>/g)]
        .map((match) => new FakeElement({ dataset: { projectSelect: match[1] } }));
      const buttons = [...html.matchAll(/<button[^>]*class="[^"]*project-open[^"]*"[^>]*data-slug="([^"]+)"[^>]*>/g)]
        .map((match) => new FakeElement({ dataset: { slug: match[1] } }));
      element.setQuery("[data-project-select]", inputs);
      element.setQuery(".project-open", buttons);
    },
  });
}

function projectDetailElement() {
  return new FakeElement({
    onInnerHTML: (html, element) => {
      const actions = [...html.matchAll(/<button[^>]*data-action="([^"]+)"[^>]*>/g)]
        .map((match) => new FakeElement({ dataset: { action: match[1] } }));
      const remotionActions = [...html.matchAll(/<button[^>]*data-remotion-task-action="([^"]+)"[^>]*data-task-id="([^"]+)"[^>]*>/g)]
        .map((match) => new FakeElement({ dataset: { remotionTaskAction: match[1], taskId: match[2] } }));
      const agentRetries = [...html.matchAll(/<button[^>]*data-agent-job-retry="([^"]+)"[^>]*>/g)]
        .map((match) => new FakeElement({ dataset: { agentJobRetry: match[1] } }));
      const fileButtons = [...html.matchAll(/<button[^>]*data-path="([^"]+)"[^>]*>/g)]
        .map((match) => new FakeElement({ dataset: { path: match[1] } }));
      const refresh = new FakeElement();
      const feedback = new FakeElement();
      const viewerState = new FakeElement();
      const fileContent = new FakeElement();
      const dialog = new FakeElement();
      const cancel = new FakeElement();
      const form = new FakeElement();
      dialog.showModal = () => { dialog.opened = true; };
      dialog.close = () => { dialog.opened = false; };
      element.setQuery("[data-action]", actions);
      element.setQuery("[data-remotion-task-action]", remotionActions);
      element.setQuery("[data-agent-job-retry]", agentRetries);
      element.setQuery("[data-path]", fileButtons);
      element.setQuery("#refresh-project-jobs", html.includes('id="refresh-project-jobs"') ? [refresh] : []);
      element.setQuery("#action-feedback", [feedback]);
      element.setQuery("#file-viewer-state", [viewerState]);
      element.setQuery("#file-content", [fileContent]);
      element.setQuery("#reject-gate-dialog", html.includes('id="reject-gate-dialog"') ? [dialog] : []);
      dialog.setQuery("[data-reject-cancel]", [cancel]);
      dialog.setQuery("[data-reject-form]", [form]);
    },
  });
}

class FakeElement {
  constructor({ dataset = {}, onInnerHTML, matchesSelectors = [] } = {}) {
    this.dataset = { ...dataset };
    this.listeners = new Map();
    this.queries = new Map();
    this.matchesSelectors = new Set(matchesSelectors);
    this.attributes = new Map();
    this.classNames = new Set();
    this.classList = {
      add: (...names) => names.forEach((name) => this.classNames.add(name)),
      remove: (...names) => names.forEach((name) => this.classNames.delete(name)),
    };
    this.hidden = false;
    this.disabled = false;
    this.checked = false;
    this.files = [];
    this.options = [];
    this.value = "";
    this.textContent = "";
    this.isConnected = true;
    this.onInnerHTML = onInnerHTML;
  }

  set innerHTML(value) {
    this._innerHTML = String(value);
    const optionMatches = [...this._innerHTML.matchAll(/<option\s+value="([^"]*)"/g)];
    if (optionMatches.length) this.options = optionMatches.map((match) => ({ value: match[1] }));
    this.onInnerHTML?.(this._innerHTML, this);
  }

  get innerHTML() {
    return this._innerHTML ?? "";
  }

  setQuery(selector, values) {
    this.queries.set(selector, values);
    return values;
  }

  querySelector(selector) {
    return this.queries.get(selector)?.[0] ?? null;
  }

  querySelectorAll(selector) {
    return this.queries.get(selector) ?? [];
  }

  addEventListener(type, handler) {
    const handlers = this.listeners.get(type) ?? [];
    handlers.push(handler);
    this.listeners.set(type, handlers);
  }

  removeEventListener(type, handler) {
    const handlers = this.listeners.get(type) ?? [];
    this.listeners.set(type, handlers.filter((item) => item !== handler));
  }

  dispatch(type, init = {}) {
    const event = typeof init === "object" ? { ...init, type } : { type };
    event.target ??= this;
    event.currentTarget = this;
    for (const handler of [...(this.listeners.get(type) ?? [])]) handler(event);
    return event;
  }

  setAttribute(name, value) {
    this.attributes.set(name, String(value));
  }

  getAttribute(name) {
    return this.attributes.get(name) ?? null;
  }

  closest(selector) {
    return this.matchesSelectors.has(selector) ? this : null;
  }

  reset() {
    this.resetCount = (this.resetCount ?? 0) + 1;
  }
}

function setGlobal(name, value) {
  if (value === undefined) delete globalThis[name];
  else globalThis[name] = value;
}

async function withBrowserGlobals(callback) {
  const previous = { window: globalThis.window, document: globalThis.document, Image: globalThis.Image, URL: globalThis.URL };
  const alerts = [];
  setGlobal("window", { confirm: () => true, alert: (message) => alerts.push(message) });
  setGlobal("document", {
    querySelectorAll: () => [],
    createElement(tag) {
      if (tag !== "canvas") return new FakeElement();
      return {
        getContext: () => ({ drawImage() {} }),
        toBlob: (resolve) => resolve(new Blob(["cover"], { type: "image/png" })),
      };
    },
  });
  setGlobal("Image", class TestImage {
    naturalWidth = 1920;
    naturalHeight = 1080;

    set src(value) {
      this._src = value;
      queueMicrotask(() => this.onload?.());
    }
  });
  setGlobal("URL", { createObjectURL: () => "blob:test", revokeObjectURL() {} });
  try {
    return await callback({ alerts });
  } finally {
    for (const [name, value] of Object.entries(previous)) setGlobal(name, value);
  }
}

test("API client applies no-store and normalizes server errors", async () => {
  const calls = [];
  const client = createApiClient({
    fetchImpl: async (url, options) => {
      calls.push({ url, options });
      return new Response(JSON.stringify({ error: "参数错误", code: "invalid-input", issues: ["slug"] }), {
        status: 400,
        headers: { "Content-Type": "application/json" },
      });
    },
  });

  await assert.rejects(client.getProjects(), (error) => {
    assert.ok(error instanceof ApiError);
    assert.equal(error.message, "参数错误");
    assert.equal(error.code, "invalid-input");
    assert.deepEqual(error.issues, ["slug"]);
    return true;
  });
  assert.equal(calls[0].options.cache, "no-store");
  assert.equal("request" in client, false);
});

test("store keeps the declared cross-page state and notifies subscribers", () => {
  const store = createStore();
  const snapshots = [];
  const unsubscribe = store.subscribe((state) => snapshots.push(state));
  store.setState({ activeProjectSlug: "demo", selectedSlugs: ["demo"] });
  unsubscribe();
  store.setState({ route: { name: "project", slug: "demo" } });
  assert.equal(snapshots.length, 1);
  assert.equal(store.getState().activeProjectSlug, "demo");
  assert.deepEqual(store.getState().selectedSlugs, ["demo"]);
});

test("router accepts both current and legacy project hashes", () => {
  assert.deepEqual(parseRoute("#/projects"), { name: "projects", slug: null });
  assert.deepEqual(parseRoute("#/batches"), { name: "batches", slug: null });
  assert.deepEqual(parseRoute("#/series"), { name: "series", slug: null });
  assert.deepEqual(parseRoute("#/remote-jobs"), { name: "remote-jobs", slug: null });
  assert.deepEqual(parseRoute("#/projects/demo-video"), { name: "project", slug: "demo-video" });
  assert.deepEqual(parseRoute("#project=demo-video"), { name: "project", slug: "demo-video" });
});

test("router navigates every top-level entry and keeps listeners in sync without a window", () => {
  const router = createRouter({ windowObject: null });
  const routes = [];
  router.subscribe((route) => routes.push(route));
  router.navigate({ name: "batches" });
  router.navigate({ name: "series" });
  router.navigate({ name: "remote-jobs" });
  router.navigate({ name: "projects" });
  assert.deepEqual(routes.map((route) => route.name), ["batches", "series", "remote-jobs", "projects"]);
  assert.deepEqual(router.current(), { name: "projects", slug: null });
});

test("polling registry replaces duplicate keys and stops them", () => {
  const active = new Set();
  const timers = new Map();
  let nextId = 0;
  const polling = createPollingRegistry({
    setIntervalImpl: (callback) => {
      const id = ++nextId;
      timers.set(id, callback);
      active.add(id);
      return id;
    },
    clearIntervalImpl: (id) => {
      timers.delete(id);
      active.delete(id);
    },
  });
  polling.start("project", () => {}, 1000);
  polling.start("project", () => {}, 1000);
  assert.equal(active.size, 1);
  polling.stopAll();
  assert.equal(active.size, 0);
});

test("project view unmount stops project lifecycle polling", () => {
  const stopped = [];
  const view = createProjectView({
    elements: { container: { querySelector() { return null; } } },
    api: {},
    polling: { stop(key) { stopped.push(key); }, start() {} },
  });
  view.mount();
  view.unmount();
  assert.deepEqual(stopped, ["project", "remotion-task"]);
});

test("project view renders Agent Job status classes from real workspace data", async () => {
  const container = new FakeElement();
  const view = createProjectView({
    elements: { container },
    api: {
      async getProjectWorkspace() {
        return {
          project: {
            slug: "demo",
            sequence: 1,
            sourceDirectory: "videos/demo",
            remotionDirectory: "src/videos/demo",
            status: "waiting-gate",
            initialized: true,
            currentStage: "content-analysis",
            progress: 0,
            next: { action: "run-stage", message: "继续执行" },
            stages: [{
              order: 0,
              stage: "content-analysis",
              label: "内容分析",
              objective: "提取内容",
              status: "ready",
              artifacts: [],
              requiresApproval: false,
            }],
          },
          files: [],
          jobs: [],
          agentJobs: [
            { id: "job-queued", stage: "content-analysis", status: "queued" },
            { id: "job-running", stage: "video-narrative", status: "running" },
            { id: "job-failed", stage: "scene-script", status: "failed", error: { message: "执行失败" } },
          ],
          remotionTasks: [],
        };
      },
    },
    polling: { stop() {}, start() {} },
  });

  view.mount();
  await view.open("demo");

  assert.match(container.innerHTML, /class="stage-status status status-queued"/);
  assert.match(container.innerHTML, /class="stage-status status status-running"/);
  assert.match(container.innerHTML, /class="stage-status status status-failed"/);
});

test("real project view puts current decision, task evidence, full stages and materials in order", async () => {
  const container = projectDetailElement();
  const stageStatuses = ["succeeded", "ready", "running", "waiting", "failed", "invalidated", "missing", "pending", "available", "succeeded", "ready", "running", "waiting", "failed", "succeeded"];
  const stages = stageStatuses.map((status, index) => ({
    order: index,
    stage: `stage-${index + 1}`,
    label: `阶段 ${index + 1}`,
    objective: `阶段 ${index + 1} 的目标`,
    status,
    artifacts: [{ present: status === "succeeded" || status === "available" }],
    requiresApproval: status === "waiting",
    review: index === 0 ? { decision: "approved" } : index === 4 ? { decision: "rejected" } : null,
  }));
  const workspace = {
    project: {
      slug: "detail-demo",
      sequence: 7,
      sourceDirectory: "videos/detail-demo",
      remotionDirectory: "src/videos/detail-demo",
      status: "waiting",
      initialized: true,
      currentStage: "stage-4",
      progress: 40,
      next: { action: "approve-or-reject-gate", message: "等待 Gate 2 人工确认", returnToStages: [{ stage: "stage-3", label: "阶段 3" }] },
      stages,
    },
    files: [
      { path: "videos/detail-demo/source.md", stage: "source", label: "原始内容", present: false },
      { path: "videos/detail-demo/visual-prototype.html", stage: "visual-prototype", label: "视觉原型", present: true },
    ],
    jobs: [{ id: "remote-1", stage: "smoke-render", status: "failed", remote: { runId: 123, runUrl: "https://example.test/run/123" }, error: { message: "远程任务失败" }, lastCheckedAt: "刚刚" }],
    activeJob: null,
    agentJobs: [{ id: "agent-1", stage: "visual-script", status: "running" }, { id: "agent-2", stage: "scene-script", status: "failed", error: { message: "Agent 产物校验失败" } }],
    remotionTasks: [{ id: "remotion-1", slug: "detail-demo", status: "blocked", error: { message: "任务被阻塞", stderr: "missing output" }, createdAt: "2026-09-07T00:00:00Z", updatedAt: "2026-09-07T00:01:00Z" }],
    alignment: { studioUrl: "http://127.0.0.1:3000", baseline: { sceneIds: ["01"] }, alignment: { scenes: [{ sceneId: "01", layout: "左上标题", visualEvents: ["淡入"], implementationFiles: ["Scene.tsx"] }] }, issues: [{ severity: "warning", message: "需要人工检查画面" }] },
  };
  const view = createProjectView({ elements: { container }, api: { async getProjectWorkspace() { return workspace; } }, polling: { stop() {}, start() {} } });

  view.mount();
  await view.open("detail-demo");

  const html = container.innerHTML;
  const order = ["project-identity", "project-decision", "evidence-section", "pipeline-section", "supporting-materials"].map((className) => html.indexOf(className));
  assert.ok(order.every((position) => position >= 0));
  assert.ok(order.every((position, index) => index === 0 || position > order[index - 1]));
  assert.equal((html.match(/class="stage-item/g) ?? []).length, 15);
  for (const status of stageStatuses) assert.match(html, new RegExp(`status status-${status}`));
  assert.match(html, /stage-item stage-waiting stage-current/);
  assert.match(html, /原文件序号 07/);
  assert.match(html, /当前阶段/);
  assert.match(html, /等待 Gate 2 人工确认/);
  assert.match(html, /1\/1 个产物/);
  assert.match(html, /需要人工确认/);
  assert.match(html, /审查：已通过/);
  assert.match(html, /审查：已驳回/);
  assert.match(html, /远程任务失败/);
  assert.match(html, /Agent 产物校验失败/);
  assert.match(html, /missing output/);
  assert.match(html, /Gate 3 对齐检查/);
  assert.match(html, /src="\/preview\/detail-demo"/);
  assert.match(html, /视觉原型预览/);
  assert.match(html, /当前缺失，不能查看文件内容/);
});

test("real project view keeps action and Gate rejection parameters while preventing duplicate submissions", async () => {
  await withBrowserGlobals(async () => {
    const container = projectDetailElement();
    const workspace = {
      project: {
        slug: "action-demo", sequence: 1, sourceDirectory: "videos/action-demo", remotionDirectory: "src/videos/action-demo", status: "ready", initialized: true,
        currentStage: "content-analysis", progress: 10, next: { action: "run-stage", message: "执行内容分析" }, stages: [{ order: 0, stage: "content-analysis", label: "内容分析", objective: "分析", status: "ready", artifacts: [] }],
      }, files: [], jobs: [], agentJobs: [], remotionTasks: [], activeJob: null,
    };
    const actionGate = deferred();
    let workspaceReads = 0;
    const actionBodies = [];
    const view = createProjectView({
      elements: { container },
      api: {
        async getProjectWorkspace() { workspaceReads += 1; return workspace; },
        runProjectAction(slug, body) { actionBodies.push({ slug, body }); return actionGate.promise; },
      },
      polling: { stop() {}, start() {} },
    });
    view.mount();
    await view.open("action-demo");
    const runButton = container.querySelectorAll("[data-action]").find((button) => button.dataset.action === "run");
    runButton.dispatch("click");
    runButton.dispatch("click");
    assert.equal(actionBodies.length, 1);
    assert.deepEqual(actionBodies[0], { slug: "action-demo", body: { action: "run", stage: "content-analysis", gate: undefined } });
    actionGate.resolve({});
    await flush();
    assert.equal(workspaceReads, 2);
    runButton.dispatch("click");
    assert.equal(actionBodies.length, 1);

    const gateContainer = projectDetailElement();
    const gateWorkspace = { ...workspace, project: { ...workspace.project, slug: "gate-demo", status: "waiting", currentStage: "gate-2", next: { action: "approve-or-reject-gate", message: "等待 Gate 2", returnToStages: [{ stage: "visual-script", label: "视觉脚本" }] } } };
    const gateBodies = [];
    const previousFormData = globalThis.FormData;
    globalThis.FormData = class TestFormData {
      get(name) { return name === "returnTo" ? "visual-script" : "已发现问题"; }
    };
    try {
      const gateView = createProjectView({ elements: { container: gateContainer }, api: { async getProjectWorkspace() { return gateWorkspace; }, async runProjectAction(slug, body) { gateBodies.push({ slug, body }); return {}; } }, polling: { stop() {}, start() {} } });
      gateView.mount();
      await gateView.open("gate-demo");
      const reject = gateContainer.querySelectorAll("[data-action]").find((button) => button.dataset.action === "reject");
      const dialog = gateContainer.querySelector("#reject-gate-dialog");
      reject.dispatch("click");
      assert.equal(dialog.opened, true);
      assert.equal(gateBodies.length, 0);
      dialog.querySelector("[data-reject-cancel]").dispatch("click");
      assert.equal(dialog.opened, false);
      dialog.querySelector("[data-reject-form]").dispatch("submit", { preventDefault() {}, currentTarget: dialog.querySelector("[data-reject-form]") });
      await flush();
      assert.deepEqual(gateBodies[0], { slug: "gate-demo", body: { action: "reject", stage: undefined, gate: "gate-2", returnTo: "visual-script", reason: "已发现问题" } });
    } finally {
      globalThis.FormData = previousFormData;
    }
  });
});

test("real project view keeps task, file and refresh events single across rerender", async () => {
  const container = projectDetailElement();
  const workspace = {
    project: { slug: "events-demo", sequence: 2, sourceDirectory: "videos/events-demo", remotionDirectory: "src/videos/events-demo", status: "ready", initialized: true, currentStage: "remotion", progress: 80, next: { action: "run-stage", message: "执行 Remotion" }, stages: [{ order: 0, stage: "remotion", label: "Remotion", objective: "制作", status: "ready", artifacts: [] }] },
    files: [{ path: "videos/events-demo/source.md", stage: "source", label: "原始内容", present: true }, { path: "videos/events-demo/missing.md", stage: "source", label: "缺失资料", present: false }],
    jobs: [], activeJob: null, agentJobs: [{ id: "agent-failed", stage: "visual-script", status: "failed", error: { message: "失败" } }],
    remotionTasks: [{ id: "task-ready", slug: "events-demo", status: "ready", createdAt: "now", updatedAt: "now" }],
  };
  const remotionGate = deferred();
  const agentGate = deferred();
  const fileGate = deferred();
  const refreshGate = deferred();
  let reads = 0;
  let remotionCalls = 0;
  let agentCalls = 0;
  let fileCalls = 0;
  const view = createProjectView({
    elements: { container },
    api: {
      async getProjectWorkspace() { reads += 1; return reads >= 4 ? refreshGate.promise : workspace; },
      runRemotionTaskAction() { remotionCalls += 1; return remotionGate.promise; },
      runAgentJobAction() { agentCalls += 1; return agentGate.promise; },
      getProjectFile() { fileCalls += 1; return fileGate.promise; },
    },
    polling: { stop() {}, start() {} },
  });
  view.mount();
  await view.open("events-demo");

  const taskButton = container.querySelectorAll("[data-remotion-task-action]")[0];
  taskButton.dispatch("click");
  taskButton.dispatch("click");
  assert.equal(remotionCalls, 1);
  remotionGate.resolve({});
  await flush();
  taskButton.dispatch("click");
  assert.equal(remotionCalls, 1);

  const agentButton = container.querySelectorAll("[data-agent-job-retry]")[0];
  agentButton.dispatch("click");
  agentButton.dispatch("click");
  assert.equal(agentCalls, 1);
  agentGate.resolve({});
  await flush();

  const fileButton = container.querySelectorAll("[data-path]").find((button) => button.dataset.path.endsWith("source.md"));
  fileButton.dispatch("click");
  fileButton.dispatch("click");
  assert.equal(fileCalls, 1);
  fileGate.resolve({ content: "真实文件内容" });
  await flush();
  assert.equal(container.querySelector("#file-content").textContent, "真实文件内容");
  assert.match(container.innerHTML, /缺失资料当前缺失，不能查看文件内容/);

  const refresh = container.querySelector("#refresh-project-jobs");
  refresh.dispatch("click");
  refresh.dispatch("click");
  assert.equal(reads, 4);
  refreshGate.resolve(workspace);
  await flush();
  refresh.dispatch("click");
  assert.equal(reads, 4);
});

test("project view ignores stale project responses and keeps polling cleanup rules", async () => {
  const container = projectDetailElement();
  const requests = new Map([["project-a", deferred()], ["project-b", deferred()]]);
  const starts = [];
  const stops = [];
  const workspace = (slug, activeJob = null) => ({ project: { slug, sequence: 1, sourceDirectory: `videos/${slug}`, remotionDirectory: `src/videos/${slug}`, status: "ready", initialized: true, currentStage: "remotion", progress: 80, next: { action: "run-stage", message: "继续" }, stages: [{ order: 0, stage: "remotion", label: "Remotion", objective: "制作", status: "ready", artifacts: [] }] }, files: [], jobs: [], agentJobs: [], remotionTasks: [], activeJob });
  const view = createProjectView({ elements: { container }, api: { getProjectWorkspace(slug) { return requests.get(slug).promise; } }, polling: { stop(key) { stops.push(key); }, start(key, callback, interval) { starts.push({ key, callback, interval }); } } });
  view.mount();
  const first = view.open("project-a");
  const second = view.open("project-b");
  requests.get("project-b").resolve(workspace("project-b"));
  await second;
  requests.get("project-a").resolve(workspace("project-a"));
  await first;
  assert.match(container.innerHTML, /project-b/);
  assert.doesNotMatch(container.innerHTML, /project-a/);
  assert.equal(starts.length, 0);

  const running = deferred();
  const runningStops = [];
  const runningView = createProjectView({ elements: { container: projectDetailElement() }, api: { getProjectWorkspace() { return running.promise; } }, polling: { stop(key) { runningStops.push(key); }, start(key, callback, interval) { starts.push({ key, callback, interval }); } } });
  runningView.mount();
  const openRunning = runningView.open("running-demo");
  running.resolve(workspace("running-demo", { id: "remote-1", stage: "remotion", status: "running" }));
  await openRunning;
  assert.equal(starts.at(-1).interval, 5000);
  runningView.unmount();
  assert.deepEqual(runningStops.slice(-2), ["project", "remotion-task"]);
});

test("application routes mount, refresh, unmount, and clear project polling", async () => {
  let hash = "#/projects";
  const hashListeners = new Set();
  const windowObject = {
    location: {
      get hash() { return hash; },
      set hash(value) { hash = value; for (const listener of hashListeners) listener(); },
    },
    addEventListener(type, listener) { if (type === "hashchange") hashListeners.add(listener); },
    removeEventListener(type, listener) { if (type === "hashchange") hashListeners.delete(listener); },
  };
  const timers = new Set();
  const clearedTimers = [];
  let nextTimer = 0;
  const polling = createPollingRegistry({
    setIntervalImpl: () => { const id = ++nextTimer; timers.add(id); return id; },
    clearIntervalImpl: (id) => { timers.delete(id); clearedTimers.push(id); },
  });
  const lifecycle = [];
  const view = (name) => ({
    mount() { lifecycle.push(`${name}:mount`); },
    refresh() { lifecycle.push(`${name}:refresh`); },
    unmount() { lifecycle.push(`${name}:unmount`); },
    setProjects() {},
    create() {},
  });
  const project = {
    mount() { lifecycle.push("project:mount"); },
    async open(slug) {
      polling.stop("project");
      lifecycle.push(`project:refresh:${slug}`);
      polling.start("project", () => {}, 1000);
    },
    unmount() {
      lifecycle.push("project:unmount");
      polling.stop("project");
      polling.stop("remotion-task");
    },
  };
  const ui = {
    status: { textContent: "", className: "" },
    dashboard: { hidden: false, querySelector() { return null; } },
    detail: { hidden: true, querySelector() { return null; } },
  };
  const application = startApplication({
    api: { async getHealth() { return { harnessVersion: "test" }; } },
    router: createRouter({ windowObject }),
    polling,
    ui,
    views: { dashboard: view("dashboard"), batches: view("batches"), series: view("series"), remote: view("remote"), project },
  });

  assert.equal(application.router.current().name, "projects");
  assert.ok(lifecycle.includes("dashboard:mount"));
  assert.ok(lifecycle.includes("batches:mount"));
  assert.ok(lifecycle.includes("series:mount"));
  assert.ok(lifecycle.includes("remote:mount"));

  application.router.navigate({ name: "project", slug: "project-a" });
  assert.equal(application.router.current().slug, "project-a");
  assert.ok(lifecycle.includes("project:mount"));
  assert.ok(lifecycle.includes("project:refresh:project-a"));
  const projectATimer = [...timers][0];
  assert.ok(projectATimer);

  application.router.navigate({ name: "project", slug: "project-b" });
  assert.ok(lifecycle.includes("project:refresh:project-b"));
  assert.ok(clearedTimers.includes(projectATimer));
  assert.equal(timers.size, 1);

  application.router.navigate({ name: "projects" });
  assert.equal(timers.size, 0);
  assert.ok(lifecycle.filter((item) => item === "project:unmount").length >= 1);

  application.destroy();
  assert.equal(timers.size, 0);
  assert.equal(hashListeners.size, 0);
});

test("application mounts top-level views once and toggles page and navigation state", async () => {
  let hash = "#/projects";
  const hashListeners = new Set();
  const windowObject = {
    location: {
      get hash() { return hash; },
      set hash(value) { hash = value; for (const listener of hashListeners) listener(); },
    },
    addEventListener(type, listener) { if (type === "hashchange") hashListeners.add(listener); },
    removeEventListener(type, listener) { if (type === "hashchange") hashListeners.delete(listener); },
  };
  const lifecycle = [];
  const page = () => ({ hidden: false, querySelector() { return null; } });
  const pages = { projects: page(), batches: page(), series: page(), "remote-jobs": page() };
  const navLinks = Object.keys(pages).map((name) => ({ dataset: { route: name }, setAttribute(name, value) { this[name] = value; } }));
  const view = (name) => ({
    mount() { lifecycle.push(`${name}:mount`); },
    refresh() { lifecycle.push(`${name}:refresh`); },
    unmount() { lifecycle.push(`${name}:unmount`); },
    setProjects() {},
    create() {},
  });
  const project = {
    mount() { lifecycle.push("project:mount"); },
    async open(slug) { lifecycle.push(`project:open:${slug}`); },
    unmount() { lifecycle.push("project:unmount"); },
    getCurrent() { return null; },
  };
  const ui = {
    status: { textContent: "", className: "" },
    dashboard: pages.projects,
    detail: { hidden: true, querySelector() { return null; } },
    pages,
    navLinks,
  };
  const application = startApplication({
    api: { async getHealth() { return { harnessVersion: "test" }; } },
    router: createRouter({ windowObject }),
    ui,
    views: { dashboard: view("dashboard"), batches: view("batches"), series: view("series"), remote: view("remote"), project },
  });

  for (const name of ["dashboard", "batches", "series", "remote"]) assert.equal(lifecycle.filter((item) => item === `${name}:mount`).length, 1);
  application.router.navigate({ name: "batches" });
  application.router.navigate({ name: "series" });
  application.router.navigate({ name: "remote-jobs" });
  application.router.navigate({ name: "projects" });
  assert.deepEqual(lifecycle.filter((item) => item.endsWith(":mount")), ["dashboard:mount", "series:mount", "batches:mount", "remote:mount"]);
  assert.equal(pages.projects.hidden, false);
  assert.equal(pages.batches.hidden, true);
  assert.equal(navLinks.find((link) => link.dataset.route === "projects")["aria-current"], "page");
  assert.equal(navLinks.find((link) => link.dataset.route === "remote-jobs")["aria-current"], "false");
  application.router.navigate({ name: "project", slug: "demo" });
  assert.equal(ui.detail.hidden, false);
  assert.equal(pages.projects.hidden, true);
  application.router.navigate({ name: "batches" });
  assert.equal(ui.detail.hidden, true);
  assert.equal(pages.batches.hidden, false);
  application.destroy();
  assert.equal(hashListeners.size, 0);
});

test("real dashboard view ignores duplicate mount and submits one batch request per click", async () => {
  await withBrowserGlobals(async () => {
    let renderedInput;
    const projectGrid = new FakeElement({
      onInnerHTML: (_, element) => {
        renderedInput = new FakeElement({ dataset: { projectSelect: "demo" } });
        const openButton = new FakeElement({ dataset: { slug: "demo" } });
        element.setQuery("[data-project-select]", [renderedInput]);
        element.setQuery(".project-open", [openButton]);
      },
    });
    const projectListState = new FakeElement();
    const batchSelectionState = new FakeElement();
    const batchButton = new FakeElement({ dataset: { batchType: "to-gate-2" } });
    const refreshButton = new FakeElement();
    const createGate = deferred();
    let createCalls = 0;
    let createInput;
    const api = {
      async getProjects() { return [{ slug: "demo", currentStage: "visual-script", status: "waiting-gate", progress: 40, succeededCount: 6, stageCount: 15, next: { message: "等待 Gate 2 确认" } }]; },
      async getSeries() { return []; },
      async getJobs() { return []; },
    };
    const view = createDashboardView({
      elements: { projectGrid, projectListState, attentionSummary: new FakeElement(), attentionProjectsState: new FakeElement(), attentionProjectGrid: projectCollectionElement(), batchSelectionState, batchButtons: [batchButton] },
      refreshButton,
      api,
      onCreateBatch(type, slugs) { createCalls += 1; createInput = { type, slugs }; return createGate.promise; },
    });

    view.mount();
    view.mount();
    await flush();
    renderedInput.checked = true;
    renderedInput.dispatch("change");
    batchButton.dispatch("click");
    batchButton.dispatch("click");
    assert.equal(createCalls, 1);
    assert.deepEqual(createInput, { type: "to-gate-2", slugs: ["demo"] });
    createGate.resolve({ batch: { id: "batch-1" } });
    await flush();

    view.unmount();
    batchButton.dispatch("click");
    assert.equal(createCalls, 1);
  });
});

test("real dashboard view renders attention summary, pending projects and complete project list", async () => {
  await withBrowserGlobals(async () => {
    const projects = [
      { sequence: 1, slug: "waiting-project", currentStage: "visual-script", status: "waiting", progress: 40, succeededCount: 6, stageCount: 15, next: { message: "等待人工确认" } },
      { sequence: 2, slug: "failed-project", currentStage: "content-analysis", status: "failed", progress: 13, succeededCount: 2, stageCount: 15, next: { message: "修复执行失败" } },
      { sequence: 3, slug: "running-project", currentStage: "video-narrative", status: "running", progress: 20, succeededCount: 3, stageCount: 15, next: { message: "正在执行当前阶段" } },
      { sequence: 4, slug: "completed-project", currentStage: "completed", status: "completed", progress: 100, succeededCount: 15, stageCount: 15, next: { message: "所有阶段已完成" } },
    ];
    const projectGrid = projectCollectionElement();
    const attentionProjectGrid = projectCollectionElement();
    const elements = {
      projectGrid,
      projectListState: new FakeElement(),
      attentionSummary: new FakeElement(),
      attentionProjectsState: new FakeElement(),
      attentionProjectGrid,
      batchSelectionState: new FakeElement(),
      batchButtons: [new FakeElement()],
    };
    const refreshButton = new FakeElement();
    let projectReads = 0;
    const opened = [];
    const view = createDashboardView({
      elements,
      refreshButton,
      api: {
        async getProjects() { projectReads += 1; return projects; },
        async getSeries() { return []; },
        async getJobs() { return []; },
      },
      onOpenProject(slug) { opened.push(slug); },
    });

    view.mount();
    view.mount();
    await flush();

    assert.equal(projectReads, 1);
    assert.match(elements.attentionSummary.innerHTML, /data-attention-count="waiting">1/);
    assert.match(elements.attentionSummary.innerHTML, /data-attention-count="failure">1/);
    assert.match(elements.attentionSummary.innerHTML, /data-attention-count="running">1/);
    assert.match(elements.attentionSummary.innerHTML, /data-attention-count="total">4/);
    assert.equal(attentionProjectGrid.querySelectorAll(".project-open").length, 3);
    assert.equal(attentionProjectGrid.innerHTML.includes("data-project-select"), false);
    assert.equal(projectGrid.querySelectorAll(".project-open").length, 4);
    assert.equal(projectGrid.querySelectorAll("[data-project-select]").length, 4);
    for (const value of ["01", "waiting-project", "等待确认", "40%", "等待人工确认", "查看详情", "04", "completed-project", "已完成", "100%", "所有阶段已完成"]) {
      assert.match(projectGrid.innerHTML, new RegExp(value));
    }

    const firstAttentionButton = attentionProjectGrid.querySelectorAll(".project-open")[0];
    firstAttentionButton.dispatch("click");
    assert.deepEqual(opened, ["waiting-project"]);

    view.refresh();
    await flush();
    assert.equal(projectReads, 2);
    firstAttentionButton.dispatch("click");
    assert.deepEqual(opened, ["waiting-project"]);
    attentionProjectGrid.querySelectorAll(".project-open")[0].dispatch("click");
    assert.deepEqual(opened, ["waiting-project", "waiting-project"]);
    view.unmount();
    refreshButton.dispatch("click");
    assert.equal(projectReads, 2);
  });
});

test("real dashboard view explains empty and failed project reads", async () => {
  await withBrowserGlobals(async () => {
    const makeView = (api) => {
      const elements = {
        projectGrid: projectCollectionElement(),
        projectListState: new FakeElement(),
        attentionSummary: new FakeElement(),
        attentionProjectsState: new FakeElement(),
        attentionProjectGrid: projectCollectionElement(),
        batchSelectionState: new FakeElement(),
        batchButtons: [new FakeElement()],
      };
      const view = createDashboardView({ elements, refreshButton: new FakeElement(), api });
      return { elements, view };
    };
    const empty = makeView({ async getProjects() { return []; }, async getSeries() { return []; }, async getJobs() { return []; } });
    empty.view.mount();
    await flush();
    assert.match(empty.elements.projectListState.textContent, /暂时没有发现视频项目/);
    assert.match(empty.elements.attentionProjectsState.textContent, /当前没有等待处理的项目/);
    assert.match(empty.elements.attentionSummary.innerHTML, /data-attention-count="total">0/);
    empty.view.unmount();

    const failed = makeView({
      async getProjects() { throw new Error("服务端不可用"); },
      async getSeries() { return []; },
      async getJobs() { return []; },
    });
    failed.view.mount();
    await flush();
    assert.match(failed.elements.projectListState.textContent, /读取失败：服务端不可用/);
    assert.match(failed.elements.attentionProjectsState.textContent, /读取失败：服务端不可用/);
    assert.match(failed.elements.attentionSummary.innerHTML, /data-attention-count="total">—/);
    failed.view.unmount();
  });
});

test("real batch view binds refresh once and deduplicates concurrent navigation refreshes", async () => {
  await withBrowserGlobals(async () => {
    const batchList = new FakeElement();
    const taskList = new FakeElement();
    const refreshButton = new FakeElement();
    const batchesGate = deferred();
    const tasksGate = deferred();
    let batchReads = 0;
    let taskReads = 0;
    const view = createBatchView({
      elements: { batchList, taskList },
      refreshButton,
      api: {
        getBatches() { batchReads += 1; return batchesGate.promise; },
        getRemotionTasks() { taskReads += 1; return tasksGate.promise; },
      },
    });

    view.mount();
    view.mount();
    refreshButton.dispatch("click");
    refreshButton.dispatch("click");
    assert.equal(batchReads, 1);
    assert.equal(taskReads, 1);
    batchesGate.resolve({ batches: [] });
    tasksGate.resolve([]);
    await flush();
    view.unmount();
    refreshButton.dispatch("click");
    assert.equal(batchReads, 1);
    assert.equal(taskReads, 1);
  });
});

test("real batch view renders every record in status order and preserves action requests", async () => {
  await withBrowserGlobals(async () => {
    const batchList = new FakeElement({
      onInnerHTML: (html, element) => {
        const buttons = [...html.matchAll(/<button[^>]*data-batch-action="([^"]+)"[^>]*data-batch-id="([^"]+)"[^>]*data-slug="([^"]+)"[^>]*>/g)]
          .map((match) => new FakeElement({ dataset: { batchAction: match[1], batchId: match[2], slug: match[3] }, matchesSelectors: ["[data-batch-action]"] }));
        element.setQuery("[data-batch-action]", buttons);
      },
    });
    const taskList = new FakeElement({
      onInnerHTML: (html, element) => {
        const buttons = [...html.matchAll(/<button[^>]*data-remotion-task-action="([^"]+)"[^>]*data-task-id="([^"]+)"[^>]*>/g)]
          .map((match) => new FakeElement({ dataset: { remotionTaskAction: match[1], taskId: match[2] }, matchesSelectors: ["[data-remotion-task-action]"] }));
        element.setQuery("[data-remotion-task-action]", buttons);
      },
    });
    const summary = new FakeElement();
    const refreshButton = new FakeElement();
    const batchGate = deferred();
    const taskGate = deferred();
    const actionGate = deferred();
    const taskActionGate = deferred();
    let batchReads = 0;
    let taskReads = 0;
    const batchActions = [];
    const taskActions = [];
    const batches = Array.from({ length: 9 }, (_, index) => ({
      id: `batch-${index + 1}`,
      type: index === 0 ? "to-tts" : "to-gate-2",
      label: `批次 ${index + 1}`,
      status: index === 0 ? "waiting" : "completed",
      description: `说明 ${index + 1}`,
      targetStage: "gate-2",
      items: index === 0 ? [
        { slug: "tts-video", status: "waiting-tts-qc", message: "等待 TTS 质检", currentProject: { status: "waiting-tts-qc", ttsQcApproved: false } },
        { slug: "smoke-video", status: "waiting-smoke-qc", message: "等待 Smoke 检查", currentProject: { status: "waiting-smoke-qc" } },
      ] : [],
    }));
    batches[1].status = "completed-with-errors";
    const tasks = [
      { id: "task-ready", kind: "remotion", slug: "ready-video", status: "ready", batchId: "batch-1", outputArtifacts: [] },
      { id: "task-running", kind: "remotion", slug: "running-video", status: "in-progress", batchId: "batch-2", outputArtifacts: [{ name: "config" }] },
      { id: "task-failed", kind: "remotion", slug: "failed-video", status: "failed", batchId: "batch-3", outputArtifacts: [], error: { message: "校验失败", stderr: "missing output" } },
    ];
    const previousCSS = globalThis.CSS;
    setGlobal("CSS", { escape: (value) => value });
    try {
      const view = createBatchView({
        elements: { batchList, taskList, summary },
        refreshButton,
        api: {
          getBatches() { batchReads += 1; return batchReads === 1 ? batchGate.promise : { batches }; },
          getRemotionTasks() { taskReads += 1; return taskReads === 1 ? taskGate.promise : tasks; },
          runBatchAction(id, body) { batchActions.push({ id, body }); return actionGate.promise; },
          runRemotionTaskAction(id, body) { taskActions.push({ id, body }); return taskActionGate.promise; },
        },
      });
      view.mount();
      batchGate.resolve({ batches });
      taskGate.resolve(tasks);
      await flush();
      assert.match(batchList.innerHTML, /batch-9/);
      assert.match(taskList.innerHTML, /task-failed/);
      assert.match(batchList.innerHTML, /status status-waiting/);
      assert.match(batchList.innerHTML, /status status-waiting-tts-qc/);
      assert.match(batchList.innerHTML, /确认 TTS 质检/);
      assert.match(batchList.innerHTML, /确认 Smoke 检查/);
      assert.match(batchList.innerHTML, /重试失败项目/);
      assert.match(taskList.innerHTML, /status status-ready/);
      assert.match(taskList.innerHTML, /status status-in-progress/);
      assert.match(taskList.innerHTML, /status status-failed/);
      assert.match(taskList.innerHTML, /校验失败/);
      assert.match(summary.innerHTML, /<strong>9<\/strong>/);
      assert.match(summary.innerHTML, /<strong>3<\/strong>/);

      const ttsButton = { dataset: { batchAction: "approve-tts-qc", batchId: "batch-1", slug: "tts-video" }, closest: () => ttsButton };
      batchList.dispatch("click", { target: ttsButton });
      batchList.dispatch("click", { target: ttsButton });
      assert.deepEqual(batchActions, [{ id: "batch-1", body: { action: "approve-tts-qc", slug: "tts-video" } }]);
      actionGate.resolve({});
      await flush();

      const taskButton = { dataset: { remotionTaskAction: "run", taskId: "task-ready" }, closest: () => taskButton };
      taskList.dispatch("click", { target: taskButton });
      taskList.dispatch("click", { target: taskButton });
      assert.deepEqual(taskActions, [{ id: "task-ready", body: { action: "run" } }]);
      taskActionGate.resolve({});
      await flush();
      view.unmount();
    } finally {
      setGlobal("CSS", previousCSS);
    }
  });
});

test("real batch view keeps batch and task failures separate and preserves empty states", async () => {
  await withBrowserGlobals(async () => {
    const batchList = new FakeElement();
    const taskList = new FakeElement();
    const view = createBatchView({
      elements: { batchList, taskList },
      api: {
        async getBatches() { throw new Error("批次服务不可用"); },
        async getRemotionTasks() { return []; },
      },
    });
    view.mount();
    await flush();
    assert.match(batchList.textContent, /读取批次失败：批次服务不可用/);
    assert.match(taskList.textContent, /暂无 Remotion 制作任务/);
    view.unmount();
  });
});

test("real series and import view deduplicates save, cover upload and source import after repeated mount", async () => {
  await withBrowserGlobals(async () => {
    const elements = {
      seriesSelect: new FakeElement(),
      seriesId: new FakeElement(),
      seriesTitle: new FakeElement(),
      seriesStyle: new FakeElement(),
      seriesCoverFrames: new FakeElement(),
      seriesVideoList: new FakeElement(),
      seriesForm: new FakeElement(),
      seriesCoverFile: new FakeElement(),
      seriesCoverPreview: new FakeElement(),
      seriesState: new FakeElement(),
      newSeries: new FakeElement(),
      uploadSeriesCover: new FakeElement(),
      importForm: new FakeElement(),
      importFile: new FakeElement(),
      importSlug: new FakeElement(),
      importSeries: new FakeElement(),
      importSubmit: new FakeElement(),
      importState: new FakeElement(),
    };
    const series = { id: "demo-series", title: "Demo", style: "current", coverDurationFrames: 45, videos: [] };
    const saveGate = deferred();
    const uploadGate = deferred();
    const importGate = deferred();
    let seriesReads = 0;
    let saveCalls = 0;
    let uploadCalls = 0;
    let importCalls = 0;
    const imported = [];
    const view = createSeriesView({
      elements,
      getProjects: () => [],
      api: {
        async getSeries() { seriesReads += 1; return [series]; },
        saveSeries(input) { saveCalls += 1; assert.equal(input.id, "demo-series"); return saveGate.promise; },
        uploadSeriesCover(id, blob) { uploadCalls += 1; assert.equal(id, "demo-series"); assert.ok(blob instanceof Blob); return uploadGate.promise; },
        importSource(file, input) { importCalls += 1; assert.equal(file.name, "source.md"); assert.equal(input.seriesId, "none"); return importGate.promise; },
      },
      onImported: (slug) => imported.push(slug),
    });

    view.mount();
    view.mount();
    await flush();
    assert.equal(seriesReads, 1);

    elements.seriesId.value = "demo-series";
    elements.seriesTitle.value = "Demo";
    elements.seriesForm.dispatch("submit", { preventDefault() {}, currentTarget: elements.seriesForm });
    elements.seriesForm.dispatch("submit", { preventDefault() {}, currentTarget: elements.seriesForm });
    assert.equal(saveCalls, 1);
    saveGate.resolve({ series });
    await flush();

    series.videos = ["existing-video"];
    const confirmationMessages = [];
    const previousConfirm = globalThis.window.confirm;
    globalThis.window.confirm = (message) => { confirmationMessages.push(message); return false; };
    elements.seriesForm.dispatch("submit", { preventDefault() {}, currentTarget: elements.seriesForm });
    await flush();
    assert.equal(saveCalls, 1);
    assert.equal(confirmationMessages.length, 1);
    assert.match(confirmationMessages[0], /existing-video/);
    globalThis.window.confirm = previousConfirm;
    series.videos = [];

    elements.seriesCoverFile.files = [{ size: 1, type: "image/png", name: "cover.png" }];
    elements.uploadSeriesCover.dispatch("click");
    elements.uploadSeriesCover.dispatch("click");
    await flush();
    assert.equal(uploadCalls, 1);
    uploadGate.resolve({ image: { width: 1920, height: 1080 } });
    await flush();

    elements.seriesCoverFile.files = [{ size: 10 * 1024 * 1024 + 1, type: "image/png", name: "oversized.png" }];
    elements.seriesCoverFile.dispatch("change");
    await flush();
    assert.equal(elements.uploadSeriesCover.disabled, true);
    assert.match(elements.seriesState.textContent, /图片超过 10 MB/);

    elements.importFile.files = [{ size: 1, name: "source.md", type: "text/markdown" }];
    elements.importSeries.value = "none";
    elements.importFile.dispatch("change");
    elements.importSeries.dispatch("change");
    assert.equal(elements.importSubmit.disabled, false);
    elements.importForm.dispatch("submit", { preventDefault() {}, currentTarget: elements.importForm });
    elements.importForm.dispatch("submit", { preventDefault() {}, currentTarget: elements.importForm });
    assert.equal(importCalls, 1);
    importGate.resolve({ result: { slug: "new-video" } });
    await flush();
    assert.deepEqual(imported, ["new-video"]);

    elements.importFile.files = [{ size: 10 * 1024 * 1024 + 1, name: "too-large.md", type: "text/markdown" }];
    elements.importForm.dispatch("submit", { preventDefault() {}, currentTarget: elements.importForm });
    await flush();
    assert.equal(importCalls, 1);
    assert.match(elements.importState.textContent, /原文件不能超过 10 MB/);

    view.unmount();
    elements.seriesForm.dispatch("submit", { preventDefault() {}, currentTarget: elements.seriesForm });
    elements.importForm.dispatch("submit", { preventDefault() {}, currentTarget: elements.importForm });
    assert.equal(saveCalls, 1);
    assert.equal(importCalls, 1);
  });
});

test("real remote jobs view sends one refresh and one diagnostics request after repeated mount", async () => {
  await withBrowserGlobals(async () => {
    const list = new FakeElement();
    const diagnostics = new FakeElement();
    const refreshButton = new FakeElement();
    const diagnosticsButton = new FakeElement();
    const jobsGate = deferred();
    const diagnosticsGate = deferred();
    let jobReads = 0;
    let diagnosticReads = 0;
    const view = createRemoteJobsView({
      elements: { list, diagnostics },
      refreshButton,
      diagnosticsButton,
      api: {
        getJobs() { jobReads += 1; return jobsGate.promise; },
        getGitHubDiagnostics() { diagnosticReads += 1; return diagnosticsGate.promise; },
      },
    });

    view.mount();
    view.mount();
    assert.equal(diagnosticReads, 0);
    refreshButton.dispatch("click");
    refreshButton.dispatch("click");
    diagnosticsButton.dispatch("click");
    diagnosticsButton.dispatch("click");
    assert.equal(jobReads, 1);
    assert.equal(diagnosticReads, 1);
    jobsGate.resolve([{ slug: "remote-video", stage: "smoke-render", status: "failed", id: "job-remote", remote: { runId: 42, runUrl: "https://example.test/run/42" }, result: { outputs: [{ artifactName: "remote-video.mp4" }] }, lastCheckedAt: "刚刚", error: { message: "Run 失败" } }]);
    diagnosticsGate.resolve({ ok: false, checks: [{ status: "error", name: "token", message: "未配置" }] });
    await flush();
    assert.match(list.innerHTML, /remote-video/);
    assert.match(list.innerHTML, /status status-failed/);
    assert.match(list.innerHTML, /Run 失败/);
    assert.match(list.innerHTML, /target="_blank" rel="noreferrer"/);
    assert.match(list.innerHTML, /Artifact：remote-video\.mp4/);
    assert.match(diagnostics.innerHTML, /status status-error/);
    assert.match(diagnostics.innerHTML, /token/);
    assert.match(diagnostics.innerHTML, /未配置/);
    view.unmount();
    refreshButton.dispatch("click");
    diagnosticsButton.dispatch("click");
    assert.equal(jobReads, 1);
    assert.equal(diagnosticReads, 1);
  });
});

test("application keeps real top-level view listeners single across hash navigation and destroy", async () => {
  const hashListeners = new Set();
  let hash = "#/projects";
  const windowObject = {
    location: {
      get hash() { return hash; },
      set hash(value) { hash = value; for (const listener of hashListeners) listener(); },
    },
    addEventListener(type, listener) { if (type === "hashchange") hashListeners.add(listener); },
    removeEventListener(type, listener) { if (type === "hashchange") hashListeners.delete(listener); },
  };
  const page = (buttons = {}) => {
    const element = new FakeElement();
    for (const [selector, button] of Object.entries(buttons)) element.setQuery(selector, [button]);
    return element;
  };
  const refreshProjects = new FakeElement();
  const refreshBatches = new FakeElement();
  const refreshJobs = new FakeElement();
  const diagnosticsButton = new FakeElement();
  const pages = {
    projects: page({ "#refresh-projects": refreshProjects }),
    batches: page({ "#refresh-batches": refreshBatches }),
    series: page(),
    "remote-jobs": page({ "#refresh-jobs-dashboard": refreshJobs, "#check-github-config": diagnosticsButton }),
  };
  const seriesElements = {
    seriesSelect: new FakeElement(), seriesId: new FakeElement(), seriesTitle: new FakeElement(), seriesStyle: new FakeElement(), seriesCoverFrames: new FakeElement(),
    seriesVideoList: new FakeElement(), seriesForm: new FakeElement(), seriesCoverFile: new FakeElement(), seriesCoverPreview: new FakeElement(), seriesState: new FakeElement(),
    newSeries: new FakeElement(), uploadSeriesCover: new FakeElement(), importForm: new FakeElement(), importFile: new FakeElement(), importSlug: new FakeElement(),
    importSeries: new FakeElement(), importSubmit: new FakeElement(), importState: new FakeElement(),
  };
  const ui = {
    status: new FakeElement(), dashboard: pages.projects, detail: new FakeElement(), projectDetail: new FakeElement(), pages, navLinks: [],
    projectGrid: new FakeElement(), projectListState: new FakeElement(), batchSelectionState: new FakeElement(),
    batchButtons: [new FakeElement(), new FakeElement(), new FakeElement(), new FakeElement()], batchList: new FakeElement(), taskList: new FakeElement(),
    globalJobs: new FakeElement(), diagnostics: new FakeElement(), ...seriesElements,
  };
  const calls = { batches: 0, tasks: 0, jobs: 0, diagnostics: 0 };
  const application = startApplication({
    windowObject,
    router: createRouter({ windowObject }),
    ui,
    api: {
      async getHealth() { return { harnessVersion: "test" }; },
      async getProjects() { return []; },
      async getSeries() { return []; },
      async getJobs() { calls.jobs += 1; return []; },
      async getBatches() { calls.batches += 1; return { batches: [] }; },
      async getRemotionTasks() { calls.tasks += 1; return []; },
      async getGitHubDiagnostics() { calls.diagnostics += 1; return { ok: true, checks: [] }; },
    },
  });
  await flush();
  const initialBatches = calls.batches;
  const initialJobs = calls.jobs;
  application.router.navigate({ name: "batches" });
  application.router.navigate({ name: "projects" });
  application.router.navigate({ name: "batches" });
  refreshBatches.dispatch("click");
  await flush();
  assert.equal(calls.batches, initialBatches + 1);
  refreshJobs.dispatch("click");
  diagnosticsButton.dispatch("click");
  await flush();
  assert.equal(calls.jobs, initialJobs + 1);
  assert.equal(calls.diagnostics, 1);
  application.destroy();
  refreshBatches.dispatch("click");
  refreshJobs.dispatch("click");
  diagnosticsButton.dispatch("click");
  assert.equal(calls.batches, initialBatches + 1);
  assert.equal(calls.jobs, initialJobs + 1);
  assert.equal(calls.diagnostics, 1);
  assert.equal(hashListeners.size, 0);
});

test("WebUI semantic tokens, state classes and accessibility hooks are present and used", async () => {
  const root = new URL("../web/", import.meta.url);
  const [tokens, base, layout, components, html] = await Promise.all([
    readFile(new URL("styles/tokens.css", root), "utf8"),
    readFile(new URL("styles/base.css", root), "utf8"),
    readFile(new URL("styles/layout.css", root), "utf8"),
    readFile(new URL("styles/components.css", root), "utf8"),
    readFile(new URL("index.html", root), "utf8"),
  ]);
  for (const token of [
    "surface-page", "surface-panel", "surface-raised", "surface-inset", "text-primary", "text-secondary", "text-muted", "text-link",
    "border-subtle", "border-strong", "focus-ring", "state-success", "state-running", "state-waiting", "state-ready", "state-warning", "state-failure", "state-disabled",
    "content-max-width", "nav-width", "control-height", "z-panel", "z-overlay", "z-dialog", "transition-fast", "ease-standard",
  ]) assert.match(tokens, new RegExp(`--webui-${token}\\s*:`));
  assert.match(base, /var\(--webui-surface-panel\)/);
  assert.match(layout, /var\(--webui-content-max-width\)/);
  assert.match(components, /var\(--webui-state-success\)/);
  assert.match(base, /prefers-reduced-motion/);
  assert.match(base, /var\(--webui-focus-ring\)/);
  assert.match(layout, /var\(--webui-nav-width\)/);
  for (const status of ["completed", "succeeded", "available", "running", "queued", "dispatching", "in-progress", "waiting", "waiting-gate", "waiting-tts-qc", "waiting-smoke-qc", "ready", "failed", "blocked", "invalidated", "missing", "timeout", "pending", "uninitialized"]) assert.match(components, new RegExp(`\\.status-${status}(?:[,\\s{])`));
  assert.match(html, /id="batch-to-gate2"[^>]*aria-describedby="batch-selection-state"/);
  assert.match(html, /id="upload-series-cover"[^>]*aria-describedby="series-state"/);
  assert.match(html, /id="source-import-submit"[^>]*aria-describedby="source-import-state"/);
});

test("shared presentation helpers are deterministic", () => {
  assert.equal(escapeHtml("<a>&\""), "&lt;a&gt;&amp;&quot;");
  assert.equal(labelFor("waiting"), "等待确认");
  assert.match(formatError({ message: "失败", issues: ["缺少文件"] }), /失败：缺少文件/);
});

test("web route matchers keep URL parsing outside business services", () => {
  assert.deepEqual(matchProjectRoute("GET", "/api/projects/demo/workspace"), {
    method: "GET", slug: "demo", resource: "workspace",
  });
  assert.deepEqual(matchTaskRoute("POST", "/api/remotion-tasks/abc-123/action"), {
    method: "POST", kind: "remotion-tasks", id: "abc-123", action: true,
  });
  assert.equal(matchProjectRoute("GET", "/api/projects/import"), null);
});

test("project action service normalizes only the action input contract", () => {
  assert.equal(isSupportedProjectAction("reject"), true);
  assert.equal(isSupportedProjectAction("delete-everything"), false);
  assert.deepEqual(normalizeProjectAction({ slug: "demo", action: "approve", commitAndPush: 1 }), {
    slug: "demo", action: "approve", stage: null, gate: null, returnTo: null, reason: null, runId: null,
    commitAndPush: false, confirmDelivery: false,
  });
});
