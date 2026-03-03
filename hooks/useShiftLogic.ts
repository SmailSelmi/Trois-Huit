// hooks/useShiftLogic.ts
"use client";

import { useMemo } from "react";
import {
  ShiftType,
  SystemType,
  INDUSTRIAL_3X8_PATTERN,
} from "@/lib/shiftPatterns";
import {
  differenceInDays,
  startOfDay,
  addDays,
  isSameDay,
  format,
} from "date-fns";
import { useAppSettings, AppSettings } from "@/hooks/useAppSettings";

export interface ShiftInfo {
  type: ShiftType;
  label: string;
  emoji: string;
  color: string;
  accentColor: string;
  startTime: string;
  endTime: string;
  startTime2?: string; // Secondary slot (e.g., Day 2 night or 5x2 afternoon)
  endTime2?: string;
  cycleDay: number;
  cycleProgress: number;
  daysUntilNextShift: number;
  nextShiftType: ShiftType;
  nextShiftLabel: string;
  returnToWorkDate: string;
  returnToWorkShiftLabel: string;
  hoursRemaining: number;
  percentComplete: number;
  isVacation: boolean;
  vacationDay: number;
  totalVacationDays: number;
  superCycleProgress: number;
  statusMessage: string;
  subStatusMessage: string;
}

const SHIFT_METADATA: Record<
  ShiftType,
  { label: string; emoji: string; color: string; accentColor: string }
> = {
  day: {
    label: "صباح + ليل",
    emoji: "☀️",
    color: "#F59E0B",
    accentColor: "rgba(245, 158, 11, 0.1)",
  },
  evening: {
    label: "عمل مسائية",
    emoji: "🌆",
    color: "#F97316",
    accentColor: "rgba(249, 115, 22, 0.1)",
  },
  night: {
    label: "ليلية",
    emoji: "🌙",
    color: "#818CF8",
    accentColor: "rgba(129, 140, 248, 0.1)",
  },
  rest: {
    label: "راحة",
    emoji: "🛡️",
    color: "#10B981",
    accentColor: "rgba(16, 185, 129, 0.1)",
  },
  leave: {
    label: "إجازة",
    emoji: "✈️",
    color: "#64748B",
    accentColor: "rgba(100, 116, 139, 0.1)",
  },
};

/**
 * Shared function to determine the broad shift type for a date
 */
export function getShiftForDate(
  date: Date,
  cycleStartDate: string,
  systemType: SystemType,
  initialCycleDay: number = 1,
  workDuration: number = 28,
  vacationDuration: number = 7,
  addRouteDays: boolean = false,
  annualLeaveBlocks: { id: string; start: string; end: string }[] = [],
  workDurationExtension: number = 0,
): ShiftType {
  const targetTime = date.getTime();
  const isInAnnualLeave = annualLeaveBlocks.some((block) => {
    const start = new Date(block.start).getTime();
    const end = new Date(block.end).getTime();
    return targetTime >= start && targetTime <= end;
  });

  if (isInAnnualLeave) return "leave";

  const start = startOfDay(new Date(cycleStartDate));
  const target = startOfDay(date);
  const diff = differenceInDays(target, start);

  const effectiveWorkDuration = workDuration + workDurationExtension;
  const totalVacation = vacationDuration + (addRouteDays ? 2 : 0);
  const totalCycle = effectiveWorkDuration + totalVacation;
  const superPosition = ((diff % totalCycle) + totalCycle) % totalCycle;

  if (superPosition >= effectiveWorkDuration) {
    return "leave";
  }

  if (systemType === "5x2_admin") {
    const dayOfWeek = date.getDay(); // 0: Sun ... 6: Sat
    return dayOfWeek === 5 || dayOfWeek === 6 ? "rest" : "day";
  }

  // 3-Day Industrial Logic
  const cycleLength = 3;
  const position =
    (((diff + (initialCycleDay - 1)) % cycleLength) + cycleLength) %
    cycleLength;
  return INDUSTRIAL_3X8_PATTERN[position];
}

