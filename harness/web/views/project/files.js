export function fileViewModel(file) {
  return {
    path: file?.path ?? "",
    label: file?.label ?? file?.path ?? "",
    present: file?.present === true,
  };
}
