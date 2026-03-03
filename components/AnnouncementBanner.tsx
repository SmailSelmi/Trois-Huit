// components/AnnouncementBanner.tsx
"use client";

import React from "react";
import { Compass, X, CheckCircle2 } from "lucide-react";
import GlassCard from "./GlassCard";

interface AnnouncementBannerProps {
  onDismiss: () => void;
  title: string;
  description: string;
  actionLabel?: string;
  icon?: React.ReactNode;
  variant?: "emerald" | "blue" | "amber";
}

export default function AnnouncementBanner({
  onDismiss,
  title,
  description,
  actionLabel = "حسناً، فهمت",
  icon,
  variant = "emerald",
}: AnnouncementBannerProps) {
  const styles = {
    emerald: {
      border: "border-emerald-500/20",
      bg: "bg-emerald-500/5",
      glow: "bg-emerald-500/10",
      blob: "bg-teal-500/5",
      iconBg: "bg-emerald-500/10",
      iconColor: "text-emerald-400",
      titleColor: "text-emerald-100",
      btnBg: "bg-emerald-500",
      btnHover: "hover:bg-emerald-400",
      btnShadow: "shadow-emerald-500/20",
    },
    blue: {
      border: "border-blue-500/20",
      bg: "bg-blue-500/5",
      glow: "bg-blue-500/10",
      blob: "bg-indigo-500/5",
      iconBg: "bg-blue-500/10",
      iconColor: "text-blue-400",
      titleColor: "text-blue-100",
      btnBg: "bg-blue-500",
      btnHover: "hover:bg-blue-400",
      btnShadow: "shadow-blue-500/20",
    },
    amber: {
      border: "border-amber-500/20",
      bg: "bg-amber-500/5",
      glow: "bg-amber-500/10",
      blob: "bg-orange-500/5",
      iconBg: "bg-amber-500/10",
      iconColor: "text-amber-400",
      titleColor: "text-amber-100",
      btnBg: "bg-amber-500",
      btnHover: "hover:bg-amber-400",
      btnShadow: "shadow-amber-500/20",
    },
  }[variant];

  return (
    <div className="px-6 mb-4 animate-slide-down">
      <GlassCard
        className={`p-4 relative overflow-hidden ${styles.border} ${styles.bg} group`}
      >
        {/* Decorative elements */}
        <div
          className={`absolute top-0 right-0 w-24 h-24 ${styles.glow} blur-2xl rounded-full -mr-12 -mt-12 transition-transform group-hover:scale-110`}
        />
        <div
          className={`absolute bottom-0 left-0 w-16 h-16 ${styles.blob} blur-xl rounded-full -ml-8 -mb-8`}
        />

        <div className="flex gap-4 relative z-10">
          <div
            className={`flex-shrink-0 w-12 h-12 rounded-2xl ${styles.iconBg} flex items-center justify-center ${styles.iconColor}`}
          >
            {icon || <Compass size={24} className="animate-spin-slow" />}
          </div>

          <div className="flex-1 flex flex-col gap-1">
            <div className="flex items-center justify-between">
              <h4 className={`text-sm font-black ${styles.titleColor} italic`}>
                {title}
              </h4>
              <button
                onClick={onDismiss}
                className="p-1 text-slate-500 hover:text-white transition-colors cursor-pointer active:scale-95"
                aria-label="Dismiss"
              >
                <X size={16} />
              </button>
            </div>
            <p className="text-[11px] font-bold text-slate-400 leading-relaxed ml-4">
              {description}
            </p>

            <div className="flex justify-end mt-2">
              <button
                onClick={onDismiss}
                className={`flex items-center gap-2 py-2 px-4 rounded-xl ${styles.btnBg} text-white text-[11px] font-black shadow-lg ${styles.btnShadow} ${styles.btnHover} active:scale-95 transition-all`}
              >
                <CheckCircle2 size={12} />
                {actionLabel}
              </button>
            </div>
          </div>
        </div>
      </GlassCard>
    </div>
  );
}
