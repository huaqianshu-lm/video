import assert from "node:assert/strict";
import test from "node:test";
import { ApiError, createApiClient } from "../web/api/client.js";
import { createPollingRegistry } from "../web/core/polling.js";
import { createRouter, parseRoute } from "../web/core/router.js";
import { createStore } from "../web/core/store.js";
import { formatError } from "../web/shared/feedback.js";
import { escapeHtml } from "../web/shared/html.js";
import { labelFor } from "../web/shared/labels.js";
import { startApplication } from "../web/views/application.js";
import { matchProjectRoute } from "../src/web/routes/projects.mjs";
import { matchTaskRoute } from "../src/web/routes/tasks.mjs";
import { isSupportedProjectAction, normalizeProjectAction } from "../src/web/services/project-actions.mjs";
import { createProjectView } from "../web/views/project/index.js";

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
  assert.deepEqual(parseRoute("#/projects/demo-video"), { name: "project", slug: "demo-video" });
  assert.deepEqual(parseRoute("#project=demo-video"), { name: "project", slug: "demo-video" });
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
