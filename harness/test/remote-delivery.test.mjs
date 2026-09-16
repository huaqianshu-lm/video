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

test("sends a dispatchId and persists the exact Run details returned by GitHub", async () => {
  const { workspaceRoot } = fixture();
  const slug = "dispatch-details-video";
  const dispatchId = "dispatch-11111111-1111-4111-8111-111111111111";
  const calls = [];
  try {
    const adapter = createGitHubActionsAdapter({
      token: "test-token",
      repository: "example/video",
      ref: "main",
      fetchImpl: async (url, options) => {
        calls.push({ url, options });
        return {
          ok: true,
          status: 200,
          text: async () => JSON.stringify({
            workflow_run_id: 4242,
            workflow_run_url: "https://api.github.com/repos/example/video/actions/runs/4242",
            html_url: "https://github.com/example/video/actions/runs/4242",
          }),
        };
      },
    });
    const dispatch = await adapter.dispatchWorkflow({
      stage: "render",
      project: {
        config: { workspaceRoot, compositionId: slug },
        state: { slug },
      },
      dispatchedAt: "2026-09-15T00:00:00.000Z",
      dispatchId,
    });

    assert.equal(dispatch.dispatchId, dispatchId);
    assert.equal(dispatch.runId, 4242);
    assert.equal(dispatch.runApiUrl, "https://api.github.com/repos/example/video/actions/runs/4242");
    assert.equal(dispatch.runUrl, "https://github.com/example/video/actions/runs/4242");
    assert.equal(dispatch.dispatchState, "confirmed");
    const body = JSON.parse(calls[0].options.body);
    assert.equal(body.return_run_details, true);
    assert.deepEqual(body.inputs, {
      video_slug: slug,
      composition_id: slug,
      dispatch_id: dispatchId,
    });
  } finally {
    fs.rmSync(workspaceRoot, { recursive: true, force: true });
  }
});

test("sends the persisted dispatch binding without rereading a newer package binding", async () => {
  const { workspaceRoot } = fixture();
  const slug = "persisted-dispatch-binding-video";
  const dispatchId = "dispatch-persisted-binding";
  const calls = [];
  try {
    const adapter = createGitHubActionsAdapter({
      token: "test-token",
      repository: "example/video",
      ref: "main",
      fetchImpl: async (url, options) => {
        calls.push({ url, options });
        return { ok: true, status: 204, text: async () => "" };
      },
    });
    await adapter.dispatchWorkflow({
      stage: "render",
      project: { config: { workspaceRoot, compositionId: slug }, state: { slug } },
      dispatchId,
      dispatch: {
        workflow: "render-video.yml",
        ref: "main",
        slug,
        compositionId: slug,
        dispatchId,
        runName: `${slug} / ${dispatchId}`,
        renderInputUrl: "https://inputs.example.test/persisted.zip",
        renderInputSha256: "d".repeat(64),
        renderInputPackageFingerprint: "e".repeat(64),
        dispatchState: "sending",
      },
    });

    const body = JSON.parse(calls[0].options.body);
    assert.equal(body.inputs.render_input_url, "https://inputs.example.test/persisted.zip");
    assert.equal(body.inputs.render_input_sha256, "d".repeat(64));
    assert.equal(body.inputs.dispatch_id, dispatchId);
  } finally {
    fs.rmSync(workspaceRoot, { recursive: true, force: true });
  }
});

test("finds only the Run whose run-name contains the exact dispatchId", async () => {
  const { workspaceRoot } = fixture();
  const slug = "same-time-video";
  const dispatchId = "dispatch-right";
  const adapter = createGitHubActionsAdapter({
    token: "test-token",
    repository: "example/video",
    ref: "main",
    fetchImpl: async () => ({
      ok: true,
      status: 200,
      text: async () => JSON.stringify({
        workflow_runs: [
          {
            id: 100,
            head_branch: "main",
            created_at: "2026-09-15T00:00:00.000Z",
            display_title: `${slug} / dispatch-other`,
          },
          {
            id: 101,
            head_branch: "main",
            created_at: "2026-09-15T00:00:00.000Z",
            display_title: `${slug} / ${dispatchId}`,
          },
        ],
      }),
    }),
  });
  try {
    const run = await adapter.findDispatchedRunOnce({
      workflow: "render-video.yml",
      ref: "main",
      slug,
      compositionId: slug,
      dispatchId,
      dispatchedAt: "2026-09-15T00:00:00.000Z",
    });
    assert.equal(run.id, 101);
  } finally {
    fs.rmSync(workspaceRoot, { recursive: true, force: true });
  }
});

