export const MAX_COVER_BYTES = 10 * 1024 * 1024;
const allowedImageTypes = new Map([["image/jpeg", "jpg"], ["image/png", "png"], ["image/webp", "webp"]]);
function pngDimensions(buffer) {
  const signature = Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]);
  if (buffer.length < 24 || !buffer.subarray(0, 8).equals(signature)) return null;
  return { width: buffer.readUInt32BE(16), height: buffer.readUInt32BE(20) };
}
function jpegDimensions(buffer) {
  if (buffer.length < 4 || buffer[0] !== 0xff || buffer[1] !== 0xd8) return null;
  let offset = 2;
  while (offset + 9 < buffer.length) {
    if (buffer[offset] !== 0xff) {
      offset += 1;
      continue;
    }
    const marker = buffer[offset + 1];
    if ([0xc0, 0xc1, 0xc2, 0xc3, 0xc5, 0xc6, 0xc7, 0xc9, 0xca, 0xcb, 0xcd, 0xce, 0xcf].includes(marker)) {
      return { height: buffer.readUInt16BE(offset + 5), width: buffer.readUInt16BE(offset + 7) };
    }
    if (marker === 0xd8 || marker === 0xd9) {
      offset += 2;
      continue;
    }
    const length = buffer.readUInt16BE(offset + 2);
    if (length < 2) return null;
    offset += 2 + length;
  }
  return null;
}

function webpDimensions(buffer) {
  if (buffer.length < 30 || buffer.toString("ascii", 0, 4) !== "RIFF" || buffer.toString("ascii", 8, 12) !== "WEBP") return null;
  const chunk = buffer.toString("ascii", 12, 16);
  if (chunk === "VP8X") {
    return {
      width: 1 + buffer.readUIntLE(24, 3),
      height: 1 + buffer.readUIntLE(27, 3),
    };
  }
  if (chunk === "VP8L" && buffer[20] === 0x2f) {
    return {
      width: 1 + buffer[21] + ((buffer[22] & 0x3f) << 8),
      height: 1 + (buffer[22] >> 6) + (buffer[23] << 2) + ((buffer[24] & 0x0f) << 10),
    };
  }
  const signatureOffset = buffer.indexOf(Buffer.from([0x9d, 0x01, 0x2a]), 20);
  if (chunk === "VP8 " && signatureOffset >= 0 && signatureOffset + 7 <= buffer.length) {
    return {
      width: buffer.readUInt16LE(signatureOffset + 3) & 0x3fff,
      height: buffer.readUInt16LE(signatureOffset + 5) & 0x3fff,
    };
  }
  return null;
}

function imageDimensions(buffer, contentType) {
  if (contentType === "image/png") return pngDimensions(buffer);
  if (contentType === "image/jpeg") return jpegDimensions(buffer);
  if (contentType === "image/webp") return webpDimensions(buffer);
  return null;
}

export function validateCover(buffer, contentType) {
  const extension = allowedImageTypes.get(contentType);
  if (!extension) throw new Error("Cover must be a PNG, JPEG, or WebP image");
  if (!Buffer.isBuffer(buffer) || buffer.length === 0) throw new Error("Cover image is empty");
  if (buffer.length > MAX_COVER_BYTES) throw new Error("Cover image exceeds the 10 MB limit");
  const dimensions = imageDimensions(buffer, contentType);
  if (!dimensions || dimensions.width <= 0 || dimensions.height <= 0) {
    throw new Error("Cover image data is invalid");
  }
  if (dimensions.width * 9 !== dimensions.height * 16) {
    throw new Error(`Cover image must be 16:9; received ${dimensions.width}x${dimensions.height}`);
  }
  return { ...dimensions, extension };
}
