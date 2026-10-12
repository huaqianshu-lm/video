import { workflowStageDefinitions } from "./workflows/registry.mjs";
import { usesStoryboardProduction } from "./production-contract.mjs";
import { storyboardSchemaVersion } from "./storyboard-design.mjs";

function projectSlug(projectOrSlug) {
  return typeof projectOrSlug === "string"
    ? projectOrSlug
    : projectOrSlug?.config?.slug ?? projectOrSlug?.state?.slug;
}

export function artifactManifestFor(projectOrSlug) {
  const slug = projectSlug(projectOrSlug);
  const definitions = typeof projectOrSlug === "string"
    ? workflowStageDefinitions({ config: { workflow: "default", workflowVersion: 2 } })
    : workflowStageDefinitions(projectOrSlug);
  return Object.fromEntries(
    Object.entries(definitions).map(([stage, definition]) => [
      stage,
      [...definition.artifacts, ...(stage === "storyboard" && typeof projectOrSlug !== "string" && usesStoryboardProduction(projectOrSlug) && storyboardSchemaVersion(projectOrSlug) >= 2 ? ["videos/{slug}/storyboard-design-audit.json"] : [])].map((template) => ({
        path: template.replaceAll("{slug}", slug),
        status: "unverified",
      })),
    ]),
  );
}
