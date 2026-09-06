export function parseRoute(hash = "") {
  const normalized = hash.replace(/^#/, "");
  const legacy = normalized.match(/^project=(.+)$/);
  if (legacy) return { name: "project", slug: decodeURIComponent(legacy[1]) };
  const project = normalized.match(/^\/projects\/([^/]+)$/);
  if (project) return { name: "project", slug: decodeURIComponent(project[1]) };
  if (normalized === "/batches") return { name: "batches", slug: null };
  if (normalized === "/series") return { name: "series", slug: null };
  if (normalized === "/remote-jobs") return { name: "remote-jobs", slug: null };
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
        : `#/${nextRoute.name === "projects" ? "projects" : nextRoute.name}`;
      if (windowObject) windowObject.location.hash = nextHash.slice(1);
      else {
        route = parseRoute(nextHash);
        for (const listener of listeners) listener(route);
      }
      return nextRoute;
    },
  };
}
