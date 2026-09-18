export type PromoAssetType =
  | 'logo'
  | 'screenshot'
  | 'screen-recording'
  | 'image'
  | 'font'
  | 'music'
  | 'sfx';

export type PromoAsset = {
  id: string;
  path: string;
  type: PromoAssetType;
  source: string;
  scenes: string[];
};

export type PromoBeat = {
  id: string;
  startFrame: number;
  endFrame: number;
  event: string;
  assetIds?: string[];
  screenTextIds?: string[];
};

export type PromoTransition = {
  id: string;
  atFrame?: number;
  startFrame?: number;
  endFrame?: number;
  type?: string;
};

export type PromoTimelineScene = {
  sceneId: string;
  startFrame: number;
  endFrame: number;
  assetIds?: string[];
  screenTextIds?: string[];
  beats: PromoBeat[];
  transitions?: PromoTransition[];
};

export type PromoTimeline = {
  schemaVersion: number;
  slug: string;
  fps: number;
  width: number;
  height: number;
  durationInFrames: number;
  scenes: PromoTimelineScene[];
  audio?: {
    music?: Array<{assetId: string; startFrame?: number; endFrame?: number}>;
    sfx?: Array<{assetId: string; atFrame?: number}>;
  };
};

export type PromoTone = 'muted' | 'accent' | 'success' | 'warning';

export type PromoBeatContent = {
  label?: string;
  detail?: string;
  tone?: PromoTone;
  kind?: 'hero' | 'product' | 'proof' | 'kinetic' | 'cta';
  assetId?: string;
};

export type PromoSceneContent = {
  sceneId: string;
  eyebrow: string;
  title: string;
  description?: string;
  screenText?: Record<string, string>;
  beats?: Record<string, PromoBeatContent>;
};

export type PromoTheme = {
  brand?: string;
  accent?: string;
  accentStrong?: string;
  background?: string;
  panel?: string;
  text?: string;
  muted?: string;
};
