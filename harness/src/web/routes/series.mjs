const seriesPattern = /^\/api\/series(?:\/([a-z0-9]+(?:-[a-z0-9]+)*)(?:\/cover)?)?$/;

import { getSeries, listSeries, saveSeries, saveSeriesCover } from "../../series-assets.mjs";
import { applySeriesStyle, reopenGate3ForSeriesCover } from "../../storage.mjs";
import { readBody, readJsonBody, sendError, sendJson } from "../http.mjs";
import { MAX_COVER_BYTES } from "../../series-assets.mjs";

export function createSeriesRoutes() {
  return async function handleSeries({ request, response, pathname }) {
    const route = matchSeriesRoute(request.method, pathname);
    if (!route) return false;
    if (!route.id && request.method === "GET") { sendJson(response, 200, { series: listSeries() }); return true; }
    if (!route.id && request.method === "POST") { try { const body = await readJsonBody(request); const previous = getSeries(body.id); const series = saveSeries({ id: body.id, title: body.title, style: body.style, coverDurationFrames: body.coverDurationFrames, videos: body.videos, confirmVideoRemoval: body.confirmVideoRemoval === true }); const updatedProjects = series.videos.filter((slug) => !previous?.videos.includes(slug)).map((slug) => ({ slug, ...applySeriesStyle(slug, series.style) })).filter((result) => result.changed); sendJson(response, 200, { series, updatedProjects }); } catch (error) { sendError(response, 400, { message: error.message, code: error.code ?? "series-save-failed", issues: error.issues ?? [] }); } return true; }
    if (!route.id) { sendError(response, 405, { message: "Method not allowed", code: "method-not-allowed" }); return true; }
    if (route.cover && request.method === "PUT") { try { const contentType = String(request.headers["content-type"] ?? "").split(";", 1)[0].trim().toLowerCase(); const result = saveSeriesCover(route.id, await readBody(request, MAX_COVER_BYTES), contentType); const reopenedProjects = result.series.videos.filter((slug) => reopenGate3ForSeriesCover(slug)); sendJson(response, 200, { ...result, reopenedProjects }); } catch (error) { sendError(response, 400, { message: error.message, code: error.code ?? "series-cover-save-failed", issues: error.issues ?? [] }); } return true; }
    if (!route.cover && request.method === "GET") { const series = getSeries(route.id); if (!series) sendError(response, 404, { message: "Series not found", code: "series-not-found" }); else sendJson(response, 200, { series }); return true; }
    sendError(response, 405, { message: "Method not allowed", code: "method-not-allowed" }); return true;
  };
}

export function matchSeriesRoute(method, pathname) {
  const match = pathname.match(seriesPattern);
  if (!match) return null;
  return { method, id: match[1] ?? null, cover: pathname.endsWith("/cover") };
}
