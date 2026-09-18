import {
  ADAPTER_REQUIRED_STAGES,
  GATE_STAGES,
  STAGE_DEFINITIONS,
  STAGES,
} from "../stages.mjs";

export const NARRATED_TUTORIAL_WORKFLOW = Object.freeze({
  id: "narrated-tutorial-v1",
  version: 2,
  label: "带口播教程视频",
  description: "现有带口播教程视频的标准生产 Workflow。",
  pathNamespace: null,
  pathMode: "legacy-flat",
  timelineMode: "narrated-manifest",
  audioMode: "tts",
  renderRuntime: "remotion",
  stages: STAGES,
  stageDefinitions: STAGE_DEFINITIONS,
  gateStages: Object.freeze([...GATE_STAGES]),
  adapterStages: Object.freeze([...ADAPTER_REQUIRED_STAGES]),
  delivery: Object.freeze({
    manifestStage: "subtitle-timeline",
    requiredStaticFiles: Object.freeze([
      "generated/audio-manifest.json",
      "generated/subtitle-manifest.json",
      "generated/timeline-manifest.json",
    ]),
    requireNarratedManifests: true,
    packageMode: "isolated-render-input",
  }),
});

