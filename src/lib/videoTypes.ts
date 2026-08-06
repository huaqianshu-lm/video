export type VideoFormat = 'vertical' | 'horizontal';

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
  caption: string[];
  showCaption?: boolean;
  visualRevealSeconds?: number[];
};

export type VisualTone = 'muted' | 'accent' | 'success' | 'warning';

export type VisualBeat = {
  title: string;
  label?: string;
  description?: string;
  items?: string[];
  tone?: VisualTone;
};

export type WorkspaceDemo = {
  files: string[];
  codeLines: string[];
  actions: VisualBeat[];
};

export type OpeningSceneConfig = BaseSceneConfig & {
  type: 'opening';
  subtitle: string;
  cards: string[];
  highlight: string;
  cardDetails?: VisualBeat[];
};

export type ConceptSceneConfig = BaseSceneConfig & {
  type: 'concept';
  keyPoints: string[];
  workspaceDemo?: WorkspaceDemo;
};

export type ComparisonColumn = {
  title: string;
  items: string[];
  visualSteps?: VisualBeat[];
};

type TwoColumnComparisonSceneConfig = BaseSceneConfig & {
  type: 'comparison';
  left: ComparisonColumn;
  right: ComparisonColumn;
  highlight: 'left' | 'right';
  columns?: never;
  highlightIndex?: never;
};

type MultiColumnComparisonSceneConfig = BaseSceneConfig & {
  type: 'comparison';
  columns: ComparisonColumn[];
  highlightIndex?: number;
  left?: never;
  right?: never;
  highlight?: never;
};

export type ComparisonSceneConfig = TwoColumnComparisonSceneConfig | MultiColumnComparisonSceneConfig;

export type StepListSceneConfig = BaseSceneConfig & {
  type: 'step-list';
  steps: string[];
  stepVisuals?: VisualBeat[];
};

export type TerminalSceneConfig = BaseSceneConfig & {
  type: 'terminal';
  command: string;
  output: string[];
  reviewFlow?: VisualBeat[];
};

export type SummarySceneConfig = BaseSceneConfig & {
  type: 'summary';
  summary: string;
  bullets: string[];
  highlight: string;
  roleCards?: VisualBeat[];
};

export type SceneConfig =
  | OpeningSceneConfig
  | ConceptSceneConfig
  | ComparisonSceneConfig
  | StepListSceneConfig
  | TerminalSceneConfig
  | SummarySceneConfig;

export type AudioTrackConfig = {
  id?: string;
  src: string;
  startSeconds?: number;
  durationSeconds: number;
};

export type SubtitleCue = {
  startSeconds: number;
  endSeconds: number;
  text: string;
};

export type VideoConfig = {
  slug: string;
  title: string;
  format: VideoFormat;
  width: number;
  height: number;
  fps: number;
  audioTracks?: AudioTrackConfig[];
  subtitleCues?: SubtitleCue[];
  scenes: SceneConfig[];
};
