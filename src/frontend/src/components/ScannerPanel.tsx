import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { cn } from "@/lib/utils";
import {
  Camera,
  Check,
  FileDown,
  Image as ImageIcon,
  RotateCcw,
  RotateCw,
  ScanLine,
  SkipForward,
  Upload,
} from "lucide-react";
import { useCallback, useEffect, useRef, useState } from "react";
import { toast } from "sonner";
import { useIsMobile } from "../hooks/use-mobile";
import { getFullResBase64, imageToBase64 } from "../lib/imageFilters";
import { exportAsPDF } from "../lib/pdfExport";
import { detectDocumentCorners, perspectiveWarp } from "../lib/perspectiveWarp";
import type {
  FilterType,
  FormatType,
  QualityType,
  ScannedDocument,
} from "../types/document";
import { CameraModal } from "./CameraModal";

const CORNER_LABELS = ["tl", "tr", "br", "bl"] as const;

const FILTERS: { id: FilterType; label: string; dot: string }[] = [
  {
    id: "original",
    label: "Original",
    dot: "bg-gradient-to-br from-blue-300 to-amber-200",
  },
  {
    id: "grayscale",
    label: "Gray",
    dot: "bg-gradient-to-br from-gray-300 to-gray-500",
  },
  { id: "bw", label: "B&W", dot: "bg-gradient-to-br from-gray-900 to-white" },
  {
    id: "enhance",
    label: "Enhance",
    dot: "bg-gradient-to-br from-yellow-300 to-orange-400",
  },
  {
    id: "magic",
    label: "Magic",
    dot: "bg-gradient-to-br from-blue-400 to-indigo-600",
  },
];

interface ScannerPanelProps {
  onDocumentSaved: (doc: ScannedDocument) => void;
  onImageChange?: (src: string | null) => void;
  mobileOpen?: boolean;
  onMobileClose?: () => void;
}

