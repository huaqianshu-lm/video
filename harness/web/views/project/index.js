export function createProjectView({ mount, unmount, refresh } = {}) {
  let mounted = false;
  return {
    mount(slug) {
      mounted = true;
      mount?.(slug);
    },
    unmount() {
      if (!mounted) return;
      mounted = false;
      unmount?.();
    },
    refresh,
  };
}
