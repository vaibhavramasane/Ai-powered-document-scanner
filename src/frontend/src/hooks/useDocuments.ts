import { useCallback, useEffect, useState } from "react";
import type { ScannedDocument } from "../types/document";

const STORAGE_KEY = "doc-scanner-pro-documents";

const SAMPLE_DOCS: ScannedDocument[] = [
  {
    id: "1",
    name: "Q3 Financial Report",
    format: "PDF",
    quality: "High",
    filter: "enhance",
    createdAt: new Date(Date.now() - 2 * 60 * 60 * 1000).toISOString(),
    thumbnail: "/assets/generated/doc-thumb-placeholder.dim_200x260.jpg",
  },
  {
    id: "2",
    name: "Project Proposal Draft",
    format: "PDF",
    quality: "High",
    filter: "grayscale",
    createdAt: new Date(Date.now() - 5 * 60 * 60 * 1000).toISOString(),
    thumbnail: "/assets/generated/doc-thumb-placeholder.dim_200x260.jpg",
  },
  {
    id: "3",
    name: "Contract Agreement v2",
    format: "PDF",
    quality: "High",
    filter: "bw",
    createdAt: new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString(),
    thumbnail: "/assets/generated/doc-thumb-placeholder.dim_200x260.jpg",
  },
  {
    id: "4",
    name: "Meeting Notes April",
    format: "PDF",
    quality: "Medium",
    filter: "original",
    createdAt: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000).toISOString(),
    thumbnail: "/assets/generated/doc-thumb-placeholder.dim_200x260.jpg",
  },
  {
    id: "5",
    name: "Invoice #INV-2024-089",
    format: "PDF",
    quality: "High",
    filter: "enhance",
    createdAt: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000).toISOString(),
    thumbnail: "/assets/generated/doc-thumb-placeholder.dim_200x260.jpg",
  },
  {
    id: "6",
    name: "Architecture Blueprint",
    format: "PDF",
    quality: "High",
    filter: "grayscale",
    createdAt: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000).toISOString(),
    thumbnail: "/assets/generated/doc-thumb-placeholder.dim_200x260.jpg",
  },
];

function loadFromStorage(): ScannedDocument[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (raw) return JSON.parse(raw) as ScannedDocument[];
  } catch {
    // ignore
  }
  return SAMPLE_DOCS;
}

function saveToStorage(docs: ScannedDocument[]) {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(docs));
  } catch {
    // ignore
  }
}

export function useDocuments() {
  const [documents, setDocuments] = useState<ScannedDocument[]>(() =>
    loadFromStorage(),
  );

  useEffect(() => {
    saveToStorage(documents);
  }, [documents]);

  const addDocument = useCallback((doc: ScannedDocument) => {
    setDocuments((prev) => [doc, ...prev]);
  }, []);

  const deleteDocument = useCallback((id: string) => {
    setDocuments((prev) => prev.filter((d) => d.id !== id));
  }, []);

  return { documents, addDocument, deleteDocument };
}
