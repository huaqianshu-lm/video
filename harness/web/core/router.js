export function parseRoute(hash = "") {
  const normalized = hash.replace(/^#/, "");
  const legacy = normalized.match(/^project=(.+)$/);
  if (legacy) return { name: "project", slug: decodeURIComponent(legacy[1]) };
  const project = normalized.match(/^\/projects\/([^/]+)$/);
  if (project) return { name: "project", slug: decodeURIComponent(project[1]) };
  return { name: "projects", slug: null };
}

export function createRouter({ windowObject = globalThis.window } = {}) {
  let route = parseRoute(windowObject?.location?.hash ?? "");
  const listeners = new Set();

  const notify = () => {
    route = parseRoute(windowObject?.location?.hash ?? "");
    for (const listener of listeners) listener(route);
  };

  return {
    current: () => route,
    start() {
      windowObject?.addEventListener("hashchange", notify);
      notify();
      return () => windowObject?.removeEventListener("hashchange", notify);
    },
    subscribe(listener) {
      listeners.add(listener);
      return () => listeners.delete(listener);
    },
    navigate(nextRoute) {
      const nextHash = nextRoute.name === "project"
        ? `#/projects/${encodeURIComponent(nextRoute.slug)}`
        : "#/projects";
      if (windowObject) windowObject.location.hash = nextHash.slice(1);
      else route = nextRoute;
      return nextRoute;
    },
  };
}
