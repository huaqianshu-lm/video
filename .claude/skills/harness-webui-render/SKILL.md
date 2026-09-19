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
- Resolve the server-side Workflow Profile before deciding stages, artifacts, asset checks, or remote inputs; the browser must not copy the Workflow graph or business rules.
- `narrated-tutorial-v1` keeps its MP3／VTT／SRT and narrated Manifest contract. `product-promo-v1` uses Asset Manifest／Visual Timeline validation, must not create placeholder narrated artifacts, and must not enter TTS or TTS quality review.
- New Workflow project materials use the Profile's unique namespaced paths; existing narrated legacy-flat paths remain readable and are not migrated. The persisted `project.json.workflow` and resolved path fields are authoritative.

## Remote delivery preflight

Before dispatching a Harness complete Render, and before manually triggering a standalone Smoke Render when its input package is prepared through Harness:

- For complete Render, require a per-video binding record that fixes the slug, Composition ID, published URL, package fingerprint, and ZIP SHA-256; legacy global URL/SHA environment variables must not bypass this check.
- Validate the resource ZIP can be fully extracted and has the expected `<video-slug>/` top-level directory.
- For `narrated-tutorial-v1`, require both `subtitles/captions.vtt` and `subtitles/captions.srt`, then match every ZIP MP3 path and count against the Audio Manifest and the other narrated manifests.
- For `product-promo-v1`, require the Profile-declared `asset-manifest.json` and `visual-timeline.json`, then match every declared local asset and optional music／SFX reference; do not require or synthesize MP3、VTT、SRT or narrated manifests.
- For `product-promo-v1`, require Remotion config to import the current `visual-timeline.json` by its exact relative path and have `TotalDurationFrames` return that import's `durationInFrames`; hard-coded or comment-only timing must fail before packaging or dispatch.
- Confirm all required code, configuration, and resource files are tracked, clean, and present on the dispatch branch.
- Resolve the branch in this order: explicit `HARNESS_GITHUB_REF`, current Git worktree branch, then `GITHUB_REF_NAME` only as a fallback.

## Git boundary

- Preparing resources must not commit or push.
- Only the explicit user-confirmed “commit and complete Render” entry may perform a targeted commit and push for the current video's delivery files.
- Never use `git add .`; never include unrelated videos, documents, or working-tree changes.
- Do not bypass human review or convert a task status into a completed production stage without validated output.
- Remotion production tasks must generate the ignored `src/RenderInputRoot.tsx` from the current validated per-video package before Gate 3 validation or Studio preview; the tracked `src/Root.tsx` remains generic and is never a concrete-video fallback.
- A standalone Smoke Render must target an unfinished video or an independent copy, and must not modify a `completed` video's content, state, Job, review, or related artifacts.
- `product-promo-v1` batch production is explicitly unsupported in the first implementation; its batch entry must return a clear unsupported-Workflow error and must not convert the project into a narrated batch.

## References

- Read `docs/END-TO-END-VIDEO-PRODUCTION-PLAN.md` for the end-to-end handoff.
- Read `harness/README.md` for commands and local setup.
- Read `harness/VALIDATION-MATRIX.md` for the applicable regression coverage.
