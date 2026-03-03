// components/SettingsView.tsx
"use client";

import React from "react";
import {
  Bell,
  Moon,
  Zap,
  RotateCcw,
  Calendar,
  Layers,
  Trash2,
  Check,
  PieChart,
  Settings as SettingsIcon,
  Plus,
  Clock,
  Globe,
  Sun,
} from "lucide-react";
import GlassCard from "./GlassCard";
import DatePickerAr from "./DatePickerAr";
import { AppSettings } from "@/hooks/useAppSettings";
import { SystemType } from "@/lib/shiftPatterns";
import { format, addDays, differenceInDays } from "date-fns";
import BottomSheet from "./BottomSheet";
import { requestOSNotificationPermission } from "@/lib/notifications";
import { usePushSubscription } from "@/hooks/usePushSubscription";

interface SettingsViewProps {
  settings: AppSettings;
  updateSettings: (s: Partial<AppSettings>) => void;
  resetSettings: () => void;
  onClose?: () => void;
}

export default function SettingsView({
  settings,
  updateSettings,
  resetSettings,
  onClose,
}: SettingsViewProps) {
  const { subscribe } = usePushSubscription();
  const [showResetConfirm, setShowResetConfirm] = React.useState(false);
  const [showAddLeave, setShowAddLeave] = React.useState(false);
  const [newLeaveStart, setNewLeaveStart] = React.useState<Date>(new Date());
  const [newLeaveDuration, setNewLeaveDuration] = React.useState<number>(1);
  const [usageType, setUsageType] = React.useState<"all" | "half" | "custom">(
    "custom",
  );
  const [showEditPool, setShowEditPool] = React.useState(false);
  const [tempPool, setTempPool] = React.useState<number>(
    settings.annualLeaveTotal || 30,
  );
  const [toastMessage, setToastMessage] = React.useState<string | null>(null);
  const [pendingChange, setPendingChange] = React.useState<{
    key: keyof AppSettings;
    value: any;
    message: string;
  } | null>(null);

  const [localWork, setLocalWork] = React.useState(settings.workDuration);
  const [localVacation, setLocalVacation] = React.useState(
    settings.vacationDuration,
  );

  React.useEffect(() => {
    setLocalWork(settings.workDuration);
  }, [settings.workDuration]);

  React.useEffect(() => {
    setLocalVacation(settings.vacationDuration);
  }, [settings.vacationDuration]);

  React.useEffect(() => {
    if (toastMessage) {
      const timer = setTimeout(() => setToastMessage(null), 3000);
      return () => clearTimeout(timer);
    }
  }, [toastMessage]);

  const handleReset = () => {
    setShowResetConfirm(true);
  };

  const confirmReset = () => {
    resetSettings();
    setShowResetConfirm(false);
  };

  const annualLeaveConsumed = (settings.annualLeaveBlocks || []).reduce(
    (acc, block) => {
      return (
        acc + (differenceInDays(new Date(block.end), new Date(block.start)) + 1)
      );
    },
    0,
  );

  const remainingDays = Math.max(
    0,
    (settings.annualLeaveTotal || 30) - annualLeaveConsumed,
  );

  const handleAddLeave = () => {
    const startStr = format(newLeaveStart, "yyyy-MM-dd");
    const endDate = addDays(newLeaveStart, newLeaveDuration - 1);
    const endStr = format(endDate, "yyyy-MM-dd");

    const newBlock = {
      id: Math.random().toString(36).substr(2, 9),
      start: startStr,
      end: endStr,
    };
    updateSettings({
      annualLeaveBlocks: [...(settings.annualLeaveBlocks || []), newBlock],
    });
    setToastMessage("تم إضافة فترة الإجازة السنوية بنجاح ✈️");
    setShowAddLeave(false);
    setNewLeaveDuration(1);
    setUsageType("custom");
  };

  const removeLeaveBlock = (id: string) => {
    updateSettings({
      annualLeaveBlocks: settings.annualLeaveBlocks.filter((b) => b.id !== id),
    });
  };

  return (
    <div className="flex flex-col gap-6 max-w-2xl mx-auto pb-8" dir="rtl">
      {/* Shift Config Section */}
      <section className="flex flex-col gap-3">
        <div className="flex items-center gap-2 px-1">
          <Layers size={14} className="text-blue-400" />
          <h3 className="text-xs font-medium text-slate-500 uppercase tracking-[0.2em]">
            إعدادات فترة العمل
          </h3>
        </div>
        <GlassCard className="p-6 flex flex-col gap-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="flex flex-col gap-3">
              <label className="text-xs font-medium text-slate-500 uppercase tracking-widest ml-1">
                تاريخ مرجع الدورة (D1)
              </label>
              <DatePickerAr
                selectedDate={new Date(settings.cycleStartDate)}
                onChange={(date) =>
                  setPendingChange({
                    key: "cycleStartDate",
                    value: format(date, "yyyy-MM-dd"),
                    message: "هل أنت متأكد من تغيير تاريخ مرجع الدورة (D1)؟",
                  })
                }
              />
              <p className="text-xs font-medium text-slate-600 mr-1">
                هذا التاريخ يمثل اليوم الأول (D1) في دورتك
              </p>
            </div>

            <div className="flex flex-col gap-3">
              <label className="text-xs font-medium text-slate-500 uppercase tracking-widest ml-1">
                نظام الدوام
              </label>
              <div className="grid grid-cols-1 gap-2">
                {[
                  {
                    id: "3x8_industrial",
                    label: "نظام (3×8) الصناعي",
                    desc: "دورة من 3 أيام",
                  },
                  {
                    id: "5x2_admin",
                    label: "نظام (5×2) الإداري",
                    desc: "أحد - خميس",
                  },
                  {
                    id: "coming_soon",
                    label: "أنظمة أخرى",
                    desc: "قريباً...",
                    disabled: true,
                  },
                ].map((sys) => (
                  <button
                    key={sys.id}
                    disabled={sys.disabled}
                    onClick={() =>
                      !sys.disabled &&
                      setPendingChange({
                        key: "systemType",
                        value: sys.id as SystemType,
                        message: `هل أنت متأكد من تغيير نظام الدوام إلى ${sys.label}؟`,
                      })
                    }
                    className={`p-4 rounded-2xl border text-right transition-all flex flex-col gap-1 ${
                      settings.systemType === sys.id
                        ? "bg-blue-600/10 border-blue-500 shadow-lg shadow-blue-500/5"
                        : sys.disabled
                          ? "bg-white/[0.01] border-white/5 opacity-50 grayscale cursor-not-allowed"
                          : "bg-white/[0.03] border-white/[0.07] hover:border-white/20"
                    }`}
                  >
                    <div className="flex items-center justify-between">
                      <span
                        className={`text-base font-medium ${settings.systemType === sys.id ? "text-blue-400" : "text-slate-200"}`}
                      >
                        {sys.label}
                      </span>
                      {settings.systemType === sys.id && (
                        <Check size={14} className="text-blue-500" />
                      )}
                    </div>
                    <span className="text-xs font-medium text-slate-500">
                      {sys.desc}
                    </span>
                  </button>
                ))}
              </div>
            </div>
          </div>

          {settings.systemType === "3x8_industrial" ? (
            <div className="flex flex-col gap-2 animate-fade-in">
              <label className="text-xs font-medium text-slate-500 uppercase ml-1">
                فترة العمل في تاريخ المرجع
              </label>
              <div className="grid grid-cols-2 md:grid-cols-3 gap-2">
                {[
                  { id: 1, label: "اليوم الأول: مسائي (13-20)" },
                  { id: 2, label: "اليوم الثاني: صباحي+ليلي" },
                  { id: 3, label: "اليوم الثالث: راحة" },
                ].map((s) => (
                  <button
                    key={s.id}
                    onClick={() =>
                      setPendingChange({
                        key: "initialCycleDay",
                        value: s.id,
                        message: `هل أنت متأكد من تغيير يوم البداية إلى ${s.label}؟`,
                      })
                    }
                    className={`py-3 px-2 rounded-xl border flex flex-col items-center justify-center gap-1 transition-all ${
                      settings.initialCycleDay === s.id
                        ? "bg-blue-600/10 border-blue-500 text-blue-400"
                        : "bg-white/5 border-transparent text-slate-500"
                    }`}
                  >
                    <span className="text-xs font-medium text-center">
                      {s.label}
                    </span>
                  </button>
                ))}
              </div>

              <div className="flex flex-col gap-4 mt-4 animate-fade-in p-5 rounded-2xl bg-white/[0.02] border border-white/5 shadow-inner">
                <div className="flex flex-col gap-1 mb-2">
                  <div className="flex items-center gap-2">
                    <Clock size={16} className="text-blue-400" />
                    <h4 className="text-sm font-black text-slate-200">
                      أوقات الورديات
                    </h4>
                  </div>
                  <p className="text-xs text-slate-500 font-medium">
                    حدد موعد بداية كل فترة (تتحدد النهاية تلقائياً)
                  </p>
                </div>

                {/* Morning Start */}
                <div className="flex flex-col gap-2">
                  <label className="text-[10px] font-black uppercase tracking-wider text-slate-400 flex items-center gap-2">
                    <Sun size={12} className="text-amber-400" /> بداية الفترة
                    الصباحية
                  </label>
                  <div className="grid grid-cols-4 gap-2">
                    {["05:00", "06:00", "07:00", "08:00"].map((time) => (
                      <button
                        key={time}
                        onClick={() => {
                          updateSettings({
                            industrialMorningStart: time,
                            industrialNightEnd: time,
                          });
                        }}
                        className={`py-2 rounded-xl border text-xs font-black transition-all active:scale-95 ${
                          (settings.industrialMorningStart || "07:00") === time
                            ? "bg-amber-500/10 border-amber-500/50 text-amber-400 shadow-lg shadow-amber-500/10"
                            : "bg-white/[0.03] border-white/10 text-slate-400 hover:bg-white/[0.05]"
                        }`}
                      >
                        {time}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Evening Start */}
                <div className="flex flex-col gap-2 mt-2">
                  <label className="text-[10px] font-black uppercase tracking-wider text-slate-400 flex items-center gap-2">
                    <Sun size={12} className="text-purple-400" /> بداية الفترة
                    المسائية
                  </label>
                  <div className="grid grid-cols-4 gap-2">
                    {["13:00", "14:00", "15:00", "16:00"].map((time) => (
                      <button
                        key={time}
                        onClick={() => {
                          updateSettings({
                            industrialEveningStart: time,
                            industrialMorningEnd: time,
                          });
                        }}
                        className={`py-2 rounded-xl border text-xs font-black transition-all active:scale-95 ${
                          (settings.industrialEveningStart || "13:00") === time
                            ? "bg-purple-500/10 border-purple-500/50 text-purple-400 shadow-lg shadow-purple-500/10"
                            : "bg-white/[0.03] border-white/10 text-slate-400 hover:bg-white/[0.05]"
                        }`}
                      >
                        {time}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Night Start */}
                <div className="flex flex-col gap-2 mt-2">
                  <label className="text-[10px] font-black uppercase tracking-wider text-slate-400 flex items-center gap-2">
                    <Moon size={12} className="text-blue-400" /> بداية الفترة
                    الليلية
                  </label>
                  <div className="grid grid-cols-4 gap-2">
                    {["19:00", "20:00", "21:00", "22:00"].map((time) => (
                      <button
                        key={time}
                        onClick={() => {
                          updateSettings({
                            industrialNightStart: time,
                            industrialEveningEnd: time,
                          });
                        }}
                        className={`py-2 rounded-xl border text-xs font-black transition-all active:scale-95 ${
                          (settings.industrialNightStart || "20:00") === time
                            ? "bg-blue-500/10 border-blue-500/50 text-blue-400 shadow-lg shadow-blue-500/10"
                            : "bg-white/[0.03] border-white/10 text-slate-400 hover:bg-white/[0.05]"
                        }`}
                      >
                        {time}
                      </button>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          ) : (
            <div className="flex flex-col gap-4 animate-fade-in p-5 rounded-2xl bg-white/[0.02] border border-white/5 shadow-inner">
              <div className="flex items-center gap-2 mb-1">
                <Clock size={16} className="text-blue-400" />
                <h4 className="text-sm font-black text-slate-200">
                  أوقات الدوام المسائي
                </h4>
              </div>

              <div className="flex flex-col gap-2">
                <label className="text-xs font-bold uppercase text-slate-500">
                  بداية فترة المساء
                </label>
                <div className="grid grid-cols-2 gap-3">
                  {["13:00", "14:00"].map((time) => (
                    <button
                      key={time}
                      onClick={() => updateSettings({ afternoonStart: time })}
                      className={`py-3 rounded-xl border text-sm font-black transition-all active:scale-95 ${
                        (settings.afternoonStart || "13:00") === time
                          ? "bg-blue-500/10 border-blue-500 text-blue-400 shadow-lg shadow-blue-500/10"
                          : "bg-white/[0.03] border-white/10 text-slate-400 hover:bg-white/[0.05]"
                      }`}
                    >
                      {time}
                    </button>
                  ))}
                </div>
              </div>

              <div className="flex flex-col gap-2 mt-2">
                <label className="text-xs font-bold uppercase text-slate-500">
                  نهاية فترة المساء
                </label>
                <div className="grid grid-cols-3 gap-3">
                  {["16:00", "16:30", "17:00"].map((time) => (
                    <button
                      key={time}
                      onClick={() => updateSettings({ afternoonEnd: time })}
                      className={`py-3 rounded-xl border text-sm font-black transition-all active:scale-95 ${
                        (settings.afternoonEnd || "16:00") === time
                          ? "bg-blue-500/10 border-blue-500 text-blue-400 shadow-lg shadow-blue-500/10"
                          : "bg-white/[0.03] border-white/10 text-slate-400 hover:bg-white/[0.05]"
                      }`}
                    >
                      {time}
                    </button>
                  ))}
                </div>
              </div>
            </div>
          )}
        </GlassCard>
      </section>

      {/* Rotation Section */}
      {settings.systemType === "3x8_industrial" && (
        <section className="flex flex-col gap-3 animate-fade-in">
          <div className="flex items-center gap-2 px-1">
            <RotateCcw size={14} className="text-purple-400" />
            <h3 className="text-xs font-medium text-slate-500 uppercase tracking-[0.2em]">
              نظام التناوب (Work/Vacation)
            </h3>
          </div>
          <GlassCard className="p-6 flex flex-col gap-6">
            <div className="grid grid-cols-2 gap-4">
              <div className="flex flex-col gap-2">
                <label className="text-xs font-medium text-slate-500 uppercase ml-1">
                  أيام العمل
                </label>
                <input
                  type="number"
                  value={localWork || ""}
                  enterKeyHint="done"
                  onKeyDown={(e) => {
                    if (e.key === "Enter") e.currentTarget.blur();
                  }}
                  onChange={(e) => {
                    const val = e.target.value;
                    setLocalWork(val === "" ? 0 : parseInt(val));
                  }}
                  onBlur={() => {
                    if (localWork !== settings.workDuration) {
                      if (localWork <= 0) {
                        setLocalWork(settings.workDuration);
                        setToastMessage("يجب أن تكون أيام العمل أكثر من 0 ⚠️");
                        return;
                      }
                      setPendingChange({
                        key: "workDuration",
                        value: localWork,
                        message: `هل أنت متأكد من تغيير عدد أيام العمل إلى ${localWork}؟`,
                      });
                    }
                  }}
                  className="w-full bg-[#030712] border border-white/5 rounded-xl px-4 py-3 text-sm font-bold text-slate-100 outline-none focus:border-blue-500/50 focus:bg-blue-500/5 focus:shadow-[0_0_15px_rgba(59,130,246,0.1)] transition-all text-center [direction:ltr]"
                />
              </div>
              <div className="flex flex-col gap-2">
                <label className="text-xs font-medium text-slate-500 uppercase ml-1">
                  أيام الإجازة
                </label>
                <input
                  type="number"
                  value={localVacation || ""}
                  enterKeyHint="done"
                  onKeyDown={(e) => {
                    if (e.key === "Enter") e.currentTarget.blur();
                  }}
                  onChange={(e) => {
                    const val = e.target.value;
                    setLocalVacation(val === "" ? 0 : parseInt(val));
                  }}
                  onBlur={() => {
                    if (localVacation !== settings.vacationDuration) {
                      if (localVacation <= 0) {
                        setLocalVacation(settings.vacationDuration);
                        setToastMessage(
                          "يجب أن تكون أيام الإجازة أكثر من 0 ⚠️",
                        );
                        return;
                      }
                      setPendingChange({
                        key: "vacationDuration",
                        value: localVacation,
                        message: `هل أنت متأكد من تغيير عدد أيام الإجازة إلى ${localVacation}؟`,
                      });
                    }
                  }}
                  className="w-full bg-[#030712] border border-white/5 rounded-xl px-4 py-3 text-sm font-bold text-slate-100 outline-none focus:border-blue-500/50 focus:bg-blue-500/5 focus:shadow-[0_0_15px_rgba(59,130,246,0.1)] transition-all text-center [direction:ltr]"
                />
              </div>
            </div>

            <div
              onClick={() => {
                const newValue = !settings.addRouteDays;
                updateSettings({ addRouteDays: newValue });
                setToastMessage(
                  newValue
                    ? "تم تفعيل أيام الطريق (+2 يوم) 🛣️"
                    : "تم إلغاء تفعيل أيام الطريق",
                );
              }}
              className={`flex justify-between items-center bg-white/[0.02] border border-white/[0.05] rounded-2xl p-4 cursor-pointer hover:bg-white/[0.04] transition-all group active:scale-[0.98]`}
            >
              <div className="flex flex-col">
                <span className="text-base font-medium text-slate-200 group-hover:text-white transition-colors">
                  أيام الطريق (+2)
                </span>
                <span className="text-xs font-medium text-slate-500">
                  إضافة يومين للسفر إلى إجازتك
                </span>
              </div>
              <div
                className={`w-12 h-6 rounded-full transition-all relative p-1 flex items-center ${settings.addRouteDays ? "bg-purple-600/20 border border-purple-500/50" : "bg-white/5 border border-white/10"}`}
              >
                <div
                  className={`w-4 h-4 rounded-full shadow-lg z-10 transition-transform duration-300 ${settings.addRouteDays ? "-translate-x-6 bg-purple-500" : "translate-x-0 bg-slate-500"}`}
                />
              </div>
            </div>
          </GlassCard>
        </section>
      )}

      {/* Annual Leave Section */}
      <section className="flex flex-col gap-3">
        <div className="flex items-center justify-between px-1">
          <div className="flex items-center gap-2">
            <Calendar size={14} className="text-emerald-400" />
            <h3 className="text-xs font-medium text-slate-500 uppercase tracking-[0.2em]">
              الإجازة السنوية (30+ يوم)
            </h3>
          </div>
          <button
            onClick={() => {
              setTempPool(settings.annualLeaveTotal || 30);
              setShowEditPool(true);
            }}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-white/5 border border-white/10 hover:bg-white/10 transition-all group"
          >
            <SettingsIcon
              size={12}
              className="text-slate-400 group-hover:text-blue-400 transition-colors"
            />
            <span className="text-xs font-medium text-slate-400 uppercase tracking-tighter">
              تعديل الرصيد
            </span>
          </button>
        </div>
        <GlassCard className="p-6 flex flex-col gap-6">
          {/* Progress Summary */}
          <div className="p-4 rounded-2xl bg-white/[0.02] border border-white/5 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-emerald-500/10 flex items-center justify-center text-emerald-400">
                <PieChart size={20} />
              </div>
              <div className="flex flex-col">
                <span className="text-xs font-medium text-slate-500 uppercase">
                  الرصيد المتبقي
                </span>
                <span className="text-lg font-black text-slate-100">
                  {remainingDays}{" "}
                  <span className="text-[10px] text-slate-500 font-bold uppercase">
                    يوم
                  </span>
                </span>
              </div>
            </div>
            <div className="text-left">
              <span className="text-xs font-medium text-slate-500 uppercase block">
                المستهلك
              </span>
              <span className="text-base font-medium text-slate-300">
                {annualLeaveConsumed} / {settings.annualLeaveTotal || 30}
              </span>
            </div>
          </div>

          <div className="flex flex-col gap-3">
            <label className="text-xs font-medium text-slate-500 uppercase ml-1">
              الفترات المضافة
            </label>
            {(settings.annualLeaveBlocks || []).length > 0 ? (
              <div className="flex flex-col gap-2">
                {settings.annualLeaveBlocks.map((block) => (
                  <div
                    key={block.id}
                    className="p-4 rounded-2xl bg-white/5 border border-white/5 flex items-center justify-between group"
                  >
                    <div className="flex flex-col">
                      <span className="text-sm font-medium text-slate-200">
                        {format(new Date(block.start), "dd/MM/yy")} -{" "}
                        {format(new Date(block.end), "dd/MM/yy")}
                      </span>
                      <span className="text-xs font-medium text-slate-500">
                        فترة محددة
                      </span>
                    </div>
                    <button
                      onClick={() => removeLeaveBlock(block.id)}
                      className="p-2 rounded-xl bg-red-500/10 text-red-500 hover:bg-red-500/20 transition-all flex items-center justify-center"
                    >
                      <Trash2 size={16} />
                    </button>
                  </div>
                ))}
              </div>
            ) : (
              <div className="p-6 text-center rounded-2xl border border-dashed border-white/10">
                <span className="text-xs font-medium text-slate-600">
                  لم يتم إضافة أي فترات بعد
                </span>
              </div>
            )}

            <button
              onClick={() => {
                setNewLeaveDuration(1);
                setUsageType("custom");
                setShowAddLeave(true);
              }}
              className="w-full py-4 rounded-2xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 text-sm font-medium hover:bg-emerald-500/20 transition-all flex items-center justify-center gap-2"
            >
              <Plus size={16} />
              إضافة فترة إجازة سنوية
            </button>
          </div>
        </GlassCard>
      </section>

      {/* Appearance Section */}
      <section className="flex flex-col gap-3">
        <div className="flex items-center gap-2 px-1">
          <Moon size={14} className="text-violet-400" />
          <h3 className="text-xs font-medium text-slate-500 uppercase tracking-[0.2em]">
            المظهر — لون اللكنة
          </h3>
        </div>
        <GlassCard className="p-6">
          <div className="grid grid-cols-4 gap-3">
            {(
              [
                {
                  id: "blue",
                  label: "أزرق",
                  hex: "#3b82f6",
                  ring: "ring-blue-500",
                  bg: "bg-blue-500",
                },
                {
                  id: "emerald",
                  label: "زمردي",
                  hex: "#10b981",
                  ring: "ring-emerald-500",
                  bg: "bg-emerald-500",
                },
                {
                  id: "violet",
                  label: "بنفسجي",
                  hex: "#8b5cf6",
                  ring: "ring-violet-500",
                  bg: "bg-violet-500",
                },
                {
                  id: "amber",
                  label: "عنبري",
                  hex: "#f59e0b",
                  ring: "ring-amber-500",
                  bg: "bg-amber-500",
                },
              ] as const
            ).map((accent) => {
              const isActive = (settings.accentColor || "blue") === accent.id;
              return (
                <button
                  key={accent.id}
                  onClick={() => {
                    updateSettings({ accentColor: accent.id });
                    document.documentElement.setAttribute(
                      "data-accent",
                      accent.id,
                    );
                    setToastMessage(
                      `تم تغيير لون اللكنة إلى ${accent.label} ✨`,
                    );
                  }}
                  className={`flex flex-col items-center gap-2 p-3 rounded-2xl border transition-all ${
                    isActive
                      ? "bg-white/[0.06] border-white/20"
                      : "bg-white/[0.02] border-transparent hover:border-white/10"
                  }`}
                >
                  <div
                    className={`w-10 h-10 rounded-full ${accent.bg} flex items-center justify-center transition-all ${
                      isActive
                        ? `ring-2 ring-offset-2 ring-offset-[#020617] ${accent.ring} scale-110`
                        : "opacity-70"
                    }`}
                  >
                    {isActive && (
                      <Check size={18} className="text-white drop-shadow" />
                    )}
                  </div>
                  <span
                    className={`text-xs font-medium uppercase tracking-wider transition-colors ${isActive ? "text-slate-200" : "text-slate-600"}`}
                  >
                    {accent.label}
                  </span>
                </button>
              );
            })}
          </div>
          <p className="text-xs font-medium text-slate-600 text-center mt-4 leading-relaxed">
            يغيّر لون التوهج والحدود النشطة وعناصر التمييز في جميع الشاشات
          </p>
        </GlassCard>
      </section>

      {/* Preferences Section */}

      <section className="flex flex-col gap-3">
        <div className="flex items-center gap-2 px-1">
          <Zap size={14} className="text-orange-400" />
          <h3 className="text-xs font-medium text-slate-500 uppercase tracking-[0.2em]">
            التفضيلات العامة
          </h3>
        </div>
        <GlassCard className="p-6 flex flex-col gap-6">
          <div
            onClick={() =>
              setPendingChange({
                key: "notifications",
                value: !settings.notifications,
                message: settings.notifications
                  ? "هل أنت متأكد من إيقاف الإشعارات العامة؟"
                  : "هل أنت متأكد من تفعيل الإشعارات العامة؟",
              })
            }
            className="flex justify-between items-center group cursor-pointer hover:bg-white/[0.02] p-2 rounded-2xl transition-all active:scale-[0.98]"
          >
            <div className="flex items-center gap-3">
              <div
                className={`p-2 rounded-xl transition-all ${settings.notifications ? "bg-blue-500/10 text-blue-500" : "bg-white/5 text-slate-600"}`}
              >
                <Bell size={18} />
              </div>
              <div className="flex flex-col">
                <span className="text-base font-medium text-slate-200 group-hover:text-white transition-colors">
                  الإشعارات
                </span>
                <span className="text-xs font-medium text-slate-500">
                  تنبيهات فترة العمل والتحولات
                </span>
              </div>
            </div>
            <div
              className={`w-12 h-6 rounded-full transition-all relative p-1 flex items-center ${settings.notifications ? "bg-blue-600/20 border border-blue-500/50" : "bg-white/5 border border-white/10"}`}
            >
              <div
                className={`w-4 h-4 rounded-full shadow-lg z-10 transition-transform duration-300 ${settings.notifications ? "-translate-x-6 bg-blue-500" : "translate-x-0 bg-slate-500"}`}
              />
            </div>
          </div>

          {/* Smart Notification Deep Config */}
          {settings.notifications && (
            <div className="border-t border-white/5 pt-4 flex flex-col gap-4 overflow-hidden animate-slide-down">
              <div className="flex flex-col gap-2">
                <label className="text-xs font-medium text-slate-500 uppercase ml-1">
                  وقت التنبيه (قبل بـ)
                </label>
                <div className="flex items-center gap-2">
                  {[15, 30, 45, 60].map((mins) => (
                    <button
                      key={mins}
                      onClick={(e) => {
                        e.stopPropagation();
                        updateSettings({ notificationLeadTime: mins });
                      }}
                      className={`flex-1 py-3 rounded-xl border text-sm font-medium transition-all ${
                        settings.notificationLeadTime === mins
                          ? "bg-blue-600/10 border-blue-500 text-blue-400"
                          : "bg-white/5 border-transparent text-slate-500"
                      }`}
                    >
                      {mins === 60 ? "ساعة" : `${mins} د`}
                    </button>
                  ))}
                </div>
              </div>

              <div
                onClick={async () => {
                  if (!settings.osNotifications) {
                    const success = await subscribe();
                    if (success) {
                      updateSettings({ osNotifications: true });
                      setToastMessage("تم تفعيل إشعارات النظام بنجاح ✅");
                    } else {
                      updateSettings({ osNotifications: false });
                      setToastMessage("حدث خطأ أو تم إلغاء التفعيل");
                    }
                  } else {
                    setPendingChange({
                      key: "osNotifications",
                      value: false,
                      message: "هل أنت متأكد من إيقاف إشعارات النظام؟",
                    });
                  }
                }}
                className="flex justify-between items-center group cursor-pointer hover:bg-white/[0.02] p-2 rounded-2xl transition-all active:scale-[0.98] mt-2 border border-white/5"
              >
                <div className="flex items-center gap-3">
                  <div
                    className={`p-2 rounded-xl transition-all ${settings.osNotifications ? "bg-emerald-500/10 text-emerald-500" : "bg-white/5 text-slate-600"}`}
                  >
                    <Globe size={18} />
                  </div>
                  <div className="flex flex-col">
                    <span className="text-base font-medium text-slate-200 group-hover:text-white transition-colors">
                      إشعارات النظام
                    </span>
                    <span className="text-xs font-medium text-slate-500">
                      استقبال الإشعارات خارج التطبيق
                    </span>
                  </div>
                </div>
                <div
                  className={`w-12 h-6 rounded-full transition-all relative p-1 flex items-center ${settings.osNotifications ? "bg-emerald-600/20 border border-emerald-500/50" : "bg-white/5 border border-white/10"}`}
                >
                  <div
                    className={`w-4 h-4 rounded-full shadow-lg z-10 transition-transform duration-300 ${settings.osNotifications ? "-translate-x-6 bg-emerald-500" : "translate-x-0 bg-slate-500"}`}
                  />
                </div>
              </div>
            </div>
          )}

          <div
            onClick={() => {
              const newValue = !settings.hapticFeedback;
              updateSettings({ hapticFeedback: newValue });
              setToastMessage(
                newValue ? "تم تفعيل الاهتزاز 📱" : "تم إيقاف الاهتزاز",
              );
            }}
            className="flex justify-between items-center group cursor-pointer hover:bg-white/[0.02] p-2 rounded-2xl transition-all active:scale-[0.98]"
          >
            <div className="flex items-center gap-3">
              <div
                className={`p-2 rounded-xl transition-all ${settings.hapticFeedback ? "bg-orange-500/10 text-orange-500" : "bg-white/5 text-slate-600"}`}
              >
                <Zap size={18} />
              </div>
              <div className="flex flex-col">
                <span className="text-base font-medium text-slate-200 group-hover:text-white transition-colors">
                  الاهتزاز (Haptic)
                </span>
                <span className="text-xs font-medium text-slate-500">
                  ملاحظات لمسية عند التفاعل
                </span>
              </div>
            </div>
            <div
              className={`w-12 h-6 rounded-full transition-all relative p-1 flex items-center ${settings.hapticFeedback ? "bg-orange-600/20 border border-orange-500/50" : "bg-white/5 border border-white/10"}`}
            >
              <div
                className={`w-4 h-4 rounded-full shadow-lg z-10 transition-transform duration-300 ${settings.hapticFeedback ? "-translate-x-6 bg-orange-500" : "translate-x-0 bg-slate-500"}`}
              />
            </div>
          </div>
        </GlassCard>
      </section>

      {/* Danger Zone */}
      <div className="mt-4">
        <button
          onClick={handleReset}
          className="w-full p-6 flex items-center justify-between bg-red-500/5 hover:bg-red-500/10 border border-red-500/10 rounded-2xl transition-all group"
        >
          <div className="flex items-center gap-3">
            <div className="p-2 bg-red-500/10 text-red-500 rounded-xl group-hover:scale-110 transition-transform">
              <RotateCcw size={18} />
            </div>
            <div className="flex flex-col text-right">
              <span className="text-base font-medium text-red-400">
                إعادة تعيين كاملة
              </span>
              <span className="text-xs font-medium text-red-900/60 uppercase">
                مسح كافة الإعدادات والبيانات
              </span>
            </div>
          </div>
          <span className="text-sm font-medium text-red-500 opacity-50 group-hover:opacity-100 transition-opacity">
            تفعيل
          </span>
        </button>
      </div>

      {/* Confirmation Dialogs */}
      {pendingChange && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
          <div
            className="absolute inset-0 bg-slate-950/80 backdrop-blur-sm animate-in fade-in duration-300"
            onClick={() => setPendingChange(null)}
          />
          <GlassCard className="w-full max-w-sm p-8 relative z-10 animate-in fade-in zoom-in-95 duration-300 flex flex-col gap-6 text-center shadow-2xl overflow-hidden bg-[#0a1628]/95 border-white/[0.06] !backdrop-blur-md">
            <div className="flex flex-col gap-2">
              <h4 className="text-lg font-black text-slate-100 italic">
                تأكيد التغيير
              </h4>
              <p className="text-sm font-bold text-slate-400 leading-relaxed px-2">
                {pendingChange.message}
              </p>
            </div>
            <div className="grid grid-cols-2 gap-4 mt-2">
              <button
                onClick={() => {
                  setPendingChange(null);
                  setLocalWork(settings.workDuration);
                  setLocalVacation(settings.vacationDuration);
                }}
                className="py-4 bg-white/5 hover:bg-white/10 rounded-2xl text-slate-400 font-black transition-all"
              >
                إلغاء
              </button>
              <button
                onClick={() => {
                  updateSettings({ [pendingChange.key]: pendingChange.value });
                  setPendingChange(null);
                  setToastMessage("تم حفظ التغيير بنجاح ✅");
                }}
                className="py-4 bg-blue-600 hover:bg-blue-500 rounded-2xl text-white font-black transition-all shadow-xl shadow-blue-500/20"
              >
                نعم، تأكيد
              </button>
            </div>
          </GlassCard>
        </div>
      )}

      {/* Toast Notification */}
      {toastMessage && (
        <div className="fixed bottom-24 left-1/2 -translate-x-1/2 z-50 animate-slide-up">
          <div className="bg-slate-800 text-white px-6 py-3 rounded-full shadow-2xl border border-white/10 text-sm font-medium flex items-center gap-2 whitespace-nowrap">
            <span className="w-2 h-2 rounded-full bg-red-500 animate-pulse" />
            {toastMessage}
          </div>
        </div>
      )}

      <div className="text-center flex flex-col items-center gap-1 py-4">
        <div className="text-xs font-medium text-slate-600 uppercase tracking-[0.4em]">
          Trois Huit v2.26
        </div>
        <div className="text-[8px] font-bold text-slate-700 uppercase tracking-[0.2em]">
          By Smail Selmi
        </div>
      </div>

      {/* Premium Reset Confirmation */}
      <BottomSheet
        isOpen={showResetConfirm}
        onClose={() => setShowResetConfirm(false)}
        title="إعادة تعيين البيانات"
      >
        <div className="flex flex-col gap-6 text-center py-4">
          <div className="w-20 h-20 bg-red-500/10 rounded-full flex items-center justify-center mx-auto text-red-500">
            <RotateCcw size={40} />
          </div>
          <p className="text-slate-400 font-bold leading-relaxed">
            هل أنت متأكد من رغبتك في إعادة تعيين كافة البيانات؟ <br />
            <span className="text-red-500/60 text-xs">
              لا يمكن التراجع عن هذا الإجراء.
            </span>
          </p>
          <div className="grid grid-cols-2 gap-4">
            <button
              onClick={() => setShowResetConfirm(false)}
              className="py-4 px-6 bg-white/5 hover:bg-white/10 rounded-2xl text-slate-400 font-black transition-all"
            >
              إلغاء
            </button>
            <button
              onClick={confirmReset}
              className="py-4 px-6 bg-red-600 hover:bg-red-500 rounded-2xl text-white font-black transition-all shadow-xl shadow-red-500/20"
            >
              حذف الكل
            </button>
          </div>
        </div>
      </BottomSheet>

      {/* Add Annual Leave BottomSheet */}
      <BottomSheet
        isOpen={showAddLeave}
        onClose={() => setShowAddLeave(false)}
        title="إضافة فترة إجازة سنوية"
      >
        <div className="flex flex-col gap-6 py-4" dir="rtl">
          <div className="flex flex-col gap-3">
            <label className="text-xs font-medium text-slate-500 uppercase tracking-widest">
              تاريخ البداية
            </label>
            <DatePickerAr
              selectedDate={newLeaveStart}
              onChange={setNewLeaveStart}
            />
          </div>

          <div className="flex flex-col gap-3">
            <label className="text-xs font-medium text-slate-500 uppercase tracking-widest">
              نوع الاستهلاك
            </label>
            <div className="grid grid-cols-3 gap-2">
              {[
                { id: "all", label: "الكل", value: remainingDays },
                {
                  id: "half",
                  label: "النصف",
                  value: Math.floor(remainingDays / 2),
                },
                { id: "custom", label: "مخصص", value: newLeaveDuration },
              ].map((opt) => (
                <button
                  key={opt.id}
                  onClick={() => {
                    setUsageType(opt.id as any);
                    if (opt.id !== "custom") {
                      setNewLeaveDuration(opt.value);
                    }
                  }}
                  className={`py-3 rounded-xl border flex flex-col items-center justify-center gap-1 transition-all ${
                    usageType === opt.id
                      ? "bg-emerald-600/10 border-emerald-500 text-emerald-400"
                      : "bg-white/5 border-transparent text-slate-500"
                  }`}
                >
                  <span className="text-sm font-medium">{opt.label}</span>
                  <span className="text-xs font-medium opacity-50">
                    {opt.id === "custom" ? "..." : `${opt.value}ي`}
                  </span>
                </button>
              ))}
            </div>
          </div>

          {usageType === "custom" && (
            <div className="flex flex-col gap-3 animate-slide-down">
              <label className="text-xs font-medium text-slate-500 uppercase tracking-widest">
                عدد الأيام
              </label>
              <input
                type="number"
                value={newLeaveDuration || ""}
                enterKeyHint="done"
                onKeyDown={(e) => {
                  if (e.key === "Enter") e.currentTarget.blur();
                }}
                onChange={(e) => {
                  const val = parseInt(e.target.value) || 0;
                  setNewLeaveDuration(Math.min(val, remainingDays));
                }}
                max={remainingDays}
                placeholder="مثلاً: 10"
                className="w-full bg-[#030712] border border-white/[0.05] rounded-xl px-4 py-3 text-sm text-slate-100 outline-none focus:border-blue-500 focus:bg-white/[0.04] transition-all [direction:ltr] text-center"
              />
              <p className="text-xs font-medium text-slate-600 mr-1">
                المتبقي متاح: {remainingDays} يوم
              </p>
            </div>
          )}

          <p className="text-xs font-medium text-slate-500 text-center px-6">
            سيتم احتساب {newLeaveDuration} يوم كإجازة سنوية وستظهر في التقويم كـ
            "إجازة".
          </p>

          <div className="grid grid-cols-2 gap-4 mt-4">
            <button
              onClick={() => setShowAddLeave(false)}
              className="py-4 px-6 bg-white/5 hover:bg-white/10 rounded-2xl text-slate-400 font-black transition-all"
            >
              إلغاء
            </button>
            <button
              disabled={newLeaveDuration <= 0}
              onClick={handleAddLeave}
              className={`py-4 px-6 rounded-2xl text-white font-black transition-all shadow-xl ${
                newLeaveDuration > 0
                  ? "bg-emerald-600 hover:bg-emerald-500 shadow-emerald-500/20"
                  : "bg-emerald-900/20 text-emerald-900 cursor-not-allowed shadow-none"
              }`}
            >
              تأكيد الإضافة
            </button>
          </div>
        </div>
      </BottomSheet>

      {/* Edit Pool BottomSheet */}
      <BottomSheet
        isOpen={showEditPool}
        onClose={() => setShowEditPool(false)}
        title="تعديل الرصيد الإجمالي"
      >
        <div className="flex flex-col gap-6 py-4" dir="rtl">
          <div className="flex flex-col gap-3">
            <label className="text-xs font-medium text-slate-500 uppercase tracking-widest">
              عدد الأيام الإجمالي للعام
            </label>
            <input
              type="number"
              value={tempPool || ""}
              onChange={(e) => setTempPool(parseInt(e.target.value) || 0)}
              placeholder="افتراضي: 30"
              className="w-full bg-[#030712] border border-white/5 rounded-xl px-4 py-3 text-sm font-bold text-slate-100 outline-none focus:border-blue-500/50 focus:bg-blue-500/5 focus:shadow-[0_0_15px_rgba(59,130,246,0.1)] transition-all [direction:ltr] text-center"
            />
            <p className="text-xs font-medium text-slate-600 mr-1">
              أدخل إجمالي أيام الإجازة السنوية الممنوحة لك (مثلاً: 30 أو 45)
            </p>
          </div>

          <div className="grid grid-cols-2 gap-4 mt-4">
            <button
              onClick={() => setShowEditPool(false)}
              className="py-4 px-6 bg-white/5 hover:bg-white/10 rounded-2xl text-slate-400 font-black transition-all"
            >
              إلغاء
            </button>
            <button
              onClick={() => {
                updateSettings({ annualLeaveTotal: tempPool });
                setToastMessage("تم تحديث الرصيد الإجمالي للإجازات ✅");
                setShowEditPool(false);
              }}
              className="py-4 px-6 bg-blue-600 hover:bg-blue-500 rounded-2xl text-white font-black transition-all shadow-xl shadow-blue-500/20"
            >
              حفظ التعديل
            </button>
          </div>
        </div>
      </BottomSheet>
    </div>
  );
}
