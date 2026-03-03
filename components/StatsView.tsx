// components/StatsView.tsx
"use client";

import { useState, useMemo } from "react";
import { AppSettings } from "@/hooks/useAppSettings";
import { getShiftForDate } from "@/hooks/useShiftLogic";
import { useStats } from "@/hooks/useStats";
import { formatShiftLabel } from "@/lib/dateUtils";
import { ShiftType } from "@/lib/shiftPatterns";
import {
  BarChart2,
  Clock,
  Sun,
  Moon,
  Coffee,
  TrendingUp,
  CalendarCheck,
  Flame,
  Plane,
  Briefcase,
  ChevronLeft,
} from "lucide-react";

/* ─────────────────────────────────────────────────────────────────────────────
   TROIS HUIT — Statistics Page v3 — Premium Redesign
   ───────────────────────────────────────────────────────────────────────────── */

// ── Helper to get Shift meta based on system type ──────────────────────────
const getShiftMeta = (
  systemType: string,
): Record<
  ShiftType,
  { label: string; icon: React.ReactNode; color: string; hours: number }
> => {
  const is5x2 = systemType === "5x2_admin";
  return {
    day: is5x2
      ? {
          label: "عمل يومي",
          icon: <Briefcase size={20} />,
          color: "#3B82F6",
          hours: 8,
        }
      : {
          label: "صباح + ليل",
          icon: <Sun size={20} />,
          color: "#f59e0b",
          hours: 8,
        },
    evening: {
      label: "عمل مسائية",
      icon: <Sun size={20} />,
      color: "#f97316",
      hours: 8,
    },
    night: {
      label: "ليلية",
      icon: <Moon size={20} />,
      color: "#818cf8",
      hours: 8,
    },
    rest: {
      label: "راحة",
      icon: <Coffee size={20} />,
      color: "#10b981",
      hours: 0,
    },
    leave: {
      label: "إجازة",
      icon: <Plane size={20} />,
      color: "#64748b",
      hours: 0,
    },
  };
};

// ── Local Glass primitive ─────────────────────────────────────────────────────
function GlassCard({
  children,
  className = "",
  style,
  glowColor,
}: {
  children: React.ReactNode;
  className?: string;
  style?: React.CSSProperties;
  glowColor?: string;
}) {
  return (
    <div
      className={`rounded-3xl border border-white/[0.07] bg-white/[0.03] backdrop-blur-sm relative overflow-hidden ${className}`}
      style={{
        boxShadow: glowColor ? `0 0 50px ${glowColor}18` : undefined,
        ...style,
      }}
    >
      {children}
    </div>
  );
}

// ── Donut ring ────────────────────────────────────────────────────────────────
function DonutRing({
  slices,
  size = 120,
  stroke = 14,
}: {
  slices: { color: string; value: number }[];
  size?: number;
  stroke?: number;
}) {
  const r = (size - stroke) / 2;
  const circ = 2 * Math.PI * r;
  const total = slices.reduce((a, b) => a + b.value, 0);
  let offset = 0;

  return (
    <svg width={size} height={size} style={{ transform: "rotate(-90deg)" }}>
      <circle
        cx={size / 2}
        cy={size / 2}
        r={r}
        fill="none"
        stroke="rgba(255,255,255,0.05)"
        strokeWidth={stroke}
      />
      {slices
        .filter((s) => s.value > 0)
        .map((s, i) => {
          const len = total > 0 ? (s.value / total) * circ - 2 : 0;
          const el = (
            <circle
              key={i}
              cx={size / 2}
              cy={size / 2}
              r={r}
              fill="none"
              stroke={s.color}
              strokeWidth={stroke}
              strokeDasharray={`${Math.max(0, len)} ${circ}`}
              strokeDashoffset={-offset}
              strokeLinecap="butt"
              style={{ filter: `drop-shadow(0 0 4px ${s.color}88)` }}
            />
          );
          offset += total > 0 ? (s.value / total) * circ : 0;
          return el;
        })}
    </svg>
  );
}

// ── Horizontal bar ────────────────────────────────────────────────────────────
function HBar({
  value,
  max,
  color,
}: {
  value: number;
  max: number;
  color: string;
}) {
  const pct = max > 0 ? Math.min(100, (value / max) * 100) : 0;
  return (
    <div className="w-full h-2 bg-white/5 rounded-full overflow-hidden">
      <div
        className="h-full rounded-full transition-all duration-1000 ease-out"
        style={{
          width: `${pct}%`,
          background: `linear-gradient(90deg, ${color}99, ${color})`,
          boxShadow: `0 0 8px ${color}55`,
        }}
      />
    </div>
  );
}

