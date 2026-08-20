import { STAGE_DEFINITIONS } from "./stages.mjs";

export function artifactManifestFor(slug) {
  return Object.fromEntries(
    Object.entries(STAGE_DEFINITIONS).map(([stage, definition]) => [
      stage,
      definition.artifacts.map((template) => ({
        path: template.replaceAll("{slug}", slug),
        status: "unverified",
      })),
    ]),
  );
}
