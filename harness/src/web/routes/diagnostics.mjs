export function matchDiagnosticsRoute(method, pathname) {
  if (pathname === "/api/health") return { method, name: "health" };
  if (pathname === "/api/diagnostics/github") return { method, name: "github" };
  if (pathname === "/api/jobs") return { method, name: "jobs" };
  if (pathname === "/api/agent-jobs") return { method, name: "agent-jobs" };
  return null;
}
