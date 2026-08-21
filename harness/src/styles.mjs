export const DEFAULT_STYLE_ID = "current";

export const STYLE_DEFINITIONS = Object.freeze({
  [DEFAULT_STYLE_ID]: Object.freeze({
    id: DEFAULT_STYLE_ID,
    version: 1,
    path: "styles/current/STYLE.md",
    description: "深色、克制、教程型的 16:9 横屏视频视觉基线。",
  }),
});

export function getStyleDefinition(style = DEFAULT_STYLE_ID) {
  return STYLE_DEFINITIONS[style] ?? null;
}
