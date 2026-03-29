import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  addPageNumbers,
  addWatermark,
  compressPDF,
  cropPDF,
  downloadBlob,
  downloadPDFBytes,
  extractPagesFromPDF,
  extractTextFromPDF,
  imageToPDF,
  mergePDFs,
  protectPDF,
  redactPDF,
  removePagesFromPDF,
  reorganizePDF,
  rotatePDF,
  signPDF,
  splitPDF,
  summariseText,
  unlockPDF,
} from "@/lib/pdfTools";
import { cn } from "@/lib/utils";
import {
  Brain,
  CheckCircle2,
  Columns2,
  Combine,
  Crop,
  Download,
  FileCheck,
  FileImage,
  FileOutput,
  FileSearch,
  FileSignature,
  FileText,
  FileType,
  FileType2,
  FileX,
  Globe,
  Hash,
  Info,
  Languages,
  Layers,
  List,
  Lock,
  LockOpen,
  Minimize2,
  Minus,
  PenLine,
  RefreshCw,
  RotateCw,
  ScanLine,
  Scissors,
  Settings2,
  ShieldCheck,
  Sparkles,
  Stamp,
  Upload,
  Wrench,
  X,
  Zap,
} from "lucide-react";
import { AnimatePresence, motion } from "motion/react";
import { useCallback, useEffect, useRef, useState } from "react";
import { toast } from "sonner";

type Tool = {
  id: string;
  label: string;
  icon: React.ReactNode;
  color: string;
  bg: string;
  badge?: string;
};

type ToolCategory = {
  id: string;
  title: string;
  icon: React.ReactNode;
  color: string;
  tools: Tool[];
};

const CATEGORIES: ToolCategory[] = [
  {
    id: "organize",
    title: "Organize PDF",
    icon: <Layers size={18} />,
    color: "text-blue-400",
    tools: [
      {
        id: "merge",
        label: "Merge PDF",
        icon: <Combine size={16} />,
        color: "text-blue-400",
        bg: "bg-blue-500/10",
      },
      {
        id: "split",
        label: "Split PDF",
        icon: <Scissors size={16} />,
        color: "text-blue-400",
        bg: "bg-blue-500/10",
      },
      {
        id: "remove-pages",
        label: "Remove Pages",
        icon: <Minus size={16} />,
        color: "text-blue-400",
        bg: "bg-blue-500/10",
      },
      {
        id: "extract-pages",
        label: "Extract Pages",
        icon: <FileOutput size={16} />,
        color: "text-blue-400",
        bg: "bg-blue-500/10",
      },
      {
        id: "organize-pdf",
        label: "Organize PDF",
        icon: <List size={16} />,
        color: "text-blue-400",
        bg: "bg-blue-500/10",
      },
    ],
  },
  {
    id: "scan",
    title: "Scan to PDF",
    icon: <ScanLine size={18} />,
    color: "text-emerald-400",
    tools: [
      {
        id: "scan-to-pdf",
        label: "Scan to PDF",
        icon: <ScanLine size={16} />,
        color: "text-emerald-400",
        bg: "bg-emerald-500/10",
      },
      {
        id: "optimize",
        label: "Optimize PDF",
        icon: <Zap size={16} />,
        color: "text-emerald-400",
        bg: "bg-emerald-500/10",
      },
      {
        id: "compress",
        label: "Compress PDF",
        icon: <Minimize2 size={16} />,
        color: "text-emerald-400",
        bg: "bg-emerald-500/10",
      },
      {
        id: "repair",
        label: "Repair PDF",
        icon: <Wrench size={16} />,
        color: "text-emerald-400",
        bg: "bg-emerald-500/10",
      },
      {
        id: "ocr",
        label: "OCR PDF",
        icon: <FileSearch size={16} />,
        color: "text-emerald-400",
        bg: "bg-emerald-500/10",
        badge: "AI",
      },
    ],
  },
  {
    id: "convert-to",
    title: "Convert to PDF",
    icon: <FileText size={18} />,
    color: "text-violet-400",
    tools: [
      {
        id: "jpg-to-pdf",
        label: "JPG to PDF",
        icon: <FileImage size={16} />,
        color: "text-violet-400",
        bg: "bg-violet-500/10",
      },
      {
        id: "word-to-pdf",
        label: "WORD to PDF",
        icon: <FileType size={16} />,
        color: "text-violet-400",
        bg: "bg-violet-500/10",
      },
      {
        id: "pptx-to-pdf",
        label: "POWERPOINT to PDF",
        icon: <Columns2 size={16} />,
        color: "text-violet-400",
        bg: "bg-violet-500/10",
      },
      {
        id: "excel-to-pdf",
        label: "EXCEL to PDF",
        icon: <FileCheck size={16} />,
        color: "text-violet-400",
        bg: "bg-violet-500/10",
      },
      {
        id: "html-to-pdf",
        label: "HTML to PDF",
        icon: <Globe size={16} />,
        color: "text-violet-400",
        bg: "bg-violet-500/10",
      },
    ],
  },
  {
    id: "convert-from",
    title: "Convert from PDF",
    icon: <FileOutput size={18} />,
    color: "text-amber-400",
    tools: [
      {
        id: "pdf-to-jpg",
        label: "PDF to JPG",
        icon: <FileImage size={16} />,
        color: "text-amber-400",
        bg: "bg-amber-500/10",
      },
      {
        id: "pdf-to-word",
        label: "PDF to WORD",
        icon: <FileType size={16} />,
        color: "text-amber-400",
        bg: "bg-amber-500/10",
      },
      {
        id: "pdf-to-pptx",
        label: "PDF to POWERPOINT",
        icon: <Columns2 size={16} />,
        color: "text-amber-400",
        bg: "bg-amber-500/10",
      },
      {
        id: "pdf-to-excel",
        label: "PDF to EXCEL",
        icon: <FileCheck size={16} />,
        color: "text-amber-400",
        bg: "bg-amber-500/10",
      },
      {
        id: "pdf-to-pdfa",
        label: "PDF to PDF/A",
        icon: <FileType2 size={16} />,
        color: "text-amber-400",
        bg: "bg-amber-500/10",
      },
    ],
  },
  {
    id: "edit",
    title: "Edit PDF",
    icon: <PenLine size={18} />,
    color: "text-pink-400",
    tools: [
      {
        id: "rotate",
        label: "Rotate PDF",
        icon: <RotateCw size={16} />,
        color: "text-pink-400",
        bg: "bg-pink-500/10",
      },
      {
        id: "page-numbers",
        label: "Add Page Numbers",
        icon: <Hash size={16} />,
        color: "text-pink-400",
        bg: "bg-pink-500/10",
      },
      {
        id: "watermark",
        label: "Add Watermark",
        icon: <Stamp size={16} />,
        color: "text-pink-400",
        bg: "bg-pink-500/10",
      },
      {
        id: "crop",
        label: "Crop PDF",
        icon: <Crop size={16} />,
        color: "text-pink-400",
        bg: "bg-pink-500/10",
      },
      {
        id: "edit-pdf",
        label: "Edit PDF",
        icon: <PenLine size={16} />,
        color: "text-pink-400",
        bg: "bg-pink-500/10",
      },
    ],
  },
  {
    id: "security",
    title: "PDF Security",
    icon: <ShieldCheck size={18} />,
    color: "text-rose-400",
    tools: [
      {
        id: "unlock",
        label: "Unlock PDF",
        icon: <LockOpen size={16} />,
        color: "text-rose-400",
        bg: "bg-rose-500/10",
      },
      {
        id: "protect",
        label: "Protect PDF",
        icon: <Lock size={16} />,
        color: "text-rose-400",
        bg: "bg-rose-500/10",
      },
      {
        id: "sign",
        label: "Sign PDF",
        icon: <FileSignature size={16} />,
        color: "text-rose-400",
        bg: "bg-rose-500/10",
      },
      {
        id: "redact",
        label: "Redact PDF",
        icon: <FileX size={16} />,
        color: "text-rose-400",
        bg: "bg-rose-500/10",
      },
      {
        id: "compare",
        label: "Compare PDF",
        icon: <Columns2 size={16} />,
        color: "text-rose-400",
        bg: "bg-rose-500/10",
      },
    ],
  },
  {
    id: "intelligence",
    title: "PDF Intelligence",
    icon: <Brain size={18} />,
    color: "text-fuchsia-400",
    tools: [
      {
        id: "ai-summarizer",
        label: "AI Summarizer",
        icon: <Sparkles size={16} />,
        color: "text-fuchsia-400",
        bg: "bg-fuchsia-500/10",
        badge: "AI",
      },
      {
        id: "translate-pdf",
        label: "Translate PDF",
        icon: <Languages size={16} />,
        color: "text-fuchsia-400",
        bg: "bg-fuchsia-500/10",
        badge: "AI",
      },
    ],
  },
];

