export function stageViewModel(stage) {
  return {
    ...stage,
    artifactCount: stage?.artifacts?.filter((artifact) => artifact.present).length ?? 0,
    artifactTotal: stage?.artifacts?.length ?? 0,
  };
}
