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
- `narrated-tutorial-v1` keeps its MP3／VTT／SRT and narrated Manifest contract.
- New Workflow project materials use the Profile's unique namespaced paths; existing narrated legacy-flat paths remain readable and are not migrated. The persisted `project.json.workflow` and resolved path fields are authoritative.

## Remote delivery preflight

For Agent series covers, apply `docs/AGENT-SERIES-COVER.md`; the independent input must contain the frozen cover snapshot and matching image in the resource ZIP. Use the same generated cover entry for Studio and Runner; missing or inconsistent cover assets block delivery.

Before operating this path, apply the mandatory successful-validation reuse requirements in the project `CLAUDE.md`. Carry forward the previous verified execution environment and code baseline; record unimplemented machine checks and incomplete cross-video validation explicitly rather than claiming that an operational workaround is a permanent fix.

For Agent/CLI single-video delivery, read `docs/RENDER-DELIVERY-BASELINE.md` and use `cli.mjs render-delivery prepare／start／resume` as the fixed entry. Reuse the verified local method configuration; preparation automatically checks the successful baseline and publishes/binds the input before presenting the exact commit list. Call start only after the user explicitly confirms that list, with its current plan ID. Resume the persisted delivery instead of rebuilding or redispatching. The old CLI `remote-run` and `run <slug> render` are disabled; Web UI and batch integration remain outside this migration.

### Agent execution environment

- On macOS, the agent sandbox may block both the system keyring and GitHub networking. A failed `gh auth token` or `gh auth status` inside that sandbox does not prove that the saved credential is invalid.
- When an authorized remote-render operation fails to read credentials or connect, use the execution tool's approved host-access mode to repeat the read-only checks with `GITHUB_TOKEN` and `GH_TOKEN` removed from that command's environment. Check `gh auth status`, Harness `doctor`, and the independent input repository's read/write permissions before proposing any credential change. Request sandbox escalation through the execution tool when required; do not attempt to escape the sandbox from application code.
- Run input publication/binding, authorized Git push, dispatch, and monitoring in the same approved environment that passed those checks. A server started inside a restricted sandbox does not gain host access from a separate successful terminal check.
- Recommend reauthentication only after the approved environment confirms missing credentials or GitHub actually rejects authentication. Do not modify tokens, shell startup files, secrets, or account login merely because the sandbox cannot read the keyring. Keep tokens out of output and persistent records.

Before dispatching a Harness complete Render, and before manually triggering a standalone Smoke Render when its input package is prepared through Harness:

- For complete Render, require a per-video binding record that fixes the slug, Composition ID, published URL, package fingerprint, and ZIP SHA-256; legacy global URL/SHA environment variables must not bypass this check.
- Validate the resource ZIP can be fully extracted and has the expected `<video-slug>/` top-level directory.
- For `narrated-tutorial-v1`, require both `subtitles/captions.vtt` and `subtitles/captions.srt`, then match every ZIP MP3 path and count against the Audio Manifest and the other narrated manifests.
- Confirm all required code, configuration, and resource files are tracked, clean, and present on the dispatch branch.
- Resolve the branch in this order: explicit `HARNESS_GITHUB_REF`, current Git worktree branch, then `GITHUB_REF_NAME` only as a fallback.

## Git boundary

- Before building a delivery plan, fetch the actual dispatch branch in the approved execution environment and compare its commit with the local branch. Local `origin/<branch>` may be stale. If a prior successful render exists, inspect its exact Run `head_sha` and ensure the new delivery baseline contains that commit or explicitly reviewed equivalent fixes; do not infer code compatibility from the branch name or a prior video's success.
- If local development and the remote dispatch branch have diverged, prepare an isolated delivery checkout from the verified remote baseline, preserving the original dirty worktree. Recompute the exact necessary file differences against that baseline and obtain the required file-list confirmation before committing or pushing. Do not push unrelated local ancestors or recommit fixes already present remotely. This does not mark the development branches as synchronized; any remaining integration must stay explicit in ROADMAP.
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

## Retired workflow

Only `narrated-tutorial-v1` is offered for production. Historical completed promo videos remain read-only, including records and input packages; the retained promo components are preview dependencies only. Never start production or packaging for a retired workflow.
