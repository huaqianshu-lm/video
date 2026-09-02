const batchPattern = /^\/api\/batches(?:\/([a-f0-9-]+)(?:\/action)?)?$/;

export function matchBatchRoute(method, pathname) {
  const match = pathname.match(batchPattern);
  if (!match) return null;
  return { method, id: match[1] ?? null, action: pathname.endsWith("/action") };
}
