import { createWebServer as createLegacyWebServer } from "./legacy-server.mjs";
import { matchProjectRoute } from "./routes/projects.mjs";
import { matchBatchRoute } from "./routes/batches.mjs";
import { matchTaskRoute } from "./routes/tasks.mjs";
import { matchSeriesRoute } from "./routes/series.mjs";
import { matchDiagnosticsRoute } from "./routes/diagnostics.mjs";

export const webRouteGroups = Object.freeze({
  projects: matchProjectRoute,
  batches: matchBatchRoute,
  tasks: matchTaskRoute,
  series: matchSeriesRoute,
  diagnostics: matchDiagnosticsRoute,
});

export function createWebServer(options = {}) {
  return createLegacyWebServer(options);
}

export { createLegacyWebServer };
