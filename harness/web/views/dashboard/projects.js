export function selectableProjects(projects = []) {
  return projects.filter((project) => project.currentStage !== "completed");
}

export function toggleProjectSelection(selectedSlugs, slug, selected) {
  const next = new Set(selectedSlugs);
  if (selected) next.add(slug);
  else next.delete(slug);
  return [...next];
}

export function projectSelectionSummary(selectedSlugs = [], total = 0) {
  return `${selectedSlugs.length}/${total} 个视频已选择`;
}