const LANGUAGES = [
  "Hindi",
  "Spanish",
  "French",
  "German",
  "Arabic",
  "Chinese (Simplified)",
  "Japanese",
  "Portuguese",
  "Russian",
  "Italian",
  "Korean",
  "Tamil",
  "Bengali",
  "Urdu",
  "Turkish",
  "Dutch",
  "Polish",
  "Swedish",
];

const SERVER_SIDE_TOOLS: Record<string, { title: string; hint: string }> = {
  "word-to-pdf": {
    title: "WORD to PDF",
    hint: "Open your .docx file in Microsoft Word or Google Docs → File → Export/Download as PDF.",
  },
  "pptx-to-pdf": {
    title: "PowerPoint to PDF",
    hint: "Open your .pptx in PowerPoint or Google Slides → File → Export → PDF.",
  },
  "excel-to-pdf": {
    title: "Excel to PDF",
    hint: "Open your .xlsx in Excel or Google Sheets → File → Export → PDF.",
  },
  "html-to-pdf": {
    title: "HTML to PDF",
    hint: "Open the HTML file in Chrome → press Ctrl+P (Cmd+P) → Save as PDF.",
  },
  "pdf-to-word": {
    title: "PDF to Word",
    hint: "Upload the PDF to Adobe Acrobat online (acrobat.adobe.com) or Google Drive → Open with Docs.",
  },
  "pdf-to-pptx": {
    title: "PDF to PowerPoint",
    hint: "Use Adobe Acrobat online (acrobat.adobe.com) → Export PDF → PowerPoint.",
  },
  "pdf-to-excel": {
    title: "PDF to Excel",
    hint: "Use Adobe Acrobat online (acrobat.adobe.com) → Export PDF → Spreadsheet.",
  },
  "pdf-to-pdfa": {
    title: "PDF to PDF/A",
    hint: "Use Adobe Acrobat or a free online tool like ilovepdf.com to convert to PDF/A format.",
  },
  "pdf-to-jpg": {
    title: "PDF to JPG",
    hint: "Use ilovepdf.com or Adobe Acrobat → Export PDF → Image (JPEG/PNG).",
  },
};

