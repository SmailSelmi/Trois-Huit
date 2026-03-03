// components/ScheduleSnapshot.tsx
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
  isToday,
} from "date-fns";
import { arDZ } from "date-fns/locale";
import { SystemType, ShiftType } from "@/lib/shiftPatterns";
import { getShiftForDate } from "@/hooks/useShiftLogic";

interface ScheduleSnapshotProps {
  snapshotRef: React.RefObject<HTMLDivElement | null>;
  month: Date;
  userName: string;
  cycleStartDate: string;
  systemType: SystemType;
  initialCycleDay: number;
  workDuration: number;
  vacationDuration: number;
  addRouteDays: boolean;
  annualLeaveBlocks: { id: string; start: string; end: string }[];
  workDurationExtension: number;
  calendarEvents: { id: string; date: string; title: string; time: string }[];
}

// ── Shift visual constants ────────────────────────────────────────────────────
const SHIFT_BG: Record<ShiftType, string> = {
  day: "rgba(249,115,22,0.15)",
  evening: "rgba(124,58,237,0.15)",
  night: "rgba(37,99,235,0.15)",
  rest: "rgba(255,255,255,0.04)",
  leave: "rgba(21,128,61,0.15)",
};
const SHIFT_TEXT: Record<ShiftType, string> = {
  day: "#fb923c",
  evening: "#a78bfa",
  night: "#60a5fa",
  rest: "#334155",
  leave: "#4ade80",
};
const SHIFT_DOT: Record<ShiftType, string> = {
  day: "#f97316",
  evening: "#8b5cf6",
  night: "#3b82f6",
  rest: "#1e293b",
  leave: "#22c55e",
};

