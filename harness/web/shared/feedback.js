export function formatError(error) {
  const issues = Array.isArray(error?.issues) && error.issues.length > 0 ? `：${error.issues.join("；")}` : "";
  return `${error?.message ?? String(error)}${issues}`;
}

export function setFeedback(element, message, kind = "info") {
  if (!element) return;
  element.textContent = message;
  element.dataset.kind = kind;
}
