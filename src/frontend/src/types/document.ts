export type FilterType = "original" | "grayscale" | "bw" | "enhance" | "magic";
export type FormatType = "PDF" | "PNG" | "JPEG";
export type QualityType = "High" | "Medium" | "Low";

export interface ScannedDocument {
  id: string;
  name: string;
  format: FormatType;
  quality: QualityType;
  filter: FilterType;
  createdAt: string;
  thumbnail: string; // base64
  fullImage?: string; // base64
}
