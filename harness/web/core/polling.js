export function createPollingRegistry({ setIntervalImpl = globalThis.setInterval, clearIntervalImpl = globalThis.clearInterval } = {}) {
  const timers = new Map();

  function stop(key) {
    const timer = timers.get(key);
    if (!timer) return;
    clearIntervalImpl(timer);
    timers.delete(key);
  }

  return {
    start(key, callback, interval = 1500) {
      stop(key);
      const timer = setIntervalImpl(() => void callback(), interval);
      timers.set(key, timer);
      return () => stop(key);
    },
    stop,
    stopAll() {
      for (const key of timers.keys()) stop(key);
    },
    has(key) {
      return timers.has(key);
    },
  };
}

export const polling = createPollingRegistry();
