---
name: visual-prototype-remotion
description: Design or implement the reusable Visual Prototype and Remotion side of a video, including Timeline alignment, visual events, and Gate 3 review.
---

# Visual Prototype and Remotion

Use this skill when working on a Visual Prototype, Remotion composition, Scene implementation, visual timing, `remotion-alignment.json`, or Gate 3.

## Prototype baseline

- Start from `templates/video-production/visual-prototype.html` and read `templates/video-production/visual-prototype-baseline.md` before changing the skeleton.
- Keep `.shell`, `.toolbar`, `.stage`, `.scene`, `.caption`, `.controls`, `.progress`, and `.meta` in the fixed order and roles.
- Use a single visible title block per Scene, containing an eyebrow and a main title, anchored in the common upper-left position.
- Keep the 16:9 stage, preview-only controls, subtitle area, and progress metadata separate from the final Composition output.
- Do not add Scene-specific CSS that moves, centers, duplicates, or resizes the title block.

## Remotion sequence

1. Wait for the confirmed Gate 2 Visual Script and Visual Prototype baseline.
2. Read the validated Audio, Subtitle, and Timeline Manifest before deciding Scene duration or visual event timing.
3. Implement reusable components first and keep video-specific content in the local video configuration.
4. Produce a fresh `remotion-alignment.json` mapping every Scene, visual event, screen text item, implementation file, Audio Segment, Subtitle Cue, and Timeline interval.
5. Compare the rendered preview against the frozen prototype and alignment file at Gate 3.

## Invariants

- Use `src/lib/timing.ts` for narrated timing; do not duplicate timing logic inside a video directory.
- Missing Scene, Segment, or Cue mappings block Remotion completion.
- Prototype changes invalidate the old Remotion alignment result.
- Gate 3 rejection must lead to a new task package and new Remotion output, not a recheck of unchanged output.
- Remove preview navigation, debug labels, helper text, and unrelated text before Smoke Render and final delivery.

## References

- Read `docs/VIDEO-PRODUCTION-RULES.md` for prototype, animation, component, and quality rules.
- Read `docs/VIDEO-PROJECT-WORKFLOW.md` for the handoff from production documents to Remotion.
- Read `docs/END-TO-END-VIDEO-PRODUCTION-PLAN.md` for timing and remote-render handoffs.
