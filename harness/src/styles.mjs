import fs from "node:fs";
import path from "node:path";

const repositoryRoot = path.resolve(new URL("../..", import.meta.url).pathname);

export const DEFAULT_STYLE_ID = "current";

export const STYLE_DEFINITIONS = Object.freeze({
  [DEFAULT_STYLE_ID]: Object.freeze({
    id: DEFAULT_STYLE_ID,
    version: 1,
    path: "styles/current/STYLE.md",
    description: "深色、克制、教程型的 16:9 横屏视频视觉基线。",
  }),
  "claude-code": Object.freeze({
    id: "claude-code",
    version: 1,
    path: "styles/current/STYLE.md",
    description: "蓝紫深色、克制、教程型的 Claude Code 系列视觉基线。",
  }),
  codex: Object.freeze({
    id: "codex",
    version: 1,
    path: "styles/codex/STYLE.md",
    description: "近黑网格、青绿主色与多入口状态卡片的 Codex 系列视觉基线。",
  }),
});

export function getSeriesDefinitionForSlug(slug) {
  const seriesRoot = path.join(repositoryRoot, "series");
  if (!fs.existsSync(seriesRoot)) return null;
  for (const entry of fs.readdirSync(seriesRoot, { withFileTypes: true })) {
    if (!entry.isDirectory()) continue;
    const filePath = path.join(seriesRoot, entry.name, "series.json");
    if (!fs.existsSync(filePath)) continue;
    try {
      const definition = JSON.parse(fs.readFileSync(filePath, "utf8"));
      if (definition.videos?.includes(slug)) return definition;
    } catch {
      // Invalid series metadata is reported by its own validation path.
    }
  }
  return null;
}

export function resolveStyleId(config = {}, slug = null) {
  if (config.style && config.style !== DEFAULT_STYLE_ID) return config.style;
  return getSeriesDefinitionForSlug(slug)?.style ?? config.style ?? DEFAULT_STYLE_ID;
}

export function getStyleDefinition(style = DEFAULT_STYLE_ID) {
  return STYLE_DEFINITIONS[style] ?? null;
}
