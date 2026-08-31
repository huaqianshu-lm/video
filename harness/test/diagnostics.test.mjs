import test from "node:test";
import assert from "node:assert/strict";
import { diagnoseGitHubActions } from "../src/diagnostics.mjs";

const environment = {
  GITHUB_TOKEN: "secret-token",
  GITHUB_REPOSITORY: "example/video",
  HARNESS_GITHUB_REF: "main",
  GITHUB_REF_NAME: "main",
};

test("reports incomplete GitHub configuration without making a request", async () => {
  let calls = 0;
  const result = await diagnoseGitHubActions({
    environment: { GITHUB_TOKEN: "" },
    fetchImpl: async () => { calls += 1; },
  });
  assert.equal(result.ok, false);
  assert.equal(result.config.tokenConfigured, false);
  assert.equal(calls, 0);
  assert.doesNotMatch(JSON.stringify(result), /secret-token/);
});

test("checks repository, ref and workflows without exposing the token", async () => {
  const paths = [];
  const result = await diagnoseGitHubActions({
    environment,
    apiUrl: "https://api.example.test",
    fetchImpl: async (url, options) => {
      paths.push(new URL(url).pathname);
      assert.equal(options.headers.Authorization, "Bearer secret-token");
      return { ok: true, status: 200 };
    },
  });
  assert.equal(result.ok, true);
  assert.deepEqual(paths, [
    "/repos/example/video",
    "/repos/example/video/git/ref/heads/main",
    "/repos/example/video/actions/workflows/smoke-test-video.yml",
    "/repos/example/video/actions/workflows/render-video.yml",
  ]);
  assert.doesNotMatch(JSON.stringify(result), /secret-token/);
});

test("surfaces API permission failures as failed diagnostics", async () => {
  const result = await diagnoseGitHubActions({
    environment,
    fetchImpl: async () => ({ ok: false, status: 403 }),
  });
  assert.equal(result.ok, false);
  assert.equal(result.checks.filter((item) => item.status === "failed").length, 4);
  assert.match(result.checks[1].message, /403/);
});
