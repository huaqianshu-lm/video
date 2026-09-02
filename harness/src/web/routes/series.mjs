const seriesPattern = /^\/api\/series(?:\/([a-z0-9]+(?:-[a-z0-9]+)*)(?:\/cover)?)?$/;

export function matchSeriesRoute(method, pathname) {
  const match = pathname.match(seriesPattern);
  if (!match) return null;
  return { method, id: match[1] ?? null, cover: pathname.endsWith("/cover") };
}
