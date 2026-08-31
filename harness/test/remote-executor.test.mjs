import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import {
  assertRemoteRenderInputs,
  createRemoteRenderExecutor,
  validateRemoteRenderInputs,
} from "../src/remote-executor.mjs";

test("submits a single remote render job without waiting for the remote Run", () => {
  const calls = [];
  const executor = createRemoteRenderExecutor({
    validateInputs() {},
    monitor: {
      submit(input) {
        calls.push(input);
        return { id: "job-1", status: "queued", ...input };
      },
    },
  });
  const project = {
    config: { slug: "single-render-video" },
    state: {
      currentStage: "smoke-render",
      stages: { "smoke-render": { status: "ready" } },
    },
  };

  const result = executor.run({ stage: "smoke-render", project });
  assert.equal(result.deferred, true);
  assert.equal(result.job.id, "job-1");
  assert.deepEqual(calls, [{ slug: "single-render-video", stage: "smoke-render" }]);
});

test("does not submit a remote job when the single project is not ready", () => {
  const executor = createRemoteRenderExecutor({
    validateInputs() {},
    monitor: { submit() { throw new Error("must not submit"); } },
  });
  const project = {
    config: { slug: "blocked-render-video" },
    state: {
      currentStage: "gate-3",
      stages: { "smoke-render": { status: "pending" } },
    },
  };

  assert.throws(
    () => executor.run({ stage: "smoke-render", project }),
    /当前不在可执行的 smoke-render 阶段/,
  );
});

function renderProjectFixture() {
  const workspaceRoot = fs.mkdtempSync(path.join(os.tmpdir(), "video-render-preflight-"));
  const slug = "preflight-video";
  const generated = path.join(workspaceRoot, "src", "videos", slug, "generated");
  const archive = path.join(workspaceRoot, "assets", `${slug}-assets.zip`);
  fs.mkdirSync(generated, { recursive: true });
  fs.mkdirSync(path.dirname(archive), { recursive: true });
  fs.writeFileSync(archive, "fixture");
  fs.writeFileSync(path.join(generated, "audio-manifest.json"), JSON.stringify({
    videoId: slug,
    scenes: [{ sceneId: "01", segments: [{ id: "01-01", file: "audio/scene-01/01-01.mp3" }] }],
  }));
  fs.writeFileSync(path.join(generated, "subtitle-manifest.json"), JSON.stringify({
    videoId: slug,
    scenes: [{ sceneId: "01" }],
  }));
  fs.writeFileSync(path.join(generated, "timeline-manifest.json"), JSON.stringify({
    videoId: slug,
    scenes: [{ sceneId: "01" }],
  }));
  return {
    workspaceRoot,
    project: { config: { slug, workspaceRoot } },
    entries: [
      `${slug}/audio/scene-01/01-01.mp3`,
      `${slug}/subtitles/captions.vtt`,
      `${slug}/subtitles/captions.srt`,
    ],
  };
}

test("validates the archive structure, subtitles, audio files, and manifest scenes before dispatch", () => {
  const fixture = renderProjectFixture();
  try {
    assert.deepEqual(validateRemoteRenderInputs(fixture.project, {
      listArchiveEntries: () => fixture.entries,
    }), []);
  } finally {
    fs.rmSync(fixture.workspaceRoot, { recursive: true, force: true });
  }
});

test("blocks dispatch when the archive omits subtitle files or manifest audio", () => {
  const fixture = renderProjectFixture();
  try {
    const options = { listArchiveEntries: () => [`${fixture.project.config.slug}/`] };
    const issues = validateRemoteRenderInputs(fixture.project, options);
    assert.ok(issues.some((issue) => issue.includes("captions.vtt")));
    assert.ok(issues.some((issue) => issue.includes("captions.srt")));
    assert.ok(issues.some((issue) => issue.includes("01-01.mp3")));
    assert.ok(issues.some((issue) => issue.includes("音频数量为 0")));
    assert.throws(
      () => assertRemoteRenderInputs(fixture.project, options),
      /远程渲染输入预检失败/,
    );
  } finally {
    fs.rmSync(fixture.workspaceRoot, { recursive: true, force: true });
  }
});
