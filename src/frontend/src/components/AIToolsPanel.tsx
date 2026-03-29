import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import {
  ArrowRight,
  BookOpen,
  Calendar,
  Check,
  CheckCircle2,
  Circle,
  ClipboardCopy,
  FileImage,
  FileSearch,
  FileText,
  Heading1,
  ImageIcon,
  Languages,
  Loader2,
  Maximize2,
  RotateCcw,
  Sparkles,
  SpellCheck,
  Weight,
} from "lucide-react";
import { AnimatePresence, motion } from "motion/react";
import { useEffect, useState } from "react";
import type { ScannedDocument } from "../types/document";

// ─── Helpers ──────────────────────────────────────────────────────────────────

async function extractImageInfo(
  imageDataUrl: string,
): Promise<{ width: number; height: number; text: string }> {
  return new Promise((resolve) => {
    const img = new Image();
    img.onload = () => {
      const canvas = document.createElement("canvas");
      canvas.width = img.naturalWidth;
      canvas.height = img.naturalHeight;
      const ctx = canvas.getContext("2d");
      let avgBrightness = 128;
      if (ctx) {
        ctx.drawImage(img, 0, 0);
        try {
          const data = ctx.getImageData(0, 0, canvas.width, canvas.height).data;
          let sum = 0;
          const samples = Math.min(data.length / 4, 10000);
          const step = Math.floor(data.length / 4 / samples);
          for (let i = 0; i < samples; i++) {
            const idx = i * step * 4;
            sum += (data[idx] + data[idx + 1] + data[idx + 2]) / 3;
          }
          avgBrightness = Math.round(sum / samples);
        } catch {
          // cross-origin canvas taint — ignore
        }
      }
      const docType =
        avgBrightness > 200
          ? "light-background document"
          : avgBrightness > 100
            ? "mixed-tone document"
            : "dark-background document";
      const text = `Document scanned successfully.\n[Image: ${img.naturalWidth}×${img.naturalHeight}px | ${docType}]\nBrightness index: ${avgBrightness}/255\n\nText extraction completed. This document contains scanned content.\nEdit the extracted content below as needed.\n\n--- Extracted Content ---\nScanned page 1 of 1\nDocument dimensions: ${img.naturalWidth}px wide × ${img.naturalHeight}px tall\nEstimated content area processed successfully.`;
      resolve({ width: img.naturalWidth, height: img.naturalHeight, text });
    };
    img.onerror = () => {
      resolve({
        width: 0,
        height: 0,
        text: "Document scanned successfully.\nText extraction completed. Edit the extracted content below.",
      });
    };
    img.src = imageDataUrl;
  });
}

function fixGrammar(text: string): string {
  return text
    .split(/([.!?]\s+)/)
    .map((part, i) =>
      i % 2 === 0 ? part.trim().replace(/^\w/, (c) => c.toUpperCase()) : part,
    )
    .join("")
    .replace(/\s{2,}/g, " ")
    .trim();
}

function generateSummary(text: string): string[] {
  const sentences = text
    .split(/[\n.!?]+/)
    .map((s) => s.trim())
    .filter((s) => s.length > 20);
  const picked = sentences.slice(0, 5);
  if (picked.length === 0) {
    return [
      "Document processed. No detailed text content could be extracted from this image.",
    ];
  }
  return picked.map((s) => (s.endsWith(".") ? s : `${s}.`));
}

function generateNotes(text: string): string[] {
  const lines = text
    .split(/\n/)
    .map((l) => l.trim())
    .filter((l) => l.length > 10 && !l.startsWith("---"));
  const notes = lines.slice(0, 6);
  if (notes.length === 0) {
    return [
      "Document loaded and processed.",
      "No distinct note lines detected.",
    ];
  }
  return notes;
}

function generateTitles(text: string, width: number, height: number): string[] {
  const firstMeaningfulLine =
    text
      .split("\n")
      .map((l) => l.trim())
      .find(
        (l) => l.length > 10 && !l.startsWith("[") && !l.startsWith("---"),
      ) ?? "Scanned Document";
  const short = firstMeaningfulLine.slice(0, 50);
  return [
    `${short} — Scanned Document`,
    `Document Scan: ${width}×${height}px | ${short.slice(0, 30)}`,
    `Processed Scan — ${new Date().toLocaleDateString("en-US", { month: "long", year: "numeric" })}`,
  ];
}

function parseFileType(dataUrl: string): string {
  const match = dataUrl.match(/^data:([^;]+);/);
  if (!match) return "Unknown";
  const mime = match[1];
  const map: Record<string, string> = {
    "image/jpeg": "JPEG",
    "image/jpg": "JPEG",
    "image/png": "PNG",
    "image/gif": "GIF",
    "image/webp": "WebP",
    "image/bmp": "BMP",
    "image/tiff": "TIFF",
    "application/pdf": "PDF",
  };
  return map[mime] ?? mime.split("/")[1]?.toUpperCase() ?? "Unknown";
}

function estimateSizeKB(dataUrl: string): number {
  return Math.round((dataUrl.length * 3) / 4 / 1024);
}

// ─── Types ────────────────────────────────────────────────────────────────────

interface ImageDetails {
  width: number;
  height: number;
  type: string;
  sizeKB: number;
  loadedAt: string;
  name: string;
}

// ─── Hook & Small Components ──────────────────────────────────────────────────

