import test from "node:test";
import assert from "node:assert/strict";
import { requireGitHubActionsConfig, validateGitHubActionsConfig } from "../src/github-config.mjs";

test("accepts the supported GitHub Actions environment variables", () => {
  const result = validateGitHubActionsConfig({
    GH_TOKEN: "secret",
    GITHUB_REPOSITORY: "owner/video",
    HARNESS_GITHUB_REF: "feat/video-harness-v0.5",
  }, { currentGitRef: "main" });
  assert.equal(result.valid, true);
  assert.deepEqual(result.config, {
    token: "secret",
    repository: "owner/video",
    ref: "feat/video-harness-v0.5",
  });
});

test("prefers the explicit Harness ref over a stale GitHub ref", () => {
  const result = validateGitHubActionsConfig({
    GITHUB_TOKEN: "secret",
    GITHUB_REPOSITORY: "owner/video",
    GITHUB_REF_NAME: "feat/video-harness-v0.5",
    HARNESS_GITHUB_REF: "feat/harness-batch-to-prototype-gate3",
  }, { currentGitRef: "main" });

  assert.equal(result.valid, true);
  assert.equal(result.config.ref, "feat/harness-batch-to-prototype-gate3");
});

test("uses the current Git branch before a stale GitHub environment ref", () => {
  const result = validateGitHubActionsConfig({
    GITHUB_TOKEN: "",
    GH_TOKEN: "secret",
    GITHUB_REPOSITORY: "owner/video",
    HARNESS_GITHUB_REF: "",
    GITHUB_REF_NAME: "feat/video-harness-v0.5",
  }, { currentGitRef: "feat/harness-batch-to-prototype-gate3" });

  assert.equal(result.valid, true);
  assert.equal(result.config.token, "secret");
  assert.equal(result.config.ref, "feat/harness-batch-to-prototype-gate3");
});

test("falls back to the GitHub environment ref outside a branch checkout", () => {
  const result = validateGitHubActionsConfig({
    GITHUB_TOKEN: "secret",
    GITHUB_REPOSITORY: "owner/video",
    GITHUB_REF_NAME: "main",
  }, { currentGitRef: "" });

  assert.equal(result.valid, true);
  assert.equal(result.config.ref, "main");
});

test("reports every missing or malformed GitHub Actions setting", () => {
  const result = validateGitHubActionsConfig({
    GITHUB_TOKEN: "",
    GITHUB_REPOSITORY: "not-a-repository",
    GITHUB_REF_NAME: "",
  }, { currentGitRef: "" });
  assert.equal(result.valid, false);
  assert.deepEqual(result.issues.map((issue) => issue.code), [
    "missing-token",
    "invalid-repository",
    "missing-ref",
  ]);
});

test("throws a structured preflight error without exposing token values", () => {
  assert.throws(
    () => requireGitHubActionsConfig(
      { GITHUB_TOKEN: "top-secret", GITHUB_REPOSITORY: "owner/video" },
      { currentGitRef: "" },
    ),
    (error) => {
      assert.equal(error.code, "github-config-invalid");
      assert.match(error.message, /GITHUB_REF_NAME/);
      assert.doesNotMatch(error.message, /top-secret/);
      return true;
    },
  );
});
