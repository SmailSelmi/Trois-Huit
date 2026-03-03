// components/BottomSheet.tsx
"use client";

import React, { useEffect, useState } from "react";
import { X } from "lucide-react";

interface BottomSheetProps {
  isOpen: boolean;
  onClose: () => void;
  title?: string;
  children: React.ReactNode;
  headerAction?: React.ReactNode;
}

export default function BottomSheet({
  isOpen,
  onClose,
  title,
  children,
  headerAction,
}: BottomSheetProps) {
  // We use standard conditional rendering. In a real app, an exit animation
  // would require a delayed unmount hook, but for performance we unmount instantly.
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "auto";
    }
    return () => {
      document.body.style.overflow = "auto";
    };
  }, [isOpen]);

  if (!isOpen) return null;

  return (
    <>
      {/* Backdrop */}
      <div
        onClick={onClose}
        className="fixed inset-0 bg-black/60 backdrop-blur-sm z-[150] animate-fade-in"
      />

      {/* Sheet */}
      <div
        className="fixed bottom-0 left-0 right-0 bg-[#0f172a] border-t border-white/10 rounded-t-[2.5rem] z-[160] max-h-[90vh] overflow-y-auto shadow-2xl pb-safe transition-all duration-300 ease-in-out animate-slide-up-modal"
        dir="rtl"
      >
        {/* Handle */}
        <div className="w-12 h-1.5 bg-white/20 rounded-full mx-auto my-4" />

        <div className="px-6 pb-8">
          <div className="flex items-center justify-between mb-6">
            {title ? (
              <h3 className="text-xl font-black text-slate-100 italic">
                {title}
              </h3>
            ) : (
              <div />
            )}
            <div className="flex items-center gap-2">
              {headerAction}
              <button
                onClick={onClose}
                className="p-2 bg-white/5 hover:bg-white/10 rounded-full text-slate-400 transition-colors"
                aria-label="إغلاق"
              >
                <X size={20} />
              </button>
            </div>
          </div>
          {children}
        </div>
      </div>
    </>
  );
}
