import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { Progress } from "@/components/ui/progress";
import { Switch } from "@/components/ui/switch";
import {
  Bell,
  CheckCheck,
  Download,
  FileCog,
  FileText,
  Folder,
  HardDrive,
  HelpCircle,
  Info,
  LogIn,
  Menu,
  MessageCircle,
  ScanLine,
  Search,
  Share2,
  Upload,
  UserPlus,
} from "lucide-react";
import { motion } from "motion/react";
import { useState } from "react";
import { toast } from "sonner";
import type { ScannedDocument } from "../types/document";
import { DocumentCard } from "./DocumentCard";

interface QuickAction {
  icon: React.ReactNode;
  title: string;
  desc: string;
  step: string;
  onClick: () => void;
}

interface MainContentProps {
  activeNav: string;
  documents: ScannedDocument[];
  onDelete: (id: string) => void;
  onScanDocument: () => void;
  onImportEdit: () => void;
  onExportPDF: () => void;
  onOpenChatbot: () => void;
  onOpenPDFTools: () => void;
  onMenuClick?: () => void;
}

const FOLDERS = [
  { name: "All Documents", color: "text-blue-500", bg: "bg-blue-500/10" },
  { name: "Receipts", color: "text-amber-500", bg: "bg-amber-500/10" },
  { name: "Contracts", color: "text-violet-500", bg: "bg-violet-500/10" },
  { name: "Personal", color: "text-emerald-500", bg: "bg-emerald-500/10" },
];

const FAQ = [
  {
    q: "How do I scan a document?",
    a: "Click Scan Document on the dashboard or in quick actions. Allow camera access when prompted, position your document in frame, then tap the capture button. The image will appear in your document library.",
  },
  {
    q: "How do I export to PDF?",
    a: "Select a document from your library or use the scanner panel on the right. Once an image is loaded, click Export PDF and the file will be downloaded to your device automatically.",
  },
  {
    q: "How do I share documents?",
    a: "Open a document card and use the share icon. You can generate a shareable link or send directly. The recipient can view the document without needing an account.",
  },
  {
    q: "Can I apply filters to scanned documents?",
    a: "Yes! After scanning or importing, use the filter buttons in the right panel — choose from Grayscale, Black & White, or Enhance to improve legibility.",
  },
];

const NOTIFICATIONS = [
  {
    icon: <ScanLine size={15} className="text-blue-400" />,
    bg: "bg-blue-500/10",
    title: "Scan Complete",
    desc: "Your document was scanned successfully.",
    time: "2 min ago",
  },
  {
    icon: <Download size={15} className="text-emerald-400" />,
    bg: "bg-emerald-500/10",
    title: "Export Ready",
    desc: "PDF export is ready to download.",
    time: "10 min ago",
  },
  {
    icon: <HardDrive size={15} className="text-violet-400" />,
    bg: "bg-violet-500/10",
    title: "Storage Update",
    desc: "You have 100 MB of free storage.",
    time: "1 hr ago",
  },
];

