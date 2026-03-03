import React, { useRef } from "react";
import { format, addDays, startOfDay, isSameDay, startOfMonth } from "date-fns";
import { arDZ } from "date-fns/locale";
import { SystemType, ShiftType } from "@/lib/shiftPatterns";
import { getShiftForDate } from "@/hooks/useShiftLogic";
import {
  LayoutGrid,
  StretchHorizontal,
  Sun,
  Moon,
  Coffee,
  Plane,
  Download,
  Loader2,
  Calendar,
} from "lucide-react";
import MonthGrid from "./MonthGrid";
import { getHolidayForDate } from "@/lib/dateUtils";
import { AppSettings } from "@/hooks/useAppSettings";
import BottomSheet from "./BottomSheet";
import { Compass, Plus, Minus } from "lucide-react";
import AnnouncementBanner from "./AnnouncementBanner";

interface CalendarViewProps {
  settings: AppSettings;
  updateSettings: (newSettings: Partial<AppSettings>) => void;
  cycleStartDate: string;
  systemType: SystemType;
  initialCycleDay?: number;
  workDuration?: number;
  vacationDuration?: number;
  addRouteDays?: boolean;
  workDurationExtension?: number;
  selectedDate: Date;
  onDateSelect: (date: Date) => void;
  onShowCalibration: () => void;
  onShowExtension: () => void;
  onExportSchedule?: (month: Date) => void;
  isExporting?: boolean;
}

import { Briefcase } from "lucide-react";

const getShiftIcons = (
  systemType: string,
): Record<ShiftType, React.ReactNode> => {
  const is5x2 = systemType === "5x2_admin";
  return {
    day: is5x2 ? (
      <Briefcase size={12} className="text-blue-400" />
    ) : (
      <Sun size={12} className="text-amber-400" />
    ),
    evening: null, // User requested to remove icon from evening shifts
    night: <Moon size={12} className="text-blue-400" />,
    rest: <Coffee size={12} className="text-slate-500" />,
    leave: <Plane size={12} className="text-emerald-400" />,
  };
};

