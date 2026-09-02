const taskPattern = /^\/api\/(agent-jobs|remotion-tasks)(?:\/([a-f0-9-]+)(?:\/action)?)?$/;

export function matchTaskRoute(method, pathname) {
  const match = pathname.match(taskPattern);
  if (!match) return null;
  return { method, kind: match[1], id: match[2] ?? null, action: pathname.endsWith("/action") };
}
