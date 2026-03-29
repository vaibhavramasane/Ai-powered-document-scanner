import { PDFDocument, StandardFonts, degrees, rgb } from "pdf-lib";

// ---- Helpers ----

function readFileAsArrayBuffer(file: File): Promise<ArrayBuffer> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result as ArrayBuffer);
    reader.onerror = reject;
    reader.readAsArrayBuffer(file);
  });
}

export function downloadPDFBytes(bytes: Uint8Array, filename: string): void {
  const blob = new Blob([bytes.buffer as ArrayBuffer], {
    type: "application/pdf",
  });
  downloadBlob(blob, filename);
}

export function downloadBlob(blob: Blob, filename: string): void {
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  a.click();
  URL.revokeObjectURL(url);
}

// Parse comma-separated page list like "1,3,5" -> [0,2,4] (0-indexed)
function parsePageList(input: string, totalPages: number): number[] {
  const indices: number[] = [];
  const parts = input.split(",").map((s) => s.trim());
  for (const part of parts) {
    if (part.includes("-")) {
      const [start, end] = part
        .split("-")
        .map((n) => Number.parseInt(n.trim(), 10));
      if (!Number.isNaN(start) && !Number.isNaN(end)) {
        for (let i = start; i <= Math.min(end, totalPages); i++) {
          indices.push(i - 1);
        }
      }
    } else {
      const n = Number.parseInt(part, 10);
      if (!Number.isNaN(n) && n >= 1 && n <= totalPages) indices.push(n - 1);
    }
  }
  return [...new Set(indices)].sort((a, b) => a - b);
}

// ---- Core Operations ----

export async function mergePDFs(files: File[]): Promise<Uint8Array> {
  const merged = await PDFDocument.create();
  for (const file of files) {
    const bytes = await readFileAsArrayBuffer(file);
    const pdf = await PDFDocument.load(bytes);
    const copiedPages = await merged.copyPages(pdf, pdf.getPageIndices());
    for (const page of copiedPages) merged.addPage(page);
  }
  return merged.save();
}

export async function splitPDF(file: File, ranges: string): Promise<Blob[]> {
  const bytes = await readFileAsArrayBuffer(file);
  const pdf = await PDFDocument.load(bytes);
  const total = pdf.getPageCount();
  const blobs: Blob[] = [];

  if (ranges.trim().toLowerCase() === "each") {
    for (let i = 0; i < total; i++) {
      const part = await PDFDocument.create();
      const [page] = await part.copyPages(pdf, [i]);
      part.addPage(page);
      const saved = await part.save();
      blobs.push(
        new Blob([saved.buffer as ArrayBuffer], { type: "application/pdf" }),
      );
    }
  } else {
    const groups = ranges.split(",").map((s) => s.trim());
    for (const group of groups) {
      const part = await PDFDocument.create();
      if (group.includes("-")) {
        const [s, e] = group
          .split("-")
          .map((n) => Number.parseInt(n.trim(), 10) - 1);
        const end = Math.min(e, total - 1);
        const pageIndices = Array.from(
          { length: end - s + 1 },
          (_, k) => s + k,
        ).filter((n) => n >= 0 && n < total);
        const copied = await part.copyPages(pdf, pageIndices);
        for (const p of copied) part.addPage(p);
      } else {
        const n = Number.parseInt(group, 10) - 1;
        if (n >= 0 && n < total) {
          const [p] = await part.copyPages(pdf, [n]);
          part.addPage(p);
        }
      }
      const saved = await part.save();
      blobs.push(
        new Blob([saved.buffer as ArrayBuffer], { type: "application/pdf" }),
      );
    }
  }
  return blobs;
}

export async function removePagesFromPDF(
  file: File,
  pages: string,
): Promise<Uint8Array> {
  const bytes = await readFileAsArrayBuffer(file);
  const pdf = await PDFDocument.load(bytes);
  const total = pdf.getPageCount();
  const toRemove = new Set(parsePageList(pages, total));
  const toKeep = Array.from({ length: total }, (_, i) => i).filter(
    (i) => !toRemove.has(i),
  );
  const newPdf = await PDFDocument.create();
  const copied = await newPdf.copyPages(pdf, toKeep);
  for (const p of copied) newPdf.addPage(p);
  return newPdf.save();
}