// ------------------------------------------------------------------
// STRATEGY 1: 3x8 Industrial Engine
// ------------------------------------------------------------------
function get3x8ShiftInfo(params: {
  today: Date;
  diff: number;
  initialCycleDay: number;
  baseType: ShiftType;
  isVacation: boolean;
  vacationDay: number;
  totalVacation: number;
  dayProgress: number;
  currentMins: number;
  nextShiftType: ShiftType;
  returnToWorkDate: string;
  returnToWorkShiftLabel: string;
  superPosition: number;
  workDuration: number;
  settings: AppSettings;
}): ShiftInfo {
  const {
    today,
    diff,
    initialCycleDay,
    baseType,
    isVacation,
    currentMins,
    settings,
  } = params;

  const cycleDay = ((((diff + (initialCycleDay - 1)) % 3) + 3) % 3) + 1;
  const realNow = new Date();
  const isActualToday = isSameDay(today, realNow);
  const currentHour = today.getHours();

  let activeType = baseType;
  let startTime = "00:00";
  let endTime = "23:59";
  let startTime2 = "";
  let endTime2 = "";

  if (isVacation) {
    activeType = "leave";
  } else {
    if (cycleDay === 1) {
      activeType = "evening";
      startTime = settings.industrialEveningStart || "13:00";
      endTime = settings.industrialEveningEnd || "20:00";
    } else if (cycleDay === 2) {
      if (isActualToday) {
        const morningEndHour = parseInt(
          (settings.industrialMorningEnd || "13:00").split(":")[0],
        );
        if (currentHour < morningEndHour) {
          activeType = "day";
          startTime = settings.industrialMorningStart || "07:00";
          endTime = settings.industrialMorningEnd || "13:00";
        } else {
          activeType = "night";
          startTime = settings.industrialNightStart || "20:00";
          endTime = settings.industrialNightEnd || "07:00";
        }
      } else {
        activeType = "day";
        startTime = settings.industrialMorningStart || "07:00";
        endTime = settings.industrialMorningEnd || "13:00";
        startTime2 = settings.industrialNightStart || "20:00";
        endTime2 = settings.industrialNightEnd || "07:00";
      }
    } else if (cycleDay === 3) {
      const nightEndHour = parseInt(
        (settings.industrialNightEnd || "07:00").split(":")[0],
      );
      if (isActualToday && currentHour < nightEndHour) {
        activeType = "night";
        startTime = settings.industrialNightStart || "20:00";
        endTime = settings.industrialNightEnd || "07:00";
      } else {
        activeType = "rest";
        startTime = settings.industrialMorningStart || "07:00"; // display only
        endTime = settings.industrialMorningEnd || "13:00";
      }
    }
  }

  // Calculate generic progress and remaining
  const [sh, sm] = startTime.split(":").map(Number);
  let [eh, em] = endTime.split(":").map(Number);
  let startTotalMins = sh * 60 + sm;
  let endTotalMins = eh * 60 + em;
  if (endTotalMins <= startTotalMins) endTotalMins += 24 * 60;

  let effCurrentMins = currentMins;
  if (
    activeType === "night" &&
    currentMins <
      parseInt((settings.industrialNightEnd || "07:00").split(":")[0]) * 60
  )
    effCurrentMins += 24 * 60;

  let hoursRemaining = 0;
  let percentComplete = 0;

  if (activeType === "rest" || activeType === "leave") {
    percentComplete = params.dayProgress * 100;
    hoursRemaining = (24 * 60 - currentMins) / 60;
  } else {
    if (effCurrentMins < startTotalMins) {
      hoursRemaining = (startTotalMins - effCurrentMins) / 60;
      percentComplete = 0;
    } else if (effCurrentMins >= endTotalMins) {
      hoursRemaining = 0;
      percentComplete = 100;
    } else {
      const duration = endTotalMins - startTotalMins;
      percentComplete = ((effCurrentMins - startTotalMins) / duration) * 100;
      hoursRemaining = (endTotalMins - effCurrentMins) / 60;
    }
  }

  let statusMessage = "";
  let subStatusMessage = "";
  const meta = SHIFT_METADATA[activeType];

  if (isVacation) {
    statusMessage = "أنت في فترة إجازة";
    subStatusMessage = `اليوم ${params.vacationDay}`;
  } else if (activeType === "rest") {
    statusMessage = "أنت في فترة راحة حالياً";
    subStatusMessage = "";
  } else if (effCurrentMins < startTotalMins) {
    const h = Math.floor(hoursRemaining);
    const m = Math.floor((hoursRemaining % 1) * 60);
    statusMessage = `حتى ورديتك القادمة ${h}h ${m}m`;
    subStatusMessage = `${meta.label}`;
  } else {
    const h = Math.floor(hoursRemaining);
    const m = Math.floor((hoursRemaining % 1) * 60);
    const isExtensionDay =
      !isVacation && params.superPosition >= params.workDuration;
    if (isExtensionDay) {
      statusMessage =
        h === 0 && m === 0 ? "فترة التمديد منتهية" : `${h}h ${m}m`;
      subStatusMessage = "يوم عمل إضافي";
    } else {
      statusMessage = h === 0 && m === 0 ? "فترة العمل منتهية" : `${h}h ${m}m`;
      subStatusMessage = "ساعة متبقية";
    }
  }

  return {
    type: activeType,
    ...meta,
    startTime,
    endTime,
    startTime2: startTime2 || undefined,
    endTime2: endTime2 || undefined,
    cycleDay,
    cycleProgress: isVacation ? 1 : (cycleDay - 1 + params.dayProgress) / 3,
    daysUntilNextShift: isVacation
      ? params.totalVacation - params.vacationDay + 1
      : 1,
    nextShiftType: params.nextShiftType,
    nextShiftLabel: SHIFT_METADATA[params.nextShiftType].label,
    returnToWorkDate: params.returnToWorkDate,
    returnToWorkShiftLabel: params.returnToWorkShiftLabel,
    hoursRemaining: Math.max(0, hoursRemaining),
    percentComplete,
    isVacation,
    vacationDay: params.vacationDay,
    totalVacationDays: params.totalVacation,
    superCycleProgress:
      params.superPosition / (params.workDuration + params.totalVacation),
    statusMessage,
    subStatusMessage,
  };
}

