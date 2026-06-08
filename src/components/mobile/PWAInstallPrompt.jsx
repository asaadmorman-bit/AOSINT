import React, { useState, useEffect } from "react";
import { Download, X } from "lucide-react";
import { Button } from "@/components/ui/button";

export default function PWAInstallPrompt() {
  const [deferredPrompt, setDeferredPrompt] = useState(null);
  const [showPrompt, setShowPrompt] = useState(false);
  const [isInstalled, setIsInstalled] = useState(false);

  useEffect(() => {
    // Check if app is already installed
    if (window.navigator.standalone === true || window.matchMedia("(display-mode: standalone)").matches) {
      setIsInstalled(true);
      return;
    }

    const handleBeforeInstallPrompt = (e) => {
      e.preventDefault();
      setDeferredPrompt(e);
      setShowPrompt(true);
    };

    window.addEventListener("beforeinstallprompt", handleBeforeInstallPrompt);

    return () => {
      window.removeEventListener("beforeinstallprompt", handleBeforeInstallPrompt);
    };
  }, []);

  const handleInstall = async () => {
    if (!deferredPrompt) return;

    deferredPrompt.prompt();
    const { outcome } = await deferredPrompt.userChoice;
    
    if (outcome === "accepted") {
      setShowPrompt(false);
      setDeferredPrompt(null);
    }
  };

  // Check iOS
  const isIOS = /iPad|iPhone|iPod/.test(navigator.userAgent) && !window.MSStream;

  if (isInstalled) {
    return null;
  }

  if (isIOS) {
    return (
      <div className="fixed bottom-0 left-0 right-0 bg-blue-50 border-t-2 border-blue-600 p-4 z-40 animate-in">
        <div className="flex items-center justify-between gap-3">
          <div className="flex-1">
            <p className="text-sm font-medium text-gray-900">Install ASOSINT</p>
            <p className="text-xs text-gray-600 mt-1">
              Tap <span className="font-mono font-bold">Share</span> then <span className="font-mono font-bold">Add to Home Screen</span>
            </p>
          </div>
          <button
            onClick={() => setShowPrompt(false)}
            className="text-gray-500 hover:text-gray-700"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      </div>
    );
  }

  if (showPrompt && deferredPrompt) {
    return (
      <div className="fixed bottom-0 left-0 right-0 bg-blue-50 border-t-2 border-blue-600 p-4 z-40 animate-in">
        <div className="flex items-center justify-between gap-4">
          <div className="flex-1">
            <p className="text-sm font-medium text-gray-900">Install ASOSINT App</p>
            <p className="text-xs text-gray-600 mt-1">Get quick access to threat intelligence from your home screen</p>
          </div>
          <div className="flex gap-2 shrink-0">
            <Button
              onClick={handleInstall}
              className="bg-blue-600 hover:bg-blue-700 gap-2 text-sm h-9"
            >
              <Download className="w-4 h-4" />
              Install
            </Button>
            <Button
              onClick={() => setShowPrompt(false)}
              variant="ghost"
              className="h-9"
            >
              <X className="w-4 h-4" />
            </Button>
          </div>
        </div>
      </div>
    );
  }

  return null;
}