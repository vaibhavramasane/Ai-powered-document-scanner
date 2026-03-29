/**
 * Detect document corners using Sobel edge detection.
 * Returns 4 corners as [x,y] pairs: [topLeft, topRight, bottomRight, bottomLeft]
 * Falls back to image corners inset by 5% if detection fails.
 */
export function detectDocumentCorners(
  img: HTMLImageElement,
  maxSize = 400,
): [number, number][] {
  const natW = img.naturalWidth;
  const natH = img.naturalHeight;
  if (!natW || !natH) {
    return defaultCorners(natW || maxSize, natH || maxSize);
  }

  const scale = Math.min(maxSize / natW, maxSize / natH, 1);
  const w = Math.round(natW * scale);
  const h = Math.round(natH * scale);

  const canvas = document.createElement("canvas");
  canvas.width = w;
  canvas.height = h;
  const ctx = canvas.getContext("2d");
  if (!ctx) return defaultCorners(natW, natH);

  ctx.drawImage(img, 0, 0, w, h);
  const { data } = ctx.getImageData(0, 0, w, h);

  // Convert to grayscale
  const gray = new Float32Array(w * h);
  for (let i = 0; i < w * h; i++) {
    gray[i] =
      0.299 * data[i * 4] + 0.587 * data[i * 4 + 1] + 0.114 * data[i * 4 + 2];
  }

  // Sobel edge detection
  const edges = new Float32Array(w * h);
  let maxEdge = 0;
  for (let y = 1; y < h - 1; y++) {
    for (let x = 1; x < w - 1; x++) {
      const idx = y * w + x;
      const gx =
        -gray[idx - w - 1] +
        gray[idx - w + 1] -
        2 * gray[idx - 1] +
        2 * gray[idx + 1] -
        gray[idx + w - 1] +
        gray[idx + w + 1];
      const gy =
        -gray[idx - w - 1] -
        2 * gray[idx - w] -
        gray[idx - w + 1] +
        gray[idx + w - 1] +
        2 * gray[idx + w] +
        gray[idx + w + 1];
      const mag = Math.sqrt(gx * gx + gy * gy);
      edges[idx] = mag;
      if (mag > maxEdge) maxEdge = mag;
    }
  }

  if (maxEdge === 0) return defaultCorners(natW, natH);

  // Threshold at 20% of max
  const threshold = maxEdge * 0.2;

  // Find extreme edge pixels from each direction
  let topY = h;
  let bottomY = 0;
  let leftX = w;
  let rightX = 0;
  let topX = w / 2;
  let bottomX = w / 2;
  let leftY = h / 2;
  let rightY = h / 2;
  let found = false;

  for (let y = 0; y < h; y++) {
    for (let x = 0; x < w; x++) {
      if (edges[y * w + x] > threshold) {
        found = true;
        if (y < topY) {
          topY = y;
          topX = x;
        }
        if (y > bottomY) {
          bottomY = y;
          bottomX = x;
        }
        if (x < leftX) {
          leftX = x;
          leftY = y;
        }
        if (x > rightX) {
          rightX = x;
          rightY = y;
        }
      }
    }
  }

  // Suppress unused-variable warnings for positional hints
  void topX;
  void bottomX;
  void leftY;
  void rightY;

  if (!found) return defaultCorners(natW, natH);

  // Scale back to image coordinates
  const invScale = 1 / scale;

  // Build corners from the detected bounding box
  const tlX = leftX * invScale;
  const tlY = topY * invScale;
  const trX = rightX * invScale;
  const trY = topY * invScale;
  const brX = rightX * invScale;
  const brY = bottomY * invScale;
  const blX = leftX * invScale;
  const blY = bottomY * invScale;

  // Validate - if the quad is too small, fall back
  const qw = trX - tlX;
  const qh = blY - tlY;
  if (qw < natW * 0.1 || qh < natH * 0.1) return defaultCorners(natW, natH);

  return [
    [tlX, tlY],
    [trX, trY],
    [brX, brY],
    [blX, blY],
  ];
}

function defaultCorners(w: number, h: number): [number, number][] {
  const insetX = w * 0.05;
  const insetY = h * 0.05;
  return [
    [insetX, insetY],
    [w - insetX, insetY],
    [w - insetX, h - insetY],
    [insetX, h - insetY],
  ];
}