export default function CalendarView({
  settings,
  updateSettings,
  cycleStartDate,
  systemType,
  initialCycleDay = 1,
  workDuration = 28,
  vacationDuration = 7,
  addRouteDays = false,
  workDurationExtension = 0,
  selectedDate,
  onDateSelect,
  onShowCalibration,
  onShowExtension,
  onExportSchedule,
  isExporting = false,
}: CalendarViewProps) {
  const [isExpanded, setIsExpanded] = React.useState(false);
  const [gridMonth, setGridMonth] = React.useState(() =>
    startOfMonth(new Date()),
  );
  // State and operations lifted to page.tsx
  const scrollRef = useRef<HTMLDivElement>(null);
  const todayRef = useRef<HTMLButtonElement>(null);
  const today = startOfDay(new Date());

  const handleDismissAnnouncement = () => {
    updateSettings({ hasSeenCalendarTip: true });
  };

  const showAnnouncement = !settings.hasSeenCalendarTip;

  const scrollToToday = React.useCallback((instant = false) => {
    if (todayRef.current) {
      todayRef.current.scrollIntoView({
        behavior: instant ? "auto" : "smooth",
        inline: "center",
        block: "nearest",
      });
    }
  }, []);

  // Auto-scroll to today
  React.useEffect(() => {
    if (!isExpanded) {
      const timer = setTimeout(() => scrollToToday(), 50);
      return () => clearTimeout(timer);
    }
  }, [isExpanded, scrollToToday]);

  const days = Array.from({ length: 60 }, (_, i) => addDays(today, i - 10));

  const dateLocale = arDZ;

  return (
    <div className="w-full flex flex-col">
      <div className="flex items-center justify-between px-6 pt-2">
        <span className="text-[10px] font-black text-slate-500 uppercase tracking-[0.2em]">
          تقويم الدوام
        </span>
        <div className="flex items-center gap-2">
          {/* Export button — only visible when month grid is expanded */}
          {isExpanded && onExportSchedule && (
            <button
              onClick={() => onExportSchedule(gridMonth)}
              disabled={isExporting}
              className="p-2 rounded-xl bg-white/5 border border-white/10 text-slate-400 hover:text-white disabled:opacity-50 transition-all flex items-center gap-2"
              title="تحميل جدول هذا الشهر"
            >
              {isExporting ? (
                <Loader2 size={14} className="animate-spin" />
              ) : (
                <Download size={14} />
              )}
              <span className="text-[10px] font-black uppercase tracking-wider">
                {isExporting ? "..." : "تحميل الجدول"}
              </span>
            </button>
          )}

          <button
            onClick={() => setIsExpanded(!isExpanded)}
            className="p-2 rounded-xl bg-white/5 border border-white/10 text-slate-400 hover:text-white transition-all flex items-center gap-2"
          >
            {isExpanded ? (
              <StretchHorizontal size={14} />
            ) : (
              <LayoutGrid size={14} />
            )}
            <span className="text-[10px] font-black uppercase tracking-wider">
              {isExpanded ? "عرض الأسبوع" : "عرض الشهر"}
            </span>
          </button>
        </div>
      </div>

      <>
        {showAnnouncement && (
          <AnnouncementBanner
            title="ميزة جديدة: تصحيح الدوام"
            description="الآن يمكنك الضغط على 🧭 لتصحيح أو تغيير أيام الدورة متى شئت بضغطة واحدة."
            onDismiss={handleDismissAnnouncement}
          />
        )}
      </>

      <>
        {isExpanded ? (
          <div
            key="grid"
            className="border-t border-white/5 animate-slide-down"
          >
            <div>
              <MonthGrid
                settings={settings}
                cycleStartDate={cycleStartDate}
                systemType={systemType}
                initialCycleDay={initialCycleDay}
                workDuration={workDuration}
                vacationDuration={vacationDuration}
                addRouteDays={addRouteDays}
                workDurationExtension={workDurationExtension}
                annualLeaveBlocks={settings.annualLeaveBlocks || []}
                selectedDate={selectedDate}
                onDateSelect={onDateSelect}
                onMonthChange={setGridMonth}
              />
            </div>
          </div>
        ) : (
          <div
            key="strip"
            ref={scrollRef}
            className="flex gap-3 overflow-x-auto no-scrollbar snap-x snap-mandatory px-6 py-4 animate-fade-in"
          >
            {days.map((date, idx) => {
              const isSelected = isSameDay(date, selectedDate);
              const isToday = isSameDay(date, today);
              const shiftType = getShiftForDate(
                date,
                cycleStartDate,
                systemType,
                initialCycleDay,
                workDuration,
                vacationDuration,
                addRouteDays,
                settings.annualLeaveBlocks || [],
                workDurationExtension,
              );
              const holiday = getHolidayForDate(date);
              const dateStr = format(date, "yyyy-MM-dd");
              const hasEvent = (settings.calendarEvents || []).some(
                (e) => e.date === dateStr,
              );

              return (
                <button
                  key={idx}
                  ref={isToday ? todayRef : null}
                  onClick={() => onDateSelect(date)}
                  style={
                    isSelected
                      ? {
                          borderColor: "rgba(var(--accent-rgb),0.15)",
                          backgroundColor: "rgba(var(--accent-rgb),0.08)",
                        }
                      : {}
                  }
                  className={`
                    flex-shrink-0 w-16 h-24 rounded-2xl flex flex-col items-center justify-center gap-2
                    snap-center transition-all duration-300 relative
                    ${isSelected ? "border scale-105" : isToday ? "bg-white/[0.02] border border-blue-500/50" : "bg-white/[0.02] border border-transparent"}
                  `}
                >
                  <span className="text-[10px] font-black text-slate-500 capitalize">
                    {format(date, "EEEE", { locale: dateLocale }).split(" ")[0]}
                  </span>
                  <div className="relative flex flex-col items-center">
                    <span
                      className={`text-xl font-black font-mono ${isSelected ? "text-white" : isToday ? "text-blue-400" : "text-slate-400"}`}
                    >
                      {format(date, "d")}
                    </span>
                    {holiday && (
                      <span
                        className="absolute -top-1 -right-4 text-[10px]"
                        title={holiday.name}
                      >
                        {holiday.icon}
                      </span>
                    )}
                    {hasEvent && (
                      <div className="absolute -top-1 -left-2 w-1.5 h-1.5 rounded-full bg-amber-400 shadow-[0_0_5px_rgba(251,191,36,0.5)]" />
                    )}
                  </div>
                  <div className="flex items-center justify-center h-4">
                    {getShiftIcons(systemType)[shiftType]}
                  </div>

                  {isToday && !isSelected && (
                    <div
                      className="absolute top-2 right-2 w-1.5 h-1.5 rounded-full"
                      style={{ backgroundColor: "var(--accent)" }}
                    />
                  )}
                </button>
              );
            })}
          </div>
        )}
      </>

      {/* Footer action bar — visible only when month grid is expanded */}
      <>
        {isExpanded && (
          <div className="flex items-center justify-center gap-3 px-6 pb-4 pt-2 border-t border-white/5 animate-slide-up-modal">
            <button
              onClick={() => onShowCalibration()}
              className={`flex-1 p-2.5 rounded-xl transition-all flex items-center justify-center gap-2 relative ${
                showAnnouncement
                  ? "bg-emerald-500/20 border border-emerald-500/50 text-emerald-400 shadow-lg shadow-emerald-500/10"
                  : "bg-emerald-500/5 border border-emerald-500/10 text-emerald-500 hover:bg-emerald-500/10"
              }`}
              title="تصحيح يدوي"
            >
              <Compass
                size={14}
                className={showAnnouncement ? "animate-pulse" : ""}
              />
              <span className="text-[10px] font-black uppercase">
                تصحيح يدوي
              </span>
              {showAnnouncement && (
                <span className="absolute -top-1 -right-1 w-2.5 h-2.5 bg-emerald-500 border-2 border-slate-950 rounded-full animate-bounce" />
              )}
            </button>

            <button
              onClick={() => onShowExtension()}
              className={`flex-1 p-2.5 rounded-xl transition-all flex items-center justify-center gap-2 relative ${
                settings.workDurationExtension > 0
                  ? "bg-blue-500/20 border border-blue-500/50 text-blue-400 shadow-lg shadow-blue-500/10"
                  : "bg-blue-500/5 border border-blue-500/10 text-blue-500 hover:bg-blue-500/10"
              }`}
              title="تمديد فترة العمل"
            >
              <Plus size={14} />
              <span className="text-[10px] font-black uppercase">
                تمديد فترة العمل
              </span>
              {settings.workDurationExtension > 0 && (
                <span className="absolute -top-1 -right-1 w-2.5 h-2.5 bg-blue-500 border-2 border-slate-950 rounded-full animate-bounce" />
              )}
            </button>
          </div>
        )}
      </>
    </div>
  );
}