export function ScannerPanel({
  onDocumentSaved,
  onImageChange,
  mobileOpen = false,
  onMobileClose,
}: ScannerPanelProps) {
  const isMobile = useIsMobile();
  const [cameraOpen, setCameraOpen] = useState(false);
  const [imageSrc, setImageSrc] = useState<string | null>(null);
  const [filter, setFilter] = useState<FilterType>("original");
  const [rotation, setRotation] = useState(0);
  const [docName, setDocName] = useState("Scanned Document");
  const [format, setFormat] = useState<FormatType>("PDF");
  const [quality, setQuality] = useState<QualityType>("High");
  const [isExporting, setIsExporting] = useState(false);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);

  // Crop / edge-detection state
  const [cropMode, setCropMode] = useState(false);
  const [corners, setCorners] = useState<[number, number][]>([]);
  const [draggingIdx, setDraggingIdx] = useState<number | null>(null);
  const cropContainerRef = useRef<HTMLDivElement>(null);

  const fileInputRef = useRef<HTMLInputElement>(null);
  const imgRef = useRef<HTMLImageElement>(null);

  const regeneratePreview = useCallback(() => {
    if (!imgRef.current || !imageSrc) return;
    const img = imgRef.current;
    if (!img.complete || img.naturalWidth === 0) return;
    const thumb = imageToBase64(img, filter, rotation, 400, 520);
    setPreviewUrl(thumb);
  }, [imageSrc, filter, rotation]);

  useEffect(() => {
    if (!cropMode) regeneratePreview();
  }, [regeneratePreview, cropMode]);

  function handleImageLoaded() {
    const img = imgRef.current;
    if (!img || img.naturalWidth === 0) return;
    const detected = detectDocumentCorners(img);
    setCorners(detected);
    setCropMode(true);
  }

  function handleFileSelect(file: File) {
    const url = URL.createObjectURL(file);
    setImageSrc(url);
    onImageChange?.(url);
    setPreviewUrl(null);
    setRotation(0);
    setCropMode(false);
    setCorners([]);
    const nameWithoutExt = file.name.replace(/\.[^.]+$/, "");
    setDocName(nameWithoutExt || "Scanned Document");
  }

  function handleUploadClick() {
    fileInputRef.current?.click();
  }

  function handleFileInputChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (file) handleFileSelect(file);
  }

  function handleCameraCapture(file: File) {
    handleFileSelect(file);
  }

  function rotateLeft() {
    setRotation((r) => (r - 90 + 360) % 360);
  }

  function rotateRight() {
    setRotation((r) => (r + 90) % 360);
  }

  function applyCrop() {
    if (!imgRef.current || corners.length < 4) {
      setCropMode(false);
      return;
    }
    const warped = perspectiveWarp(imgRef.current, corners);
    setImageSrc(warped);
    onImageChange?.(warped);
    setCropMode(false);
    toast.success("Perspective correction applied!");
  }

  function imageCornersToDisplay(imgEl: HTMLImageElement): [number, number][] {
    const container = cropContainerRef.current;
    if (!container) return corners;
    const cw = container.clientWidth;
    const ch = container.clientHeight;
    const natW = imgEl.naturalWidth;
    const natH = imgEl.naturalHeight;
    const scale = Math.min(cw / natW, ch / natH);
    const dispW = natW * scale;
    const dispH = natH * scale;
    const offsetX = (cw - dispW) / 2;
    const offsetY = (ch - dispH) / 2;
    return corners.map(
      ([x, y]) =>
        [offsetX + x * scale, offsetY + y * scale] as [number, number],
    );
  }

  function displayCoordsToImage(
    dispX: number,
    dispY: number,
    imgEl: HTMLImageElement,
  ): [number, number] {
    const container = cropContainerRef.current;
    if (!container) return [dispX, dispY];
    const cw = container.clientWidth;
    const ch = container.clientHeight;
    const natW = imgEl.naturalWidth;
    const natH = imgEl.naturalHeight;
    const scale = Math.min(cw / natW, ch / natH);
    const dispW = natW * scale;
    const dispH = natH * scale;
    const offsetX = (cw - dispW) / 2;
    const offsetY = (ch - dispH) / 2;
    const imgX = Math.max(0, Math.min(natW, (dispX - offsetX) / scale));
    const imgY = Math.max(0, Math.min(natH, (dispY - offsetY) / scale));
    return [imgX, imgY];
  }

  function handleOverlayPointerMove(e: React.PointerEvent<SVGSVGElement>) {
    if (draggingIdx === null || !imgRef.current) return;
    const rect = e.currentTarget.getBoundingClientRect();
    const dispX = e.clientX - rect.left;
    const dispY = e.clientY - rect.top;
    const [imgX, imgY] = displayCoordsToImage(dispX, dispY, imgRef.current);
    setCorners((prev) => {
      const next = [...prev] as [number, number][];
      next[draggingIdx] = [imgX, imgY];
      return next;
    });
  }

  function handleOverlayPointerUp() {
    setDraggingIdx(null);
  }

  async function handleExport() {
    if (!imgRef.current || !imageSrc) {
      toast.error("Please load an image first.");
      return;
    }

    setIsExporting(true);
    try {
      const fullBase64 = getFullResBase64(imgRef.current, filter, rotation);
      const thumb = imageToBase64(imgRef.current, filter, rotation, 200, 260);

      if (format === "PDF") {
        await exportAsPDF(fullBase64, docName, quality);
      } else {
        const link = document.createElement("a");
        link.href = fullBase64;
        link.download = `${docName}.${format.toLowerCase()}`;
        link.click();
      }

      const doc: ScannedDocument = {
        id: Date.now().toString(),
        name: docName,
        format,
        quality,
        filter,
        createdAt: new Date().toISOString(),
        thumbnail: thumb,
        fullImage: fullBase64,
      };

      onDocumentSaved(doc);
      toast.success(`Exported "${docName}.pdf" successfully!`);
    } catch (_err) {
      toast.error("Export failed. Please try again.");
    } finally {
      setIsExporting(false);
    }
  }

  const displayCorners =
    cropMode && imgRef.current ? imageCornersToDisplay(imgRef.current) : [];
  const polygonPoints = displayCorners.map((c) => `${c[0]},${c[1]}`).join(" ");

  return (
    <>
      {/* Mobile backdrop */}
      {isMobile && mobileOpen && (
        <div
          className="fixed inset-0 bg-black/60 z-40"
          onClick={onMobileClose}
          onKeyDown={(e) => e.key === "Escape" && onMobileClose?.()}
          role="button"
          tabIndex={-1}
          aria-label="Close scanner"
        />
      )}
      <aside
        className={cn(
          "fixed right-0 top-0 h-full w-80 bg-card border-l border-border flex flex-col",
          isMobile
            ? cn(
                "z-50 transition-transform duration-300",
                mobileOpen ? "translate-x-0" : "translate-x-full",
              )
            : "z-20 hidden md:flex",
        )}
        data-ocid="scanner.panel"
      >
        {/* Header */}
        <div className="px-5 py-4 border-b border-border flex items-center gap-2">
          <ScanLine size={16} className="text-blue-500 shrink-0" />
          <div>
            <h2 className="font-semibold text-sm text-foreground leading-tight">
              Active Scanner
            </h2>
            <p className="text-xs text-muted-foreground">Capture &amp; Edit</p>
          </div>
        </div>

        <div className="flex-1 overflow-y-auto">
          {/* Preview / Crop Mode */}
          <div className="p-4">
            <div
              ref={cropContainerRef}
              className="relative rounded-lg overflow-hidden bg-muted border border-border flex items-center justify-center"
              style={{ height: "260px" }}
            >
              {cropMode && imageSrc ? (
                <>
                  <img
                    src={imageSrc}
                    alt="Crop preview"
                    className="max-w-full max-h-full object-contain select-none"
                    draggable={false}
                  />
                  {/* SVG overlay for corner handles */}
                  <svg
                    aria-label="Document edge correction overlay"
                    role="img"
                    className="absolute inset-0 w-full h-full cursor-crosshair"
                    onPointerMove={handleOverlayPointerMove}
                    onPointerUp={handleOverlayPointerUp}
                    onPointerLeave={handleOverlayPointerUp}
                  >
                    {displayCorners.length === 4 && (
                      <>
                        <polygon
                          points={polygonPoints}
                          fill="rgba(37, 99, 235, 0.12)"
                          stroke="#2563eb"
                          strokeWidth="2"
                          strokeDasharray="6 3"
                          className="animate-pulse"
                        />
                        {displayCorners.map((c, idx) => (
                          <g key={CORNER_LABELS[idx]}>
                            <circle
                              cx={c[0]}
                              cy={c[1]}
                              r={14}
                              fill="transparent"
                              className="cursor-grab"
                              onPointerDown={(e) => {
                                e.currentTarget.setPointerCapture(e.pointerId);
                                setDraggingIdx(idx);
                              }}
                            />
                            <circle
                              cx={c[0]}
                              cy={c[1]}
                              r={7}
                              fill="#2563eb"
                              stroke="white"
                              strokeWidth="2"
                              className="cursor-grab pointer-events-none"
                            />
                          </g>
                        ))}
                      </>
                    )}
                  </svg>
                  <div className="absolute bottom-2 left-1/2 -translate-x-1/2 flex gap-2">
                    <button
                      type="button"
                      onClick={applyCrop}
                      className="flex items-center gap-1 bg-blue-600 text-white text-xs font-medium px-3 py-1.5 rounded-full shadow-lg hover:bg-blue-700 transition-colors"
                      data-ocid="scanner.crop_apply.button"
                    >
                      <Check size={11} />
                      Apply Crop
                    </button>
                    <button
                      type="button"
                      onClick={() => setCropMode(false)}
                      className="flex items-center gap-1 bg-black/50 text-white text-xs font-medium px-3 py-1.5 rounded-full shadow-lg hover:bg-black/70 transition-colors"
                      data-ocid="scanner.crop_skip.button"
                    >
                      <SkipForward size={11} />
                      Skip
                    </button>
                  </div>
                  <div className="absolute top-2 left-1/2 -translate-x-1/2 bg-blue-600/90 text-white text-xs px-2 py-0.5 rounded-full whitespace-nowrap">
                    Drag corners to adjust
                  </div>
                </>
              ) : previewUrl ? (
                <img
                  src={previewUrl}
                  alt="Preview"
                  className="max-w-full max-h-full object-contain"
                />
              ) : (
                <div className="flex flex-col items-center gap-2 text-muted-foreground">
                  <ImageIcon size={32} className="opacity-30" />
                  <span className="text-xs">No image loaded</span>
                </div>
              )}
            </div>

            {/* Hidden img for processing */}
            {imageSrc && !cropMode && (
              <img
                ref={imgRef}
                src={imageSrc}
                alt="source"
                className="hidden"
                onLoad={regeneratePreview}
              />
            )}
            {/* Img used in crop mode */}
            {imageSrc && cropMode && (
              <img
                ref={imgRef}
                src={imageSrc}
                alt="source"
                className="hidden"
                onLoad={handleImageLoaded}
              />
            )}
            {/* Detection trigger on first load */}
            {imageSrc && !cropMode && corners.length === 0 && (
              <img
                src={imageSrc}
                alt="detect"
                className="hidden"
                onLoad={(e) => {
                  const el = e.currentTarget as HTMLImageElement;
                  if (el.naturalWidth > 0) {
                    const detected = detectDocumentCorners(el);
                    setCorners(detected);
                    setCropMode(true);
                  }
                }}
              />
            )}
          </div>

          {/* Camera + Upload */}
          <div className="px-4 pb-3 grid grid-cols-2 gap-2">
            <Button
              type="button"
              variant="outline"
              size="sm"
              className="text-xs"
              onClick={() => setCameraOpen(true)}
              data-ocid="scanner.camera_view.button"
            >
              <Camera size={13} className="mr-1.5" />
              Camera View
            </Button>
            <Button
              type="button"
              variant="outline"
              size="sm"
              className="text-xs"
              onClick={handleUploadClick}
              data-ocid="scanner.upload_button"
            >
              <Upload size={13} className="mr-1.5" />
              Upload Image
            </Button>
            <input
              ref={fileInputRef}
              type="file"
              accept="image/*"
              className="hidden"
              onChange={handleFileInputChange}
              data-ocid="scanner.file.input"
            />
          </div>

          {/* Rotation */}
          <div className="px-4 pb-3 flex items-center gap-2">
            <span className="text-xs text-muted-foreground flex-1">
              Rotation
            </span>
            <Button
              type="button"
              variant="outline"
              size="sm"
              className="h-7 w-7 p-0"
              onClick={rotateLeft}
              data-ocid="scanner.rotate_left.button"
            >
              <RotateCcw size={13} />
            </Button>
            <span className="text-xs text-muted-foreground w-8 text-center">
              {rotation}°
            </span>
            <Button
              type="button"
              variant="outline"
              size="sm"
              className="h-7 w-7 p-0"
              onClick={rotateRight}
              data-ocid="scanner.rotate_right.button"
            >
              <RotateCw size={13} />
            </Button>
          </div>

          {/* Filter segmented control */}
          <div className="px-4 pb-3">
            <p className="text-xs text-muted-foreground mb-2">Filter</p>
            <div className="grid grid-cols-5 gap-1 bg-muted rounded-lg p-1">
              {FILTERS.map((f) => (
                <button
                  type="button"
                  key={f.id}
                  onClick={() => setFilter(f.id)}
                  data-ocid={`scanner.filter_${f.id}.toggle`}
                  className={cn(
                    "py-1.5 rounded-md text-xs font-medium transition-all flex flex-col items-center gap-0.5",
                    filter === f.id
                      ? "bg-card text-foreground shadow-xs"
                      : "text-muted-foreground hover:text-foreground",
                  )}
                >
                  <span className={cn("w-3 h-3 rounded-full", f.dot)} />
                  {f.label}
                </button>
              ))}
            </div>
          </div>

          {/* Document settings */}
          <div className="px-4 pb-3 space-y-3">
            <div>
              <Label className="text-xs text-muted-foreground mb-1.5 block">
                Document Name
              </Label>
              <Input
                value={docName}
                onChange={(e) => setDocName(e.target.value)}
                className="h-8 text-sm"
                data-ocid="scanner.name.input"
              />
            </div>
            <div className="grid grid-cols-2 gap-2">
              <div>
                <Label className="text-xs text-muted-foreground mb-1.5 block">
                  Format
                </Label>
                <Select
                  value={format}
                  onValueChange={(v) => setFormat(v as FormatType)}
                >
                  <SelectTrigger
                    className="h-8 text-xs"
                    data-ocid="scanner.format.select"
                  >
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="PDF">PDF</SelectItem>
                    <SelectItem value="PNG">PNG</SelectItem>
                    <SelectItem value="JPEG">JPEG</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label className="text-xs text-muted-foreground mb-1.5 block">
                  Quality
                </Label>
                <Select
                  value={quality}
                  onValueChange={(v) => setQuality(v as QualityType)}
                >
                  <SelectTrigger
                    className="h-8 text-xs"
                    data-ocid="scanner.quality.select"
                  >
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="High">High</SelectItem>
                    <SelectItem value="Medium">Medium</SelectItem>
                    <SelectItem value="Low">Low</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
          </div>
        </div>

        {/* Export CTA */}
        <div className="p-4 border-t border-border">
          <Button
            type="button"
            onClick={handleExport}
            disabled={isExporting || !imageSrc}
            className="w-full font-semibold"
            style={{ backgroundColor: "#1E88E5", color: "white" }}
            data-ocid="scanner.export.primary_button"
          >
            {isExporting ? (
              <span className="flex items-center gap-2">
                <span className="w-3.5 h-3.5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                Exporting...
              </span>
            ) : (
              <span className="flex items-center gap-2">
                <FileDown size={15} />
                Export as PDF
              </span>
            )}
          </Button>
        </div>

        <CameraModal
          open={cameraOpen}
          onClose={() => setCameraOpen(false)}
          onCapture={handleCameraCapture}
        />
      </aside>
    </>
  );
}
