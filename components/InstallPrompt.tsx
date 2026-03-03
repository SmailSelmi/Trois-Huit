"use client";

import React, { useState, useEffect } from "react";
import { Download } from "lucide-react";
import { useInstallContext } from "@/context/InstallContext";
import BottomSheet from "./BottomSheet";

export default function InstallPrompt() {
  const { isInstallable, isInstalled, promptInstall, setHighlightHeaderIcon } =
    useInstallContext();
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    if (isInstallable && !isInstalled) {
      try {
        const hasDismissed = localStorage.getItem("hasDismissedInstall");
        if (!hasDismissed) {
          setIsVisible(true);
        }
      } catch (e) {
        // Ignore local storage errors safely
      }
    } else {
      setIsVisible(false);
    }
  }, [isInstallable, isInstalled]);

  const handleRemindMeLater = () => {
    setIsVisible(false);
    try {
      localStorage.setItem(
        "hasDismissedInstall",
        JSON.stringify({ dismissed: true, timestamp: Date.now() }),
      );
    } catch (e) {
      // Ignore
    }

    // Trigger header highlight animation
    setHighlightHeaderIcon(true);
    setTimeout(() => {
      setHighlightHeaderIcon(false);
    }, 3000);
  };

  const handleInstall = async () => {
    await promptInstall();
    setIsVisible(false);
  };

  if (isInstalled) return null;

  return (
    <BottomSheet
      isOpen={isVisible}
      onClose={handleRemindMeLater}
      title="تثبيت التطبيق"
    >
      <div className="flex flex-col gap-6">
        <div className="flex items-start gap-4">
          <div className="w-14 h-14 bg-blue-500/20 rounded-2xl flex items-center justify-center shrink-0">
            <Download className="text-blue-400" size={28} />
          </div>
          <div className="flex flex-col mt-1">
            <span className="text-[13px] font-medium text-slate-400 leading-relaxed">
              أضف Trois Huit إلى شاشتك الرئيسية للحصول على إشعارات ذكية بدون
              إنترنت وتجربة أسرع بكثير!
            </span>
          </div>
        </div>

        <div className="flex flex-col gap-3 w-full">
          <button
            onClick={handleInstall}
            className="w-full py-4 bg-blue-600 hover:bg-blue-500 text-white text-sm font-black rounded-xl transition-all shadow-lg shadow-blue-500/20 active:scale-95"
          >
            تثبيت التطبيق
          </button>
          <button
            onClick={handleRemindMeLater}
            className="w-full py-4 bg-white/5 hover:bg-white/10 text-slate-300 text-sm font-black rounded-xl transition-colors active:scale-95"
          >
            ذكرني لاحقاً
          </button>
        </div>
      </div>
    </BottomSheet>
  );
}