// ------------------------------------------------------------------
// STRATEGY 2: 5x2 Admin Engine (Isolated and customized)
// ------------------------------------------------------------------
function get5x2ShiftInfo(params: {
  today: Date;
  baseType: ShiftType;
  isVacation: boolean;
  vacationDay: number;
  totalVacation: number;
  dayProgress: number;
  currentMins: number;
  nextShiftType: ShiftType;
  returnToWorkDate: string;
  returnToWorkShiftLabel: string;
  superPosition: number;
  workDuration: number;
  settings: AppSettings;
}): ShiftInfo {
  const { baseType, isVacation, currentMins, settings } = params;

  let activeType = baseType;
  let startTime = "08:00";
  let endTime = "12:00";
  let startTime2 = settings.afternoonStart || "13:00";
  let endTime2 = settings.afternoonEnd || "16:00";

  if (isVacation) {
    activeType = "leave";
    startTime = "00:00";
    endTime = "23:59";
    startTime2 = "";
    endTime2 = "";
  } else if (activeType === "rest") {
    startTime = "00:00";
    endTime = "23:59";
    startTime2 = "";
    endTime2 = "";
  }

  // 5x2 uses dual slots for workday.
  let isAfternoon = false;
  let percentComplete = 0;
  let hoursRemaining = 0;

  if (activeType === "day") {
    const min1S = 8 * 60;
    const min1E = 12 * 60;
    const [hS2, mS2] = startTime2.split(":").map(Number);
    const [hE2, mE2] = endTime2.split(":").map(Number);
    const min2S = hS2 * 60 + mS2;
    const min2E = hE2 * 60 + mE2;

    if (currentMins < min1E) {
      // Morning
      if (currentMins < min1S) {
        hoursRemaining = (min1S - currentMins) / 60;
      } else {
        hoursRemaining = (min1E - currentMins) / 60;
        percentComplete = ((currentMins - min1S) / (min1E - min1S)) * 100;
      }
    } else {
      // Afternoon
      isAfternoon = true;
      if (currentMins < min2S) {
        hoursRemaining = (min2S - currentMins) / 60;
      } else if (currentMins < min2E) {
        hoursRemaining = (min2E - currentMins) / 60;
        percentComplete = ((currentMins - min2S) / (min2E - min2S)) * 100;
      } else {
        hoursRemaining = 0;
        percentComplete = 100;
      }
    }
  } else {
    // Rest or leave
    percentComplete = params.dayProgress * 100;
    hoursRemaining = (24 * 60 - currentMins) / 60;
  }

  let statusMessage = "";
  let subStatusMessage = "";
  const meta =
    activeType === "day"
      ? {
          label: "عمل يومي",
          emoji: "💼",
          color: "#3B82F6",
          accentColor: "rgba(59, 130, 246, 0.1)",
        }
      : SHIFT_METADATA[activeType]; // rest or leave

  if (isVacation) {
    statusMessage = "أنت في فترة إجازة";
    subStatusMessage = `اليوم ${params.vacationDay}`;
  } else if (activeType === "rest") {
    statusMessage = "عطلة نهاية الأسبوع";
    subStatusMessage = "استمتع بوقتك";
  } else {
    // Active workday
    const h = Math.floor(hoursRemaining);
    const m = Math.floor((hoursRemaining % 1) * 60);
    if (hoursRemaining > 0 && percentComplete === 0) {
      statusMessage = `تبدأ فترة العمل خلال ${h}h ${m}m`;
      subStatusMessage = isAfternoon ? "الفترة المسائية" : "الفترة الصباحية";
    } else if (hoursRemaining > 0) {
      statusMessage = `${h}h ${m}m`;
      subStatusMessage = "متبقية من فترة العمل";
    } else {
      statusMessage = "انتهى دوام اليوم";
      subStatusMessage = "";
    }
  }

  return {
    type: activeType,
    ...meta,
    startTime,
    endTime,
    startTime2: startTime2 || undefined,
    endTime2: endTime2 || undefined,
    cycleDay: params.today.getDay() + 1,
    cycleProgress: isVacation
      ? 1
      : (params.today.getDay() + params.dayProgress) / 7,
    daysUntilNextShift: isVacation
      ? params.totalVacation - params.vacationDay + 1
      : 1,
    nextShiftType: params.nextShiftType,
    nextShiftLabel:
      params.nextShiftType === "day"
        ? "عمل يومي"
        : SHIFT_METADATA[params.nextShiftType].label,
    returnToWorkDate: params.returnToWorkDate,
    returnToWorkShiftLabel: params.returnToWorkShiftLabel,
    hoursRemaining: Math.max(0, hoursRemaining),
    percentComplete,
    isVacation,
    vacationDay: params.vacationDay,
    totalVacationDays: params.totalVacation,
    superCycleProgress:
      params.superPosition / (params.workDuration + params.totalVacation),
    statusMessage,
    subStatusMessage,
  };
}