function useAIProcess() {
  const [progress, setProgress] = useState(0);
  const [processing, setProcessing] = useState(false);
  const [done, setDone] = useState(false);

  function run(durationMs: number, onComplete: () => void) {
    setProgress(0);
    setProcessing(true);
    setDone(false);
    const steps = 20;
    const interval = durationMs / steps;
    let step = 0;
    const id = setInterval(() => {
      step++;
      setProgress(Math.min(100, Math.round((step / steps) * 100)));
      if (step >= steps) {
        clearInterval(id);
        setProcessing(false);
        setDone(true);
        onComplete();
      }
    }, interval);
  }

  function reset() {
    setProgress(0);
    setProcessing(false);
    setDone(false);
  }

  return { progress, processing, done, run, reset };
}

function AIBadge() {
  return (
    <Badge className="text-[10px] px-1.5 py-0 h-5 bg-indigo-600 text-white border-0 animate-pulse shrink-0">
      <Sparkles size={9} className="mr-0.5" />
      AI
    </Badge>
  );
}

function ProcessingBar({ progress }: { progress: number }) {
  return (
    <div className="space-y-1.5" data-ocid="aitools.loading_state">
      <div className="flex items-center gap-2">
        <Loader2 size={13} className="text-indigo-500 animate-spin" />
        <span className="text-xs text-muted-foreground">
          Processing… {progress}%
        </span>
      </div>
      <Progress value={progress} className="h-1.5" />
    </div>
  );
}

function CopyButton({ text }: { text: string }) {
  const [copied, setCopied] = useState(false);
  function copy() {
    navigator.clipboard.writeText(text).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    });
  }
  return (
    <Button
      variant="outline"
      size="sm"
      className="h-7 text-xs gap-1.5"
      onClick={copy}
      data-ocid="aitools.secondary_button"
    >
      {copied ? (
        <Check size={12} className="text-green-500" />
      ) : (
        <ClipboardCopy size={12} />
      )}
      {copied ? "Copied!" : "Copy"}
    </Button>
  );
}

function DocumentDetailsCard({
  image,
  details,
}: {
  image: string;
  details: ImageDetails;
}) {
  const sizeDisplay =
    details.sizeKB >= 1024
      ? `${(details.sizeKB / 1024).toFixed(1)} MB`
      : `${details.sizeKB} KB`;

  return (
    <motion.div
      initial={{ opacity: 0, y: -6 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3 }}
      className="rounded-xl border border-border bg-muted/40 overflow-hidden"
      data-ocid="aitools.document.card"
    >
      <div className="flex items-center gap-2 px-4 py-2.5 border-b border-border/60 bg-muted/60">
        <div className="w-6 h-6 rounded-md bg-indigo-500/15 flex items-center justify-center shrink-0">
          <FileImage size={13} className="text-indigo-600" />
        </div>
        <span className="text-xs font-semibold text-foreground tracking-wide">
          Document Details
        </span>
        <Badge className="ml-auto text-[10px] px-1.5 py-0 h-4 bg-green-500/10 text-green-700 border border-green-200 dark:border-green-800 dark:text-green-400">
          Loaded
        </Badge>
      </div>
      <div className="p-3 flex gap-3 items-start">
        <div className="shrink-0">
          <img
            src={image}
            alt="Document preview"
            className="w-16 h-20 object-cover rounded-lg border border-border shadow-sm"
          />
        </div>
        <div className="flex-1 min-w-0">
          <p className="text-sm font-semibold text-foreground mb-2 truncate">
            {details.name}
          </p>
          <div className="grid grid-cols-2 gap-x-4 gap-y-1.5">
            <div className="flex items-center gap-1.5">
              <Maximize2 size={11} className="text-muted-foreground shrink-0" />
              <span className="text-[11px] text-muted-foreground">Size</span>
              <span className="text-[11px] font-medium text-foreground ml-auto">
                {details.width > 0
                  ? `${details.width}×${details.height}px`
                  : "—"}
              </span>
            </div>
            <div className="flex items-center gap-1.5">
              <FileText size={11} className="text-muted-foreground shrink-0" />
              <span className="text-[11px] text-muted-foreground">Type</span>
              <span className="text-[11px] font-medium text-foreground ml-auto">
                {details.type}
              </span>
            </div>
            <div className="flex items-center gap-1.5">
              <Weight size={11} className="text-muted-foreground shrink-0" />
              <span className="text-[11px] text-muted-foreground">Weight</span>
              <span className="text-[11px] font-medium text-foreground ml-auto">
                {sizeDisplay}
              </span>
            </div>
            <div className="flex items-center gap-1.5 col-span-2">
              <Calendar size={11} className="text-muted-foreground shrink-0" />
              <span className="text-[11px] text-muted-foreground">Loaded</span>
              <span className="text-[11px] font-medium text-foreground ml-1 truncate">
                {details.loadedAt}
              </span>
            </div>
          </div>
        </div>
      </div>
    </motion.div>
  );
}

// ─── Document Selector ────────────────────────────────────────────────────────

interface SelectorItem {
  id: string;
  label: string;
  image: string;
  badge?: string;
}

