import test from "node:test";
import assert from "node:assert/strict";
import { execFileSync } from "node:child_process";
import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import { validateGitRenderDelivery } from "../src/git-delivery.mjs";

function write(root, relativePath, content = "fixture\n") {
  const filePath = path.join(root, relativePath);
  fs.mkdirSync(path.dirname(filePath), { recursive: true });
  fs.writeFileSync(filePath, content, "utf8");
}

function fixture() {
  const workspaceRoot = fs.mkdtempSync(path.join(os.tmpdir(), "video-harness-git-delivery-"));
  const slug = "delivery-video";
  for (const relativePath of [
    `assets/${slug}-assets.zip`,
    "src/Root.tsx",
    `src/videos/${slug}/video.config.ts`,
    `src/videos/${slug}/generated/audio-manifest.json`,
    `src/videos/${slug}/generated/subtitle-manifest.json`,
    `src/videos/${slug}/generated/timeline-manifest.json`,
    `src/videos/${slug}/DeliveryVideo.tsx`,
  ]) write(workspaceRoot, relativePath);
  execFileSync("git", ["-C", workspaceRoot, "init", "-q", "-b", "main"]);
  execFileSync("git", ["-C", workspaceRoot, "config", "user.email", "harness@example.test"]);
  execFileSync("git", ["-C", workspaceRoot, "config", "user.name", "Harness Test"]);
  execFileSync("git", ["-C", workspaceRoot, "add", "."]);
  execFileSync("git", ["-C", workspaceRoot, "commit", "-qm", "test: render delivery fixture"]);
  return { workspaceRoot, slug, project: { config: { slug, workspaceRoot } } };
}

test("accepts a clean tracked render delivery on the dispatch ref", () => {
  const { workspaceRoot, project } = fixture();
  try {
    assert.deepEqual(validateGitRenderDelivery(project, {
      environment: { HARNESS_GITHUB_REF: "main" },
    }), []);
  } finally {
    fs.rmSync(workspaceRoot, { recursive: true, force: true });
  }
});

test("reports uncommitted and untracked render inputs", () => {
  const { workspaceRoot, project, slug } = fixture();
  try {
    fs.appendFileSync(path.join(workspaceRoot, "src", "Root.tsx"), "changed\n");
    write(workspaceRoot, `src/videos/${slug}/NewVideo.tsx`);
    const issues = validateGitRenderDelivery(project, {
      environment: { HARNESS_GITHUB_REF: "main" },
    });
    assert.ok(issues.includes("渲染相关文件存在未提交修改：src/Root.tsx"));
    assert.ok(issues.includes(`渲染相关文件存在未提交修改：src/videos/${slug}/NewVideo.tsx`));
    assert.ok(issues.includes(`渲染所需文件未被 Git 跟踪：src/videos/${slug}/NewVideo.tsx`));
  } finally {
    fs.rmSync(workspaceRoot, { recursive: true, force: true });
  }
});

