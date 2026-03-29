import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Camera, RotateCcw, X } from "lucide-react";
import { useEffect, useRef } from "react";
import { useCamera } from "../camera/useCamera";

interface CameraModalProps {
  open: boolean;
  onClose: () => void;
  onCapture: (file: File) => void;
}

export function CameraModal({ open, onClose, onCapture }: CameraModalProps) {
  const {
    videoRef,
    canvasRef,
    isActive,
    isLoading,
    error,
    startCamera,
    stopCamera,
    capturePhoto,
  } = useCamera({ facingMode: "environment", quality: 0.9 });

  // Keep stable refs so the effect never depends on the callback identities
  const startCameraRef = useRef(startCamera);
  const stopCameraRef = useRef(stopCamera);
  useEffect(() => {
    startCameraRef.current = startCamera;
  }, [startCamera]);
  useEffect(() => {
    stopCameraRef.current = stopCamera;
  }, [stopCamera]);

  useEffect(() => {
    if (open) {
      startCameraRef.current();
    } else {
      stopCameraRef.current();
    }
  }, [open]);

  async function handleCapture() {
    const file = await capturePhoto();
    if (file) {
      onCapture(file);
      onClose();
    }
  }

  return (
    <Dialog open={open} onOpenChange={(v) => !v && onClose()}>
      <DialogContent
        className="max-w-2xl p-0 overflow-hidden"
        data-ocid="camera.modal"
      >
        <DialogHeader className="px-6 pt-5 pb-3">
          <DialogTitle className="flex items-center gap-2">
            <Camera size={18} className="text-primary" />
            Camera Capture
          </DialogTitle>
        </DialogHeader>

        <div className="relative bg-black" style={{ minHeight: "360px" }}>
          {isLoading && (
            <div
              className="absolute inset-0 flex items-center justify-center bg-black"
              data-ocid="camera.loading_state"
            >
              <div className="text-white/60 text-sm">Starting camera...</div>
            </div>
          )}
          {error && (
            <div
              className="absolute inset-0 flex flex-col items-center justify-center bg-black gap-3"
              data-ocid="camera.error_state"
            >
              <X size={32} className="text-red-400" />
              <p className="text-white/70 text-sm text-center px-6">
                {error.message}
              </p>
            </div>
          )}
          <video
            ref={videoRef}
            autoPlay
            playsInline
            muted
            className="w-full object-cover"
            style={{ maxHeight: "480px", display: isActive ? "block" : "none" }}
          />
          <canvas ref={canvasRef} className="hidden" />
        </div>

        <div className="flex items-center justify-between px-6 py-4 bg-background">
          <Button
            variant="outline"
            onClick={onClose}
            data-ocid="camera.cancel_button"
          >
            Cancel
          </Button>
          <div className="flex gap-2">
            {error && (
              <Button
                variant="outline"
                onClick={() => startCameraRef.current()}
                data-ocid="camera.retry.button"
              >
                <RotateCcw size={15} className="mr-2" />
                Retry
              </Button>
            )}
            <Button
              onClick={handleCapture}
              disabled={!isActive}
              style={{ backgroundColor: "#1E88E5", color: "white" }}
              data-ocid="camera.capture_button"
            >
              <Camera size={15} className="mr-2" />
              Capture Photo
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