export function MainContent({
  activeNav,
  documents,
  onDelete,
  onScanDocument,
  onImportEdit,
  onExportPDF,
  onOpenChatbot,
  onOpenPDFTools,
  onMenuClick,
}: MainContentProps) {
  const [search, setSearch] = useState("");
  const [autoEnhance, setAutoEnhance] = useState(false);
  const [compactView, setCompactView] = useState(false);
  const [selectedFolder, setSelectedFolder] = useState("All Documents");
  const [notifOpen, setNotifOpen] = useState(false);
  const [allRead, setAllRead] = useState(false);
  const [signInOpen, setSignInOpen] = useState(false);
  const [loginOpen, setLoginOpen] = useState(false);
  const [registerOpen, setRegisterOpen] = useState(false);

  const [loginEmail, setLoginEmail] = useState("");
  const [loginPassword, setLoginPassword] = useState("");
  const [regName, setRegName] = useState("");
  const [regEmail, setRegEmail] = useState("");
  const [regPassword, setRegPassword] = useState("");
  const [regConfirm, setRegConfirm] = useState("");

  function openLogin() {
    setSignInOpen(false);
    setRegisterOpen(false);
    setLoginOpen(true);
  }

  function openRegister() {
    setSignInOpen(false);
    setLoginOpen(false);
    setRegisterOpen(true);
  }

  function handleLoginSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoginOpen(false);
    setLoginEmail("");
    setLoginPassword("");
    toast.success("Login successful! Welcome back.");
  }

  function handleRegisterSubmit(e: React.FormEvent) {
    e.preventDefault();
    setRegisterOpen(false);
    setRegName("");
    setRegEmail("");
    setRegPassword("");
    setRegConfirm("");
    toast.success("Registration successful! Welcome aboard.");
  }

  const QUICK_ACTIONS: QuickAction[] = [
    {
      icon: <ScanLine size={20} className="text-blue-500" />,
      title: "Scan Document",
      desc: "Use camera to scan",
      step: "01",
      onClick: onScanDocument,
    },
    {
      icon: <Upload size={20} className="text-emerald-500" />,
      title: "Import & Edit",
      desc: "Upload from device",
      step: "02",
      onClick: onImportEdit,
    },
    {
      icon: <FileText size={20} className="text-violet-500" />,
      title: "Export PDF",
      desc: "Save as PDF file",
      step: "03",
      onClick: onExportPDF,
    },
    {
      icon: <MessageCircle size={20} className="text-fuchsia-500" />,
      title: "Chatbot",
      desc: "Ask about your documents",
      step: "04",
      onClick: onOpenChatbot,
    },
    {
      icon: <FileCog size={20} className="text-orange-500" />,
      title: "PDF Tools",
      desc: "Merge, convert, secure",
      step: "05",
      onClick: onOpenPDFTools,
    },
  ];

  const filtered = documents.filter((d) =>
    d.name.toLowerCase().includes(search.toLowerCase()),
  );
  const folderDocs = selectedFolder === "All Documents" ? filtered : [];

  const Header = (
    <header className="flex items-center gap-2 px-4 md:px-8 py-3 md:py-4 bg-card border-b border-border sticky top-0 z-10">
      {/* Hamburger — mobile only */}
      <button
        type="button"
        onClick={onMenuClick}
        className="md:hidden p-2 rounded-lg hover:bg-muted transition-colors flex-shrink-0"
        data-ocid="main.menu.button"
        aria-label="Open menu"
      >
        <Menu size={20} className="text-muted-foreground" />
      </button>
      <div className="relative flex-1 md:flex-none">
        <Search
          size={15}
          className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground"
        />
        <Input
          placeholder="Search documents..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="pl-9 h-9 w-full md:w-64 text-sm bg-background"
          data-ocid="main.search_input"
        />
      </div>
      <div className="flex items-center gap-3">
        <Popover
          open={notifOpen}
          onOpenChange={(v) => {
            setNotifOpen(v);
            if (v) setAllRead(false);
          }}
        >
          <PopoverTrigger asChild>
            <button
              type="button"
              className="relative p-2 rounded-lg hover:bg-muted transition-colors"
              data-ocid="main.bell.button"
            >
              <Bell size={18} className="text-muted-foreground" />
              {!allRead && !notifOpen && (
                <span className="absolute top-1.5 right-1.5 w-1.5 h-1.5 bg-primary rounded-full" />
              )}
            </button>
          </PopoverTrigger>
          <PopoverContent
            align="end"
            sideOffset={8}
            className="w-80 p-0 bg-card border-border shadow-lg"
            data-ocid="main.popover"
          >
            <div className="flex items-center justify-between px-4 py-3 border-b border-border">
              <span className="text-sm font-semibold text-foreground">
                Notifications
              </span>
              <span className="text-xs text-muted-foreground">
                {NOTIFICATIONS.length} new
              </span>
            </div>
            <div className="divide-y divide-border">
              {NOTIFICATIONS.map((n, i) => (
                <div
                  key={n.title}
                  className="flex items-start gap-3 px-4 py-3 hover:bg-muted/40 transition-colors"
                  data-ocid={`main.notification.item.${i + 1}`}
                >
                  <div
                    className={`mt-0.5 w-7 h-7 rounded-lg ${n.bg} flex items-center justify-center flex-shrink-0`}
                  >
                    {n.icon}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-xs font-semibold text-foreground">
                      {n.title}
                    </p>
                    <p className="text-xs text-muted-foreground mt-0.5 leading-relaxed">
                      {n.desc}
                    </p>
                  </div>
                  <span className="text-[10px] text-muted-foreground flex-shrink-0 mt-0.5">
                    {n.time}
                  </span>
                </div>
              ))}
            </div>
            <div className="px-4 py-3 border-t border-border">
              <Button
                variant="ghost"
                size="sm"
                className="w-full h-8 text-xs text-muted-foreground hover:text-foreground gap-1.5"
                onClick={() => {
                  setAllRead(true);
                  setNotifOpen(false);
                }}
                data-ocid="main.notification.primary_button"
              >
                <CheckCheck size={13} />
                Mark all as read
              </Button>
            </div>
          </PopoverContent>
        </Popover>

        <Popover open={signInOpen} onOpenChange={setSignInOpen}>
          <PopoverTrigger asChild>
            <Button
              variant="default"
              size="sm"
              className="gap-1.5"
              data-ocid="main.signin.button"
              onMouseEnter={() => setSignInOpen(true)}
              onMouseLeave={() => setSignInOpen(false)}
            >
              <LogIn size={14} />
              Sign In
            </Button>
          </PopoverTrigger>
          <PopoverContent
            align="end"
            sideOffset={6}
            className="w-48 p-2 bg-card border-border shadow-lg"
            data-ocid="main.signin.popover"
            onMouseEnter={() => setSignInOpen(true)}
            onMouseLeave={() => setSignInOpen(false)}
          >
            <button
              type="button"
              className="w-full flex items-center gap-2.5 px-3 py-2.5 rounded-lg text-sm text-foreground hover:bg-muted transition-colors text-left"
              data-ocid="main.signin.login_button"
              onClick={openLogin}
            >
              <LogIn size={15} className="text-primary" />
              Login
            </button>
            <button
              type="button"
              className="w-full flex items-center gap-2.5 px-3 py-2.5 rounded-lg text-sm text-foreground hover:bg-muted transition-colors text-left"
              data-ocid="main.signin.register_button"
              onClick={openRegister}
            >
              <UserPlus size={15} className="text-emerald-500" />
              Register
            </button>
          </PopoverContent>
        </Popover>
      </div>
    </header>
  );

  const Footer = (
    <footer className="px-4 md:px-8 py-4 border-t border-border text-center mb-16 md:mb-0">
      <p className="text-xs text-muted-foreground">
        © {new Date().getFullYear()}. Built by vaibhav ramasane
      </p>
    </footer>
  );

  function renderBody() {
    switch (activeNav) {
      case "dashboard":
        return (
          <div className="flex-1 p-4 md:p-8">
            <motion.div
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.3 }}
              className="mb-6 md:mb-7"
            >
              <h1 className="text-2xl md:text-3xl font-bold text-foreground">
                Welcome back!
              </h1>
              <p className="text-muted-foreground mt-1 text-sm">
                You have {documents.length} documents in your library.
              </p>
            </motion.div>

            {/* Quick actions — 3 cols first row, 2 cols second row centered */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 mb-2">
              {QUICK_ACTIONS.slice(0, 3).map((action, i) => (
                <motion.div
                  key={action.step}
                  initial={{ opacity: 0, y: 12 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: i * 0.08, duration: 0.3 }}
                  onClick={action.onClick}
                  className="bg-card border border-border rounded-2xl px-5 py-4 flex items-center gap-4 shadow-card hover:shadow-md hover:border-primary/50 hover:bg-muted/50 active:scale-[0.98] transition-all cursor-pointer select-none"
                  data-ocid={`main.quick_action.card.${i + 1}`}
                >
                  <div className="w-10 h-10 rounded-xl bg-muted flex items-center justify-center flex-shrink-0">
                    {action.icon}
                  </div>
                  <div>
                    <p className="text-sm font-semibold text-foreground">
                      {action.title}
                    </p>
                    <p className="text-xs text-muted-foreground mt-0.5">
                      {action.desc}
                    </p>
                  </div>
                  <span className="ml-auto text-2xl font-bold text-border">
                    {action.step}
                  </span>
                </motion.div>
              ))}
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mb-6 md:mb-8">
              {QUICK_ACTIONS.slice(3).map((action, i) => (
                <motion.div
                  key={action.step}
                  initial={{ opacity: 0, y: 12 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: (i + 3) * 0.08, duration: 0.3 }}
                  onClick={action.onClick}
                  className="bg-card border border-border rounded-2xl px-5 py-4 flex items-center gap-4 shadow-card hover:shadow-md hover:border-primary/50 hover:bg-muted/50 active:scale-[0.98] transition-all cursor-pointer select-none"
                  data-ocid={`main.quick_action.card.${i + 4}`}
                >
                  <div className="w-10 h-10 rounded-xl bg-muted flex items-center justify-center flex-shrink-0">
                    {action.icon}
                  </div>
                  <div>
                    <p className="text-sm font-semibold text-foreground">
                      {action.title}
                    </p>
                    <p className="text-xs text-muted-foreground mt-0.5">
                      {action.desc}
                    </p>
                  </div>
                  <span className="ml-auto text-2xl font-bold text-border">
                    {action.step}
                  </span>
                </motion.div>
              ))}
            </div>

            <div className="mb-4 flex items-center justify-between">
              <h2 className="text-base font-semibold text-foreground">
                Scanned Documents
                <span className="ml-2 text-xs font-normal text-muted-foreground">
                  {filtered.length} files
                </span>
              </h2>
            </div>
            {filtered.length === 0 ? (
              <div
                className="flex flex-col items-center justify-center py-16 text-muted-foreground"
                data-ocid="documents.empty_state"
              >
                <FileText size={40} className="opacity-20 mb-3" />
                <p className="text-sm">
                  {search
                    ? "No documents match your search."
                    : "No documents yet. Scan or import to get started."}
                </p>
              </div>
            ) : (
              <motion.div
                className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3 md:gap-4"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 0.15, duration: 0.3 }}
                data-ocid="documents.list"
              >
                {filtered.map((doc, i) => (
                  <DocumentCard
                    key={doc.id}
                    doc={doc}
                    index={i + 1}
                    onDelete={onDelete}
                  />
                ))}
              </motion.div>
            )}
          </div>
        );

      case "scans":
        return (
          <div className="flex-1 p-4 md:p-8">
            <motion.div
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.3 }}
              className="mb-6 md:mb-7"
            >
              <h1 className="text-2xl md:text-3xl font-bold text-foreground">
                My Scans
              </h1>
              <p className="text-muted-foreground mt-1 text-sm">
                {documents.length} document{documents.length !== 1 ? "s" : ""}{" "}
                in your library.
              </p>
            </motion.div>
            {filtered.length === 0 ? (
              <div
                className="flex flex-col items-center justify-center py-20 text-muted-foreground"
                data-ocid="scans.empty_state"
              >
                <ScanLine size={44} className="opacity-20 mb-3" />
                <p className="text-sm font-medium mb-4">
                  {search ? "No documents match your search." : "No scans yet."}
                </p>
                {!search && (
                  <Button
                    size="sm"
                    onClick={onScanDocument}
                    data-ocid="scans.primary_button"
                  >
                    <ScanLine size={14} className="mr-2" /> Scan your first
                    document
                  </Button>
                )}
              </div>
            ) : (
              <motion.div
                className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3 md:gap-4"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 0.1, duration: 0.3 }}
                data-ocid="scans.list"
              >
                {filtered.map((doc, i) => (
                  <DocumentCard
                    key={doc.id}
                    doc={doc}
                    index={i + 1}
                    onDelete={onDelete}
                  />
                ))}
              </motion.div>
            )}
          </div>
        );

      case "shared":
        return (
          <div className="flex-1 p-4 md:p-8">
            <motion.div
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.3 }}
              className="mb-6 md:mb-7"
            >
              <h1 className="text-2xl md:text-3xl font-bold text-foreground">
                Shared Documents
              </h1>
              <p className="text-muted-foreground mt-1 text-sm">
                Documents you have shared with others.
              </p>
            </motion.div>
            <div
              className="flex flex-col items-center justify-center py-24 text-muted-foreground"
              data-ocid="shared.empty_state"
            >
              <div className="w-16 h-16 rounded-2xl bg-muted flex items-center justify-center mb-4">
                <Share2 size={28} className="opacity-40" />
              </div>
              <p className="text-sm font-medium mb-1">
                No shared documents yet.
              </p>
              <p className="text-xs mb-6">Share a document to see it here.</p>
              <Button
                size="sm"
                onClick={onScanDocument}
                data-ocid="shared.primary_button"
              >
                <Share2 size={14} className="mr-2" /> Share a Document
              </Button>
            </div>
          </div>
        );

      case "folders":
        return (
          <div className="flex-1 p-4 md:p-8">
            <motion.div
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.3 }}
              className="mb-6 md:mb-7"
            >
              <h1 className="text-2xl md:text-3xl font-bold text-foreground">
                Folders
              </h1>
              <p className="text-muted-foreground mt-1 text-sm">
                Organise your documents into folders.
              </p>
            </motion.div>
            <div
              className="grid grid-cols-2 md:grid-cols-4 gap-3 md:gap-4 mb-6 md:mb-8"
              data-ocid="folders.list"
            >
              {FOLDERS.map((folder, i) => (
                <motion.button
                  key={folder.name}
                  type="button"
                  initial={{ opacity: 0, y: 12 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: i * 0.06, duration: 0.3 }}
                  onClick={() => setSelectedFolder(folder.name)}
                  className={`bg-card border rounded-2xl px-5 py-5 flex flex-col items-start gap-3 hover:shadow-md active:scale-[0.98] transition-all cursor-pointer text-left ${
                    selectedFolder === folder.name
                      ? "border-primary/70 bg-muted/60"
                      : "border-border hover:border-primary/40"
                  }`}
                  data-ocid={`folders.item.${i + 1}`}
                >
                  <div
                    className={`w-10 h-10 rounded-xl ${folder.bg} flex items-center justify-center`}
                  >
                    <Folder size={20} className={folder.color} />
                  </div>
                  <div>
                    <p className="text-sm font-semibold text-foreground">
                      {folder.name}
                    </p>
                    <p className="text-xs text-muted-foreground mt-0.5">
                      {folder.name === "All Documents"
                        ? `${documents.length} files`
                        : "0 files"}
                    </p>
                  </div>
                </motion.button>
              ))}
            </div>
            <div className="mb-4">
              <h2 className="text-base font-semibold text-foreground">
                {selectedFolder}
                <span className="ml-2 text-xs font-normal text-muted-foreground">
                  {folderDocs.length} files
                </span>
              </h2>
            </div>
            {folderDocs.length === 0 ? (
              <div
                className="flex flex-col items-center justify-center py-16 text-muted-foreground"
                data-ocid="folders.empty_state"
              >
                <Folder size={40} className="opacity-20 mb-3" />
                <p className="text-sm">This folder is empty.</p>
              </div>
            ) : (
              <div
                className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3 md:gap-4"
                data-ocid="folders.documents.list"
              >
                {folderDocs.map((doc, i) => (
                  <DocumentCard
                    key={doc.id}
                    doc={doc}
                    index={i + 1}
                    onDelete={onDelete}
                  />
                ))}
              </div>
            )}
          </div>
        );

      case "settings":
        return (
          <div className="flex-1 p-4 md:p-8 max-w-2xl">
            <motion.div
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.3 }}
              className="mb-6 md:mb-7"
            >
              <h1 className="text-2xl md:text-3xl font-bold text-foreground">
                Settings
              </h1>
              <p className="text-muted-foreground mt-1 text-sm">
                Manage your app preferences.
              </p>
            </motion.div>
            <div className="space-y-6">
              <section
                className="bg-card border border-border rounded-2xl p-6"
                data-ocid="settings.general.panel"
              >
                <h3 className="text-sm font-semibold text-foreground mb-4">
                  General
                </h3>
                <div className="flex items-center justify-between">
                  <div>
                    <Label
                      htmlFor="auto-enhance"
                      className="text-sm font-medium"
                    >
                      Auto-enhance scans
                    </Label>
                    <p className="text-xs text-muted-foreground mt-0.5">
                      Automatically improve image quality when scanning.
                    </p>
                  </div>
                  <Switch
                    id="auto-enhance"
                    checked={autoEnhance}
                    onCheckedChange={setAutoEnhance}
                    data-ocid="settings.auto_enhance.switch"
                  />
                </div>
              </section>
              <section
                className="bg-card border border-border rounded-2xl p-6"
                data-ocid="settings.appearance.panel"
              >
                <h3 className="text-sm font-semibold text-foreground mb-4">
                  Appearance
                </h3>
                <div className="flex items-center justify-between">
                  <div>
                    <Label
                      htmlFor="compact-view"
                      className="text-sm font-medium"
                    >
                      Compact view
                    </Label>
                    <p className="text-xs text-muted-foreground mt-0.5">
                      Show more documents by reducing card size.
                    </p>
                  </div>
                  <Switch
                    id="compact-view"
                    checked={compactView}
                    onCheckedChange={setCompactView}
                    data-ocid="settings.compact_view.switch"
                  />
                </div>
              </section>
              <section
                className="bg-card border border-border rounded-2xl p-6"
                data-ocid="settings.storage.panel"
              >
                <h3 className="text-sm font-semibold text-foreground mb-4">
                  Storage
                </h3>
                <div className="flex items-center justify-between text-sm mb-2">
                  <span className="text-muted-foreground">Used</span>
                  <span className="font-medium text-foreground">
                    0 MB / 100 MB
                  </span>
                </div>
                <Progress value={0} className="h-2" />
                <p className="text-xs text-muted-foreground mt-2">
                  100 MB free remaining.
                </p>
              </section>
              <section
                className="bg-card border border-border rounded-2xl p-6"
                data-ocid="settings.about.panel"
              >
                <h3 className="text-sm font-semibold text-foreground mb-4">
                  About
                </h3>
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center">
                    <Info size={18} className="text-primary" />
                  </div>
                  <div>
                    <p className="text-sm font-semibold text-foreground">
                      Document Scanner Pro
                    </p>
                    <p className="text-xs text-muted-foreground">
                      Version v3.0
                    </p>
                  </div>
                </div>
              </section>
            </div>
          </div>
        );

      case "help":
        return (
          <div className="flex-1 p-4 md:p-8 max-w-2xl">
            <motion.div
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.3 }}
              className="mb-6 md:mb-7"
            >
              <h1 className="text-2xl md:text-3xl font-bold text-foreground">
                Help & Support
              </h1>
              <p className="text-muted-foreground mt-1 text-sm">
                Frequently asked questions.
              </p>
            </motion.div>
            <div
              className="bg-card border border-border rounded-2xl p-6"
              data-ocid="help.panel"
            >
              <div className="flex items-center gap-3 mb-5">
                <div className="w-9 h-9 rounded-xl bg-primary/10 flex items-center justify-center">
                  <HelpCircle size={16} className="text-primary" />
                </div>
                <h3 className="text-sm font-semibold text-foreground">
                  Frequently Asked Questions
                </h3>
              </div>
              <Accordion type="single" collapsible className="space-y-1">
                {FAQ.map((item, i) => (
                  <AccordionItem
                    key={item.q}
                    value={`faq-${i}`}
                    className="border border-border rounded-xl px-4"
                    data-ocid={`help.item.${i + 1}`}
                  >
                    <AccordionTrigger className="text-sm font-medium py-3 hover:no-underline">
                      {item.q}
                    </AccordionTrigger>
                    <AccordionContent className="text-sm text-muted-foreground pb-3">
                      {item.a}
                    </AccordionContent>
                  </AccordionItem>
                ))}
              </Accordion>
            </div>
          </div>
        );

      default:
        return null;
    }
  }

  return (
    <main
      className="flex-1 flex flex-col min-h-screen pb-16 md:pb-0"
      data-ocid="main.page"
    >
      {Header}
      {renderBody()}
      {Footer}

      <Dialog open={loginOpen} onOpenChange={setLoginOpen}>
        <DialogContent className="sm:max-w-md" data-ocid="login.dialog">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <LogIn size={18} className="text-primary" />
              Login to your account
            </DialogTitle>
          </DialogHeader>
          <form onSubmit={handleLoginSubmit} className="space-y-4 mt-2">
            <div className="space-y-1.5">
              <Label htmlFor="login-email">Email</Label>
              <Input
                id="login-email"
                type="email"
                placeholder="you@example.com"
                value={loginEmail}
                onChange={(e) => setLoginEmail(e.target.value)}
                required
                data-ocid="login.input"
              />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="login-password">Password</Label>
              <Input
                id="login-password"
                type="password"
                placeholder="Enter your password"
                value={loginPassword}
                onChange={(e) => setLoginPassword(e.target.value)}
                required
                data-ocid="login.input"
              />
            </div>
            <Button
              type="submit"
              className="w-full"
              data-ocid="login.submit_button"
            >
              Login
            </Button>
            <p className="text-center text-sm text-muted-foreground">
              Don&apos;t have an account?{" "}
              <button
                type="button"
                className="text-primary hover:underline font-medium"
                onClick={openRegister}
                data-ocid="login.register_link"
              >
                Register here
              </button>
            </p>
          </form>
        </DialogContent>
      </Dialog>

      <Dialog open={registerOpen} onOpenChange={setRegisterOpen}>
        <DialogContent className="sm:max-w-md" data-ocid="register.dialog">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <UserPlus size={18} className="text-emerald-500" />
              Create an account
            </DialogTitle>
          </DialogHeader>
          <form onSubmit={handleRegisterSubmit} className="space-y-4 mt-2">
            <div className="space-y-1.5">
              <Label htmlFor="reg-name">Full Name</Label>
              <Input
                id="reg-name"
                type="text"
                placeholder="John Doe"
                value={regName}
                onChange={(e) => setRegName(e.target.value)}
                required
                data-ocid="register.input"
              />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="reg-email">Email</Label>
              <Input
                id="reg-email"
                type="email"
                placeholder="you@example.com"
                value={regEmail}
                onChange={(e) => setRegEmail(e.target.value)}
                required
                data-ocid="register.input"
              />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="reg-password">Password</Label>
              <Input
                id="reg-password"
                type="password"
                placeholder="Create a password"
                value={regPassword}
                onChange={(e) => setRegPassword(e.target.value)}
                required
                data-ocid="register.input"
              />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="reg-confirm">Confirm Password</Label>
              <Input
                id="reg-confirm"
                type="password"
                placeholder="Confirm your password"
                value={regConfirm}
                onChange={(e) => setRegConfirm(e.target.value)}
                required
                data-ocid="register.input"
              />
            </div>
            <Button
              type="submit"
              className="w-full bg-emerald-600 hover:bg-emerald-700"
              data-ocid="register.submit_button"
            >
              Register
            </Button>
            <p className="text-center text-sm text-muted-foreground">
              Already have an account?{" "}
              <button
                type="button"
                className="text-primary hover:underline font-medium"
                onClick={openLogin}
                data-ocid="register.login_link"
              >
                Login here
              </button>
            </p>
          </form>
        </DialogContent>
      </Dialog>
    </main>
  );
}
