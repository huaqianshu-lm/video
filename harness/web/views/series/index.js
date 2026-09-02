export function seriesViewModel(series) {
  return {
    ...series,
    videoCount: series?.videos?.length ?? 0,
  };
}
