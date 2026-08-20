const artifactTemplates = Object.freeze({
  source: ["videos/{slug}/source.md"],
  "content-analysis": ["videos/{slug}/content-analysis.md"],
  "video-narrative": ["videos/{slug}/video-narrative.md"],
  "scene-script": ["videos/{slug}/scene-script.md"],
  "narration-script": ["videos/{slug}/narration-script.md"],
  "visual-script": ["videos/{slug}/visual-script.md"],
  "visual-prototype": ["videos/{slug}/visual-prototype.html"],
  "gate-2": [],
  tts: ["videos/{slug}/tts-script.json"],
  "subtitle-timeline": [
    "src/videos/{slug}/generated/audio-manifest.json",
    "src/videos/{slug}/generated/subtitle-manifest.json",
    "src/videos/{slug}/generated/timeline-manifest.json",
  ],
  remotion: [
    "src/videos/{slug}/video.config.ts",
    "src/videos/{slug}/*Video.tsx",
  ],
  "gate-3": [],
  "smoke-render": [],
  render: ["out/{slug}.mp4"],
  "gate-4": [],
});

export function artifactManifestFor(slug) {
  return Object.fromEntries(
    Object.entries(artifactTemplates).map(([stage, paths]) => [
      stage,
      paths.map((template) => ({
        path: template.replaceAll("{slug}", slug),
        status: "unverified",
      })),
    ]),
  );
}