// ------------------------------------------------------------------
// MAIN HOOK: Serves as the strategy router
// ------------------------------------------------------------------
export default function useShiftLogic(
  cycleStartDate: string,
  systemType: SystemType,
  initialCycleDay: number = 1,
  workDuration: number = 21,
  vacationDuration: number = 7,
  addRouteDays: boolean = false,
  annualLeaveBlocks: { id: string; start: string; end: string }[] = [],
  workDurationExtension: number = 0,
  today: Date = new Date(),
) {
  const { settings } = useAppSettings();

  return useMemo((): ShiftInfo => {
    const start = startOfDay(new Date(cycleStartDate));
    const dayStart = startOfDay(today);

    // Annual Leave Check for today
    const isInAnnualLeave = annualLeaveBlocks.some((block) => {
      const bStart = new Date(block.start).getTime();
      const bEnd = new Date(block.end).getTime();
      const t = dayStart.getTime();
      return t >= bStart && t <= bEnd;
    });

    const diff = differenceInDays(dayStart, start);

    // Super cycle calculations
    const effectiveWorkDuration = workDuration + workDurationExtension;
    const totalVacation = vacationDuration + (addRouteDays ? 2 : 0);
    const totalCycle = effectiveWorkDuration + totalVacation;
    const superPosition = ((diff % totalCycle) + totalCycle) % totalCycle;
    const isVacation =
      superPosition >= effectiveWorkDuration || isInAnnualLeave;
    const vacationDay = isInAnnualLeave
      ? 1
      : superPosition >= effectiveWorkDuration
        ? superPosition - effectiveWorkDuration + 1
        : 0;

    const baseType = getShiftForDate(
      today,
      cycleStartDate,
      systemType,
      initialCycleDay,
      workDuration,
      vacationDuration,
      addRouteDays,
      annualLeaveBlocks,
      workDurationExtension,
    );

    const nextShiftType = getShiftForDate(
      addDays(today, 1),
      cycleStartDate,
      systemType,
      initialCycleDay,
      workDuration,
      vacationDuration,
      addRouteDays,
      annualLeaveBlocks,
      workDurationExtension,
    );

    let returnToWorkDate = "";
    let returnToWorkShiftLabel = "";

    if (isVacation) {
      let checkDate = addDays(dayStart, 1);
      for (let i = 0; i < 60; i++) {
        const type = getShiftForDate(
          checkDate,
          cycleStartDate,
          systemType,
          initialCycleDay,
          workDuration,
          vacationDuration,
          addRouteDays,
          annualLeaveBlocks,
          workDurationExtension,
        );
        if (type !== "leave") {
          returnToWorkDate = format(checkDate, "yyyy-MM-dd");
          returnToWorkShiftLabel =
            systemType === "5x2_admin" && type === "day"
              ? "عمل يومي"
              : SHIFT_METADATA[type].label;
          break;
        }
        checkDate = addDays(checkDate, 1);
      }
    }

    const currentHour = today.getHours();
    const currentMinute = today.getMinutes();
    const currentMins = currentHour * 60 + currentMinute;
    const dayProgress = currentMins / (24 * 60);

    // Common payload for strategy router
    const baseParams = {
      today,
      baseType,
      isVacation,
      vacationDay,
      totalVacation,
      dayProgress,
      currentMins,
      nextShiftType,
      returnToWorkDate,
      returnToWorkShiftLabel,
      superPosition,
      workDuration: effectiveWorkDuration,
    };

    if (systemType === "5x2_admin") {
      return get5x2ShiftInfo({ ...baseParams, settings });
    } else {
      return get3x8ShiftInfo({
        ...baseParams,
        diff,
        initialCycleDay,
        settings,
      });
    }
  }, [
    cycleStartDate,
    systemType,
    initialCycleDay,
    workDuration,
    vacationDuration,
    addRouteDays,
    today,
    annualLeaveBlocks,
    workDurationExtension,
    settings,
  ]);
}
