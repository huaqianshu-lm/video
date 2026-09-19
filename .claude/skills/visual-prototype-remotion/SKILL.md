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
- 两条首期 Workflow 共用这套 Prototype 外壳；`product-promo-v1` 可以把字幕区域作为视觉信息布局区域，但不要求教程式口播字幕，最终 Composition 仍不得包含预览控件、导航、进度或调试文字。

## Remotion sequence

1. Wait for the confirmed Gate 2 Visual Script and Visual Prototype baseline.
2. Read the validated timing contract before deciding Scene duration or visual event timing：`narrated-tutorial-v1` 使用 Audio／Subtitle／Timeline Manifest，`product-promo-v1` 使用 Asset Manifest／`visual-timeline.json`，不得为缺失的 narrated 产物生成占位文件。
3. Implement reusable components first and keep video-specific content in the local video configuration.
4. Produce a fresh `remotion-alignment.json`：narrated 视频还要映射 Audio Segment 和 Subtitle Cue，宣传片至少映射每个 Scene、Beat、Transition、屏幕文字、实现文件和 Visual Timeline 区间。
5. Compare the rendered preview against the frozen prototype and alignment file at Gate 3.

## Invariants

- Use `src/lib/timing.ts` for narrated timing; do not duplicate narrated timing logic inside a video directory. Promo timing must come from the validated Visual Timeline；the config must import the current Timeline by exact relative path and have `TotalDurationFrames` return its `durationInFrames`。
- Missing narrated Scene／Segment／Cue mappings, or missing promo Scene／Beat／Transition／screen-text mappings, block Remotion completion。
- Prototype changes invalidate the old Remotion alignment result.
- Gate 3 rejection must lead to a new task package and new Remotion output, not a recheck of unchanged output.
- Remove preview navigation, debug labels, helper text, and unrelated text before Smoke Render and final delivery.

## References

- Read `docs/VIDEO-PRODUCTION-RULES.md` for prototype, animation, component, and quality rules.
- Read `docs/VIDEO-PROJECT-WORKFLOW.md` for the handoff from production documents to Remotion.
- Read `docs/END-TO-END-VIDEO-PRODUCTION-PLAN.md` for timing and remote-render handoffs.