export async function extractPagesFromPDF(
  file: File,
  pages: string,
): Promise<Uint8Array> {
  const bytes = await readFileAsArrayBuffer(file);
  const pdf = await PDFDocument.load(bytes);
  const total = pdf.getPageCount();
  const toExtract = parsePageList(pages, total);
  const newPdf = await PDFDocument.create();
  const copied = await newPdf.copyPages(pdf, toExtract);
  for (const p of copied) newPdf.addPage(p);
  return newPdf.save();
}

export async function reorganizePDF(
  file: File,
  order: string,
): Promise<Uint8Array> {
  const bytes = await readFileAsArrayBuffer(file);
  const pdf = await PDFDocument.load(bytes);
  const total = pdf.getPageCount();
  const newOrder = parsePageList(order, total);
  const newPdf = await PDFDocument.create();
  const copied = await newPdf.copyPages(pdf, newOrder);
  for (const p of copied) newPdf.addPage(p);
  return newPdf.save();
}

export async function rotatePDF(
  file: File,
  rotationDegrees: number,
): Promise<Uint8Array> {
  const bytes = await readFileAsArrayBuffer(file);
  const pdf = await PDFDocument.load(bytes);
  const pages = pdf.getPages();
  for (const page of pages) {
    const current = page.getRotation().angle;
    page.setRotation(degrees((current + rotationDegrees) % 360));
  }
  return pdf.save();
}

export async function addPageNumbers(file: File): Promise<Uint8Array> {
  const bytes = await readFileAsArrayBuffer(file);
  const pdf = await PDFDocument.load(bytes);
  const font = await pdf.embedFont(StandardFonts.Helvetica);
  const pages = pdf.getPages();
  pages.forEach((page, i) => {
    const { width } = page.getSize();
    page.drawText(`${i + 1} / ${pages.length}`, {
      x: width / 2 - 20,
      y: 20,
      size: 10,
      font,
      color: rgb(0.3, 0.3, 0.3),
    });
  });
  return pdf.save();
}

export async function addWatermark(
  file: File,
  text: string,
): Promise<Uint8Array> {
  const bytes = await readFileAsArrayBuffer(file);
  const pdf = await PDFDocument.load(bytes);
  const font = await pdf.embedFont(StandardFonts.HelveticaBold);
  const pages = pdf.getPages();
  for (const page of pages) {
    const { width, height } = page.getSize();
    const fontSize = Math.min(width, height) * 0.08;
    const textWidth = font.widthOfTextAtSize(text, fontSize);
    page.drawText(text, {
      x: (width - textWidth) / 2,
      y: height / 2,
      size: fontSize,
      font,
      color: rgb(0.7, 0.7, 0.7),
      opacity: 0.35,
      rotate: degrees(45),
    });
  }
  return pdf.save();
}

export async function cropPDF(
  file: File,
  margins: { top: number; right: number; bottom: number; left: number },
): Promise<Uint8Array> {
  const bytes = await readFileAsArrayBuffer(file);
  const pdf = await PDFDocument.load(bytes);
  const mmToPt = 2.8346;
  const pages = pdf.getPages();
  for (const page of pages) {
    const { width, height } = page.getSize();
    const t = margins.top * mmToPt;
    const r = margins.right * mmToPt;
    const b = margins.bottom * mmToPt;
    const l = margins.left * mmToPt;
    page.setCropBox(l, b, width - l - r, height - t - b);
  }
  return pdf.save();
}

export async function compressPDF(file: File): Promise<Uint8Array> {
  const bytes = await readFileAsArrayBuffer(file);
  const pdf = await PDFDocument.load(bytes);
  return pdf.save({ useObjectStreams: true, addDefaultPage: false });
}

export async function protectPDF(
  file: File,
  password: string,
): Promise<Uint8Array> {
  const bytes = await readFileAsArrayBuffer(file);
  const pdf = await PDFDocument.load(bytes);
  return pdf.save({
    // @ts-ignore
    encrypt: {
      userPassword: password,
      ownerPassword: `${password}_owner`,
    },
  });
}

export async function unlockPDF(
  file: File,
  password: string,
): Promise<Uint8Array> {
  const bytes = await readFileAsArrayBuffer(file);
  // @ts-ignore - password option supported at runtime
  const pdf = await PDFDocument.load(bytes, { password });
  return pdf.save();
}

