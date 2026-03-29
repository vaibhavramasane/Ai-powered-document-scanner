import { Toaster } from "@/components/ui/sonner";
import { cn } from "@/lib/utils";
import {
  Camera,
  FileCog,
  LayoutDashboard,
  MessageCircle,
  ScanLine,
} from "lucide-react";
import { useState } from "react";
import ChatbotPanel from "./components/ChatbotPanel";
import { MainContent } from "./components/MainContent";
import { PDFToolsPanel } from "./components/PDFToolsPanel";
import { ScannerPanel } from "./components/ScannerPanel";
import { Sidebar } from "./components/Sidebar";
import { useIsMobile } from "./hooks/use-mobile";
import { useDocuments } from "./hooks/useDocuments";
import type { ScannedDocument } from "./types/document";

export default function App() {
  const [activeNav, setActiveNav] = useState("dashboard");
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [mobileSidebarOpen, setMobileSidebarOpen] = useState(false);
  const [mobileScannerOpen, setMobileScannerOpen] = useState(false);
  const [currentImageSrc, setCurrentImageSrc] = useState<string | null>(null);
  const { documents, addDocument, deleteDocument } = useDocuments();
  const isMobile = useIsMobile();

  const sidebarWidth = sidebarCollapsed ? 64 : 240;
  const rightPanelWidth = 320;

  function handleNewScan() {
    if (isMobile) {
      setMobileScannerOpen(true);
      return;
    }
    const el = document.querySelector(
      '[data-ocid="scanner.camera_view.button"]',
    ) as HTMLButtonElement;
    el?.click();
  }

  function handleImport() {
    if (isMobile) {
      setMobileScannerOpen(true);
      return;
    }
    const el = document.querySelector(
      '[data-ocid="scanner.upload_button"]',
    ) as HTMLButtonElement;
    el?.click();
  }

  function handleExportPDF() {
    const el = document.querySelector(
      '[data-ocid="scanner.export.primary_button"]',
    ) as HTMLButtonElement;
    el?.click();
  }

  function handleDocumentSaved(doc: ScannedDocument) {
    addDocument(doc);
  }

  const isChatbot = activeNav === "chatbot";
  const isPDFTools = activeNav === "pdftools";
  const hideRightPanel = isChatbot || isPDFTools;

  const BOTTOM_NAV = [
    { id: "dashboard", icon: <LayoutDashboard size={20} />, label: "Home" },
    { id: "scans", icon: <ScanLine size={20} />, label: "Scans" },
    { id: "chatbot", icon: <MessageCircle size={20} />, label: "Chat" },
    { id: "pdftools", icon: <FileCog size={20} />, label: "PDF" },
  ];

  return (
    <div className="flex min-h-screen bg-background">
      {/* Sidebar — hidden on mobile, visible on md+ */}
      <Sidebar
        activeNav={activeNav}
        onNavChange={(id) => {
          setActiveNav(id);
          setMobileSidebarOpen(false);
        }}
        onNewScan={handleNewScan}
        onImport={handleImport}
        collapsed={sidebarCollapsed}
        onToggleCollapse={() => setSidebarCollapsed((v) => !v)}
        mobileOpen={mobileSidebarOpen}
        onMobileClose={() => setMobileSidebarOpen(false)}
      />

      {/* Main content — full width on mobile */}
      <div
        className={cn(
          "flex-1 flex flex-col min-w-0",
          // desktop only: respect sidebar + scanner panel width
          !isMobile && "transition-[margin] duration-300",
        )}
        style={{
          marginLeft: isMobile ? 0 : `${sidebarWidth}px`,
          marginRight: isMobile || hideRightPanel ? 0 : `${rightPanelWidth}px`,
          transition: "margin-left 0.3s, margin-right 0.3s",
        }}
      >
        {/* Add bottom padding on mobile to account for bottom nav */}
        <div className="flex-1 flex flex-col pb-0 md:pb-0">
          {isChatbot ? (
            <ChatbotPanel
              currentImage={currentImageSrc}
              documents={documents}
            />
          ) : isPDFTools ? (
            <PDFToolsPanel />
          ) : (
            <MainContent
              activeNav={activeNav}
              documents={documents}
              onDelete={deleteDocument}
              onScanDocument={handleNewScan}
              onImportEdit={handleImport}
              onExportPDF={handleExportPDF}
              onOpenChatbot={() => setActiveNav("chatbot")}
              onOpenPDFTools={() => setActiveNav("pdftools")}
              onMenuClick={() => setMobileSidebarOpen(true)}
            />
          )}
        </div>
      </div>

      {/* Desktop scanner panel */}
      {!hideRightPanel && (
        <ScannerPanel
          onDocumentSaved={handleDocumentSaved}
          onImageChange={setCurrentImageSrc}
          mobileOpen={mobileScannerOpen}
          onMobileClose={() => setMobileScannerOpen(false)}
        />
      )}

      {/* Mobile FAB — camera button */}
      {!hideRightPanel && (
        <button
          type="button"
          onClick={() => setMobileScannerOpen(true)}
          className="md:hidden fixed bottom-20 right-4 w-14 h-14 rounded-full shadow-xl flex items-center justify-center z-30 transition-transform active:scale-95"
          style={{ backgroundColor: "#1E88E5" }}
          data-ocid="app.scanner.open_modal_button"
          aria-label="Open scanner"
        >
          <Camera size={22} className="text-white" />
        </button>
      )}

      {/* Mobile bottom navigation */}
      <nav
        className="md:hidden fixed bottom-0 left-0 right-0 z-40 bg-card border-t border-border flex items-stretch"
        data-ocid="app.bottom_nav.panel"
      >
        {BOTTOM_NAV.map((item) => (
          <button
            key={item.id}
            type="button"
            onClick={() => setActiveNav(item.id)}
            className={cn(
              "flex-1 flex flex-col items-center justify-center py-2 gap-1 text-[10px] font-medium transition-colors",
              activeNav === item.id
                ? "text-blue-400"
                : "text-muted-foreground hover:text-foreground",
            )}
            data-ocid={`app.bottom_nav.${item.id}.link`}
          >
            <span
              className={cn(
                "p-1 rounded-lg transition-colors",
                activeNav === item.id ? "bg-blue-500/15" : "",
              )}
            >
              {item.icon}
            </span>
            {item.label}
          </button>
        ))}
        {/* Menu button — opens sidebar drawer */}
        <button
          type="button"
          onClick={() => setMobileSidebarOpen(true)}
          className="flex-1 flex flex-col items-center justify-center py-2 gap-1 text-[10px] font-medium text-muted-foreground hover:text-foreground transition-colors"
          data-ocid="app.bottom_nav.menu.button"
        >
          <span className="p-1 rounded-lg">
            <svg
              role="img"
              aria-label="Menu"
              xmlns="http://www.w3.org/2000/svg"
              width="20"
              height="20"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <line x1="3" y1="12" x2="21" y2="12" />
              <line x1="3" y1="6" x2="21" y2="6" />
              <line x1="3" y1="18" x2="21" y2="18" />
            </svg>
          </span>
          Menu
        </button>
      </nav>

      <Toaster richColors position="bottom-right" />
    </div>
  );
}
