import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { Clock, Download, FileText, Trash2 } from "lucide-react";
import { toast } from "sonner";
import { exportAsPDF } from "../lib/pdfExport";
import type { ScannedDocument } from "../types/document";

const FILTER_LABELS: Record<string, string> = {
  original: "Original",
  grayscale: "Grayscale",
  bw: "B&W",
  enhance: "Enhanced",
};

const FILTER_COLORS: Record<string, string> = {
  original: "bg-blue-100 text-blue-700",
  grayscale: "bg-gray-100 text-gray-700",
  bw: "bg-zinc-900 text-zinc-100",
  enhance: "bg-amber-100 text-amber-700",
};

function formatRelativeTime(dateStr: string): string {
  const date = new Date(dateStr);
  const now = new Date();
  const diffMs = now.getTime() - date.getTime();
  const diffMins = Math.floor(diffMs / 60000);
  if (diffMins < 60) return `${diffMins}m ago`;
  const diffHours = Math.floor(diffMins / 60);
  if (diffHours < 24) return `${diffHours}h ago`;
  const diffDays = Math.floor(diffHours / 24);
  return `${diffDays}d ago`;
}

interface DocumentCardProps {
  doc: ScannedDocument;
  index: number;
  onDelete: (id: string) => void;
}

export function DocumentCard({ doc, index, onDelete }: DocumentCardProps) {
  async function handleDownload() {
    try {
      if (doc.fullImage) {
        await exportAsPDF(doc.fullImage, doc.name, doc.quality);
      } else {
        toast.info("Full image not available. Thumbnail only.");
      }
    } catch {
      toast.error("Download failed.");
    }
  }

  return (
    <div
      className="bg-card border border-border rounded-xl overflow-hidden shadow-card hover:shadow-md transition-shadow group"
      data-ocid={`documents.item.${index}`}
    >
      {/* Thumbnail */}
      <div className="relative bg-muted" style={{ height: "160px" }}>
        <img
          src={doc.thumbnail}
          alt={doc.name}
          className="w-full h-full object-cover"
          onError={(e) => {
            (e.target as HTMLImageElement).style.display = "none";
          }}
        />
        <div className="absolute inset-0 bg-gradient-to-t from-black/10 to-transparent" />
        <Badge
          className={cn(
            "absolute top-2 right-2 text-xs border-0",
            FILTER_COLORS[doc.filter],
          )}
        >
          {FILTER_LABELS[doc.filter]}
        </Badge>
      </div>

      {/* Info */}
      <div className="p-3">
        <div className="flex items-start gap-2 mb-2">
          <FileText size={14} className="text-primary mt-0.5 flex-shrink-0" />
          <h3 className="text-sm font-semibold text-foreground leading-tight line-clamp-1">
            {doc.name}
          </h3>
        </div>

        <div className="flex items-center justify-between text-xs text-muted-foreground mb-3">
          <span className="flex items-center gap-1">
            <Clock size={11} />
            {formatRelativeTime(doc.createdAt)}
          </span>
          <span className="font-medium">
            {doc.format} · {doc.quality}
          </span>
        </div>

        {/* Actions */}
        <div className="flex gap-1.5">
          <Button
            variant="outline"
            size="sm"
            className="flex-1 h-7 text-xs"
            onClick={handleDownload}
            data-ocid={`documents.download.button.${index}`}
          >
            <Download size={11} className="mr-1" />
            Download
          </Button>
          <Button
            variant="outline"
            size="sm"
            className="h-7 w-7 p-0 text-destructive hover:bg-destructive/10 hover:text-destructive border-destructive/30"
            onClick={() => onDelete(doc.id)}
            data-ocid={`documents.delete_button.${index}`}
          >
            <Trash2 size={11} />
          </Button>
        </div>
      </div>
    </div>
  );
}