/**
 * Apply perspective warp: map the quadrilateral defined by srcCorners
 * onto a flat rectangle. Returns a new base64 data URL of the warped image.
 */
export function perspectiveWarp(
  img: HTMLImageElement,
  srcCorners: [number, number][],
  outputWidth?: number,
  outputHeight?: number,
): string {
  const natW = img.naturalWidth;
  const natH = img.naturalHeight;
  if (!natW || !natH || srcCorners.length < 4) {
    const c = document.createElement("canvas");
    c.width = natW || 800;
    c.height = natH || 1100;
    const cx = c.getContext("2d");
    if (cx) cx.drawImage(img, 0, 0);
    return c.toDataURL("image/jpeg", 0.95);
  }

  const [tl, tr, br, bl] = srcCorners;

  // Compute output size
  const outW =
    outputWidth ||
    Math.round(
      Math.max(
        Math.hypot(tr[0] - tl[0], tr[1] - tl[1]),
        Math.hypot(br[0] - bl[0], br[1] - bl[1]),
      ),
    );
  const outH =
    outputHeight ||
    Math.round(
      Math.max(
        Math.hypot(bl[0] - tl[0], bl[1] - tl[1]),
        Math.hypot(br[0] - tr[0], br[1] - tr[1]),
      ),
    );

  // Render the source image to a source canvas
  const srcCanvas = document.createElement("canvas");
  srcCanvas.width = natW;
  srcCanvas.height = natH;
  const srcCtx = srcCanvas.getContext("2d");
  if (!srcCtx) return img.src;
  srcCtx.drawImage(img, 0, 0);
  const srcData = srcCtx.getImageData(0, 0, natW, natH);

  // Output canvas
  const dstCanvas = document.createElement("canvas");
  dstCanvas.width = outW;
  dstCanvas.height = outH;
  const dstCtx = dstCanvas.getContext("2d");
  if (!dstCtx) return img.src;

  const dstData = dstCtx.createImageData(outW, outH);
  const dst = dstData.data;
  const src = srcData.data;

  // Inverse bilinear mapping:
  // For each output pixel (px, py), compute normalized (s,t) in [0,1]x[0,1]
  // then find corresponding source point via bilinear interpolation
  for (let py = 0; py < outH; py++) {
    const t = py / (outH - 1);
    for (let px = 0; px < outW; px++) {
      const s = px / (outW - 1);

      // Bilinear: src = (1-s)(1-t)*TL + s(1-t)*TR + s*t*BR + (1-s)*t*BL
      const sx =
        (1 - s) * (1 - t) * tl[0] +
        s * (1 - t) * tr[0] +
        s * t * br[0] +
        (1 - s) * t * bl[0];
      const sy =
        (1 - s) * (1 - t) * tl[1] +
        s * (1 - t) * tr[1] +
        s * t * br[1] +
        (1 - s) * t * bl[1];

      // Bilinear sample from source
      const x0 = Math.floor(sx);
      const y0 = Math.floor(sy);
      const x1 = Math.min(x0 + 1, natW - 1);
      const y1 = Math.min(y0 + 1, natH - 1);
      const fx = sx - x0;
      const fy = sy - y0;

      if (x0 < 0 || y0 < 0 || x0 >= natW || y0 >= natH) {
        const di = (py * outW + px) * 4;
        dst[di] = 255;
        dst[di + 1] = 255;
        dst[di + 2] = 255;
        dst[di + 3] = 255;
        continue;
      }

      const i00 = (y0 * natW + x0) * 4;
      const i10 = (y0 * natW + x1) * 4;
      const i01 = (y1 * natW + x0) * 4;
      const i11 = (y1 * natW + x1) * 4;

      const di = (py * outW + px) * 4;
      for (let c = 0; c < 3; c++) {
        dst[di + c] = Math.round(
          (1 - fx) * (1 - fy) * src[i00 + c] +
            fx * (1 - fy) * src[i10 + c] +
            (1 - fx) * fy * src[i01 + c] +
            fx * fy * src[i11 + c],
        );
      }
      dst[di + 3] = 255;
    }
  }

  dstCtx.putImageData(dstData, 0, 0);
  return dstCanvas.toDataURL("image/jpeg", 0.95);
}
