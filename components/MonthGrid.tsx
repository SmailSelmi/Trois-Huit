// components/MonthGrid.tsx
"use client";

import React from "react";
import {
  format,
  startOfMonth,
  endOfMonth,
  startOfWeek,
  endOfWeek,
  eachDayOfInterval,
  isSameMonth,
  isSameDay,
  addMonths,
  subMonths,
} from "date-fns";
import { arDZ } from "date-fns/locale";
import { getHolidayForDate, formatShiftLabel } from "@/lib/dateUtils";
import { AppSettings } from "@/hooks/useAppSettings";
import { SystemType, ShiftType } from "@/lib/shiftPatterns";
import { getShiftForDate } from "@/hooks/useShiftLogic";
import { Sun, Moon, Coffee, Plane, Sunset } from "lucide-react";

interface MonthGridProps {
  settings: AppSettings;
  cycleStartDate: string;
  systemType: SystemType;
  initialCycleDay?: number;
  workDuration?: number;
  vacationDuration?: number;
  addRouteDays?: boolean;
  annualLeaveBlocks?: { id: string; start: string; end: string }[];
  workDurationExtension?: number;
  selectedDate: Date;
  onDateSelect: (date: Date) => void;
  onMonthChange?: (month: Date) => void;
}

import { Briefcase } from "lucide-react";

const getShiftIcons = (
  systemType: string,
): Record<ShiftType, React.ReactNode> => {
  const is5x2 = systemType === "5x2_admin";
  return {
    day: is5x2 ? (
      <Briefcase size={10} className="text-blue-400" />
    ) : (
      <div className="flex flex-col items-center gap-[1px]">
        <Sun size={9} className="text-amber-400" />
        <Moon size={9} className="text-blue-400" />
      </div>
    ),
    evening: <Sunset size={10} className="text-orange-400" />,
    night: <Moon size={10} className="text-blue-400" />,
    rest: <Coffee size={10} className="text-slate-500" />,
    leave: <Plane size={10} className="text-emerald-400" />,
  };
};

const WEEKDAYS = [
  "الأحد",
  "الاثنين",
  "الثلاثاء",
  "الأربعاء",
  "الخميس",
  "الجمعة",
  "السبت",
];

