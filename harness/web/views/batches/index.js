export function batchViewModel(batch) {
  return {
    ...batch,
    itemCount: batch?.items?.length ?? 0,
  };
}
