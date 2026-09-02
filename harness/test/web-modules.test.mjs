import assert from "node:assert/strict";
import test from "node:test";
import { ApiError, createApiClient } from "../web/core/api-client.js";
import { createPollingRegistry } from "../web/core/polling.js";
import { parseRoute } from "../web/core/router.js";
import { createStore } from "../web/core/store.js";
import { formatError } from "../web/shared/feedback.js";
import { escapeHtml } from "../web/shared/html.js";
import { labelFor } from "../web/shared/labels.js";

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

test("shared presentation helpers are deterministic", () => {
  assert.equal(escapeHtml("<a>&\""), "&lt;a&gt;&amp;&quot;");
  assert.equal(labelFor("waiting"), "等待确认");
  assert.match(formatError({ message: "失败", issues: ["缺少文件"] }), /失败：缺少文件/);
});