type ModalState = {
  tool: Tool;
  category: ToolCategory;
};

type ProcessResult = {
  bytes?: Uint8Array;
  blobs?: Blob[];
  text?: string;
  summary?: string[];
  compareInfo?: string;
  filename: string;
};

// ---- Signature Canvas ----
function SignatureCanvas({
  onSave,
}: {
  onSave: (dataUrl: string) => void;
}) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const drawing = useRef(false);

  const getPos = (
    e: React.MouseEvent | React.TouchEvent,
    canvas: HTMLCanvasElement,
  ) => {
    const rect = canvas.getBoundingClientRect();
    if ("touches" in e) {
      return {
        x: e.touches[0].clientX - rect.left,
        y: e.touches[0].clientY - rect.top,
      };
    }
    return { x: e.clientX - rect.left, y: e.clientY - rect.top };
  };

  const startDraw = (e: React.MouseEvent | React.TouchEvent) => {
    e.preventDefault();
    const canvas = canvasRef.current;
    if (!canvas) return;
    drawing.current = true;
    const ctx = canvas.getContext("2d")!;
    const { x, y } = getPos(e, canvas);
    ctx.beginPath();
    ctx.moveTo(x, y);
  };

  const draw = (e: React.MouseEvent | React.TouchEvent) => {
    e.preventDefault();
    if (!drawing.current) return;
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d")!;
    const { x, y } = getPos(e, canvas);
    ctx.lineTo(x, y);
    ctx.strokeStyle = "#1a1a2e";
    ctx.lineWidth = 2;
    ctx.lineCap = "round";
    ctx.stroke();
  };

  const stopDraw = () => {
    drawing.current = false;
  };

  const clear = () => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d")!;
    ctx.clearRect(0, 0, canvas.width, canvas.height);
  };

  const save = () => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    onSave(canvas.toDataURL("image/png"));
  };

  return (
    <div className="space-y-2">
      <p className="text-xs text-muted-foreground">
        Draw your signature below:
      </p>
      <div className="border border-border rounded-xl overflow-hidden bg-white">
        <canvas
          ref={canvasRef}
          width={380}
          height={120}
          className="w-full touch-none cursor-crosshair"
          onMouseDown={startDraw}
          onMouseMove={draw}
          onMouseUp={stopDraw}
          onMouseLeave={stopDraw}
          onTouchStart={startDraw}
          onTouchMove={draw}
          onTouchEnd={stopDraw}
          data-ocid="pdftools.sign.canvas_target"
        />
      </div>
      <div className="flex gap-2">
        <Button variant="outline" size="sm" onClick={clear} className="flex-1">
          Clear
        </Button>
        <Button size="sm" onClick={save} className="flex-1">
          Use Signature
        </Button>
      </div>
    </div>
  );
}

// ---- File Drop Zone ----
function FileZone({
  label,
  accept,
  file,
  onChange,
  id,
  multiple,
  files,
  onChangeMultiple,
  onRemoveMultiple,
}: {
  label: string;
  accept: string;
  file?: File | null;
  onChange?: (f: File) => void;
  id: string;
  multiple?: boolean;
  files?: File[];
  onChangeMultiple?: (fs: File[]) => void;
  onRemoveMultiple?: (i: number) => void;
}) {
  return (
    <div className="border-2 border-dashed border-border rounded-xl hover:border-primary/40 transition-colors">
      <label htmlFor={id} className="cursor-pointer block p-4 text-center">
        <input
          type="file"
          id={id}
          accept={accept}
          multiple={multiple}
          className="hidden"
          onChange={(e) => {
            if (multiple && onChangeMultiple) {
              onChangeMultiple(Array.from(e.target.files ?? []));
            } else if (onChange && e.target.files?.[0]) {
              onChange(e.target.files[0]);
            }
          }}
          data-ocid={`pdftools.modal.${id}`}
        />
        <Upload size={20} className="mx-auto mb-2 text-muted-foreground" />
        {multiple && files && files.length > 0 ? (
          <div className="text-left space-y-1">
            {files.map((f, i) => (
              <div
                key={f.name + String(i)}
                className="flex items-center justify-between text-xs bg-muted/40 rounded px-2 py-1"
              >
                <span className="truncate text-foreground">{f.name}</span>
                <button
                  type="button"
                  onClick={(e) => {
                    e.preventDefault();
                    e.stopPropagation();
                    onRemoveMultiple?.(i);
                  }}
                  className="ml-2 text-muted-foreground hover:text-destructive"
                >
                  <X size={12} />
                </button>
              </div>
            ))}
            <p className="text-xs text-muted-foreground mt-1">
              Click to add more files
            </p>
          </div>
        ) : file ? (
          <div>
            <p className="text-sm font-medium text-foreground">{file.name}</p>
            <p className="text-xs text-muted-foreground">
              {(file.size / 1024).toFixed(1)} KB
            </p>
          </div>
        ) : (
          <div>
            <p className="text-sm font-medium text-foreground">{label}</p>
            <p className="text-xs text-muted-foreground">Click to browse</p>
          </div>
        )}
      </label>
    </div>
  );
}

