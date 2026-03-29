import type { FilterType } from "../types/document";

export function applyFilter(
  canvas: HTMLCanvasElement,
  filter: FilterType,
): void {
  const ctx = canvas.getContext("2d");
  if (!ctx) return;

  const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
  const data = imageData.data;

  if (filter === "grayscale") {
    for (let i = 0; i < data.length; i += 4) {
      const avg = 0.299 * data[i] + 0.587 * data[i + 1] + 0.114 * data[i + 2];
      data[i] = avg;
      data[i + 1] = avg;
      data[i + 2] = avg;
    }
  } else if (filter === "bw") {
    for (let i = 0; i < data.length; i += 4) {
      const avg = 0.299 * data[i] + 0.587 * data[i + 1] + 0.114 * data[i + 2];
      const val = avg > 128 ? 255 : 0;
      data[i] = val;
      data[i + 1] = val;
      data[i + 2] = val;
    }
  } else if (filter === "enhance") {
    const contrast = 1.3;
    const brightness = 15;
    for (let i = 0; i < data.length; i += 4) {
      data[i] = Math.min(
        255,
        Math.max(0, (data[i] - 128) * contrast + 128 + brightness),
      );
      data[i + 1] = Math.min(
        255,
        Math.max(0, (data[i + 1] - 128) * contrast + 128 + brightness),
      );
      data[i + 2] = Math.min(
        255,
        Math.max(0, (data[i + 2] - 128) * contrast + 128 + brightness),
      );
    }
  } else if (filter === "magic") {
    applyMagicFilter(data, canvas.width, canvas.height);
  }

  ctx.putImageData(imageData, 0, 0);
}

function applyMagicFilter(
  data: Uint8ClampedArray,
  width: number,
  height: number,
): void {
  // Step 1: Grayscale
  const gray = new Float32Array(width * height);
  for (let i = 0; i < width * height; i++) {
    gray[i] =
      0.299 * data[i * 4] + 0.587 * data[i * 4 + 1] + 0.114 * data[i * 4 + 2];
  }

  // Step 2: High contrast (factor 2.5) + brightness -20
  const contrast = new Float32Array(width * height);
  for (let i = 0; i < gray.length; i++) {
    contrast[i] = Math.min(255, Math.max(0, (gray[i] - 128) * 2.5 + 128 - 20));
  }

  // Write back
  for (let i = 0; i < width * height; i++) {
    const v = contrast[i];
    data[i * 4] = v;
    data[i * 4 + 1] = v;
    data[i * 4 + 2] = v;
  }
}

export function drawImageToCanvas(
  canvas: HTMLCanvasElement,
  img: HTMLImageElement | HTMLVideoElement,
  rotation: number,
): void {
  const ctx = canvas.getContext("2d");
  if (!ctx) return;

  const isRotated90 = rotation % 180 !== 0;
  const srcW =
    img instanceof HTMLImageElement ? img.naturalWidth : img.videoWidth;
  const srcH =
    img instanceof HTMLImageElement ? img.naturalHeight : img.videoHeight;

  if (isRotated90) {
    canvas.width = srcH;
    canvas.height = srcW;
  } else {
    canvas.width = srcW;
    canvas.height = srcH;
  }

  ctx.save();
  ctx.translate(canvas.width / 2, canvas.height / 2);
  ctx.rotate((rotation * Math.PI) / 180);
  ctx.drawImage(img, -srcW / 2, -srcH / 2, srcW, srcH);
  ctx.restore();
}

export function imageToBase64(
  source: HTMLImageElement | HTMLVideoElement,
  filter: FilterType,
  rotation: number,
  thumbWidth = 200,
  thumbHeight = 260,
): string {
  const canvas = document.createElement("canvas");
  canvas.width = thumbWidth;
  canvas.height = thumbHeight;
  const ctx = canvas.getContext("2d");
  if (!ctx) return "";

  const isRotated90 = rotation % 180 !== 0;
  const srcW =
    source instanceof HTMLImageElement
      ? source.naturalWidth
      : source.videoWidth;
  const srcH =
    source instanceof HTMLImageElement
      ? source.naturalHeight
      : source.videoHeight;

  const drawW = isRotated90 ? srcH : srcW;
  const drawH = isRotated90 ? srcW : srcH;
  const scale = Math.min(thumbWidth / drawW, thumbHeight / drawH);
  const w = drawW * scale;
  const h = drawH * scale;
  const x = (thumbWidth - w) / 2;
  const y = (thumbHeight - h) / 2;

  ctx.fillStyle = "#f9fafb";
  ctx.fillRect(0, 0, thumbWidth, thumbHeight);

  ctx.save();
  ctx.translate(x + w / 2, y + h / 2);
  ctx.rotate((rotation * Math.PI) / 180);
  ctx.drawImage(
    source,
    (-(isRotated90 ? srcH : srcW) / 2) * scale,
    (-(isRotated90 ? srcW : srcH) / 2) * scale,
    (isRotated90 ? srcH : srcW) * scale,
    (isRotated90 ? srcW : srcH) * scale,
  );
  ctx.restore();

  const imageData = ctx.getImageData(0, 0, thumbWidth, thumbHeight);
  const d = imageData.data;

  if (filter === "grayscale") {
    for (let i = 0; i < d.length; i += 4) {
      const avg = 0.299 * d[i] + 0.587 * d[i + 1] + 0.114 * d[i + 2];
      d[i] = avg;
      d[i + 1] = avg;
      d[i + 2] = avg;
    }
  } else if (filter === "bw") {
    for (let i = 0; i < d.length; i += 4) {
      const avg = 0.299 * d[i] + 0.587 * d[i + 1] + 0.114 * d[i + 2];
      const val = avg > 128 ? 255 : 0;
      d[i] = val;
      d[i + 1] = val;
      d[i + 2] = val;
    }
  } else if (filter === "enhance") {
    for (let i = 0; i < d.length; i += 4) {
      d[i] = Math.min(255, Math.max(0, (d[i] - 128) * 1.3 + 128 + 15));
      d[i + 1] = Math.min(255, Math.max(0, (d[i + 1] - 128) * 1.3 + 128 + 15));
      d[i + 2] = Math.min(255, Math.max(0, (d[i + 2] - 128) * 1.3 + 128 + 15));
    }
  } else if (filter === "magic") {
    applyMagicFilter(d, thumbWidth, thumbHeight);
  }

  ctx.putImageData(imageData, 0, 0);
  return canvas.toDataURL("image/jpeg", 0.7);
}

export function getFullResBase64(
  source: HTMLImageElement | HTMLVideoElement,
  filter: FilterType,
  rotation: number,
): string {
  const canvas = document.createElement("canvas");
  const isRotated90 = rotation % 180 !== 0;
  const srcW =
    source instanceof HTMLImageElement
      ? source.naturalWidth
      : source.videoWidth;
  const srcH =
    source instanceof HTMLImageElement
      ? source.naturalHeight
      : source.videoHeight;

  if (isRotated90) {
    canvas.width = srcH;
    canvas.height = srcW;
  } else {
    canvas.width = srcW;
    canvas.height = srcH;
  }

  const ctx = canvas.getContext("2d");
  if (!ctx) return "";

  ctx.save();
  ctx.translate(canvas.width / 2, canvas.height / 2);
  ctx.rotate((rotation * Math.PI) / 180);
  ctx.drawImage(source, -srcW / 2, -srcH / 2, srcW, srcH);
  ctx.restore();

  applyFilter(canvas, filter);
  return canvas.toDataURL("image/jpeg", 0.92);
}
