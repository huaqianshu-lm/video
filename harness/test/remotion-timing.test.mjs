import assert from "node:assert/strict";
import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import test from "node:test";
import { artifactManifestFor } from "../src/artifacts.mjs";
import { buildTaskPacket } from "../src/context.mjs";
import { buildRemotionTimingPlan } from "../src/remotion-timing.mjs";

function writeJson(root, relativePath, value) {
  const filePath = path.join(root, relativePath);
  fs.mkdirSync(path.dirname(filePath), { recursive: true });
  fs.writeFileSync(filePath, `${JSON.stringify(value)}\n`, "utf8");
}

function createTimingFixture() {
  const workspaceRoot = fs.mkdtempSync(path.join(os.tmpdir(), "video-remotion-timing-"));
  const slug = "timing-fixture";
  const generatedRoot = `src/videos/${slug}/generated`;

  writeJson(workspaceRoot, `${generatedRoot}/audio-manifest.json`, {
    videoId: slug,
    scenes: [
      { sceneId: "01", segments: [{ id: "01-01", file: "audio/scene-01/01-01.mp3", duration: 2 }] },
      { sceneId: "02", segments: [{ id: "02-01", file: "audio/scene-02/02-01.mp3", duration: 1.5 }] },
    ],
  });
  writeJson(workspaceRoot, `${generatedRoot}/subtitle-manifest.json`, {
    videoId: slug,
    scenes: [
      { sceneId: "01", segments: [{ segmentId: "01-01", cues: [{ id: "01-01-a", start: 0.2, end: 0.8, text: "第一段" }] }] },
      { sceneId: "02", segments: [{ segmentId: "02-01", cues: [{ id: "02-01-a", start: 0.1, end: 0.9, text: "第二段" }] }] },
    ],
  });
  writeJson(workspaceRoot, `${generatedRoot}/timeline-manifest.json`, {
    videoId: slug,
    duration: 3.5,
    scenes: [
      {
        sceneId: "01",
        offset: 0,
        duration: 2,
        end: 2,
        segments: [{ segmentId: "01-01", offset: 0, duration: 2, end: 2 }],
      },
      {
        sceneId: "02",
        offset: 2,
        duration: 1.5,
        end: 3.5,
        segments: [{ segmentId: "02-01", offset: 0, duration: 1.5, end: 1.5 }],
      },
    ],
  });

  return { slug, workspaceRoot };
}

function projectForFixture({ slug, workspaceRoot }) {
  return {
    config: {
      harnessVersion: "0.6.0",
      remotionDirectory: `src/videos/${slug}`,
      sourceDirectory: `videos/${slug}`,
      slug,
      style: "current",
      target: "gate-4",
      workflow: "default",
      workflowVersion: 1,
      workspaceRoot,
    },
    state: {
      currentStage: "remotion",
      slug,
      stages: { remotion: { status: "ready" } },
    },
    artifacts: { stages: artifactManifestFor(slug) },
  };
}

test("builds a single Timeline-based Scene, Segment, and Cue frame map", () => {
  const fixture = createTimingFixture();
  try {
    const plan = buildRemotionTimingPlan({ ...fixture, fps: 30 });

    assert.equal(plan.source, "timeline-manifest.json");
    assert.equal(plan.durationSeconds, 3.5);
    assert.equal(plan.durationFrames, 105);
    assert.deepEqual(plan.scenes.map((scene) => [scene.sceneId, scene.startFrame, scene.durationFrames]), [
      ["01", 0, 60],
      ["02", 60, 45],
    ]);
    assert.deepEqual(plan.scenes[0].segments[0], {
      audioDurationSeconds: 2,
      audioFile: "audio/scene-01/01-01.mp3",
      cues: [{
        id: "01-01-a",
        segmentId: "01-01",
        endFrame: 24,
        endSeconds: 0.8,
        startFrame: 6,
        startSeconds: 0.2,
        text: "第一段",
      }],
      durationSeconds: 2,
      endFrame: 60,
      endSeconds: 2,
      segmentId: "01-01",
      startFrame: 0,
      startSeconds: 0,
    });
    assert.deepEqual(plan.scenes[1].segments[0].cues[0], {
      id: "02-01-a",
      segmentId: "02-01",
      endFrame: 87,
      endSeconds: 2.9,
      startFrame: 63,
      startSeconds: 2.1,
      text: "第二段",
    });
  } finally {
    fs.rmSync(fixture.workspaceRoot, { recursive: true, force: true });
  }
});

test("embeds the Timeline plan and production instructions in the Remotion Agent packet", () => {
  const fixture = createTimingFixture();
  try {
    const project = projectForFixture(fixture);
    const packet = buildTaskPacket(project);

    assert.deepEqual(packet.context.timingPlan, buildRemotionTimingPlan({ ...fixture, fps: 30 }));
    assert.deepEqual(packet.task.inputStages, ["tts", "subtitle-timeline", "visual-prototype"]);
    assert.equal(packet.task.inputArtifacts.some((item) => item.path === `videos/${project.config.slug}/tts-script.json`), true);
    assert.equal(packet.context.readPaths.includes(`videos/${project.config.slug}/tts-script.json`), true);
    assert.match(packet.context.constraints.join("\n"), /必须先读取 context\.timingPlan/);
    assert.match(packet.context.constraints.join("\n"), /必须读取并校验冻结的 tts-script\.json/);
    assert.match(packet.context.constraints.join("\n"), /Timeline Manifest 是唯一时间基准/);
    assert.match(packet.context.constraints.join("\n"), /不得使用估算时长或任意硬编码时间替代映射/);
    assert.equal(packet.context.timingPlan.scenes[1].segments[0].cues[0].startFrame, 63);
    assert.equal(packet.context.timingPlan.scenes[1].segments[0].cues[0].endFrame, 87);
  } finally {
    fs.rmSync(fixture.workspaceRoot, { recursive: true, force: true });
  }
});

test("rejects a timing fixture when audio duration diverges from Timeline", () => {
  const fixture = createTimingFixture();
  try {
    const audioPath = path.join(fixture.workspaceRoot, "src/videos/timing-fixture/generated/audio-manifest.json");
    const audio = JSON.parse(fs.readFileSync(audioPath, "utf8"));
    audio.scenes[1].segments[0].duration = 1.25;
    fs.writeFileSync(audioPath, `${JSON.stringify(audio)}\n`, "utf8");

    assert.throws(
      () => buildRemotionTimingPlan({ ...fixture, fps: 30 }),
      /Scene 02／Segment 02-01 的音频时长不一致/,
    );
  } finally {
    fs.rmSync(fixture.workspaceRoot, { recursive: true, force: true });
  }
});
