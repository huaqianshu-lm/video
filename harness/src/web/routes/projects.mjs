const projectPattern = /^\/api\/projects\/([a-z0-9]+(?:-[a-z0-9]+)*)(?:\/(workspace|files|file|jobs|agent-jobs|alignment|action))?$/;

export function matchProjectRoute(method, pathname) {
  const match = pathname.match(projectPattern);
  if (!match || match[1] === "import") return null;
  return { method, slug: match[1], resource: match[2] ?? "detail" };
}

export function isProjectRoute(method, pathname, resource) {
  const route = matchProjectRoute(method, pathname);
  return route?.resource === resource;
}
