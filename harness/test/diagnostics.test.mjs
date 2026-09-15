import test from "node:test";
import assert from "node:assert/strict";
import { assertGitHubActionsReady, diagnoseGitHubActions } from "../src/diagnostics.mjs";

const environment = {
  GITHUB_TOKEN: "secret-token",
  GITHUB_REPOSITORY: "example/video",
  HARNESS_GITHUB_REF: "main",
  GITHUB_REF_NAME: "main",
  HARNESS_RENDER_INPUT_URL: "https://api.github.com/repos/example/video-render-inputs/releases/assets/123",
  HARNESS_RENDER_INPUT_SHA256: "aaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa",
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
  assert.equal(result.ok, false);
  assert.equal(result.config.renderInputConfigured, false);
  assert.match(result.checks[0].message, /按视频绑定/);
  assert.deepEqual(paths, [
    "/user",
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
  assert.equal(result.checks.filter((item) => item.status === "failed").length, 6);
  assert.match(result.checks[3].message, /403/);
});

test("does not treat legacy global render input variables as a video delivery binding", async () => {
  const result = await diagnoseGitHubActions({
    environment: {
      ...environment,
      HARNESS_RENDER_INPUT_URL: "https://github.com/example/video-render-inputs/releases/download/v1/video.zip",
    },
    fetchImpl: async () => ({ ok: true, status: 200 }),
  });
  assert.equal(result.ok, false);
  assert.equal(result.config.renderInputConfigured, false);
  assert.equal(result.checks[0].name, "render-input");
  assert.match(result.checks[0].message, /按视频绑定/);
});

test("checks the authenticated GitHub identity before remote probes", async () => {
  const paths = [];
  const result = await diagnoseGitHubActions({
    environment,
    checkRenderInput: false,
    apiUrl: "https://api.example.test",
    fetchImpl: async (url) => {
      paths.push(new URL(url).pathname);
      return { ok: true, status: 200 };
    },
  });
  assert.equal(result.ok, true);
  assert.equal(result.config.authSource, "env");
  assert.equal(result.config.renderInputConfigured, null);
  assert.deepEqual(paths[0], "/user");
});

test("blocks a token that can read but cannot push", async () => {
  const result = await diagnoseGitHubActions({
    environment,
    checkRenderInput: false,
    fetchImpl: async (url) => new URL(url).pathname === "/repos/example/video"
      ? { ok: true, status: 200, json: async () => ({ permissions: { push: false } }) }
      : { ok: true, status: 200 },
  });
  assert.equal(result.ok, false);
  assert.equal(result.checks.find((item) => item.name === "repository-write").status, "failed");
});

test("asserts authentication before creating a remote job and never exposes the token", async () => {
  await assert.rejects(
    () => assertGitHubActionsReady({
      environment,
      fetchImpl: async (url) => new URL(url).pathname === "/user"
        ? { ok: false, status: 401 }
        : { ok: true, status: 200 },
    }),
    (error) => {
      assert.equal(error.code, "github-auth-invalid");
      assert.doesNotMatch(`${error.message}${JSON.stringify(error.issues)}${JSON.stringify(error.diagnostics)}`, /secret-token/);
      return true;
    },
  );
});
