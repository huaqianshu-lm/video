---
name: narrated-video-tts
description: Prepare and validate narration, TTS, audio, subtitles, and Timeline Manifest for a narrated video after its visual and narration gate.
---

# Narrated video and TTS

Use this skill when a video has spoken narration or when working on TTS, audio, subtitles, timing, or Timeline Manifest files.


`storyboard-v1` 先读取 `docs/STORYBOARD-PRODUCTION-CONTRACT.md`，以其阶段、任务和审核边界覆盖本文的旧原型要求；旧契约继续遵守本文。新契约保留纯口播、真实 Timeline、人工 Gate 和共享交付约束。

## Required sequence

1. Confirm Gate 2 has passed and the narration baseline is frozen.
2. Derive `tts-script.json` from pure `narration-script.md` with `scripts/build_tts_script.py`.
3. Validate Scene and Segment IDs, text coverage, empty text, and absence of production instructions.
4. Generate audio, subtitles, and Timeline from that validated TTS Script and the actual generated audio.
5. Read `docs/HARNESS-PRODUCTION-CONTRACT.md` and the project's persisted productionContract. For unified-v1, finish automatic checks before Remotion and combine human listening with Gate 3 preview review; Harness binds approval to current audio/Timeline fingerprints. For legacy-v1 or a missing field, retain the standalone human TTS quality review before Remotion. Never infer migration from the entrypoint.

## Invariants

- Never send the entire production Markdown to TTS.
- Narrated videos default to an explicitly passed `--rate +25%`, unless the user specifies another rate.
- Subtitles may remove sentence-final punctuation for display, but must not modify the spoken TTS text, audio, or timing source.
- Scene, Segment, Cue, audio, subtitle, and Timeline mappings must remain consistent.
- Derive durations from the actual audio and validated timing data; do not retime a video from an estimate after audio generation.
- Keep the established Edge TTS authorization limited to this project, frozen narration text, and the established service. Ask again if the project, input scope, destination, or service changes.

## References

- Read `docs/END-TO-END-VIDEO-PRODUCTION-PLAN.md` for the cross-project contract and handoff files.
- Read the TTS sections of `docs/VIDEO-PRODUCTION-RULES.md` when making production-rule decisions.
- Read `docs/TTS-SETUP.md` only for local environment setup and troubleshooting.
