export const COVER_WIDTH = 1920;
export const COVER_HEIGHT = 1080;
export const MAX_COVER_ASPECT_ERROR = 0.01;

export function coverCropFor(width, height) {
  if (!Number.isFinite(width) || !Number.isFinite(height) || width <= 0 || height <= 0) {
    throw new Error("无法读取图片尺寸");
  }

  const targetAspect = COVER_WIDTH / COVER_HEIGHT;
  const sourceAspect = width / height;
  const aspectError = Math.abs(sourceAspect - targetAspect) / targetAspect;
  if (aspectError > MAX_COVER_ASPECT_ERROR) {
    throw new Error(`图片比例偏离 16:9 超过 1%，当前为 ${width}×${height}`);
  }

  if (sourceAspect > targetAspect) {
    const cropWidth = height * targetAspect;
    return { x: (width - cropWidth) / 2, y: 0, width: cropWidth, height };
  }

  const cropHeight = width / targetAspect;
  return { x: 0, y: (height - cropHeight) / 2, width, height: cropHeight };
}
