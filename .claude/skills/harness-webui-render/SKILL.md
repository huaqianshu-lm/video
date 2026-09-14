---
name: harness-webui-render
description: Operate or modify the local Harness Web UI, persistent jobs, batch orchestration, asset preflight, standalone Smoke Render checks, and GitHub Actions delivery.
---

# Harness Web UI and remote render

Use this skill for Harness Web UI, batch jobs, Agent executors, asset packaging, Smoke Render, complete Render, or GitHub Actions delivery.

## Core behavior

- Reuse the Harness stage contract and persistent project state; do not duplicate stage or Gate logic in the browser.
- Keep the Web UI on `127.0.0.1`; the browser must never receive the GitHub token.
- Agent, TTS, Remotion, and remote jobs must be persistent, resumable, idempotent, and revalidated from real output after the process exits.
- Missing executors, failed processes, and invalid outputs remain retryable failures or waiting tasks; never create placeholder output.
- Gate 2, TTS quality review, Gate 3, and Gate 4 remain human checkpoints in the production workflow.
- Smoke Render is a standalone manual environment check for a new series or a rendering-environment change. It does not advance a Harness stage, create a Harness production Job, or write a video review.

## Remote delivery preflight

Before dispatching a Harness complete Render, and before manually triggering a standalone Smoke Render when its input package is prepared through Harness:

- For complete Render, require a per-video binding record that fixes the slug, Composition ID, published URL, package fingerprint, and ZIP SHA-256; legacy global URL/SHA environment variables must not bypass this check.
- Validate the resource ZIP can be fully extracted and has the expected `<video-slug>/` top-level directory.
- Require both `subtitles/captions.vtt` and `subtitles/captions.srt`.
- Match every ZIP MP3 path and count against the Audio Manifest and the other manifests.
- Confirm all required code, configuration, and resource files are tracked, clean, and present on the dispatch branch.
- Resolve the branch in this order: explicit `HARNESS_GITHUB_REF`, current Git worktree branch, then `GITHUB_REF_NAME` only as a fallback.

## Git boundary

- Preparing resources must not commit or push.
- Only the explicit user-confirmed “commit and complete Render” entry may perform a targeted commit and push for the current video's delivery files.
- Never use `git add .`; never include unrelated videos, documents, or working-tree changes.
- Do not bypass human review or convert a task status into a completed production stage without validated output.
- Remotion production tasks must generate the ignored `src/RenderInputRoot.tsx` from the current validated per-video package before Gate 3 validation or Studio preview; the tracked `src/Root.tsx` remains generic and is never a concrete-video fallback.
- A standalone Smoke Render must target an unfinished video or an independent copy, and must not modify a `completed` video's content, state, Job, review, or related artifacts.

## References

- Read `docs/END-TO-END-VIDEO-PRODUCTION-PLAN.md` for the end-to-end handoff.
- Read `harness/README.md` for commands and local setup.
- Read `harness/VALIDATION-MATRIX.md` for the applicable regression coverage.