test("uses different exact run-name markers for consecutive dispatches of one video", () => {
  const { workspaceRoot } = fixture();
  const slug = "same-slug-video";
  const project = { config: { workspaceRoot, compositionId: slug }, state: { slug } };
  try {
    const adapter = createGitHubActionsAdapter({
      token: "test-token",
      repository: "example/video",
      ref: "main",
      fetchImpl: async () => ({ ok: true, status: 204, text: async () => "" }),
    });
    const first = adapter.createDispatch({ stage: "render", project, dispatchId: "dispatch-first" });
    const second = adapter.createDispatch({ stage: "render", project, dispatchId: "dispatch-second" });
    assert.notEqual(first.dispatchId, second.dispatchId);
    assert.equal(first.runName, `${slug} / dispatch-first`);
    assert.equal(second.runName, `${slug} / dispatch-second`);
  } finally {
    fs.rmSync(workspaceRoot, { recursive: true, force: true });
  }
});

test("does not choose the newest Run when dispatchId matches zero or multiple Runs", async () => {
  const { workspaceRoot } = fixture();
  const baseDispatch = {
    workflow: "render-video.yml",
    ref: "main",
    slug: "ambiguous-video",
    compositionId: "ambiguous-video",
    dispatchId: "dispatch-ambiguous",
    dispatchedAt: "2026-09-15T00:00:00.000Z",
  };
  const adapterFor = (runs) => createGitHubActionsAdapter({
    token: "test-token",
    repository: "example/video",
    ref: "main",
    fetchImpl: async () => ({
      ok: true,
      status: 200,
      text: async () => JSON.stringify({ workflow_runs: runs }),
    }),
  });
  try {
    const missing = await adapterFor([{
      id: 201,
      head_branch: "main",
      created_at: "2026-09-15T00:00:01.000Z",
      display_title: "ambiguous-video / another-dispatch",
    }]).findDispatchedRunOnce(baseDispatch);
    assert.equal(missing, null);

    await assert.rejects(
      () => adapterFor([
        { id: 202, head_branch: "main", display_title: "ambiguous-video / dispatch-ambiguous" },
        { id: 203, head_branch: "main", display_title: "ambiguous-video / dispatch-ambiguous" },
      ]).findDispatchedRunOnce(baseDispatch),
      (error) => error.code === "remote-dispatch-ambiguous" && error.candidates.length === 2,
    );
  } finally {
    fs.rmSync(workspaceRoot, { recursive: true, force: true });
  }
});

test("rejects a persisted Run name that does not match its dispatchId", async () => {
  const { workspaceRoot } = fixture();
  const dispatch = {
    workflow: "render-video.yml",
    ref: "main",
    slug: "run-name-binding-video",
    compositionId: "run-name-binding-video",
    dispatchId: "dispatch-expected",
    runName: "run-name-binding-video / dispatch-other",
  };
  const adapter = createGitHubActionsAdapter({
    token: "test-token",
    repository: "example/video",
    ref: "main",
    fetchImpl: async () => ({
      ok: true,
      status: 200,
      text: async () => JSON.stringify({ workflow_runs: [] }),
    }),
  });
  try {
    await assert.rejects(
      () => adapter.findDispatchedRunOnce(dispatch),
      (error) => error.code === "remote-dispatch-id-mismatch",
    );
  } finally {
    fs.rmSync(workspaceRoot, { recursive: true, force: true });
  }
});

test("turns a discovery timeout into an explicit uncertain-dispatch error", async () => {
  const { workspaceRoot } = fixture();
  const adapter = createGitHubActionsAdapter({
    token: "test-token",
    repository: "example/video",
    ref: "main",
    discoveryTimeoutMs: 0,
    fetchImpl: async () => ({
      ok: true,
      status: 200,
      text: async () => JSON.stringify({ workflow_runs: [] }),
    }),
    sleepImpl: async () => {},
  });
  try {
    await assert.rejects(
      () => adapter.findDispatchedRun({
        workflow: "render-video.yml",
        ref: "main",
        slug: "uncertain-video",
        compositionId: "uncertain-video",
        dispatchId: "dispatch-uncertain",
        dispatchedAt: "2026-09-15T00:00:00.000Z",
      }),
      (error) => error.code === "remote-dispatch-uncertain",
    );
  } finally {
    fs.rmSync(workspaceRoot, { recursive: true, force: true });
  }
});