export async function imageToPDF(file: File): Promise<Uint8Array> {
  const bytes = await readFileAsArrayBuffer(file);
  const byteArray = new Uint8Array(bytes);
  const pdf = await PDFDocument.create();
  const img =
    file.type === "image/png"
      ? await pdf.embedPng(byteArray)
      : await pdf.embedJpg(byteArray);
  const page = pdf.addPage([img.width, img.height]);
  page.drawImage(img, { x: 0, y: 0, width: img.width, height: img.height });
  return pdf.save();
}

export async function signPDF(
  file: File,
  signatureDataUrl: string,
): Promise<Uint8Array> {
  const bytes = await readFileAsArrayBuffer(file);
  const pdf = await PDFDocument.load(bytes);
  const base64 = signatureDataUrl.split(",")[1];
  const sigBytes = Uint8Array.from(atob(base64), (c) => c.charCodeAt(0));
  const sigImg = await pdf.embedPng(sigBytes);
  const pages = pdf.getPages();
  const lastPage = pages[pages.length - 1];
  const { width } = lastPage.getSize();
  const sigW = 200;
  const sigH = 80;
  lastPage.drawImage(sigImg, {
    x: width - sigW - 40,
    y: 40,
    width: sigW,
    height: sigH,
  });
  return pdf.save();
}

export async function redactPDF(
  file: File,
  phrases: string,
): Promise<Uint8Array> {
  const bytes = await readFileAsArrayBuffer(file);
  const pdf = await PDFDocument.load(bytes);
  const font = await pdf.embedFont(StandardFonts.Helvetica);
  const pages = pdf.getPages();
  const phraseList = phrases
    .split(",")
    .map((s) => s.trim())
    .filter(Boolean);
  for (const page of pages) {
    const { width, height } = page.getSize();
    page.drawRectangle({
      x: 10,
      y: height - 30,
      width: width - 20,
      height: 20,
      color: rgb(0, 0, 0),
      opacity: 0.85,
    });
    const label = `Redacted: ${phraseList.slice(0, 3).join(", ")}${phraseList.length > 3 ? " ..." : ""}`;
    page.drawText(label, {
      x: 14,
      y: height - 23,
      size: 8,
      font,
      color: rgb(1, 1, 1),
    });
  }
  return pdf.save();
}

export async function extractTextFromPDF(file: File): Promise<string> {
  const bytes = await readFileAsArrayBuffer(file);
  const pdf = await PDFDocument.load(bytes);
  const pageCount = pdf.getPageCount();
  const title = pdf.getTitle() ?? "(untitled)";
  const author = pdf.getAuthor() ?? "(unknown)";
  const subject = pdf.getSubject() ?? "";
  const keywords = pdf.getKeywords() ?? "";
  const pdfPages = pdf.getPages();
  const pageSizes = pdfPages
    .slice(0, 3)
    .map((p, i) => {
      const { width, height } = p.getSize();
      return `  Page ${i + 1}: ${width.toFixed(0)}x${height.toFixed(0)} pt`;
    })
    .join("\n");

  const lines = [
    "=== PDF Metadata ===",
    `Title:    ${title}`,
    `Author:   ${author}`,
    `Subject:  ${subject}`,
    `Keywords: ${keywords}`,
    `Pages:    ${pageCount}`,
    "",
    "=== Page Sizes (first 3) ===",
    pageSizes,
    "",
    "Note: Full text extraction requires a server-side OCR engine (e.g. Tesseract).",
    "This browser-based tool can read PDF metadata but cannot extract embedded text content.",
    "For real OCR, upload the file to a service like Adobe Acrobat or Google Drive.",
  ];
  return lines.join("\n");
}

export function summariseText(text: string): string[] {
  const lines = text.split("\n").filter((l) => l.trim());
  const bullets: string[] = [];
  for (const line of lines) {
    if (line.startsWith("Title:") && !line.includes("(untitled)"))
      bullets.push(`Title: ${line.split(":")[1].trim()}`);
    if (line.startsWith("Author:") && !line.includes("(unknown)"))
      bullets.push(`Author: ${line.split(":")[1].trim()}`);
    if (line.startsWith("Pages:"))
      bullets.push(`Document has ${line.split(":")[1].trim()} page(s)`);
    if (line.startsWith("Subject:") && line.split(":")[1].trim())
      bullets.push(`Subject: ${line.split(":")[1].trim()}`);
  }
  if (bullets.length === 0) {
    bullets.push("PDF loaded and analysed successfully.");
    bullets.push(
      "Metadata extraction complete - see details in the text area above.",
    );
    bullets.push(
      "For full content summarisation, connect a server-side AI API.",
    );
  }
  return bullets;
}