// ── Mini pill stat ────────────────────────────────────────────────────────────
function Pill({
  label,
  value,
  sub,
  color,
  icon,
}: {
  label: string;
  value: string | number;
  sub?: string;
  color: string;
  icon: React.ReactNode;
}) {
  return (
    <GlassCard className="p-4 flex flex-col gap-3">
      <div className="flex items-center justify-between">
        <div
          className="w-8 h-8 rounded-xl flex items-center justify-center"
          style={{
            backgroundColor: `${color}22`,
            border: `1px solid ${color}33`,
          }}
        >
          <div style={{ color }} className="w-4 h-4">
            {icon}
          </div>
        </div>
        <span className="font-mono text-[10px] font-bold text-slate-700 uppercase tracking-widest">
          {sub}
        </span>
      </div>
      <div>
        <div className="text-2xl font-black text-slate-100 leading-none mb-1">
          {value}
        </div>
        <div className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">
          {label}
        </div>
      </div>
    </GlassCard>
  );
}

// ── History row ───────────────────────────────────────────────────────────────
function HistoryRow({
  date,
  shiftType,
  delay,
  systemType,
}: {
  date: Date;
  shiftType: ShiftType;
  delay: number;
  systemType: string;
}) {
  const meta = getShiftMeta(systemType)[shiftType];
  const dateStr = date.toLocaleDateString("ar-DZ", {
    weekday: "short",
    day: "numeric",
    month: "short",
  });
  return (
    <div
      dir="rtl"
      className="flex items-center justify-between px-4 py-3.5 rounded-2xl bg-white/[0.02] border border-white/[0.05] hover:bg-white/[0.04] transition-all animate-fade-in"
      style={{ animationDelay: `${delay}s`, animationFillMode: "both" }}
    >
      <div className="flex items-center gap-3">
        <div
          className="w-10 h-10 rounded-xl flex items-center justify-center text-lg shrink-0"
          style={{
            backgroundColor: `${meta.color}18`,
            border: `1px solid ${meta.color}28`,
          }}
        >
          {meta.icon}
        </div>
        <div>
          <div className="text-sm font-black text-slate-200">
            {formatShiftLabel(meta.label)}
          </div>
          <div className="text-[10px] font-bold text-slate-600 uppercase tracking-widest">
            {dateStr}
          </div>
        </div>
      </div>
      <div
        className="px-2.5 py-1 rounded-full text-[9px] font-black uppercase tracking-wider"
        style={{ backgroundColor: `${meta.color}18`, color: meta.color }}
      >
        {meta.hours > 0 ? `${meta.hours}س` : "—"}
      </div>
    </div>
  );
}

// ── MAIN COMPONENT ────────────────────────────────────────────────────────────
interface StatsViewProps {
  settings: AppSettings;
}

const TABS = [
  { id: "overview", label: "نظرة عامة", icon: <BarChart2 size={14} /> },
  { id: "history", label: "السجل", icon: <CalendarCheck size={14} /> },
  { id: "schedule", label: "الجدول", icon: <ChevronLeft size={14} /> },
] as const;
type TabId = (typeof TABS)[number]["id"];