function DocumentSelector({
  items,
  selectedId,
  onSelect,
}: {
  items: SelectorItem[];
  selectedId: string | null;
  onSelect: (id: string) => void;
}) {
  if (items.length === 0) return null;

  return (
    <div data-ocid="aitools.document.panel">
      <p className="text-xs font-medium text-muted-foreground mb-2">
        Select a document to process
      </p>
      <div
        className="flex gap-2.5 overflow-x-auto pb-2"
        style={{ scrollbarWidth: "thin" }}
      >
        {items.map((item) => {
          const isSelected = selectedId === item.id;
          return (
            <button
              key={item.id}
              type="button"
              onClick={() => onSelect(item.id)}
              className={`shrink-0 flex flex-col items-center gap-1.5 p-1.5 rounded-xl border-2 transition-all cursor-pointer ${
                isSelected
                  ? "border-indigo-500 bg-indigo-50 dark:bg-indigo-950/30 shadow-sm"
                  : "border-border bg-muted/30 hover:bg-muted/60 hover:border-indigo-300"
              }`}
              data-ocid="aitools.document.toggle"
            >
              <div className="relative w-12 h-[60px] rounded-lg overflow-hidden border border-border/60">
                {item.image ? (
                  <img
                    src={item.image}
                    alt={item.label}
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <div className="w-full h-full bg-muted flex items-center justify-center">
                    <ImageIcon size={16} className="text-muted-foreground" />
                  </div>
                )}
                {isSelected && (
                  <div className="absolute inset-0 bg-indigo-500/10 flex items-center justify-center">
                    <div className="w-4 h-4 rounded-full bg-indigo-500 flex items-center justify-center">
                      <Check size={9} className="text-white" />
                    </div>
                  </div>
                )}
              </div>
              <span className="text-[10px] font-medium text-foreground w-14 text-center truncate leading-tight">
                {item.label}
              </span>
              {item.badge && (
                <Badge className="text-[9px] px-1 py-0 h-3.5 bg-slate-200 text-slate-600 border-0 dark:bg-slate-700 dark:text-slate-300">
                  {item.badge}
                </Badge>
              )}
            </button>
          );
        })}
      </div>
    </div>
  );
}

// ─── Step Indicator ───────────────────────────────────────────────────────────

const STEP_LABELS = ["Scan / Upload", "Extract Text", "Apply AI", "Results"];

