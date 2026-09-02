export function send(response, statusCode, body, contentType = "text/plain; charset=utf-8") {
  response.writeHead(statusCode, {
    "Content-Type": contentType,
    "Content-Length": Buffer.byteLength(body),
    "Cache-Control": "no-store",
  });
  response.end(body);
}

export function sendJson(response, statusCode, payload) {
  send(response, statusCode, `${JSON.stringify(payload)}\n`, "application/json; charset=utf-8");
}

export function sendError(response, statusCode, { message, code = "request-failed", issues = [] } = {}) {
  sendJson(response, statusCode, { error: message ?? "Request failed", code, issues });
}

export function readBody(request, maximumBytes) {
  return new Promise((resolve, reject) => {
    const chunks = [];
    let size = 0;
    request.on("data", (chunk) => {
      size += chunk.length;
      if (size > maximumBytes) {
        reject(new Error("Request body is too large"));
        request.destroy();
        return;
      }
      chunks.push(chunk);
    });
    request.on("end", () => resolve(Buffer.concat(chunks)));
    request.on("error", reject);
  });
}

export function readJsonBody(request) {
  return readBody(request, 1_000_000).then((body) => {
    if (body.length === 0) return {};
    try {
      return JSON.parse(body.toString("utf8"));
    } catch {
      const error = new Error("Request body must be valid JSON");
      error.code = "invalid-json";
      throw error;
    }
  });
}
