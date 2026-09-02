export function escapeHtml(value) {
  return String(value ?? "")
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#039;");
}

export function projectSequence(project) {
  return project.sequence === null || project.sequence === undefined
    ? "—"
    : String(project.sequence).padStart(2, "0");
}
