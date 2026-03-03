"use client";

import { useEffect, useState } from "react";
import { RefreshCw, X } from "lucide-react";

export default function ServiceWorkerRegistration() {
  const [showUpdate, setShowUpdate] = useState(false);
  const [waitingWorker, setWaitingWorker] = useState<ServiceWorker | null>(
    null,
  );

  useEffect(() => {
    if ("serviceWorker" in navigator) {
      navigator.serviceWorker
        .register("/sw.js")
        .then((reg) => {
          console.log("[SW] Registered:", reg.scope);

          reg.addEventListener("updatefound", () => {
            const newWorker = reg.installing;
            if (!newWorker) return;

            newWorker.addEventListener("statechange", () => {
              if (
                newWorker.state === "installed" &&
                navigator.serviceWorker.controller
              ) {
                // New update available
                setWaitingWorker(newWorker);
                setShowUpdate(true);
              }
            });
          });
        })
        .catch((err) => console.error("[SW] Registration failed:", err));

      // Also check if there's already a waiting worker
      navigator.serviceWorker.ready.then((reg) => {
        if (reg.waiting) {
          setWaitingWorker(reg.waiting);
          setShowUpdate(true);
        }
      });

      // Auto-reload once new service worker takes control
      let refreshing = false;
      navigator.serviceWorker.addEventListener("controllerchange", () => {
        if (!refreshing) {
          refreshing = true;
          window.location.reload();
        }
      });
    }
  }, []);

  const handleUpdate = () => {
    if (waitingWorker) {
      waitingWorker.postMessage({ type: "SKIP_WAITING" });
    }
  };

  if (!showUpdate) return null;

  return (
    <div
      className="fixed bottom-24 left-4 right-4 z-[9999] animate-slide-up"
      dir="rtl"
    >
      <div className="bg-blue-600 rounded-2xl p-4 shadow-lg shadow-blue-900/50 flex items-center gap-3">
        <div className="w-10 h-10 bg-white/20 rounded-xl flex items-center justify-center shrink-0">
          <RefreshCw className="text-white animate-spin-slow" size={20} />
        </div>
        <div className="flex-1">
          <h3 className="text-sm font-black text-white">تحديث جديد متوفر</h3>
          <p className="text-[11px] font-bold text-blue-100">
            تم إطلاق نسخة جديدة من التطبيق.
          </p>
        </div>
        <button
          onClick={handleUpdate}
          className="px-4 py-2 bg-white text-blue-600 text-[10px] font-black uppercase tracking-wider rounded-xl active:scale-95 transition-transform"
        >
          تحديث الآن
        </button>
        <button
          onClick={() => setShowUpdate(false)}
          className="p-2 text-white/70 hover:text-white transition-colors"
        >
          <X size={16} />
        </button>
      </div>
    </div>
  );
}
