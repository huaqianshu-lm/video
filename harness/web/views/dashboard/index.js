export function createDashboardView({ mount, unmount, refresh } = {}) {
  let mounted = false;
  return {
    mount() {
      if (mounted) return;
      mounted = true;
      mount?.();
    },
    unmount() {
      if (!mounted) return;
      mounted = false;
      unmount?.();
    },
    refresh,
  };
}