// ── Component ─────────────────────────────────────────────────────────────────
export default function ScheduleSnapshot({
  snapshotRef,
  month,
  userName,
  cycleStartDate,
  systemType,
  initialCycleDay,
  workDuration,
  vacationDuration,
  addRouteDays,
  annualLeaveBlocks,
  workDurationExtension,
  calendarEvents,
}: ScheduleSnapshotProps) {
  const monthStart = startOfMonth(month);
  const monthEnd = endOfMonth(month);
  const calStart = startOfWeek(monthStart, { weekStartsOn: 0 });
  const calEnd = endOfWeek(monthEnd, { weekStartsOn: 0 });
  const days = eachDayOfInterval({ start: calStart, end: calEnd });

  const SHIFT_LABEL: Record<ShiftType, string> = {
    day: "ص",
    evening: "م",
    night: "ل",
    rest: "ر",
    leave: "إ",
  };

  const SHIFT_FULL: Record<ShiftType, string> = {
    day: "صباحي",
    evening: "مسائي",
    night: "ليلي",
    rest: "راحة",
    leave: "إجازة",
  };

  const weekDayLabels = [0, 1, 2, 3, 4, 5, 6].map((d) =>
    format(new Date(2024, 0, 7 + d), "EEE", { locale: arDZ }),
  );

  const monthLabel = format(month, "MMMM yyyy", { locale: arDZ });
  const generatedOn = format(new Date(), "dd/MM/yy");

  return (
    /**
     * Hidden off-screen — 390px portrait (phone-width), captured by html-to-image.
     * All styles are inline to guarantee correct rendering outside the Tailwind context.
     */
    <div
      ref={snapshotRef}
      style={{
        position: "absolute",
        left: "-9999px",
        top: "0",
        width: "390px",
        background: "linear-gradient(180deg, #0f172a 0%, #020617 100%)",
        fontFamily: "Tajawal, Arial, sans-serif",
        direction: "rtl",
        boxSizing: "border-box",
        overflow: "visible", // Prevent truncation during export
        borderRadius: "16px",
        border: "1px solid rgba(255,255,255,0.08)",
        boxShadow: "0 25px 50px -12px rgba(0, 0, 0, 0.5)",
        paddingBottom: "16px", // Extra padding to avoid bottom cut-off
      }}
    >
      {/* ── Top rainbow bar ─────────────────────────────────────────────── */}
      <div
        style={{
          height: "4px",
          background: "linear-gradient(90deg,#3b82f6,#8b5cf6,#10b981)",
        }}
      />

      {/* ── Header ──────────────────────────────────────────────────────── */}
      <div
        style={{
          padding: "24px 24px 16px",
          background:
            "linear-gradient(180deg,rgba(59,130,246,0.12) 0%,transparent 100%)",
        }}
      >
        <div
          style={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "flex-start",
          }}
        >
          <div>
            <div
              style={{
                fontSize: "9px",
                fontWeight: 700,
                color: "#3b82f6",
                textTransform: "uppercase",
                letterSpacing: "2px",
                marginBottom: "4px",
              }}
            >
              TROIS HUIT · 3×8
            </div>
            <div
              style={{
                fontSize: "22px",
                fontWeight: 900,
                color: "#f1f5f9",
                letterSpacing: "-0.5px",
                lineHeight: 1.1,
              }}
            >
              {monthLabel}
            </div>
            <div
              style={{
                fontSize: "10px",
                fontWeight: 600,
                color: "#64748b",
                marginTop: "4px",
              }}
            >
              {userName}
            </div>
          </div>
          <div style={{ fontSize: "36px", lineHeight: 1 }}>📅</div>
        </div>
      </div>

      {/* ── Weekday labels ───────────────────────────────────────────────── */}
      <div
        style={{
          display: "grid",
          gridTemplateColumns: "repeat(7,1fr)",
          gap: "4px",
          padding: "0 16px 8px",
        }}
      >
        {weekDayLabels.map((d, i) => (
          <div
            key={i}
            style={{
              textAlign: "center",
              fontSize: "8px",
              fontWeight: 900,
              color: "#1e293b",
              padding: "4px 0",
            }}
          >
            {d}
          </div>
        ))}
      </div>

      {/* ── Calendar grid ───────────────────────────────────────────────── */}
      <div
        style={{
          display: "grid",
          gridTemplateColumns: "repeat(7,1fr)",
          gap: "4px",
          padding: "0 16px 20px",
        }}
      >
        {days.map((date, i) => {
          const inMonth = isSameMonth(date, monthStart);
          const isTodayDay = isToday(date);
          const shift = getShiftForDate(
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

          const dateStr = format(date, "yyyy-MM-dd");
          const dayEvents = calendarEvents.filter((ev) => ev.date === dateStr);

          // We use flex column so the cell grows vertically to fit content space
          return (
            <div
              key={i}
              style={{
                backgroundColor: inMonth
                  ? SHIFT_BG[shift]
                  : "rgba(255,255,255,0.01)",
                borderRadius: "8px",
                padding: "6px 2px",
                display: "flex",
                flexDirection: "column",
                alignItems: "center",
                opacity: inMonth ? 1 : 0.12,
                border: isTodayDay
                  ? "1.5px solid #3b82f6"
                  : "1px solid rgba(255,255,255,0.04)",
                position: "relative",
                minHeight: "40px",
              }}
            >
              {isTodayDay && (
                <div
                  style={{
                    position: "absolute",
                    top: "2px",
                    right: "3px",
                    width: "4px",
                    height: "4px",
                    borderRadius: "50%",
                    backgroundColor: "#3b82f6",
                  }}
                />
              )}
              <div
                style={{
                  fontSize: "13px",
                  fontWeight: 900,
                  color: inMonth ? SHIFT_TEXT[shift] : "#1e293b",
                  lineHeight: 1.1,
                }}
              >
                {format(date, "d")}
              </div>
              {inMonth && (
                <div
                  style={{
                    fontSize: "7px",
                    fontWeight: 800,
                    color: SHIFT_TEXT[shift],
                    marginTop: "2px",
                    opacity: 0.9,
                  }}
                >
                  {SHIFT_LABEL[shift]}
                </div>
              )}
              {inMonth && dayEvents.length > 0 && (
                <div
                  style={{
                    display: "flex",
                    flexDirection: "column",
                    gap: "2px",
                    marginTop: "4px",
                    width: "100%",
                  }}
                >
                  {dayEvents.map((ev, idx) => (
                    <div
                      key={idx}
                      style={{
                        backgroundColor: "rgba(59,130,246,0.15)",
                        color: "#60a5fa",
                        fontSize: "5px",
                        fontWeight: 700,
                        padding: "2px 0",
                        borderRadius: "2px",
                        width: "90%",
                        margin: "0 auto",
                        textAlign: "center",
                        whiteSpace: "nowrap",
                        overflow: "hidden",
                        textOverflow: "ellipsis",
                      }}
                    >
                      {ev.title}
                    </div>
                  ))}
                </div>
              )}
            </div>
          );
        })}
      </div>

      {/* ── Legend ──────────────────────────────────────────────────────── */}
      <div
        style={{
          margin: "0 16px",
          padding: "16px 0",
          borderTop: "1px solid rgba(255,255,255,0.06)",
        }}
      >
        <div
          style={{
            display: "grid",
            gridTemplateColumns: "repeat(4,1fr)",
            gap: "4px",
          }}
        >
          {(["day", "evening", "rest", "leave"] as ShiftType[]).map((t) => (
            <div
              key={t}
              style={{
                display: "flex",
                flexDirection: "column",
                alignItems: "center",
                gap: "6px",
              }}
            >
              <div
                style={{
                  width: "10px",
                  height: "10px",
                  borderRadius: "50%",
                  backgroundColor: SHIFT_DOT[t],
                  boxShadow: `0 0 8px ${SHIFT_DOT[t]}40`,
                }}
              />
              <span
                style={{ fontSize: "9px", fontWeight: 800, color: "#64748b" }}
              >
                {SHIFT_FULL[t]}
              </span>
            </div>
          ))}
        </div>
      </div>

      {/* ── Footer ──────────────────────────────────────────────────────── */}
      <div
        style={{
          padding: "8px 16px 12px",
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
        }}
      >
        <div
          style={{
            fontSize: "8px",
            fontWeight: 700,
            color: "#1e293b",
            letterSpacing: "1px",
            textTransform: "uppercase",
          }}
        >
          {generatedOn}
        </div>
        <div
          style={{
            fontSize: "8px",
            fontWeight: 700,
            color: "#1e293b",
            letterSpacing: "1px",
            textTransform: "uppercase",
          }}
        >
          TROIS HUIT
        </div>
      </div>
    </div>
  );
}
