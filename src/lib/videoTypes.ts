export type VideoFormat = 'vertical';

export type SceneType =
  | 'opening'
  | 'concept'
  | 'comparison'
  | 'step-list'
  | 'terminal'
  | 'summary';

export type BaseSceneConfig = {
  id: string;
  type: SceneType;
  durationSeconds: number;
  headline: string;
  caption: string;
};

export type OpeningSceneConfig = BaseSceneConfig & {
  type: 'opening';
  subtitle: string;
  cards: string[];
  highlight: string;
};

export type ConceptSceneConfig = BaseSceneConfig & {
  type: 'concept';
  keyPoints: string[];
};

export type ComparisonColumn = {
  title: string;
  items: string[];
};

export type ComparisonSceneConfig = BaseSceneConfig & {
  type: 'comparison';
  left: ComparisonColumn;
  right: ComparisonColumn;
  highlight: 'left' | 'right';
};

export type StepListSceneConfig = BaseSceneConfig & {
  type: 'step-list';
  steps: string[];
};

export type TerminalSceneConfig = BaseSceneConfig & {
  type: 'terminal';
  command: string;
  output: string[];
};

export type SummarySceneConfig = BaseSceneConfig & {
  type: 'summary';
  summary: string;
  bullets: string[];
  highlight: string;
};

export type SceneConfig =
  | OpeningSceneConfig
  | ConceptSceneConfig
  | ComparisonSceneConfig
  | StepListSceneConfig
  | TerminalSceneConfig
  | SummarySceneConfig;

export type VideoConfig = {
  slug: string;
  title: string;
  format: VideoFormat;
  width: number;
  height: number;
  fps: number;
  scenes: SceneConfig[];
};
