// components/Header.tsx
"use client";

import React from "react";
import { User, Share2, Settings } from "lucide-react";
import { getHijriDate } from "@/lib/dateUtils";
import { NavTab } from "./BottomNav";
import NotificationMenu from "./NotificationMenu";

interface HeaderProps {
  userName: string;
  profileImage?: string | null;
  currentTime: Date;
  onNavigate: (tab: NavTab) => void;
}

export default function Header({
  userName,
  profileImage,
  currentTime,
  onNavigate,
}: HeaderProps) {
  const getGreeting = () => {
    const hour = currentTime.getHours();
    if (hour >= 5 && hour < 12) return "صباح الخير";
    if (hour >= 12 && hour < 17) return "طاب يومك";
    if (hour >= 17 && hour < 21) return "مساء الخير";
    return "ليلة سعيدة";
  };

  const handleNavigate = (tab: NavTab) => {
    onNavigate(tab);
  };

  return (
    <header className="p-6 flex flex-col gap-1 z-50 relative">
      <div className="flex justify-between items-center">
        {/* User Identity */}
        <div className="flex items-center gap-3">
          {/* Profile Button + Dropdown */}
          <div className="relative">
            <button
              onClick={() => {
                handleNavigate("PROFILE");
              }}
              className="w-10 h-10 rounded-full border flex items-center justify-center text-blue-400 overflow-hidden transition-all bg-blue-500/20 border-blue-500/30 hover:border-blue-500/60 hover:ring-2 hover:ring-blue-500/20 active:scale-95"
            >
              {profileImage ? (
                <img
                  src={profileImage}
                  alt="Profile"
                  className="w-full h-full object-cover"
                />
              ) : (
                <User size={20} />
              )}
            </button>
          </div>

          <div className="flex flex-col">
            <span className="text-[10px] font-black text-slate-500 uppercase tracking-widest">
              {getGreeting()}
            </span>
            <span className="text-sm font-black text-slate-100">
              {userName || "زميل العمل"}
            </span>
          </div>
        </div>

        <div className="flex items-center gap-2">
          {/* Share Button */}
          <button
            onClick={() => {
              if (navigator.share) {
                navigator
                  .share({
                    title: "Trois Huit - جدول المناوبات",
                    text: "ودّع فوضى جداول العمل، واستقبل تنظيماً أكثر كفاءة واحترافية مع تطبيق Trois Huit — المساعد الذكي لإدارة نظام المناوبات.\n\nماذا يقدّم لك التطبيق؟\n\n✅ حساب دقيق وفوري لجداول المناوبات وفق نظام عملك.\n🌴 إدارة تلقائية لرصيد الإجازات الشهرية والسنوية بكل شفافية.\n📅 أجندة متكاملة تتضمن العطل الوطنية والمناسبات الإسلامية لتخطيط أفضل.\n🔔 تنبيهات وإشعارات فورية لضمان عدم تفويت أي موعد أو مناوبة.\n\nتطبيق خفيف وسهل الاستخدام، لا يتطلب إنشاء حساب، ومتاح مجاناً بالكامل.\n\nابدأ الآن بتنظيم وقتك بكفاءة أعلى، وشاركه مع زملائك ليستفيد الجميع.",
                    url: window.location.origin,
                  })
                  .catch(() => {
                    // Fallback for failed share or user cancel
                  });
              } else {
                alert("الرابط: " + window.location.origin);
              }
            }}
            className="w-10 h-10 rounded-full bg-white/[0.04] border border-white/[0.08] text-slate-400 flex items-center justify-center hover:bg-blue-600/20 hover:border-blue-500 hover:text-blue-400 transition-all"
          >
            <Share2 size={20} />
          </button>

          {/* Settings Button */}
          <button
            onClick={() => handleNavigate("SETTINGS")}
            className="w-10 h-10 rounded-full bg-white/[0.04] border border-white/[0.08] text-slate-400 flex items-center justify-center hover:bg-violet-600/20 hover:border-violet-500 hover:text-violet-400 transition-all active:scale-95"
          >
            <Settings size={20} />
          </button>

          {/* Notifications */}
          <NotificationMenu />
        </div>
      </div>

      {/* Date Bar */}
      <div className="flex items-center justify-between mt-4 px-1">
        <div className="flex flex-col items-start">
          <span
            className="text-[10px] font-black text-slate-400 uppercase tracking-widest leading-none"
            suppressHydrationWarning
          >
            {new Intl.DateTimeFormat("ar-DZ", {
              weekday: "long",
              day: "numeric",
              month: "long",
              year: "numeric",
            }).format(currentTime)}
          </span>
          <span
            className="text-[14px] font-black text-blue-500 mt-0.5"
            suppressHydrationWarning
          >
            {getHijriDate(currentTime)}
          </span>
        </div>

        <div className="flex items-center gap-2">
          <div className="w-1.5 h-1.5 rounded-full bg-blue-500 animate-pulse" />
          <span className="text-xl font-medium font-mono text-slate-100">
            {currentTime.toLocaleTimeString("en-US", {
              hour12: false,
              hour: "2-digit",
              minute: "2-digit",
            })}
          </span>
        </div>
      </div>
    </header>
  );
}
