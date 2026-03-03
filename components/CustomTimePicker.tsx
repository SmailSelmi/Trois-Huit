"use client";

import React, { useRef } from "react";
import { Clock } from "lucide-react";

interface CustomTimePickerProps {
  value: string; // "HH:mm"
  onChange: (time: string) => void;
}

export default function CustomTimePicker({
  value,
  onChange,
}: CustomTimePickerProps) {
  const inputRef = useRef<HTMLInputElement>(null);

  return (
    <div className="relative w-full">
      {/* Background UI matching the premium aesthetic */}
      <div className="w-full flex items-center justify-between p-4 bg-white/5 border border-white/10 rounded-2xl transition-all group relative overflow-hidden focus-within:bg-blue-500/5 focus-within:border-blue-500/30">
        <div className="flex items-center gap-3">
          <Clock
            size={18}
            className="text-slate-400 group-focus-within:text-blue-400 transition-colors"
          />
          <span className="text-slate-200 font-mono font-bold text-lg tracking-wider">
            {value || "12:00"}
          </span>
        </div>
        <div className="px-3 py-1 bg-blue-500/10 rounded-lg">
          <span className="text-[10px] font-black tracking-widest uppercase text-blue-400">
            تغيير
          </span>
        </div>

        {/* 
          Transparent Native Input Overlay
          This ensures the user gets the best UX native to their OS (iOS dial, Android clock face)
          while we maintain total control over the visual presentation. 
        */}
        <input
          ref={inputRef}
          type="time"
          value={value}
          onChange={(e) => onChange(e.target.value)}
          onClick={(e) => {
            if (typeof inputRef.current?.showPicker === "function") {
              try {
                inputRef.current.showPicker();
              } catch (err) {
                // Feature not strictly required, fallback to default input click
              }
            }
          }}
          className="absolute inset-0 w-full h-full opacity-0 cursor-pointer [color-scheme:dark] accent-blue-500"
        />
      </div>
    </div>
  );
}