// ---- Tool Modal Content ----
function ToolModalBody({
  tool,
  onClose,
}: {
  tool: Tool;
  onClose: () => void;
}) {
  const id = tool.id;
  const [file, setFile] = useState<File | null>(null);
  const [file2, setFile2] = useState<File | null>(null);
  const [files, setFiles] = useState<File[]>([]);
  const [rangeInput, setRangeInput] = useState("");
  const [textInput, setTextInput] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [rotation, setRotation] = useState("90");
  const [language, setLanguage] = useState("Hindi");
  const [cropMargins, setCropMargins] = useState({
    top: 10,
    right: 10,
    bottom: 10,
    left: 10,
  });
  const [signatureDataUrl, setSignatureDataUrl] = useState<string | null>(null);
  const [showSignCanvas, setShowSignCanvas] = useState(false);

  const [processing, setProcessing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [result, setResult] = useState<ProcessResult | null>(null);

  // Server-side only tools
  if (SERVER_SIDE_TOOLS[id]) {
    const info = SERVER_SIDE_TOOLS[id];
    return (
      <div className="space-y-4">
        <div className="flex items-start gap-3 bg-amber-500/10 border border-amber-500/20 rounded-xl p-4">
          <Info size={18} className="text-amber-400 flex-shrink-0 mt-0.5" />
          <div>
            <p className="text-sm font-medium text-foreground mb-1">
              Server-side conversion required
            </p>
            <p className="text-xs text-muted-foreground leading-relaxed">
              {info.hint}
            </p>
          </div>
        </div>
        <Button
          variant="outline"
          className="w-full"
          onClick={onClose}
          data-ocid="pdftools.modal.close_button"
        >
          Close
        </Button>
      </div>
    );
  }

  if (id === "scan-to-pdf" || id === "edit-pdf") {
    return (
      <div className="space-y-4">
        <div className="flex items-start gap-3 bg-blue-500/10 border border-blue-500/20 rounded-xl p-4">
          <ScanLine size={18} className="text-blue-400 flex-shrink-0 mt-0.5" />
          <p className="text-sm text-muted-foreground leading-relaxed">
            Use the{" "}
            <span className="font-semibold text-foreground">Scanner panel</span>{" "}
            on the right to scan documents with your camera, apply filters and
            crop, then tap{" "}
            <span className="font-semibold text-foreground">Export PDF</span> to
            save.
          </p>
        </div>
        <Button
          variant="outline"
          className="w-full"
          onClick={onClose}
          data-ocid="pdftools.modal.close_button"
        >
          Close
        </Button>
      </div>
    );
  }

  async function handleProcess() {
    setError(null);
    setProcessing(true);
    try {
      let res: ProcessResult | null = null;
      const baseName = file?.name.replace(/\.pdf$/i, "") ?? "output";

      switch (id) {
        case "merge": {
          if (files.length < 2)
            throw new Error("Please add at least 2 PDF files.");
          const bytes = await mergePDFs(files);
          res = { bytes, filename: "merged.pdf" };
          break;
        }
        case "split": {
          if (!file) throw new Error("Please upload a PDF.");
          if (!rangeInput.trim())
            throw new Error("Please enter page ranges or type 'each'.");
          const blobs = await splitPDF(file, rangeInput);
          res = { blobs, filename: `${baseName}_split.pdf` };
          break;
        }
        case "remove-pages": {
          if (!file) throw new Error("Please upload a PDF.");
          if (!rangeInput.trim())
            throw new Error("Please enter page numbers to remove.");
          const bytes = await removePagesFromPDF(file, rangeInput);
          res = { bytes, filename: `${baseName}_removed.pdf` };
          break;
        }
        case "extract-pages": {
          if (!file) throw new Error("Please upload a PDF.");
          if (!rangeInput.trim())
            throw new Error("Please enter pages to extract.");
          const bytes = await extractPagesFromPDF(file, rangeInput);
          res = { bytes, filename: `${baseName}_extracted.pdf` };
          break;
        }
        case "organize-pdf": {
          if (!file) throw new Error("Please upload a PDF.");
          if (!rangeInput.trim())
            throw new Error("Please enter the new page order.");
          const bytes = await reorganizePDF(file, rangeInput);
          res = { bytes, filename: `${baseName}_organized.pdf` };
          break;
        }
        case "optimize":
        case "compress":
        case "repair": {
          if (!file) throw new Error("Please upload a PDF.");
          const bytes = await compressPDF(file);
          res = { bytes, filename: `${baseName}_compressed.pdf` };
          break;
        }
        case "ocr": {
          if (!file) throw new Error("Please upload a PDF.");
          const text = await extractTextFromPDF(file);
          res = { text, filename: `${baseName}_text.txt` };
          break;
        }
        case "jpg-to-pdf": {
          if (!file) throw new Error("Please upload an image file.");
          const bytes = await imageToPDF(file);
          res = { bytes, filename: `${baseName}.pdf` };
          break;
        }
        case "rotate": {
          if (!file) throw new Error("Please upload a PDF.");
          const bytes = await rotatePDF(file, Number(rotation));
          res = { bytes, filename: `${baseName}_rotated.pdf` };
          break;
        }
        case "page-numbers": {
          if (!file) throw new Error("Please upload a PDF.");
          const bytes = await addPageNumbers(file);
          res = { bytes, filename: `${baseName}_numbered.pdf` };
          break;
        }
        case "watermark": {
          if (!file) throw new Error("Please upload a PDF.");
          const wText = textInput.trim() || "CONFIDENTIAL";
          const bytes = await addWatermark(file, wText);
          res = { bytes, filename: `${baseName}_watermarked.pdf` };
          break;
        }
        case "crop": {
          if (!file) throw new Error("Please upload a PDF.");
          const bytes = await cropPDF(file, cropMargins);
          res = { bytes, filename: `${baseName}_cropped.pdf` };
          break;
        }
        case "unlock": {
          if (!file) throw new Error("Please upload a PDF.");
          const bytes = await unlockPDF(file, password);
          res = { bytes, filename: `${baseName}_unlocked.pdf` };
          break;
        }
        case "protect": {
          if (!file) throw new Error("Please upload a PDF.");
          if (!password) throw new Error("Please enter a password.");
          if (password !== confirmPassword)
            throw new Error("Passwords do not match.");
          const bytes = await protectPDF(file, password);
          res = { bytes, filename: `${baseName}_protected.pdf` };
          break;
        }
        case "sign": {
          if (!file) throw new Error("Please upload a PDF.");
          if (!signatureDataUrl)
            throw new Error("Please draw your signature first.");
          const bytes = await signPDF(file, signatureDataUrl);
          res = { bytes, filename: `${baseName}_signed.pdf` };
          break;
        }
        case "redact": {
          if (!file) throw new Error("Please upload a PDF.");
          if (!textInput.trim())
            throw new Error("Please enter phrases to redact.");
          const bytes = await redactPDF(file, textInput);
          res = { bytes, filename: `${baseName}_redacted.pdf` };
          break;
        }
        case "compare": {
          if (!file || !file2)
            throw new Error("Please upload two PDF files to compare.");
          const text1 = await extractTextFromPDF(file);
          const text2 = await extractTextFromPDF(file2);
          const info = [
            `📄 File 1: ${file.name} (${(file.size / 1024).toFixed(1)} KB)`,
            `📄 File 2: ${file2.name} (${(file2.size / 1024).toFixed(1)} KB)`,
            "",
            "--- File 1 Metadata ---",
            text1,
            "",
            "--- File 2 Metadata ---",
            text2,
          ].join("\n");
          res = { text: info, compareInfo: info, filename: "comparison.txt" };
          break;
        }
        case "ai-summarizer": {
          if (!file) throw new Error("Please upload a PDF.");
          const text = await extractTextFromPDF(file);
          const summary = summariseText(text);
          res = { text, summary, filename: `${baseName}_summary.txt` };
          break;
        }
        case "translate-pdf": {
          if (!file) throw new Error("Please upload a PDF.");
          const text = await extractTextFromPDF(file);
          const translated = `[Translated to ${language}]\n\n${text}\n\n--- Note ---\nReal-time translation requires a live API (e.g. Google Translate). This preview shows the original extracted metadata with a translation marker.`;
          res = {
            text: translated,
            filename: `${baseName}_translated_${language}.txt`,
          };
          break;
        }
        default:
          throw new Error("This tool is not yet implemented.");
      }

      setResult(res);
      toast.success(`${tool.label} completed!`);
    } catch (err) {
      const msg = err instanceof Error ? err.message : String(err);
      setError(msg);
      toast.error(msg);
    } finally {
      setProcessing(false);
    }
  }

  function handleDownload() {
    if (!result) return;
    if (result.blobs) {
      result.blobs.forEach((blob, i) =>
        downloadBlob(blob, `part_${i + 1}_${result.filename}`),
      );
    } else if (result.bytes) {
      downloadPDFBytes(result.bytes, result.filename);
    } else if (result.text) {
      const blob = new Blob([result.text], { type: "text/plain" });
      downloadBlob(blob, result.filename);
    }
    toast.success("Downloaded!");
  }

  if (result) {
    return (
      <div className="space-y-4" data-ocid="pdftools.modal.success_state">
        <div className="flex flex-col items-center gap-2 py-3">
          <CheckCircle2 size={40} className="text-emerald-400" />
          <p className="text-base font-semibold text-foreground">Done!</p>
          <p className="text-xs text-muted-foreground text-center">
            {tool.label} completed successfully.
          </p>
        </div>
        {result.summary && (
          <div className="bg-muted/40 rounded-xl p-3 space-y-1">
            <p className="text-xs font-semibold text-muted-foreground mb-2">
              Summary
            </p>
            {result.summary.map((line) => (
              <p key={line} className="text-xs text-foreground">
                {line}
              </p>
            ))}
          </div>
        )}
        {(result.text || result.compareInfo) && (
          <textarea
            readOnly
            className="w-full h-32 text-xs bg-muted/30 border border-border rounded-lg p-2 font-mono resize-none text-foreground"
            value={result.text ?? result.compareInfo ?? ""}
            data-ocid="pdftools.modal.textarea"
          />
        )}
        <div className="flex gap-2">
          <Button
            variant="outline"
            className="flex-1"
            onClick={onClose}
            data-ocid="pdftools.modal.close_button"
          >
            Close
          </Button>
          <Button
            className="flex-1 bg-emerald-600 hover:bg-emerald-700"
            onClick={handleDownload}
            data-ocid="pdftools.modal.download_button"
          >
            <Download size={14} className="mr-2" />
            {result.blobs
              ? `Download ${result.blobs.length} file(s)`
              : "Download"}
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {error && (
        <div
          className="flex items-start gap-2 bg-destructive/10 border border-destructive/20 rounded-xl p-3"
          data-ocid="pdftools.modal.error_state"
        >
          <X size={14} className="text-destructive flex-shrink-0 mt-0.5" />
          <p className="text-xs text-destructive">{error}</p>
        </div>
      )}

      {/* Merge: multi-file */}
      {id === "merge" && (
        <FileZone
          label="Add PDF files (select multiple)"
          accept=".pdf"
          multiple
          files={files}
          id="merge-files"
          onChangeMultiple={(fs) => setFiles((prev) => [...prev, ...fs])}
          onRemoveMultiple={(i) =>
            setFiles((prev) => prev.filter((_, idx) => idx !== i))
          }
        />
      )}

      {/* Compare: two file inputs */}
      {id === "compare" && (
        <div className="space-y-3">
          <div>
            <p className="text-xs text-muted-foreground mb-1">First PDF</p>
            <FileZone
              label="Upload first PDF"
              accept=".pdf"
              file={file}
              onChange={setFile}
              id="compare-file1"
            />
          </div>
          <div>
            <p className="text-xs text-muted-foreground mb-1">Second PDF</p>
            <FileZone
              label="Upload second PDF"
              accept=".pdf"
              file={file2}
              onChange={setFile2}
              id="compare-file2"
            />
          </div>
        </div>
      )}

      {/* All single-file tools */}
      {id !== "merge" && id !== "compare" && id !== "sign" && (
        <FileZone
          label={
            id === "jpg-to-pdf" ? "Upload JPG or PNG image" : "Upload PDF file"
          }
          accept={id === "jpg-to-pdf" ? ".jpg,.jpeg,.png,image/*" : ".pdf"}
          file={file}
          onChange={setFile}
          id="main-file"
        />
      )}

      {/* Sign: PDF + canvas */}
      {id === "sign" && (
        <div className="space-y-3">
          <FileZone
            label="Upload PDF file"
            accept=".pdf"
            file={file}
            onChange={setFile}
            id="sign-file"
          />
          {!showSignCanvas && !signatureDataUrl && (
            <Button
              variant="outline"
              className="w-full"
              onClick={() => setShowSignCanvas(true)}
              data-ocid="pdftools.sign.open_modal_button"
            >
              <PenLine size={14} className="mr-2" />
              Draw Signature
            </Button>
          )}
          {showSignCanvas && (
            <SignatureCanvas
              onSave={(dataUrl) => {
                setSignatureDataUrl(dataUrl);
                setShowSignCanvas(false);
              }}
            />
          )}
          {signatureDataUrl && !showSignCanvas && (
            <div className="space-y-2">
              <p className="text-xs text-muted-foreground">
                Signature preview:
              </p>
              <div className="bg-white border border-border rounded-lg p-2">
                <img
                  src={signatureDataUrl}
                  alt="Signature"
                  className="h-16 object-contain"
                />
              </div>
              <Button
                variant="outline"
                size="sm"
                onClick={() => {
                  setSignatureDataUrl(null);
                  setShowSignCanvas(true);
                }}
              >
                Redraw
              </Button>
            </div>
          )}
        </div>
      )}

      {/* Extra inputs per tool */}
      {(id === "split" ||
        id === "remove-pages" ||
        id === "extract-pages" ||
        id === "organize-pdf") && (
        <div>
          <label
            htmlFor="range-input"
            className="text-xs text-muted-foreground block mb-1"
          >
            {id === "split" && "Page ranges (e.g. 1-3,4-6 or type 'each')"}
            {id === "remove-pages" && "Pages to remove (e.g. 1,3,5)"}
            {id === "extract-pages" && "Pages to extract (e.g. 2-5)"}
            {id === "organize-pdf" && "New page order (e.g. 3,1,2,4)"}
          </label>
          <input
            type="text"
            value={rangeInput}
            onChange={(e) => setRangeInput(e.target.value)}
            id="range-input"
            placeholder={id === "split" ? "e.g. 1-3,4-6 or each" : "e.g. 1,3,5"}
            className="w-full border border-border rounded-lg px-3 py-2 text-sm bg-background text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/40"
            data-ocid="pdftools.modal.input"
          />
        </div>
      )}

      {id === "watermark" && (
        <div>
          <label
            htmlFor="watermark-input"
            className="text-xs text-muted-foreground block mb-1"
          >
            Watermark text
          </label>
          <input
            id="watermark-input"
            type="text"
            value={textInput}
            onChange={(e) => setTextInput(e.target.value)}
            placeholder="CONFIDENTIAL"
            className="w-full border border-border rounded-lg px-3 py-2 text-sm bg-background text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/40"
            data-ocid="pdftools.modal.input"
          />
        </div>
      )}

      {id === "redact" && (
        <div>
          <label
            htmlFor="redact-input"
            className="text-xs text-muted-foreground block mb-1"
          >
            Phrases to redact (comma-separated)
          </label>
          <input
            id="redact-input"
            type="text"
            value={textInput}
            onChange={(e) => setTextInput(e.target.value)}
            placeholder="e.g. confidential, secret, John Doe"
            className="w-full border border-border rounded-lg px-3 py-2 text-sm bg-background text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/40"
            data-ocid="pdftools.modal.input"
          />
        </div>
      )}

      {id === "rotate" && (
        <div>
          <p className="text-xs text-muted-foreground block mb-1">
            Rotation angle
          </p>
          <div className="flex gap-2">
            {["90", "180", "270"].map((deg) => (
              <button
                key={deg}
                type="button"
                onClick={() => setRotation(deg)}
                className={cn(
                  "flex-1 py-2 rounded-lg border text-sm font-medium transition-colors",
                  rotation === deg
                    ? "bg-primary text-primary-foreground border-primary"
                    : "border-border text-foreground hover:bg-muted/40",
                )}
                data-ocid={`pdftools.rotate.${deg}.toggle`}
              >
                {deg}°
              </button>
            ))}
          </div>
        </div>
      )}

      {id === "crop" && (
        <div className="grid grid-cols-2 gap-2">
          {(["top", "right", "bottom", "left"] as const).map((side) => (
            <div key={side}>
              <label
                htmlFor={`crop-${side}`}
                className="text-xs text-muted-foreground capitalize block mb-1"
              >
                {side} margin (mm)
              </label>
              <input
                id={`crop-${side}`}
                type="number"
                value={cropMargins[side]}
                onChange={(e) =>
                  setCropMargins((prev) => ({
                    ...prev,
                    [side]: Number(e.target.value),
                  }))
                }
                min={0}
                className="w-full border border-border rounded-lg px-3 py-2 text-sm bg-background text-foreground focus:outline-none focus:ring-2 focus:ring-primary/40"
                data-ocid={`pdftools.crop.${side}.input`}
              />
            </div>
          ))}
        </div>
      )}

      {id === "unlock" && (
        <div>
          <label
            htmlFor="unlock-password"
            className="text-xs text-muted-foreground block mb-1"
          >
            PDF Password
          </label>
          <input
            id="unlock-password"
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            placeholder="Enter PDF password"
            className="w-full border border-border rounded-lg px-3 py-2 text-sm bg-background text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/40"
            data-ocid="pdftools.modal.input"
          />
        </div>
      )}

      {id === "protect" && (
        <div className="space-y-2">
          <div>
            <label
              htmlFor="protect-password"
              className="text-xs text-muted-foreground block mb-1"
            >
              Password
            </label>
            <input
              id="protect-password"
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="Set password"
              className="w-full border border-border rounded-lg px-3 py-2 text-sm bg-background text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/40"
              data-ocid="pdftools.modal.input"
            />
          </div>
          <div>
            <label
              htmlFor="protect-confirm"
              className="text-xs text-muted-foreground block mb-1"
            >
              Confirm Password
            </label>
            <input
              id="protect-confirm"
              type="password"
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              placeholder="Confirm password"
              className="w-full border border-border rounded-lg px-3 py-2 text-sm bg-background text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/40"
              data-ocid="pdftools.modal.confirm_input"
            />
          </div>
        </div>
      )}

      {id === "translate-pdf" && (
        <div>
          <label
            htmlFor="translate-lang"
            className="text-xs text-muted-foreground block mb-1"
          >
            Target language
          </label>
          <select
            id="translate-lang"
            value={language}
            onChange={(e) => setLanguage(e.target.value)}
            className="w-full border border-border rounded-lg px-3 py-2 text-sm bg-background text-foreground focus:outline-none focus:ring-2 focus:ring-primary/40"
            data-ocid="pdftools.modal.select"
          >
            {LANGUAGES.map((lang) => (
              <option key={lang} value={lang}>
                {lang}
              </option>
            ))}
          </select>
        </div>
      )}

      <div className="flex gap-2 pt-1">
        <Button
          variant="outline"
          className="flex-1"
          onClick={onClose}
          data-ocid="pdftools.modal.cancel_button"
        >
          Cancel
        </Button>
        <Button
          className="flex-1"
          onClick={handleProcess}
          disabled={processing}
          data-ocid="pdftools.modal.process_button"
        >
          {processing ? (
            <span className="flex items-center gap-2">
              <RefreshCw size={14} className="animate-spin" />
              Processing...
            </span>
          ) : (
            <span className="flex items-center gap-2">
              <Settings2 size={14} />
              Process
            </span>
          )}
        </Button>
      </div>
    </div>
  );
}

// ---- Main Panel ----
export function PDFToolsPanel() {
  const [activeCategory, setActiveCategory] = useState<string>("organize");
  const [activeTool, setActiveTool] = useState<ModalState | null>(null);

  const currentCategory = CATEGORIES.find((c) => c.id === activeCategory)!;

  function closeModal() {
    setActiveTool(null);
  }

  function handleToolClick(tool: Tool, category: ToolCategory) {
    setActiveTool({ tool, category });
  }

  return (
    <div className="flex-1 p-8" data-ocid="pdftools.page">
      <motion.div
        initial={{ opacity: 0, y: 8 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.3 }}
        className="mb-7"
      >
        <h1 className="text-3xl font-bold text-foreground">PDF Tools</h1>
        <p className="text-muted-foreground mt-1 text-sm">
          A complete toolkit — organize, convert, edit, secure, and analyze your
          PDFs.
        </p>
      </motion.div>

      <div className="flex gap-6">
        {/* Category sidebar */}
        <div
          className="flex-shrink-0 w-52 space-y-1"
          data-ocid="pdftools.categories"
        >
          {CATEGORIES.map((cat, i) => (
            <motion.button
              key={cat.id}
              type="button"
              initial={{ opacity: 0, x: -10 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: i * 0.05, duration: 0.25 }}
              onClick={() => setActiveCategory(cat.id)}
              className={cn(
                "w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-all duration-200 text-left",
                activeCategory === cat.id
                  ? "bg-primary/15 text-foreground shadow-sm"
                  : "text-muted-foreground hover:text-foreground hover:bg-muted/50",
              )}
              style={{
                boxShadow:
                  activeCategory === cat.id
                    ? "inset 3px 0 0 #1E88E5"
                    : undefined,
              }}
              data-ocid={`pdftools.category.${cat.id}`}
            >
              <span className={cn("flex-shrink-0", cat.color)}>{cat.icon}</span>
              <span className="truncate">{cat.title}</span>
              <span className="ml-auto text-xs text-muted-foreground font-normal">
                {cat.tools.length}
              </span>
            </motion.button>
          ))}
        </div>

        {/* Tools grid */}
        <div className="flex-1">
          <motion.div
            key={activeCategory}
            initial={{ opacity: 0, y: 6 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.25 }}
          >
            <div className="flex items-center gap-2 mb-4">
              <span className={currentCategory.color}>
                {currentCategory.icon}
              </span>
              <h2 className="text-base font-semibold text-foreground">
                {currentCategory.title}
              </h2>
              <Badge variant="secondary" className="text-xs">
                {currentCategory.tools.length} tools
              </Badge>
            </div>
            <div
              className="grid grid-cols-3 gap-3"
              data-ocid={`pdftools.tools.${activeCategory}`}
            >
              {currentCategory.tools.map((tool, i) => (
                <motion.button
                  key={tool.id}
                  type="button"
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: i * 0.06, duration: 0.25 }}
                  onClick={() => handleToolClick(tool, currentCategory)}
                  className="bg-card border border-border rounded-2xl p-4 flex flex-col items-start gap-3 hover:shadow-md hover:border-primary/40 hover:bg-muted/40 active:scale-[0.97] transition-all cursor-pointer text-left group"
                  data-ocid={`pdftools.tool.${tool.id}`}
                >
                  <div
                    className={cn(
                      "w-9 h-9 rounded-xl flex items-center justify-center",
                      tool.bg,
                    )}
                  >
                    <span className={tool.color}>{tool.icon}</span>
                  </div>
                  <div className="flex items-center gap-1.5 w-full">
                    <span className="text-sm font-medium text-foreground group-hover:text-primary transition-colors leading-tight">
                      {tool.label}
                    </span>
                    {tool.badge && (
                      <Badge
                        className="text-[9px] py-0 px-1 h-3.5 font-semibold flex-shrink-0"
                        style={{
                          backgroundColor: "#7c3aed",
                          color: "white",
                          border: "none",
                        }}
                      >
                        {tool.badge}
                      </Badge>
                    )}
                  </div>
                </motion.button>
              ))}
            </div>
          </motion.div>
        </div>
      </div>

      {/* Smart Tool Modal */}
      <AnimatePresence>
        {activeTool && (
          <button
            type="button"
            className="fixed inset-0 z-50 flex items-center justify-center w-full h-full border-0 p-0 bg-transparent"
            style={{ background: "rgba(0,0,0,0.6)" }}
            onClick={closeModal}
            data-ocid="pdftools.modal.overlay"
            aria-label="Close modal"
          >
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              transition={{ duration: 0.2 }}
              className="bg-card border border-border rounded-2xl p-6 w-full max-w-md shadow-2xl max-h-[90vh] overflow-y-auto"
              onClick={(e) => e.stopPropagation()}
              data-ocid="pdftools.modal.content"
            >
              {/* Header */}
              <div className="flex items-center justify-between mb-5">
                <div className="flex items-center gap-3">
                  <div
                    className={cn(
                      "w-10 h-10 rounded-xl flex items-center justify-center",
                      activeTool.tool.bg,
                    )}
                  >
                    <span className={activeTool.tool.color}>
                      {activeTool.tool.icon}
                    </span>
                  </div>
                  <div>
                    <h3 className="text-base font-semibold text-foreground">
                      {activeTool.tool.label}
                    </h3>
                    <p className="text-xs text-muted-foreground">
                      {activeTool.category.title}
                    </p>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={closeModal}
                  className="text-muted-foreground hover:text-foreground transition-colors"
                  data-ocid="pdftools.modal.close_button"
                >
                  <X size={18} />
                </button>
              </div>

              <ToolModalBody tool={activeTool.tool} onClose={closeModal} />
            </motion.div>
          </button>
        )}
      </AnimatePresence>
    </div>
  );
}