export default function MonthGrid({
  settings,
  cycleStartDate,
  systemType,
  initialCycleDay = 1,
  workDuration = 28,
  vacationDuration = 7,
  addRouteDays = false,
  annualLeaveBlocks = [],
  workDurationExtension = 0,
  selectedDate,
  onDateSelect,
  onMonthChange,
}: MonthGridProps) {
  const [currentMonth, setCurrentMonth] = React.useState(
    startOfMonth(selectedDate),
  );
  const [direction, setDirection] = React.useState(0);
  const [touchStartX, setTouchStartX] = React.useState<number | null>(null);

  const handleTouchStart = (e: React.TouchEvent) => {
    setTouchStartX(e.targetTouches[0].clientX);
  };

  const handleTouchEnd = (e: React.TouchEvent) => {
    if (touchStartX === null) return;
    const touchEndX = e.changedTouches[0].clientX;
    const swipeDistance = touchStartX - touchEndX;

    // RTL swipe logic:
    // Swiping right (negative distance) -> see content to the "left" (future dates)
    // Swiping left (positive distance) -> see content to the "right" (past dates)
    if (swipeDistance > 50) {
      handlePrevMonth();
    } else if (swipeDistance < -50) {
      handleNextMonth();
    }
    setTouchStartX(null);
  };

  const is5x2 = systemType === "5x2_admin";
  const shiftLabels: Record<ShiftType, string> = {
    day: is5x2 ? "عمل يومي" : "صباح + ليل",
    evening: "عمل مسائية",
    night: "ليلية",
    rest: "راحة",
    leave: "إجازة",
  };

  const weekdays = [0, 1, 2, 3, 4, 5, 6].map((d) =>
    format(new Date(2024, 0, 7 + d), "EEE", { locale: arDZ }),
  );

  const monthStart = startOfMonth(currentMonth);
  const monthEnd = endOfMonth(currentMonth);
  const calendarStart = startOfWeek(monthStart, { weekStartsOn: 0 });
  const calendarEnd = endOfWeek(monthEnd, { weekStartsOn: 0 });

  const days = eachDayOfInterval({
    start: calendarStart,
    end: calendarEnd,
  });

  const today = new Date();

  const handlePrevMonth = () => {
    setDirection(-1);
    const prev = subMonths(currentMonth, 1);
    setCurrentMonth(prev);
    onMonthChange?.(prev);
  };

  const handleNextMonth = () => {
    setDirection(1);
    const next = addMonths(currentMonth, 1);
    setCurrentMonth(next);
    onMonthChange?.(next);
  };

  return (
    <div className="w-full px-6 py-4 flex flex-col gap-4">
      <div className="flex items-center justify-between mb-2 px-1">
        <h3 className="text-lg font-black text-slate-100 italic tracking-tighter capitalize">
          {format(currentMonth, "MMMM yyyy", { locale: arDZ })}
        </h3>
      </div>

      <div className="relative overflow-hidden min-h-[300px] touch-none">
        <div
          key={currentMonth.toISOString()}
          onTouchStart={handleTouchStart}
          onTouchEnd={handleTouchEnd}
          className="grid grid-cols-7 gap-1 animate-fade-in transition-all duration-300"
        >
          {weekdays.map((day, i) => (
            <div
              key={i}
              className="text-center text-[10px] font-black text-slate-600 uppercase py-2"
            >
              {day}
            </div>
          ))}

          {days.map((date, idx) => {
            const isCurrentMonth = isSameMonth(date, monthStart);
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
              annualLeaveBlocks,
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
                onClick={() => onDateSelect(date)}
                style={
                  isSelected
                    ? {
                        backgroundColor: "var(--accent-glow)",
                        borderColor: "var(--accent-border)",
                      }
                    : {}
                }
                className={`
                    aspect-square rounded-xl flex flex-col items-center justify-center gap-1 transition-all
                    relative border active:scale-95
                    ${!isCurrentMonth ? "opacity-10 pointer-events-none" : ""}
                    ${isSelected ? "shadow-lg" : isToday ? "bg-white/[0.02] border border-blue-500/50" : "bg-white/[0.02] border-transparent hover:bg-white/[0.04]"}
                  `}
              >
                <div className="relative flex flex-col items-center">
                  <span
                    style={isSelected ? { color: "var(--accent-text)" } : {}}
                    className={`text-sm font-black font-mono ${isSelected ? "" : isToday ? "text-blue-400" : "text-slate-400"}`}
                  >
                    {format(date, "d")}
                  </span>
                  {holiday && (
                    <span
                      className="absolute -top-1.5 -right-3 text-[8px]"
                      title={holiday.name}
                    >
                      {holiday.icon}
                    </span>
                  )}
                  {hasEvent && (
                    <div className="absolute -bottom-1 left-1 w-1 h-1 rounded-full bg-amber-400 shadow-[0_0_5px_rgba(251,191,36,0.5)]" />
                  )}
                </div>

                <div className="flex items-center justify-center h-4">
                  {getShiftIcons(systemType)[shiftType]}
                </div>

                {isToday && !isSelected && (
                  <div
                    className="absolute top-1 right-1 w-1 h-1 rounded-full"
                    style={{ backgroundColor: "var(--accent)" }}
                  />
                )}
              </button>
            );
          })}
        </div>
      </div>

      <div className="flex flex-wrap justify-center gap-x-4 gap-y-2 py-3 border-t border-white/5 mt-2">
        {(
          (is5x2
            ? ["day", "rest", "leave"]
            : ["day", "evening", "rest", "leave"]) as ShiftType[]
        ).map((type) => (
          <div
            key={type}
            className="flex items-center gap-1.5 opacity-80 scale-95"
          >
            <div className="w-4 h-4 flex items-center justify-center">
              {getShiftIcons(systemType)[type]}
            </div>
            <span className="text-[9px] text-slate-400 uppercase font-black tracking-wider">
              {formatShiftLabel(shiftLabels[type])}
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}
