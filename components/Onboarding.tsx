// components/Onboarding.tsx
"use client";

import React, { useState } from "react";
import { AppSettings } from "@/hooks/useAppSettings";
import { SystemType } from "@/lib/shiftPatterns";
import GlassCard from "./GlassCard";
import {
  ChevronRight,
  ChevronLeft,
  Check,
  Globe,
  Plus,
  Minus,
} from "lucide-react";
import DatePickerAr from "./DatePickerAr";
import { format } from "date-fns";
import { useAppSettings } from "@/hooks/useAppSettings";

interface OnboardingProps {
  onComplete: (settings: Partial<AppSettings>) => void;
}

export default function Onboarding({ onComplete }: OnboardingProps) {
  const { settings } = useAppSettings();
  const [step, setStep] = useState(1);
  const [formData, setFormData] = useState<{
    userName: string;
    cycleStartDate: string;
    initialCycleDay: number;
    systemType: SystemType;
    workDuration: number;
    vacationDuration: number;
    addRouteDays: boolean;
  }>({
    userName: "",
    cycleStartDate: format(new Date(), "yyyy-MM-dd"),
    initialCycleDay: 1,
    systemType: "3x8_industrial",
    workDuration: 28,
    vacationDuration: 4,
    addRouteDays: false,
  });

  const nextStep = () => setStep((s) => Math.min(5, s + 1));
  const prevStep = () => setStep((s) => Math.max(1, s - 1));

  const handleFinish = () => {
    if (formData.userName) {
      onComplete(formData);
    }
  };

  const steps = [
    {
      title: "مرحباً بك!",
      description: "أخبرنا ما هو اسمك الكريم؟",
      content: (
        <input
          type="text"
          autoFocus
          placeholder="أدخل اسمك هنا..."
          enterKeyHint="next"
          onKeyDown={(e) => {
            if (e.key === "Enter" && formData.userName) nextStep();
          }}
          className="w-full bg-white/[0.03] backdrop-blur-md border border-white/10 rounded-2xl px-6 py-4 text-xl font-black text-center text-slate-100 outline-none focus:border-blue-500 focus:bg-blue-500/10 focus:shadow-lg focus:shadow-blue-900/20 transition-all duration-200"
          value={formData.userName}
          onChange={(e) =>
            setFormData({ ...formData, userName: e.target.value })
          }
        />
      ),
    },

    {
      title: "بداية الدورة",
      description:
        "حدد تاريخ بداية دورة عملك الحالية بدقة (تاريخ أول يوم عمل في الدورة الحالية).",
      content: (
        <div className="flex flex-col items-center gap-2">
          <DatePickerAr
            selectedDate={new Date(formData.cycleStartDate)}
            onChange={(date) =>
              setFormData({
                ...formData,
                cycleStartDate: format(date, "yyyy-MM-dd"),
              })
            }
          />
        </div>
      ),
    },
    {
      id: "system",
      title: "نظام العمل",
      description: "اختر نظام الدوام الخاص بك للاستمرار",
      content: (
        <div className="flex flex-col gap-3">
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
          ].map((sys) => (
            <button
              key={sys.id}
              onClick={() =>
                setFormData({ ...formData, systemType: sys.id as SystemType })
              }
              className={`group p-5 rounded-2xl border transition-all duration-200 active:scale-95 flex items-center justify-between text-start ${
                formData.systemType === sys.id
                  ? "bg-blue-500/10 border-blue-500 shadow-lg shadow-blue-900/20"
                  : "bg-white/[0.03] backdrop-blur-md border-white/10 hover:bg-white/[0.05] hover:border-white/20 text-slate-400"
              }`}
            >
              <div className="flex flex-col gap-1">
                <div
                  className={`font-black text-base ${formData.systemType === sys.id ? "text-blue-400" : "text-slate-200"}`}
                >
                  {sys.label}
                </div>
                <div className="text-xs font-medium text-slate-400 leading-relaxed">
                  {sys.desc}
                </div>
              </div>
              {formData.systemType === sys.id && (
                <div className="w-6 h-6 rounded-full bg-blue-500/20 flex items-center justify-center border border-blue-500/50">
                  <Check size={14} className="text-blue-400" />
                </div>
              )}
            </button>
          ))}
          <div className="p-4 rounded-2xl border border-dashed border-white/10 opacity-50 grayscale flex flex-col gap-1 text-start">
            <span className="text-sm font-black text-slate-500 leading-relaxed">
              أنظمة أخرى...
            </span>
            <span className="text-xs font-medium text-slate-600 italic leading-relaxed">
              قريباً في التحديثات القادمة
            </span>
          </div>
        </div>
      ),
    },
    ...(formData.systemType === "5x2_admin"
      ? []
      : [
          {
            id: "initial_day",
            title: "نوع فترة العمل",
            description: "أي فترة عمل كانت لديك في هذا التاريخ؟",
            content: (
              <div className="flex flex-col gap-2">
                {[
                  {
                    id: 1,
                    label: "اليوم الأول: فترة عمل مسائية",
                    desc: "13:00 - 20:00",
                  },
                  {
                    id: 2,
                    label: "اليوم الثاني: فترة عمل صباح + ليل",
                    desc: "07h-13h / 20h-07h",
                  },
                  {
                    id: 3,
                    label: "اليوم الثالث: راحة",
                    desc: "ابتداءً من 07:00",
                  },
                ].map((shift) => (
                  <button
                    key={shift.id}
                    onClick={() =>
                      setFormData({ ...formData, initialCycleDay: shift.id })
                    }
                    className={`group p-4 rounded-2xl border transition-all duration-200 active:scale-95 text-start flex flex-col gap-1 ${
                      formData.initialCycleDay === shift.id
                        ? "bg-blue-500/10 border-blue-500 shadow-lg shadow-blue-900/20"
                        : "bg-white/[0.03] backdrop-blur-md border-white/10 hover:bg-white/[0.05] hover:border-white/20 text-slate-400"
                    }`}
                  >
                    <div
                      className={`font-black text-base ${formData.initialCycleDay === shift.id ? "text-blue-400" : "text-slate-200"}`}
                    >
                      {shift.label}
                    </div>
                    <div className="text-xs font-medium opacity-80 leading-relaxed">
                      {shift.desc}
                    </div>
                  </button>
                ))}
              </div>
            ),
          },
        ]),
    {
      title: "مدة الدورة",
      description: "حدد عدد أيام العمل والإجازة",
      content: (
        <div className="flex flex-col gap-6">
          <div className="flex flex-col gap-6">
            <div className="flex flex-col gap-2">
              <label className="text-xs font-black text-slate-400 uppercase tracking-widest text-center">
                أيام العمل
              </label>
              <div className="flex justify-center items-center px-4">
                <button
                  onClick={() =>
                    setFormData({
                      ...formData,
                      workDuration: Math.max(1, formData.workDuration - 1),
                    })
                  }
                  className="w-12 h-12 flex items-center justify-center bg-white/[0.02] border border-white/10 hover:bg-white/[0.05] active:scale-95 transition-all text-slate-300 text-2xl font-bold rounded-2xl mx-2"
                >
                  -
                </button>
                <input
                  type="number"
                  min="1"
                  max="365"
                  dir="ltr"
                  value={formData.workDuration || ""}
                  onChange={(e) =>
                    setFormData({
                      ...formData,
                      workDuration: parseInt(e.target.value) || 0,
                    })
                  }
                  className="w-full max-w-[120px] bg-white/[0.02] border border-white/10 rounded-2xl py-3 text-center text-3xl font-black text-slate-100 shadow-inner outline-none focus:border-blue-500 focus:bg-blue-500/10 transition-all"
                />
                <button
                  onClick={() =>
                    setFormData({
                      ...formData,
                      workDuration: formData.workDuration + 1,
                    })
                  }
                  className="w-12 h-12 flex items-center justify-center bg-white/[0.02] border border-white/10 hover:bg-white/[0.05] active:scale-95 transition-all text-slate-300 text-2xl font-bold rounded-2xl mx-2"
                >
                  +
                </button>
              </div>
            </div>

            <div className="flex flex-col gap-2">
              <label className="text-xs font-black text-slate-400 uppercase tracking-widest text-center">
                أيام الإجازة
              </label>
              <div className="flex justify-center items-center px-4">
                <button
                  onClick={() =>
                    setFormData({
                      ...formData,
                      vacationDuration: Math.max(
                        1,
                        formData.vacationDuration - 1,
                      ),
                    })
                  }
                  className="w-12 h-12 flex items-center justify-center bg-white/[0.02] border border-white/10 hover:bg-white/[0.05] active:scale-95 transition-all text-slate-300 text-2xl font-bold rounded-2xl mx-2"
                >
                  -
                </button>
                <input
                  type="number"
                  min="1"
                  max="365"
                  dir="ltr"
                  value={formData.vacationDuration || ""}
                  onChange={(e) =>
                    setFormData({
                      ...formData,
                      vacationDuration: parseInt(e.target.value) || 0,
                    })
                  }
                  className="w-full max-w-[120px] bg-white/[0.02] border border-white/10 rounded-2xl py-3 text-center text-3xl font-black text-slate-100 shadow-inner outline-none focus:border-blue-500 focus:bg-blue-500/10 transition-all"
                />
                <button
                  onClick={() =>
                    setFormData({
                      ...formData,
                      vacationDuration: formData.vacationDuration + 1,
                    })
                  }
                  className="w-12 h-12 flex items-center justify-center bg-white/[0.02] border border-white/10 hover:bg-white/[0.05] active:scale-95 transition-all text-slate-300 text-2xl font-bold rounded-2xl mx-2"
                >
                  +
                </button>
              </div>
            </div>
          </div>

          <button
            onClick={() =>
              setFormData({ ...formData, addRouteDays: !formData.addRouteDays })
            }
            className={`group p-5 rounded-2xl border transition-all duration-200 active:scale-95 flex items-center justify-between text-start ${
              formData.addRouteDays
                ? "bg-blue-500/10 border-blue-500 shadow-lg shadow-blue-900/20"
                : "bg-white/[0.03] backdrop-blur-md border-white/10 hover:bg-white/[0.05] hover:border-white/20 text-slate-400"
            }`}
          >
            <div className="flex flex-col gap-1 text-start">
              <div
                className={`font-black text-base ${formData.addRouteDays ? "text-blue-400" : "text-slate-200"}`}
              >
                أيام الطريق (Route Days)
              </div>
              <div className="text-xs font-medium opacity-80 leading-relaxed">
                إضافة +2 يوم لإجمالي الإجازة
              </div>
            </div>
            <div
              className={`w-12 h-6 rounded-full relative transition-colors ${formData.addRouteDays ? "bg-blue-500" : "bg-white/10"}`}
            >
              <div
                className={`w-4 h-4 bg-white rounded-full absolute top-1 right-1 transition-transform ${formData.addRouteDays ? "-translate-x-[24px]" : "translate-x-0"}`}
              />
            </div>
          </button>
        </div>
      ),
    },
  ];

  const currentStep = steps[step - 1];

  return (
    <div
      className="fixed inset-0 z-[100] bg-slate-950 flex flex-col items-center justify-start overflow-y-auto p-6 text-start"
      dir="rtl"
    >
      <div className="absolute inset-x-0 bottom-0 top-1/2 bg-gradient-to-t from-blue-900/20 to-transparent pointer-events-none" />

      <div
        key={step}
        className="w-full max-w-md my-auto py-8 animate-fade-in flex flex-col gap-6"
      >
        <GlassCard
          className="p-6 md:p-8 flex flex-col gap-6 md:gap-8 relative overflow-visible"
          glow
          glowColor="#3b82f6"
        >
          <div className="flex flex-col gap-2">
            <div className="flex justify-between items-center">
              <span className="text-[10px] font-black text-blue-500 uppercase tracking-[0.3em]">
                {`الخطوة ${step} من ${steps.length}`}
              </span>
            </div>
            <h1 className="text-2xl md:text-3xl font-black text-slate-100 italic leading-relaxed">
              {currentStep.title}
            </h1>
            <p className="text-sm md:text-base font-medium text-slate-400 leading-relaxed">
              {currentStep.description}
            </p>
          </div>

          <div className="min-h-[200px] flex flex-col justify-center">
            {currentStep.content}
          </div>

          <div className="flex gap-4 mt-6">
            {step > 1 && (
              <button
                onClick={prevStep}
                className="group p-4 bg-white/[0.03] backdrop-blur-md border border-white/10 rounded-2xl text-slate-400 hover:text-white hover:bg-white/[0.05] hover:border-white/20 transition-all duration-200 active:scale-95 flex items-center justify-center"
              >
                <ChevronRight
                  size={24}
                  className="group-hover:translate-x-1 transition-transform"
                />
              </button>
            )}

            <button
              onClick={step === steps.length ? handleFinish : nextStep}
              disabled={step === 1 && !formData.userName}
              className={`group flex-1 py-4 rounded-2xl font-black text-lg shadow-lg flex items-center justify-center gap-2 transition-all duration-200 active:scale-95 ${
                step === 1 && !formData.userName
                  ? "bg-white/[0.03] backdrop-blur-md border border-white/5 text-slate-500 cursor-not-allowed"
                  : "bg-blue-600 text-white shadow-blue-900/20 hover:bg-blue-500"
              }`}
            >
              {step === steps.length ? "ابدأ الاستخدام" : "التالي"}
              {step < steps.length && (
                <ChevronLeft
                  size={20}
                  className="group-hover:-translate-x-1 transition-transform"
                />
              )}
            </button>
          </div>
        </GlassCard>
      </div>
    </div>
  );
}
