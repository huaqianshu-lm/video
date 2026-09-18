import { workflowStageDefinitions } from "./workflows/registry.mjs";

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
      definition.artifacts.map((template) => ({
        path: template.replaceAll("{slug}", slug),
        status: "unverified",
      })),
    ]),
  );
}
