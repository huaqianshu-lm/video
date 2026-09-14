import test from "node:test";
import assert from "node:assert/strict";
import { execFileSync } from "node:child_process";
import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import { createGitHubActionsAdapter } from "../src/adapters.mjs";

function fixture() {
  const workspaceRoot = fs.mkdtempSync(path.join(os.tmpdir(), "video-harness-remote-ref-"));
  fs.writeFileSync(path.join(workspaceRoot, "README.md"), "fixture\n", "utf8");
  execFileSync("git", ["-C", workspaceRoot, "init", "-q", "-b", "main"]);
  execFileSync("git", ["-C", workspaceRoot, "config", "user.email", "harness@example.test"]);
  execFileSync("git", ["-C", workspaceRoot, "config", "user.name", "Harness Test"]);
  execFileSync("git", ["-C", workspaceRoot, "add", "README.md"]);
  execFileSync("git", ["-C", workspaceRoot, "commit", "-qm", "test: remote ref"]);
  const sha = execFileSync("git", ["-C", workspaceRoot, "rev-parse", "main"], { encoding: "utf8" }).trim();
  return { workspaceRoot, sha, project: { config: { workspaceRoot } } };
}

function adapter(remoteSha) {
  return createGitHubActionsAdapter({
    token: "test-token",
    repository: "example/video",
    ref: "main",
    fetchImpl: async () => ({
      ok: true,
      status: 200,
      text: async () => JSON.stringify({ object: { sha: remoteSha } }),
    }),
  });
}

test("verifies the GitHub dispatch ref contains the local commit", async () => {
  const { workspaceRoot, sha, project } = fixture();
  try {
    const result = await adapter(sha).verifyDispatchRef({ project, dispatch: { ref: "main" } });
    assert.deepEqual(result, { ref: "main", localSha: sha, remoteSha: sha });
  } finally {
    fs.rmSync(workspaceRoot, { recursive: true, force: true });
  }
});

test("blocks dispatch when the remote ref is behind the local commit", async () => {
  const { workspaceRoot, project } = fixture();
  try {
    await assert.rejects(
      () => adapter("0000000000000000000000000000000000000000").verifyDispatchRef({ project, dispatch: { ref: "main" } }),
      (error) => error.code === "remote-ref-out-of-sync" && /请先 push/.test(error.message),
    );
  } finally {
    fs.rmSync(workspaceRoot, { recursive: true, force: true });
  }
});

test("uses the per-video delivery binding when creating a render dispatch", () => {
  const { workspaceRoot, project } = fixture();
  const slug = "bound-render-video";
  project.config.slug = slug;
  const deliveryRoot = path.join(workspaceRoot, "local", "render-input");
  fs.mkdirSync(deliveryRoot, { recursive: true });
  fs.writeFileSync(path.join(deliveryRoot, `${slug}.delivery.json`), `${JSON.stringify({
    schemaVersion: 1,
    kind: "video-render-input-delivery",
    videoSlug: slug,
    compositionId: slug,
    packageFingerprint: "a".repeat(64),
    archiveSha256: "b".repeat(64),
    url: "https://inputs.example.test/bound-render.zip",
    boundAt: "2026-09-14T00:00:00.000Z",
  }, null, 2)}\n`, "utf8");
  try {
    const adapter = createGitHubActionsAdapter({
      token: "test-token",
      repository: "example/video",
      ref: "main",
      requireRenderInput: true,
      fetchImpl: async () => ({ ok: true, status: 204, text: async () => "" }),
    });
    const dispatch = adapter.createDispatch({
      stage: "render",
      project: { config: { ...project.config, compositionId: slug }, state: { slug } },
    });
    assert.equal(dispatch.renderInputUrl, "https://inputs.example.test/bound-render.zip");
    assert.equal(dispatch.renderInputSha256, "b".repeat(64));
  } finally {
    fs.rmSync(workspaceRoot, { recursive: true, force: true });
  }
});

test("a legacy global render URL cannot bypass a missing per-video binding", async () => {
  const { workspaceRoot, project } = fixture();
  project.config.slug = "missing-binding-video";
  try {
    const adapter = createGitHubActionsAdapter({
      token: "test-token",
      repository: "example/video",
      ref: "main",
      renderInputUrl: "https://inputs.example.test/legacy.zip",
      renderInputSha256: "c".repeat(64),
      requireRenderInput: true,
      fetchImpl: async () => ({ ok: true, status: 204, text: async () => "" }),
    });
    await assert.rejects(
      () => adapter.dispatchWorkflow({ stage: "render", project: { ...project, state: { slug: project.config.slug } } }),
      (error) => error.code === "render-input-remote-config-invalid",
    );
  } finally {
    fs.rmSync(workspaceRoot, { recursive: true, force: true });
  }
});
