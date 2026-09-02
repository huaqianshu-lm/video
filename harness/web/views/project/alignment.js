export function alignmentViewModel(alignment) {
  return {
    available: Boolean(alignment),
    scenes: alignment?.scenes ?? [],
    issues: alignment?.issues ?? [],
  };
}