export default function StatsView({ settings }: StatsViewProps) {
  const [tab, setTab] = useState<TabId>("overview");

  const today = useMemo(() => {
    const d = new Date();
    d.setHours(0, 0, 0, 0);
    return d;
  }, []);

  const stats = useStats(
    settings.cycleStartDate,
    settings.systemType,
    settings.initialCycleDay,
    settings.workDuration,
    settings.vacationDuration,
    settings.addRouteDays,
    settings.annualLeaveBlocks || [],
    settings.annualLeaveTotal || 30,
    settings.workDurationExtension || 0,
    today,
  );

  const todayShift = getShiftForDate(
    today,
    settings.cycleStartDate,
    settings.systemType,
    settings.initialCycleDay,
    settings.workDuration,
    settings.vacationDuration,
    settings.addRouteDays,
    settings.annualLeaveBlocks || [],
    settings.workDurationExtension || 0,
  );
  const isVacation = todayShift === "leave";
  const isRest = todayShift === "rest";
  const isWork = !isVacation && !isRest;

  const cyclePercent = Math.min(
    100,
    (stats.daysWorkedInCycle / stats.totalWorkBlockDays) * 100,
  );
  const leavePercent =
    stats.annualLeaveTotal > 0
      ? Math.min(
          100,
          (stats.annualLeaveConsumed / stats.annualLeaveTotal) * 100,
        )
      : 0;

  // Distribution for donut
  const totalDays = stats.daysInMonthCount;
  const currentMeta = getShiftMeta(settings.systemType);
  const donutSlices = [
    { color: currentMeta.day.color, value: stats.distribution.day },
    { color: currentMeta.evening.color, value: stats.distribution.evening },
    { color: currentMeta.night.color, value: stats.distribution.night },
    { color: currentMeta.rest.color, value: stats.distribution.rest },
    { color: currentMeta.leave.color, value: stats.distribution.leave },
  ];

  // History list data
  const historyDays = Array.from({ length: 14 }, (_, i) => {
    const d = new Date(today);
    d.setDate(d.getDate() - (i + 1));
    return {
      date: d,
      shiftType: getShiftForDate(
        d,
        settings.cycleStartDate,
        settings.systemType,
        settings.initialCycleDay,
        settings.workDuration,
        settings.vacationDuration,
        settings.addRouteDays,
        settings.annualLeaveBlocks || [],
        settings.workDurationExtension || 0,
      ),
    };
  });

  const scheduleDays = Array.from({ length: 14 }, (_, i) => {
    const d = new Date(today);
    d.setDate(d.getDate() + (i + 1));
    return {
      date: d,
      shiftType: getShiftForDate(
        d,
        settings.cycleStartDate,
        settings.systemType,
        settings.initialCycleDay,
        settings.workDuration,
        settings.vacationDuration,
        settings.addRouteDays,
        settings.annualLeaveBlocks || [],
        settings.workDurationExtension || 0,
      ),
    };
  });

  const n = (x: number) => Math.round(x).toLocaleString("ar-DZ");

  return (
    <div dir="rtl" className="flex flex-col gap-5">
      {/* ── Tab bar ──────────────────────────────────────────────────────── */}
      <div className="flex gap-2">
        {TABS.map((t) => (
          <button
            key={t.id}
            onClick={() => setTab(t.id)}
            className={`flex-1 flex items-center justify-center gap-1.5 py-3 px-2 rounded-2xl text-[11px] font-black transition-all border ${
              tab === t.id
                ? "bg-white/10 border-white/15 text-white"
                : "bg-white/[0.03] border-transparent text-slate-500 hover:text-slate-300"
            }`}
          >
            {t.label}
            {t.icon}
          </button>
        ))}
      </div>

      <>
        {tab === "overview" && (
          <div
            key="overview"
            className="flex flex-col gap-5 animate-slide-up-modal"
          >
            {/* ── Today's status banner ──────────────────────────────────── */}
            <GlassCard
              className="p-5"
              glowColor={
                isVacation ? "#10b981" : isRest ? "#818cf8" : "#f59e0b"
              }
            >
              <div
                className="absolute inset-0 rounded-3xl opacity-30"
                style={{
                  background: `radial-gradient(ellipse at top right, ${isVacation ? "#10b981" : isRest ? "#818cf8" : "#f59e0b"}22 0%, transparent 60%)`,
                }}
              />
              <div className="relative z-10 flex items-center justify-between">
                <div>
                  <div className="text-[10px] font-black text-slate-500 uppercase tracking-[0.2em] mb-1">
                    حالة اليوم
                  </div>
                  <div className="text-2xl font-black text-slate-100 flex items-center gap-2">
                    {currentMeta[todayShift].icon}{" "}
                    {formatShiftLabel(currentMeta[todayShift].label)}
                  </div>
                  <div className="text-[11px] font-bold text-slate-500 mt-1">
                    {isVacation
                      ? "يوم إجازة سعيد"
                      : isRest
                        ? "راحة مستحقة"
                        : `${currentMeta[todayShift].hours} ساعات عمل`}
                  </div>
                </div>
                <div className="text-5xl opacity-80">
                  {currentMeta[todayShift].icon}
                </div>
              </div>
            </GlassCard>

            {/* ── Vacation / Next break countdown ───────────────────────── */}
            <GlassCard className="p-5" glowColor="#10b981">
              <div
                className="absolute top-0 right-0 w-40 h-40 rounded-full blur-3xl opacity-20"
                style={{
                  background: "#10b981",
                  transform: "translate(40%, -40%)",
                }}
              />
              <div className="relative z-10">
                <div className="flex items-center justify-between mb-4">
                  <div className="flex items-center gap-2">
                    <Plane size={14} className="text-emerald-400" />
                    <span className="text-[10px] font-black text-slate-500 uppercase tracking-[0.15em]">
                      الإجازات السنوية
                    </span>
                  </div>
                  <div
                    className={`px-3 py-1 rounded-full text-[9px] font-black uppercase ${isVacation ? "bg-emerald-500/20 text-emerald-400 border border-emerald-500/20" : "bg-white/5 text-slate-500 border border-white/5"}`}
                  >
                    {isVacation ? "في إجازة الآن" : "مجدولة"}
                  </div>
                </div>

                <div className="grid grid-cols-3 gap-3 mb-4">
                  <div className="text-center">
                    <div className="text-3xl font-black text-emerald-400 leading-none">
                      #{n(stats.currentVacationIndex)}
                    </div>
                    <div className="text-[9px] font-bold text-slate-600 mt-1">
                      الحالية
                    </div>
                  </div>
                  <div className="text-center border-x border-white/5">
                    <div className="text-3xl font-black text-slate-300 leading-none">
                      {n(stats.vacationsInYear)}
                    </div>
                    <div className="text-[9px] font-bold text-slate-600 mt-1">
                      الإجمالي
                    </div>
                  </div>
                  <div className="text-center">
                    <div className="text-3xl font-black text-slate-400 leading-none">
                      {n(stats.vacationsRemaining)}
                    </div>
                    <div className="text-[9px] font-bold text-slate-600 mt-1">
                      المتبقي
                    </div>
                  </div>
                </div>

                {!isVacation && stats.daysUntilNextVacation > 0 && (
                  <div className="flex items-center justify-between p-3 rounded-2xl bg-white/5 border border-white/5">
                    <span className="text-[11px] font-bold text-slate-400">
                      ⏳ حتى الإجازة القادمة
                    </span>
                    <span className="text-lg font-black text-emerald-400">
                      {n(stats.daysUntilNextVacation)} يوم
                    </span>
                  </div>
                )}
              </div>
            </GlassCard>

            {/* ── Work cycle progress ───────────────────────────────────── */}
            <GlassCard className="p-5">
              <div className="flex items-center gap-2 mb-4">
                <Briefcase size={14} className="text-blue-400" />
                <span className="text-[10px] font-black text-slate-500 uppercase tracking-[0.15em]">
                  تقدم دورة العمل
                </span>
                <span className="mr-auto text-[10px] font-black text-slate-300">
                  {n(cyclePercent)}٪
                </span>
              </div>
              <HBar
                value={stats.daysWorkedInCycle}
                max={stats.totalWorkBlockDays}
                color="#3b82f6"
              />
              <div className="flex justify-between mt-3">
                <span className="text-[10px] font-bold text-slate-600">
                  المنقضي: {n(stats.daysWorkedInCycle)} يوم
                </span>
                <span className="text-[10px] font-bold text-slate-600">
                  متبقي: {n(stats.totalWorkBlockDays - stats.daysWorkedInCycle)}{" "}
                  يوم
                </span>
              </div>
            </GlassCard>

            {/* ── Annual leave bar ──────────────────────────────────────── */}
            <GlassCard className="p-5">
              <div className="flex items-center gap-2 mb-4">
                <Plane size={14} className="text-emerald-400" />
                <span className="text-[10px] font-black text-slate-500 uppercase tracking-[0.15em]">
                  رصيد الإجازة السنوية
                </span>
                <span className="mr-auto text-[10px] font-black text-emerald-400">
                  {n(stats.annualLeaveRemaining)} / {n(stats.annualLeaveTotal)}{" "}
                  يوم
                </span>
              </div>
              <HBar
                value={stats.annualLeaveConsumed}
                max={stats.annualLeaveTotal}
                color="#10b981"
              />
              <div className="flex justify-between mt-3">
                <span className="text-[10px] font-bold text-slate-600">
                  المستهلك: {n(stats.annualLeaveConsumed)} يوم
                </span>
                <span className="text-[10px] font-bold text-emerald-600/80">
                  متبقي: {n(stats.annualLeaveRemaining)} يوم
                </span>
              </div>
            </GlassCard>

            {/* ── Monthly distribution ring + legend ───────────────────── */}
            <GlassCard className="p-5">
              <div className="flex items-center gap-2 mb-4">
                <BarChart2 size={14} className="text-violet-400" />
                <span className="text-[10px] font-black text-slate-500 uppercase tracking-[0.15em]">
                  توزيع الشهر الحالي
                </span>
              </div>
              <div className="flex items-center gap-6">
                <div className="relative shrink-0">
                  <DonutRing slices={donutSlices} size={110} stroke={13} />
                  <div className="absolute inset-0 flex flex-col items-center justify-center">
                    <span className="text-2xl font-black text-slate-100 leading-none">
                      {n(totalDays)}
                    </span>
                    <span className="text-[8px] font-bold text-slate-600 uppercase">
                      يوم مجدول
                    </span>
                  </div>
                </div>
                <div className="flex-1 grid grid-cols-1 gap-2.5">
                  {(Object.entries(stats.distribution) as [ShiftType, number][])
                    .filter(([, count]) => count > 0)
                    .map(([type, count]) => (
                      <div key={type} className="flex items-center gap-2">
                        <div
                          className="w-2 h-2 rounded-full shrink-0"
                          style={{ backgroundColor: currentMeta[type].color }}
                        />
                        <span className="text-[10px] font-bold text-slate-400 flex-1">
                          {formatShiftLabel(currentMeta[type].label)}
                        </span>
                        <span className="font-mono text-[10px] font-black text-slate-300">
                          {n(count)}
                        </span>
                        <span className="text-[9px] text-slate-600 w-6 text-left">
                          {totalDays > 0
                            ? `${Math.round((count / totalDays) * 100)}٪`
                            : ""}
                        </span>
                      </div>
                    ))}
                </div>
              </div>
            </GlassCard>

            {/* ── Key metrics grid ──────────────────────────────────────── */}
            <div className="grid grid-cols-2 gap-3">
              <Pill
                icon={<Clock size={14} />}
                label="ساعات العمل"
                value={`${n(stats.hoursThisMonth)}س`}
                sub="شهر"
                color="#fbbf24"
              />
              <Pill
                icon={<Coffee size={14} />}
                label="أيام راحة"
                value={n(stats.distribution.rest)}
                sub="هذا الشهر"
                color="#10b981"
              />
              <Pill
                icon={<Sun size={14} />}
                label="مناوبات مكتملة"
                value={n(stats.shiftsCompleted)}
                sub="مكتمل"
                color="#f59e0b"
              />
              <Pill
                icon={<Flame size={14} />}
                label="أطول سلسلة عمل"
                value={`${n(stats.streak)} يوم`}
                sub="متواصل"
                color="#ef4444"
              />
            </div>
          </div>
        )}

        {tab === "history" && (
          <div
            key="history"
            className="flex flex-col gap-2 animate-slide-up-modal"
          >
            <div className="flex items-center gap-2 px-1 mb-1">
              <CalendarCheck size={13} className="text-slate-600" />
              <span className="text-[10px] font-black text-slate-600 uppercase tracking-[0.2em]">
                آخر 14 يوم
              </span>
            </div>
            {historyDays.map((row, i) => (
              <HistoryRow
                key={i}
                date={row.date}
                shiftType={row.shiftType as ShiftType}
                delay={i * 0.04}
                systemType={settings.systemType}
              />
            ))}
          </div>
        )}

        {tab === "schedule" && (
          <div
            key="schedule"
            className="flex flex-col gap-2 animate-slide-up-modal"
          >
            <div className="flex items-center gap-2 px-1 mb-1">
              <span className="text-[10px] font-black text-slate-600 uppercase tracking-[0.2em]">
                الجدول القادم (14 يوم)
              </span>
              <ChevronLeft size={13} className="text-slate-600" />
            </div>
            {scheduleDays.map((row, i) => (
              <HistoryRow
                key={i}
                date={row.date}
                shiftType={row.shiftType as ShiftType}
                delay={i * 0.04}
                systemType={settings.systemType}
              />
            ))}
          </div>
        )}
      </>

      <div className="text-center text-[8px] font-black text-slate-800 uppercase tracking-[0.4em] py-8">
        Trois Huit Analytics Engine
      </div>
    </div>
  );
}
