const fetchImpl = globalThis.fetch;
globalThis.fetch = (input, ...args) => {
  const address = typeof input === "string" ? input : input.url ?? String(input);
  const hostname = new URL(address).hostname;
  if (!["127.0.0.1", "localhost", "[::1]"].includes(hostname)) {
    throw Object.assign(new Error(`自动测试禁止真实外网请求：${hostname}`), { code: "test-live-network-blocked" });
  }
  return fetchImpl(input, ...args);
};
