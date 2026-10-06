---
name: video-production
description: Create or revise reusable narrated or visual video production materials, including the seven-layer documents, scene planning, visual prototype, and human review gates.
---

# Video production

Use this skill when the task creates or revises a video's Source, Content Analysis, Video Narrative, Scene Script, Narration Script, Visual Script, or Visual Prototype.

## Before working

- For new Agent videos, follow `docs/AGENT-SERIES-COVER.md`: list actual series names, IDs and cover availability for the user to choose; include new-series and no-series options. Never infer the choice from a filename. After confirmation, freeze it with `series select`; show the cover and handoff in the prototype. Do not alter completed members.
- Read only the relevant sections of `docs/VIDEO-PRODUCTION-RULES.md` and `docs/VIDEO-PROJECT-WORKFLOW.md`.
- For full background or historical rationale, read `docs/article-to-video-complete-workflow-summary.md` only when needed.
- Use the generic structures in `templates/video-production/`; do not use a local video's private files as the only baseline.

## Required boundaries

- Keep the seven production layers separate and preserve their upstream/downstream responsibilities.
- Complete Content Analysis, Video Narrative, and Scene Script together before the Gate 1 internal review.
- Complete Narration Script, Visual Script, and Visual Prototype together before Gate 2.
- A Scene in `narration-script.md` contains spoken text only. Do not put visual instructions, production notes, gate checklists, or source-document references in the spoken body.
- Write narration as a self-contained video for viewers who have not seen the source material.
- Visual Script and Visual Prototype must add visual information, process, state, or relationship; they must not merely repeat narration as slides.
- For each new Scene, identify the visual focus, before state, semantic trigger, visible after state, intentional hold, and handoff to the next focus. Apply the Workflow-specific timing source from `docs/VIDEO-PRODUCTION-RULES.md`; do not demand continuous motion during reading holds.
- Select and describe motion semantics using section 9.1 of `docs/VIDEO-PRODUCTION-RULES.md`; use consistent expressions for the same meaning and do not invent changes to fit an animation component.
- Before choosing paths for code or execution scenes, apply the three code-execution and path-expression rules in section 9.1; record the actual execution changes and the source-supported meaning of any path geometry in Visual Script.
- Apply sections 8.4／8.5 for titles as visual events and persistent subjects in a shared evolving space; record title handoff, world relationships, camera movement and reasons for any viewpoint change.
- Apply sections 9.3～9.5 for animation capability selection, action chains, whole-film rhythm and strategy coverage; record available versus proposed components and bind formal timing to the current Workflow. Use the expanded Visual Script template rather than relying on the local motion sample as the only guide.
- Apply section 9.2 to record each element's entry, visible interval, exit and any reason for retaining it across Scenes; include underlying paths, arrows, labels and effects in actual prototype review.
- Apply section 10.3 of `docs/VIDEO-PRODUCTION-RULES.md` to inspect text throughout each relevant animation; record actual viewing evidence under VC-4／VC-5, including intermediate and overlapping states.
- Keep the fixed 16:9 prototype skeleton, short source-supported context text, preview subtitle area, navigation, and progress area. At the upper left of the video canvas, omit Scene numbers and recurring large titles.
- The final Scene in a series must include a source-supported next-episode teaser as a visual event.
- Preserve human Gate decisions. Do not mark a gate passed because files merely exist or because structural checks passed.
- Before Gate 2, perform the visual convergence check defined in `docs/VIDEO-PRODUCTION-RULES.md` using actual prototype or preview evidence. Treat structural, type, and file validation as supporting checks only; if the visual check fails, return to Visual Script and do not continue to Remotion.
- Save that review as the current video's `visual-self-review.json`; Gate 2 automation must verify its schema, workflow, current Visual Script／Prototype fingerprints, evidence files, and all required checks before the project is ready for human approval. This record never replaces the human Gate 2 decision.
- Apply the tutorial anti-PPT baseline: tutorials may use explanatory UI, code, diagrams, or cards only when they advance the narrated reasoning and are not repeated title-card pages.

## Output and review

- Record the current stage and next action in `ROADMAP.md` after meaningful work.
- Before moving to the next stage, check structure against the generic templates and verify that all visible text belongs to the current video's production materials.
- Record the visual evidence and any failed visual-convergence item before requesting Gate 2; do not describe a visual change as complete from code or Harness output alone.
- Keep all concrete video materials under local ignored directories; extract only reusable patterns into tracked templates or Skill references.

## Lightweight dynamic prototype

Follow the lightweight prototype contract in `docs/VIDEO-PRODUCTION-RULES.md`: estimated playback, stable semantic event IDs, no downstream TTS dependency. Preserve layout, state changes and handoffs in Remotion; bind actual timing after Gate 2. The prototype task may write `visual-self-review.json` and review evidence, but must never claim visual checks passed without actual viewing.