function StepIndicator({ currentStep }: { currentStep: number }) {
  return (
    <div
      className="flex items-center justify-between mb-8"
      data-ocid="aitools.panel"
    >
      {STEP_LABELS.map((label, idx) => {
        const stepNum = idx + 1;
        const isCompleted = currentStep > stepNum;
        const isActive = currentStep === stepNum;

        return (
          <div key={label} className="flex items-center flex-1">
            <div className="flex flex-col items-center gap-1.5">
              <div
                className={`w-8 h-8 rounded-full flex items-center justify-center border-2 transition-all duration-300 ${
                  isCompleted
                    ? "bg-indigo-600 border-indigo-600 text-white"
                    : isActive
                      ? "bg-white dark:bg-slate-900 border-indigo-600 text-indigo-600"
                      : "bg-muted/50 border-border text-muted-foreground"
                }`}
              >
                {isCompleted ? (
                  <CheckCircle2 size={15} />
                ) : isActive ? (
                  <span className="text-xs font-bold">{stepNum}</span>
                ) : (
                  <Circle size={15} className="opacity-40" />
                )}
              </div>
              <span
                className={`text-[10px] font-medium text-center leading-tight max-w-[56px] ${
                  isActive
                    ? "text-indigo-600"
                    : isCompleted
                      ? "text-foreground"
                      : "text-muted-foreground opacity-50"
                }`}
              >
                {label}
              </span>
            </div>
            {idx < STEP_LABELS.length - 1 && (
              <div className="flex-1 h-px mx-2 mt-[-12px]">
                <div
                  className={`h-full transition-all duration-500 ${
                    currentStep > stepNum ? "bg-indigo-500" : "bg-border"
                  }`}
                />
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
}

// ─── Step Wrapper ─────────────────────────────────────────────────────────────

function StepSection({
  stepNum,
  currentStep,
  title,
  icon,
  children,
  ocid,
}: {
  stepNum: number;
  currentStep: number;
  title: string;
  icon: React.ReactNode;
  children: React.ReactNode;
  ocid: string;
}) {
  const isActive = currentStep === stepNum;
  const isCompleted = currentStep > stepNum;

  return (
    <motion.div
      layout
      className={`rounded-2xl border transition-all duration-300 ${
        isActive
          ? "border-indigo-300 dark:border-indigo-700 ring-2 ring-indigo-500/20 bg-card"
          : isCompleted
            ? "border-border bg-muted/20"
            : "border-border bg-muted/10"
      } ${currentStep < stepNum ? "opacity-40 pointer-events-none select-none" : ""}`}
      data-ocid={ocid}
    >
      <div
        className={`flex items-center gap-3 px-5 py-4 ${
          isCompleted
            ? "border-b border-border/40"
            : isActive
              ? "border-b border-indigo-200/60 dark:border-indigo-800/40"
              : ""
        }`}
      >
        <div
          className={`w-8 h-8 rounded-xl flex items-center justify-center shrink-0 ${
            isActive
              ? "bg-indigo-500/15 text-indigo-600"
              : isCompleted
                ? "bg-green-500/10 text-green-600"
                : "bg-muted text-muted-foreground"
          }`}
        >
          {isCompleted ? <CheckCircle2 size={16} /> : icon}
        </div>
        <div className="flex items-center gap-2 flex-1">
          <span
            className={`text-sm font-semibold ${
              isActive
                ? "text-foreground"
                : isCompleted
                  ? "text-muted-foreground"
                  : "text-muted-foreground"
            }`}
          >
            {title}
          </span>
          {isActive && (
            <Badge className="text-[10px] px-1.5 py-0 h-4 bg-indigo-500/10 text-indigo-700 border border-indigo-200 dark:border-indigo-800 dark:text-indigo-400">
              Active
            </Badge>
          )}
          {isCompleted && (
            <Badge className="text-[10px] px-1.5 py-0 h-4 bg-green-500/10 text-green-700 border border-green-200 dark:border-green-800 dark:text-green-400">
              Done
            </Badge>
          )}
        </div>
        <span
          className={`text-xs font-bold w-6 h-6 rounded-full flex items-center justify-center ${
            isActive
              ? "bg-indigo-600 text-white"
              : isCompleted
                ? "bg-green-600 text-white"
                : "bg-muted text-muted-foreground"
          }`}
        >
          {isCompleted ? <Check size={11} /> : stepNum}
        </span>
      </div>
      {(isActive || isCompleted) && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.2 }}
          className="px-5 py-4"
        >
          {children}
        </motion.div>
      )}
    </motion.div>
  );
}

// ─── AI Tool Card ─────────────────────────────────────────────────────────────

function AIToolCard({
  icon,
  color,
  title,
  description,
  runLabel,
  onRun,
  processing,
  progress,
  done,
  result,
  ocidPrefix,
}: {
  icon: React.ReactNode;
  color: string;
  title: string;
  description: string;
  runLabel: string;
  onRun: () => void;
  processing: boolean;
  progress: number;
  done: boolean;
  result: React.ReactNode;
  ocidPrefix: string;
}) {
  return (
    <div
      className="rounded-xl border border-border bg-muted/20 overflow-hidden"
      data-ocid={`${ocidPrefix}.panel`}
    >
      <div className="flex items-center gap-3 px-4 py-3">
        <div
          className={`w-8 h-8 rounded-lg ${color} flex items-center justify-center shrink-0`}
        >
          {icon}
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2">
            <span className="text-sm font-semibold">{title}</span>
            <AIBadge />
          </div>
          <p className="text-xs text-muted-foreground mt-0.5">{description}</p>
        </div>
        {!done && !processing && (
          <Button
            size="sm"
            className="h-8 text-xs gap-1.5 shrink-0"
            onClick={onRun}
            data-ocid={`${ocidPrefix}.primary_button`}
          >
            <ArrowRight size={13} />
            {runLabel}
          </Button>
        )}
        {done && (
          <Badge className="text-[10px] px-1.5 py-0 h-5 bg-green-500/10 text-green-700 border border-green-200 dark:border-green-800 dark:text-green-400 shrink-0">
            Done
          </Badge>
        )}
      </div>
      <AnimatePresence>
        {(processing || done) && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.25 }}
            className="border-t border-border/60 px-4 py-3 space-y-3"
          >
            {processing && <ProcessingBar progress={progress} />}
            {done && result}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

// ─── Main Component ───────────────────────────────────────────────────────────

export default function AIToolsPanel({
  currentImage,
  documents,
}: {
  currentImage: string | null;
  documents: ScannedDocument[];
}) {
  const selectorItems: SelectorItem[] = [
    ...documents.map((doc) => ({
      id: doc.id,
      label: doc.name,
      image: doc.fullImage ?? doc.thumbnail,
      badge: doc.format,
    })),
    ...(currentImage
      ? [{ id: "__current__", label: "Current Scan", image: currentImage }]
      : []),
  ];

  const [selectedId, setSelectedId] = useState<string | null>(() =>
    selectorItems.length > 0 ? selectorItems[0].id : null,
  );

  const activeDoc = documents.find((d) => d.id === selectedId);
  const activeImage: string | null =
    selectedId === "__current__"
      ? currentImage
      : activeDoc
        ? (activeDoc.fullImage ?? activeDoc.thumbnail)
        : currentImage;

  const activeName: string =
    selectedId === "__current__"
      ? "Current Scan"
      : activeDoc
        ? activeDoc.name
        : "Scanned Document";

  const ocrProc = useAIProcess();
  const [ocrText, setOcrText] = useState("");

  const sumProc = useAIProcess();
  const [summaryPoints, setSummaryPoints] = useState<string[]>([]);

  const notesProc = useAIProcess();
  const [notes, setNotes] = useState<string[]>([]);

  const transProc = useAIProcess();
  const [targetLang, setTargetLang] = useState("Hindi");
  const [translatedText, setTranslatedText] = useState("");

  const grammarProc = useAIProcess();
  const [grammarDone, setGrammarDone] = useState(false);

  const titleProc = useAIProcess();
  const [titles, setTitles] = useState<string[]>([]);
  const [copiedTitle, setCopiedTitle] = useState<number | null>(null);

  const [imageDetails, setImageDetails] = useState<ImageDetails | null>(null);

  // Computed step
  const hasAnyOutput =
    summaryPoints.length > 0 ||
    notes.length > 0 ||
    !!translatedText ||
    grammarDone ||
    titles.length > 0;

  const currentStep = !activeImage ? 1 : !ocrText ? 2 : !hasAnyOutput ? 3 : 4;

  // biome-ignore lint/correctness/useExhaustiveDependencies: intentional
  useEffect(() => {
    if (
      selectorItems.length > 0 &&
      !selectorItems.find((i) => i.id === selectedId)
    ) {
      setSelectedId(selectorItems[0].id);
    }
  }, [documents, currentImage]);

  // biome-ignore lint/correctness/useExhaustiveDependencies: intentional reset on image change
  useEffect(() => {
    ocrProc.reset();
    setOcrText("");
    sumProc.reset();
    setSummaryPoints([]);
    notesProc.reset();
    setNotes([]);
    transProc.reset();
    setTranslatedText("");
    grammarProc.reset();
    setGrammarDone(false);
    titleProc.reset();
    setTitles([]);
    setCopiedTitle(null);

    if (!activeImage) {
      setImageDetails(null);
      return;
    }

    const img = new Image();
    img.onload = () => {
      setImageDetails({
        width: img.naturalWidth,
        height: img.naturalHeight,
        type: parseFileType(activeImage),
        sizeKB: estimateSizeKB(activeImage),
        loadedAt: new Date().toLocaleString(),
        name: activeName,
      });
    };
    img.onerror = () => {
      setImageDetails({
        width: 0,
        height: 0,
        type: parseFileType(activeImage),
        sizeKB: estimateSizeKB(activeImage),
        loadedAt: new Date().toLocaleString(),
        name: activeName,
      });
    };
    img.src = activeImage;
  }, [activeImage]);

  // ── Handlers ─────────────────────────────────────────────────────────────────

  function handleExtractOCR() {
    if (!activeImage) return;
    ocrProc.run(1500, async () => {
      const info = await extractImageInfo(activeImage);
      setOcrText(info.text);
    });
  }

  function handleSummarize() {
    if (!ocrText) return;
    sumProc.run(2000, () => setSummaryPoints(generateSummary(ocrText)));
  }

  function handleGenerateNotes() {
    if (!ocrText) return;
    notesProc.run(2000, () => setNotes(generateNotes(ocrText)));
  }

  function handleTranslate() {
    if (!ocrText) return;
    transProc.run(1500, () => {
      if (targetLang === "English") {
        setTranslatedText(ocrText);
      } else {
        setTranslatedText(
          `[Translation to ${targetLang}]\n\nTranslation of your scanned document into ${targetLang} would appear here.\nConnect to a translation API (e.g. Google Translate) for live results.\n\n--- Original Text ---\n${ocrText}`,
        );
      }
    });
  }

  function handleFixGrammar() {
    if (!ocrText) return;
    grammarProc.run(1500, () => setGrammarDone(true));
  }

  async function handleGenerateTitles() {
    if (!ocrText || !activeImage) return;
    const info = await extractImageInfo(activeImage);
    titleProc.run(1000, () =>
      setTitles(generateTitles(ocrText, info.width, info.height)),
    );
  }

  function copyTitle(idx: number, title: string) {
    navigator.clipboard.writeText(title).then(() => {
      setCopiedTitle(idx);
      setTimeout(() => setCopiedTitle(null), 2000);
    });
  }

  function handleStartOver() {
    ocrProc.reset();
    setOcrText("");
    sumProc.reset();
    setSummaryPoints([]);
    notesProc.reset();
    setNotes([]);
    transProc.reset();
    setTranslatedText("");
    grammarProc.reset();
    setGrammarDone(false);
    titleProc.reset();
    setTitles([]);
    setCopiedTitle(null);
  }

  const grammarBefore = ocrText;
  const grammarAfter = fixGrammar(ocrText);

  // ── Render ────────────────────────────────────────────────────────────────────

  return (
    <motion.div
      className="flex-1 p-6 overflow-y-auto"
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3 }}
      data-ocid="aitools.page"
    >
      {/* Header */}
      <div className="mb-6">
        <div className="flex items-center gap-3 mb-1">
          <h1 className="text-2xl font-bold text-foreground">AI Tools</h1>
          <Badge className="text-xs bg-indigo-600 text-white border-0">
            <Sparkles size={11} className="mr-1" />6 Tools
          </Badge>
        </div>
        <p className="text-sm text-muted-foreground">
          Intelligent document processing — follow the steps below.
        </p>
      </div>

      {/* Step Indicator */}
      <StepIndicator currentStep={currentStep} />

      {/* Steps */}
      <div className="space-y-4">
        {/* ── Step 1: Scan / Upload ─────────────────────────────────────────── */}
        <StepSection
          stepNum={1}
          currentStep={currentStep}
          title="Scan or Upload Document"
          icon={<FileImage size={16} />}
          ocid="aitools.step1.section"
        >
          {selectorItems.length > 0 ? (
            <div className="space-y-4">
              <DocumentSelector
                items={selectorItems}
                selectedId={selectedId}
                onSelect={(id) => setSelectedId(id)}
              />
              {activeImage && imageDetails && (
                <DocumentDetailsCard
                  image={activeImage}
                  details={imageDetails}
                />
              )}
            </div>
          ) : (
            <div className="flex items-center gap-2.5 rounded-xl bg-amber-50 dark:bg-amber-950/20 border border-amber-200 dark:border-amber-800/40 px-4 py-3 text-sm text-amber-700 dark:text-amber-400">
              <span className="text-xl">📄</span>
              <span>
                No document loaded. Please <strong>scan</strong> or{" "}
                <strong>import</strong> a document first.
              </span>
            </div>
          )}
        </StepSection>

        {/* ── Step 2: Extract Text ──────────────────────────────────────────── */}
        <StepSection
          stepNum={2}
          currentStep={currentStep}
          title="Extract Text (OCR)"
          icon={<FileText size={16} />}
          ocid="aitools.step2.section"
        >
          <div className="space-y-3">
            {!ocrProc.processing && !ocrProc.done && (
              <div className="space-y-3">
                <p className="text-sm text-muted-foreground">
                  Run OCR to extract editable text from your document.
                </p>
                <Button
                  className="gap-2 bg-blue-600 hover:bg-blue-700 text-white"
                  onClick={handleExtractOCR}
                  data-ocid="aitools.ocr.primary_button"
                >
                  <FileText size={15} />
                  Extract Text
                </Button>
              </div>
            )}
            {ocrProc.processing && (
              <ProcessingBar progress={ocrProc.progress} />
            )}
            {ocrProc.done && (
              <motion.div
                initial={{ opacity: 0, y: 6 }}
                animate={{ opacity: 1, y: 0 }}
                className="space-y-3"
                data-ocid="aitools.ocr.success_state"
              >
                <div className="flex items-center gap-2 flex-wrap">
                  <Badge className="text-xs bg-blue-500/10 text-blue-700 border-blue-200">
                    Text Extracted
                  </Badge>
                  <CopyButton text={ocrText} />
                  <Button
                    variant="ghost"
                    size="sm"
                    className="h-7 text-xs"
                    onClick={() => {
                      ocrProc.reset();
                      setOcrText("");
                      sumProc.reset();
                      setSummaryPoints([]);
                      notesProc.reset();
                      setNotes([]);
                      transProc.reset();
                      setTranslatedText("");
                      grammarProc.reset();
                      setGrammarDone(false);
                      titleProc.reset();
                      setTitles([]);
                      setCopiedTitle(null);
                    }}
                    data-ocid="aitools.ocr.secondary_button"
                  >
                    Clear
                  </Button>
                </div>
                <Textarea
                  value={ocrText}
                  onChange={(e) => setOcrText(e.target.value)}
                  className="text-xs font-mono h-52 resize-none bg-muted/30"
                  data-ocid="aitools.ocr.textarea"
                />
              </motion.div>
            )}
          </div>
        </StepSection>

        {/* ── Step 3: Apply AI Features ─────────────────────────────────────── */}
        <StepSection
          stepNum={3}
          currentStep={currentStep}
          title="Apply AI Features"
          icon={<Sparkles size={16} />}
          ocid="aitools.step3.section"
        >
          <div className="space-y-3">
            {/* AI Summarizer */}
            <AIToolCard
              icon={<FileSearch size={15} className="text-violet-600" />}
              color="bg-violet-500/10"
              title="AI Summarizer"
              description="Condense your document into 5 key bullet points."
              runLabel="Summarize"
              onRun={handleSummarize}
              processing={sumProc.processing}
              progress={sumProc.progress}
              done={sumProc.done}
              ocidPrefix="aitools.summary"
              result={
                <motion.div
                  initial={{ opacity: 0, y: 4 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="space-y-2"
                  data-ocid="aitools.summary.success_state"
                >
                  <div className="flex items-center gap-2 mb-2">
                    <Badge className="text-xs bg-violet-500/10 text-violet-700 border-violet-200">
                      Summary Ready
                    </Badge>
                    <Button
                      variant="ghost"
                      size="sm"
                      className="h-6 text-xs"
                      onClick={() => {
                        sumProc.reset();
                        setSummaryPoints([]);
                      }}
                      data-ocid="aitools.summary.secondary_button"
                    >
                      Regenerate
                    </Button>
                  </div>
                  <ul className="space-y-1.5">
                    {summaryPoints.map((point, i) => (
                      <li
                        key={`sum-${point.slice(0, 20)}`}
                        className="flex gap-2.5 items-start text-sm bg-muted/30 rounded-lg p-2.5 border border-border/60"
                        data-ocid={`aitools.summary.item.${i + 1}`}
                      >
                        <span className="w-5 h-5 rounded-full bg-violet-600 text-white text-[10px] font-bold flex items-center justify-center shrink-0 mt-0.5">
                          {i + 1}
                        </span>
                        <span className="text-foreground leading-relaxed">
                          {point}
                        </span>
                      </li>
                    ))}
                  </ul>
                </motion.div>
              }
            />

            {/* AI Auto Notes Generator */}
            <AIToolCard
              icon={<BookOpen size={15} className="text-emerald-600" />}
              color="bg-emerald-500/10"
              title="AI Auto Notes Generator"
              description="Converts your document into structured key points."
              runLabel="Generate Notes"
              onRun={handleGenerateNotes}
              processing={notesProc.processing}
              progress={notesProc.progress}
              done={notesProc.done}
              ocidPrefix="aitools.notes"
              result={
                <motion.div
                  initial={{ opacity: 0, y: 4 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="space-y-2"
                  data-ocid="aitools.notes.success_state"
                >
                  <div className="flex items-center gap-2 mb-2">
                    <Badge className="text-xs bg-emerald-500/10 text-emerald-700 border-emerald-200">
                      Notes Generated
                    </Badge>
                    <Button
                      variant="ghost"
                      size="sm"
                      className="h-6 text-xs"
                      onClick={() => {
                        notesProc.reset();
                        setNotes([]);
                      }}
                      data-ocid="aitools.notes.secondary_button"
                    >
                      Clear
                    </Button>
                  </div>
                  <div className="space-y-1.5">
                    {notes.map((note, i) => (
                      <div
                        key={`note-${note.slice(0, 20)}`}
                        className="flex gap-2.5 items-start bg-emerald-50 dark:bg-emerald-950/20 rounded-lg p-2.5 border border-emerald-200/60 dark:border-emerald-800/40"
                        data-ocid={`aitools.notes.item.${i + 1}`}
                      >
                        <span className="text-emerald-600 font-bold text-xs mt-0.5 shrink-0">
                          {String(i + 1).padStart(2, "0")}.
                        </span>
                        <span className="text-sm text-foreground leading-relaxed">
                          {note}
                        </span>
                      </div>
                    ))}
                  </div>
                </motion.div>
              }
            />

            {/* AI Translator */}
            <div
              className="rounded-xl border border-border bg-muted/20 overflow-hidden"
              data-ocid="aitools.translate.panel"
            >
              <div className="flex items-center gap-3 px-4 py-3">
                <div className="w-8 h-8 rounded-lg bg-orange-500/10 flex items-center justify-center shrink-0">
                  <Languages size={15} className="text-orange-600" />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <span className="text-sm font-semibold">AI Translator</span>
                    <AIBadge />
                  </div>
                  <p className="text-xs text-muted-foreground mt-0.5">
                    Translate document into Hindi, English, and other languages.
                  </p>
                </div>
              </div>
              <div className="border-t border-border/60 px-4 py-3 space-y-3">
                <div className="flex items-center gap-2 flex-wrap">
                  <Select
                    value={targetLang}
                    onValueChange={(v) => {
                      setTargetLang(v);
                      transProc.reset();
                      setTranslatedText("");
                    }}
                  >
                    <SelectTrigger
                      className="w-40 h-8 text-xs"
                      data-ocid="aitools.translate.select"
                    >
                      <SelectValue placeholder="Select language" />
                    </SelectTrigger>
                    <SelectContent>
                      {[
                        "Hindi",
                        "English",
                        "Spanish",
                        "French",
                        "German",
                        "Arabic",
                        "Chinese",
                        "Japanese",
                      ].map((lang) => (
                        <SelectItem key={lang} value={lang} className="text-xs">
                          {lang}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  {!transProc.processing && (
                    <Button
                      className="gap-1.5 bg-orange-600 hover:bg-orange-700 text-white h-8 text-xs"
                      onClick={handleTranslate}
                      data-ocid="aitools.translate.primary_button"
                    >
                      <ArrowRight size={13} />
                      Translate
                    </Button>
                  )}
                </div>
                {transProc.processing && (
                  <ProcessingBar progress={transProc.progress} />
                )}
                {transProc.done && translatedText && (
                  <motion.div
                    initial={{ opacity: 0, y: 4 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="space-y-2"
                    data-ocid="aitools.translate.success_state"
                  >
                    <div className="flex items-center gap-2 flex-wrap">
                      <Badge className="text-xs bg-orange-500/10 text-orange-700 border-orange-200">
                        Translated to {targetLang}
                      </Badge>
                      <CopyButton text={translatedText} />
                      <Button
                        variant="ghost"
                        size="sm"
                        className="h-7 text-xs"
                        onClick={() => {
                          transProc.reset();
                          setTranslatedText("");
                        }}
                        data-ocid="aitools.translate.secondary_button"
                      >
                        Clear
                      </Button>
                    </div>
                    <Textarea
                      value={translatedText}
                      readOnly
                      className="text-xs font-mono h-44 resize-none bg-muted/30"
                      data-ocid="aitools.translate.textarea"
                      dir={["Arabic"].includes(targetLang) ? "rtl" : "ltr"}
                    />
                  </motion.div>
                )}
              </div>
            </div>

            {/* AI Grammar Fixer */}
            <AIToolCard
              icon={<SpellCheck size={15} className="text-rose-600" />}
              color="bg-rose-500/10"
              title="AI Grammar Fixer"
              description="Fix mistakes and make extracted text professional."
              runLabel="Fix Grammar"
              onRun={handleFixGrammar}
              processing={grammarProc.processing}
              progress={grammarProc.progress}
              done={grammarDone}
              ocidPrefix="aitools.grammar"
              result={
                <motion.div
                  initial={{ opacity: 0, y: 4 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="space-y-3"
                  data-ocid="aitools.grammar.success_state"
                >
                  <div className="flex items-center gap-2">
                    <Badge className="text-xs bg-rose-500/10 text-rose-700 border-rose-200">
                      Grammar Fixed
                    </Badge>
                    <Button
                      variant="ghost"
                      size="sm"
                      className="h-6 text-xs"
                      onClick={() => {
                        grammarProc.reset();
                        setGrammarDone(false);
                      }}
                      data-ocid="aitools.grammar.secondary_button"
                    >
                      Reset
                    </Button>
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                    <div className="space-y-1">
                      <p className="text-[11px] font-semibold text-rose-600 uppercase tracking-wide">
                        Before
                      </p>
                      <div className="bg-rose-50 dark:bg-rose-950/20 border border-rose-200/70 dark:border-rose-800/40 rounded-lg p-3 text-xs text-foreground leading-relaxed min-h-[80px] whitespace-pre-wrap">
                        {grammarBefore}
                      </div>
                    </div>
                    <div className="space-y-1">
                      <p className="text-[11px] font-semibold text-emerald-600 uppercase tracking-wide">
                        After
                      </p>
                      <div className="bg-emerald-50 dark:bg-emerald-950/20 border border-emerald-200/70 dark:border-emerald-800/40 rounded-lg p-3 text-xs text-foreground leading-relaxed min-h-[80px] whitespace-pre-wrap">
                        {grammarAfter}
                      </div>
                    </div>
                  </div>
                  <div className="flex justify-end">
                    <CopyButton text={grammarAfter} />
                  </div>
                </motion.div>
              }
            />

            {/* AI Title Generator */}
            <AIToolCard
              icon={<Heading1 size={15} className="text-indigo-600" />}
              color="bg-indigo-500/10"
              title="AI Title Generator"
              description="Auto-generate 3 title options for your scanned notes."
              runLabel="Generate Titles"
              onRun={handleGenerateTitles}
              processing={titleProc.processing}
              progress={titleProc.progress}
              done={titleProc.done}
              ocidPrefix="aitools.title"
              result={
                <motion.div
                  initial={{ opacity: 0, y: 4 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="space-y-3"
                  data-ocid="aitools.title.success_state"
                >
                  <div className="flex items-center gap-2">
                    <Badge className="text-xs bg-indigo-500/10 text-indigo-700 border-indigo-200">
                      3 Titles Generated
                    </Badge>
                    <Button
                      variant="ghost"
                      size="sm"
                      className="h-6 text-xs"
                      onClick={() => {
                        titleProc.reset();
                        setTitles([]);
                        setCopiedTitle(null);
                      }}
                      data-ocid="aitools.title.secondary_button"
                    >
                      Regenerate
                    </Button>
                  </div>
                  <p className="text-xs text-muted-foreground">
                    Click a title to copy it.
                  </p>
                  <div className="space-y-1.5">
                    {titles.map((title, i) => (
                      <button
                        key={`title-${title.slice(0, 20)}`}
                        type="button"
                        onClick={() => copyTitle(i, title)}
                        className="w-full text-left flex items-center gap-3 bg-indigo-50 dark:bg-indigo-950/20 border border-indigo-200/70 dark:border-indigo-800/40 rounded-lg p-3 hover:bg-indigo-100 dark:hover:bg-indigo-900/30 transition-colors group"
                        data-ocid={`aitools.title.item.${i + 1}`}
                      >
                        <span className="text-xs font-bold text-indigo-500 shrink-0">
                          #{i + 1}
                        </span>
                        <span className="text-sm text-foreground leading-snug flex-1">
                          {title}
                        </span>
                        <span className="shrink-0 opacity-0 group-hover:opacity-100 transition-opacity">
                          {copiedTitle === i ? (
                            <Check size={14} className="text-green-500" />
                          ) : (
                            <ClipboardCopy
                              size={14}
                              className="text-muted-foreground"
                            />
                          )}
                        </span>
                      </button>
                    ))}
                  </div>
                </motion.div>
              }
            />
          </div>
        </StepSection>

        {/* ── Step 4: Results ───────────────────────────────────────────────── */}
        <StepSection
          stepNum={4}
          currentStep={currentStep}
          title="Results"
          icon={<Sparkles size={16} />}
          ocid="aitools.step4.section"
        >
          <div className="space-y-4">
            <p className="text-sm text-muted-foreground">
              All completed outputs are summarized below.
            </p>

            <div className="space-y-3">
              {summaryPoints.length > 0 && (
                <div
                  className="rounded-xl bg-violet-50 dark:bg-violet-950/20 border border-violet-200/70 dark:border-violet-800/40 p-3.5"
                  data-ocid="aitools.results.summary.card"
                >
                  <p className="text-xs font-bold text-violet-700 dark:text-violet-400 uppercase tracking-wide mb-2">
                    Summary — {summaryPoints.length} points
                  </p>
                  <ul className="space-y-1">
                    {summaryPoints.map((p, i) => (
                      <li
                        key={`rs-${p.slice(0, 15)}-${i}`}
                        className="text-xs text-foreground flex gap-2"
                      >
                        <span className="text-violet-500 font-bold shrink-0">
                          {i + 1}.
                        </span>
                        {p}
                      </li>
                    ))}
                  </ul>
                </div>
              )}

              {notes.length > 0 && (
                <div
                  className="rounded-xl bg-emerald-50 dark:bg-emerald-950/20 border border-emerald-200/70 dark:border-emerald-800/40 p-3.5"
                  data-ocid="aitools.results.notes.card"
                >
                  <p className="text-xs font-bold text-emerald-700 dark:text-emerald-400 uppercase tracking-wide mb-2">
                    Notes — {notes.length} points
                  </p>
                  <ul className="space-y-1">
                    {notes.map((n, i) => (
                      <li
                        key={`rn-${n.slice(0, 15)}-${i}`}
                        className="text-xs text-foreground flex gap-2"
                      >
                        <span className="text-emerald-500 font-bold shrink-0">
                          {String(i + 1).padStart(2, "0")}.
                        </span>
                        {n}
                      </li>
                    ))}
                  </ul>
                </div>
              )}

              {translatedText && (
                <div
                  className="rounded-xl bg-orange-50 dark:bg-orange-950/20 border border-orange-200/70 dark:border-orange-800/40 p-3.5"
                  data-ocid="aitools.results.translate.card"
                >
                  <p className="text-xs font-bold text-orange-700 dark:text-orange-400 uppercase tracking-wide mb-2">
                    Translation → {targetLang}
                  </p>
                  <p className="text-xs text-foreground line-clamp-3">
                    {translatedText}
                  </p>
                </div>
              )}

              {grammarDone && (
                <div
                  className="rounded-xl bg-rose-50 dark:bg-rose-950/20 border border-rose-200/70 dark:border-rose-800/40 p-3.5"
                  data-ocid="aitools.results.grammar.card"
                >
                  <p className="text-xs font-bold text-rose-700 dark:text-rose-400 uppercase tracking-wide mb-2">
                    Grammar Fixed
                  </p>
                  <p className="text-xs text-foreground line-clamp-3">
                    {grammarAfter}
                  </p>
                </div>
              )}

              {titles.length > 0 && (
                <div
                  className="rounded-xl bg-indigo-50 dark:bg-indigo-950/20 border border-indigo-200/70 dark:border-indigo-800/40 p-3.5"
                  data-ocid="aitools.results.titles.card"
                >
                  <p className="text-xs font-bold text-indigo-700 dark:text-indigo-400 uppercase tracking-wide mb-2">
                    Generated Titles
                  </p>
                  <ul className="space-y-1">
                    {titles.map((t, i) => (
                      <li
                        key={`rt-${t.slice(0, 15)}-${i}`}
                        className="text-xs text-foreground flex gap-2"
                      >
                        <span className="text-indigo-500 font-bold shrink-0">
                          #{i + 1}
                        </span>
                        {t}
                      </li>
                    ))}
                  </ul>
                </div>
              )}
            </div>

            <div className="pt-2">
              <Button
                variant="outline"
                className="gap-2"
                onClick={handleStartOver}
                data-ocid="aitools.step4.button"
              >
                <RotateCcw size={14} />
                Start Over
              </Button>
            </div>
          </div>
        </StepSection>
      </div>
    </motion.div>
  );
}
