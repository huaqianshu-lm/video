---
name: visual-prototype-remotion
description: Design or implement the reusable Visual Prototype and Remotion side of a video, including Timeline alignment, visual events, and Gate 3 review.
---

# Visual Prototype and Remotion

Use this skill when working on a Visual Prototype, Remotion composition, Scene implementation, visual timing, `remotion-alignment.json`, or Gate 3.

## Prototype baseline

- Start from `templates/video-production/visual-prototype.html` and read `templates/video-production/visual-prototype-baseline.md` before changing the skeleton.
- Keep `.shell`, `.toolbar`, `.stage`, `.scene`, `.caption`, `.controls`, `.progress`, and `.meta` in the fixed order and roles.
- Use short source-supported context text without a Scene number at the upper left. Let the visual subject carry the Scene; do not place a large recurring main title there.
- Keep the 16:9 stage, preview-only controls, subtitle area, and progress metadata separate from the final Composition output.
- Keep this text quiet and consistent. Place any necessary content heading next to the object or evidence it explains, and follow the Workflow-specific anti-PPT rules in `docs/VIDEO-PRODUCTION-RULES.md`.
- Preview the key before → action → after events and the handoff between Scenes at normal speed. A static layout or a sequence of entrance animations does not demonstrate the Visual Script's change of state.

## Gate 2 visual convergence

- Before requesting Gate 2, inspect actual prototype or preview frames against the Visual Script and the visual convergence checklist in `docs/VIDEO-PRODUCTION-RULES.md`.
- Save the result as `visual-self-review.json`; Gate 2 automation must reject missing, stale, incomplete, or failed review records before exposing the project as ready for human approval. This is a machine precondition, not automatic Gate 2 approval.
- A passing structural validator is not visual evidence. If the sequence still reads as repeated title／card pages, return to Visual Script and invalidate downstream work instead of proceeding to Remotion.
- Preserve intentional reading holds. Judge whether each motion explains an action, relationship, or change; do not add idle movement to satisfy a freeze threshold.
- Keep the tutorial shell; tutorials may retain explanatory UI or diagrams when they clearly support the narration.

## Remotion sequence

For Agent series covers, read `docs/AGENT-SERIES-COVER.md`. The generated single-video and Studio catalog entries own the frozen cover and shift the whole content together; do not add another cover, shift subtitles separately, or change the body-relative Timeline. At Gate 3 inspect the generated entry including its cover.

1. Wait for the confirmed Gate 2 Visual Script and Visual Prototype baseline.
2. Read the validated timing contract before deciding Scene duration or visual event timing：`narrated-tutorial-v1` 使用 Audio／Subtitle／Timeline Manifest，不得为缺失的 narrated 产物生成占位文件。
3. Implement reusable components first and keep video-specific content in the local video configuration.
4. Produce a fresh `remotion-alignment.json`：narrated 视频还要映射 Audio Segment 和 Subtitle Cue。
5. Compare the rendered preview against the frozen prototype and alignment file at Gate 3.

## Invariants

- Use `src/lib/timing.ts` for narrated timing; do not duplicate narrated timing logic inside a video directory.
- Apply section 9.1 of `docs/VIDEO-PRODUCTION-RULES.md` for motion semantics and prioritize the applicable components in `src/components/SemanticMotion.tsx`; validate the visible change, not just the component call.
- Apply section 9.1's three code-execution and path-expression rules before selecting path components; review the meaning of path geometry as well as text avoidance during Prototype and Remotion playback.
- Apply sections 8.4／8.5 for title entry／handoff／exit, shared world coordinates, persistent subjects and camera continuity; avoid resetting these at Scene boundaries.
- Apply sections 9.3～9.5 for official animation selection, frame-driven React implementations, action chains and review coverage. Check actual dependencies and API compatibility before choosing spring／paths／transitions; account for transition overlap in the validated Workflow timing, and distinguish proposed capabilities from implemented ones.
- Apply section 9.2 for element visibility lifetimes in the tutorial workflow; inspect before entry, after exit, seeking and Scene boundaries, including underlying paths, arrows, labels and effects.
- Apply section 10.3 of `docs/VIDEO-PRODUCTION-RULES.md` at Gate 2 and again at Gate 3 with actual Remotion timing; inspect complete actions and intermediate text states, record evidence, and resolve unreadable overlap before requesting approval or rendering.
- Missing narrated Scene／Segment／Cue mappings, block Remotion completion。
- Prototype changes invalidate the old Remotion alignment result.
- Gate 3 rejection must lead to a new task package and new Remotion output, not a recheck of unchanged output.
- Remove preview navigation, debug labels, helper text, and unrelated text before Smoke Render and final delivery.

## References

- Read `docs/VIDEO-PRODUCTION-RULES.md` for prototype, animation, component, and quality rules.
- Read `docs/MOTION-COMPONENTS.md` when implementing path motion, spring assembly, shape／state changes, focus, camera continuity or official transitions; use the public APIs and their frame／visibility contracts.
- Read `docs/VIDEO-PROJECT-WORKFLOW.md` for the handoff from production documents to Remotion.
- Read `docs/END-TO-END-VIDEO-PRODUCTION-PLAN.md` for timing and remote-render handoffs.

## Lightweight dynamic prototype

Follow the lightweight prototype contract in `docs/VIDEO-PRODUCTION-RULES.md`: estimated playback, stable semantic event IDs, no downstream TTS dependency. Preserve layout, state changes and handoffs in Remotion; bind actual timing after Gate 2. The prototype task may write `visual-self-review.json` and review evidence, but must never claim visual checks passed without actual viewing.
