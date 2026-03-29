import type { QualityType } from "../types/document";

const QUALITY_MAP: Record<QualityType, number> = {
  High: 0.95,
  Medium: 0.8,
  Low: 0.55,
};

// Encode a number as a PDF integer string
function pdfNum(n: number): string {
  return Math.round(n).toString();
}

function pdfDate(d: Date): string {
  const pad = (n: number, len = 2) => n.toString().padStart(len, "0");
  return `D:${d.getFullYear()}${pad(d.getMonth() + 1)}${pad(d.getDate())}${pad(d.getHours())}${pad(d.getMinutes())}${pad(d.getSeconds())}`;
}

export async function exportAsPDF(
  imgBase64: string,
  filename: string,
  quality: QualityType,
): Promise<void> {
  const img = new Image();
  img.src = imgBase64;
  await new Promise<void>((resolve) => {
    img.onload = () => resolve();
    img.onerror = () => resolve();
  });

  const imgW = img.naturalWidth || 800;
  const imgH = img.naturalHeight || 1100;

  // Compress onto canvas
  const canvas = document.createElement("canvas");
  canvas.width = imgW;
  canvas.height = imgH;
  const ctx = canvas.getContext("2d");
  if (ctx) {
    ctx.drawImage(img, 0, 0);
  }

  const q = QUALITY_MAP[quality];
  const dataUrl = canvas.toDataURL("image/jpeg", q);
  const base64Data = dataUrl.split(",")[1];

  // Decode base64 to binary
  const binaryStr = atob(base64Data);
  const jpegBytes = new Uint8Array(binaryStr.length);
  for (let i = 0; i < binaryStr.length; i++) {
    jpegBytes[i] = binaryStr.charCodeAt(i);
  }

  // Use image dimensions as PDF page size (in points, 1px at 96dpi)
  const PX_TO_PT = 72 / 96;
  const pageW = imgW * PX_TO_PT;
  const pageH = imgH * PX_TO_PT;

  // Build minimal PDF 1.4 structure
  const enc = new TextEncoder();
  const parts: Uint8Array[] = [];
  const offsets: number[] = [];
  let pos = 0;

  function appendStr(s: string) {
    const bytes = enc.encode(s);
    parts.push(bytes);
    pos += bytes.length;
  }

  function appendBytes(bytes: Uint8Array) {
    parts.push(bytes);
    pos += bytes.length;
  }

  const now = new Date();
  const creationDate = pdfDate(now);
  const safeTitle = filename.replace(/[()\\]/g, "");

  // Header
  appendStr("%PDF-1.4\n");

  // Object 1: Catalog
  offsets[1] = pos;
  appendStr("1 0 obj\n<< /Type /Catalog /Pages 2 0 R >>\nendobj\n");

  // Object 2: Pages
  offsets[2] = pos;
  appendStr("2 0 obj\n<< /Type /Pages /Kids [3 0 R] /Count 1 >>\nendobj\n");

  // Object 3: Page
  offsets[3] = pos;
  appendStr(
    `3 0 obj\n<< /Type /Page /Parent 2 0 R /MediaBox [0 0 ${pdfNum(pageW)} ${pdfNum(pageH)}] /Contents 4 0 R /Resources << /XObject << /Im1 5 0 R >> >> >>\nendobj\n`,
  );

  // Object 4: Content stream - draw image filling the page
  const contentStr = `q ${pdfNum(pageW)} 0 0 ${pdfNum(pageH)} 0 0 cm /Im1 Do Q`;
  const contentBytes = enc.encode(contentStr);
  offsets[4] = pos;
  appendStr(`4 0 obj\n<< /Length ${contentBytes.length} >>\nstream\n`);
  appendBytes(contentBytes);
  appendStr("\nendstream\nendobj\n");

  // Object 5: JPEG image XObject
  offsets[5] = pos;
  appendStr(
    `5 0 obj\n<< /Type /XObject /Subtype /Image /Width ${pdfNum(imgW)} /Height ${pdfNum(imgH)} /ColorSpace /DeviceRGB /BitsPerComponent 8 /Filter /DCTDecode /Length ${jpegBytes.length} /DPI 150 >>\nstream\n`,
  );
  appendBytes(jpegBytes);
  appendStr("\nendstream\nendobj\n");

  // Object 6: Info dictionary
  offsets[6] = pos;
  appendStr(
    `6 0 obj\n<< /Title (${safeTitle}) /CreationDate (${creationDate}) /Producer (Document Scanner Pro) >>\nendobj\n`,
  );

  // Cross-reference table
  const xrefPos = pos;
  appendStr("xref\n");
  appendStr("0 7\n");
  appendStr("0000000000 65535 f \n");
  for (let i = 1; i <= 6; i++) {
    appendStr(`${offsets[i].toString().padStart(10, "0")} 00000 n \n`);
  }

  // Trailer
  appendStr(
    `trailer\n<< /Size 7 /Root 1 0 R /Info 6 0 R >>\nstartxref\n${xrefPos}\n%%EOF\n`,
  );

  // Concatenate all parts
  const totalLength = parts.reduce((sum, p) => sum + p.length, 0);
  const pdfBytes = new Uint8Array(totalLength);
  let offset = 0;
  for (const part of parts) {
    pdfBytes.set(part, offset);
    offset += part.length;
  }

  const blob = new Blob([pdfBytes], { type: "application/pdf" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = `${filename}.pdf`;
  a.click();
  setTimeout(() => URL.revokeObjectURL(url), 5000);
}
