---
name: video-production
description: Create or revise reusable narrated or visual video production materials, including the seven-layer documents, scene planning, visual prototype, and human review gates.
---

# Video production

Use this skill when the task creates or revises a video's Source, Content Analysis, Video Narrative, Scene Script, Narration Script, Visual Script, or Visual Prototype.

## Before working

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
- Keep the fixed 16:9 prototype skeleton, one left-top title block per Scene, preview subtitle area, navigation, and progress area.
- The final Scene in a series must include a source-supported next-episode teaser as a visual event.
- Preserve human Gate decisions. Do not mark a gate passed because files merely exist or because structural checks passed.
- Before Gate 2, perform the visual convergence check defined in `docs/VIDEO-PRODUCTION-RULES.md` using actual prototype or preview evidence. Treat structural, type, and file validation as supporting checks only; if the visual check fails, return to Visual Script and do not continue to Remotion.
- Save that review as the current video's `visual-self-review.json`; Gate 2 automation must verify its schema, workflow, current Visual Script／Prototype fingerprints, evidence files, and all required checks before the project is ready for human approval. This record never replaces the human Gate 2 decision.
- Apply the shared anti-PPT baseline to both Workflow Profiles, with the profile-specific allowance: product promos are action-first and evidence-led; narrated tutorials may use explanatory UI, code, diagrams, or cards only when they advance the narrated reasoning and are not repeated title-card pages.

## Output and review

- Record the current stage and next action in `ROADMAP.md` after meaningful work.
- Before moving to the next stage, check structure against the generic templates and verify that all visible text belongs to the current video's production materials.
- Record the visual evidence and any failed visual-convergence item before requesting Gate 2; do not describe a visual change as complete from code or Harness output alone.
- Keep all concrete video materials under local ignored directories; extract only reusable patterns into tracked templates or Skill references.
