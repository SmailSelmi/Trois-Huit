// hooks/useStats.ts
"use client";

import { useMemo } from "react";
import {
  startOfMonth,
  endOfMonth,
  eachDayOfInterval,
  isSameMonth,
  addDays,
  differenceInDays,
} from "date-fns";
import { SystemType, ShiftType } from "@/lib/shiftPatterns";
import { getShiftForDate } from "./useShiftLogic";

export interface AppStats {
  hoursThisMonth: number;
  shiftsCompleted: number;
  restDaysRemaining: number;
  completionPercent: number;
  distribution: Record<ShiftType, number>;
  streak: number;
  history: { date: Date; type: ShiftType }[];
  // Annual & Rotation Stats
  vacationsInYear: number;
  currentVacationIndex: number; // 1-based
  vacationsRemaining: number;
  daysUntilNextVacation: number;
  daysWorkedInCycle: number; // For the current WORK block
  totalWorkBlockDays: number;
  // Annual Leave Stats
  annualLeaveConsumed: number;
  annualLeaveTotal: number;
  annualLeaveRemaining: number;
  daysInMonthCount: number;
}

export function useStats(
  cycleStartDate: string,
  systemType: SystemType,
  initialCycleDay: number = 1,
  workDuration: number = 28,
  vacationDuration: number = 7,
  addRouteDays: boolean = false,
  annualLeaveBlocks: { id: string; start: string; end: string }[] = [],
  annualLeaveTotal: number = 30,
  workDurationExtension: number = 0,
  today: Date = new Date(),
) {
  return useMemo((): AppStats => {
    const monthStart = startOfMonth(today);
    const monthEnd = endOfMonth(today);
    const daysInMonth = eachDayOfInterval({ start: monthStart, end: monthEnd });

    const getTypeLinked = (date: Date): ShiftType => {
      const type = getShiftForDate(
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
      if (systemType === "3x8_industrial" && type === "night") {
        return "day";
      }
      return type;
    };

    const shiftData = daysInMonth.map((date) => ({
      date,
      type: getTypeLinked(date),
    }));

    let workDays = 0;
    let completedShifts = 0;
    let restDaysRemaining = 0;

    const distribution: Record<ShiftType, number> = {
      day: 0,
      evening: 0,
      night: 0,
      rest: 0,
      leave: 0,
    };

    daysInMonth.forEach((date) => {
      const shiftType = getTypeLinked(date);
      distribution[shiftType]++;

      const isWork = ["day", "evening", "night"].includes(shiftType);

      if (isWork) {
        if (shiftType === "day" && systemType === "3x8_industrial") {
          workDays += 2;
          if (date < today) {
            completedShifts += 2;
          }
        } else {
          workDays++;
          if (date < today) {
            completedShifts++;
          }
        }
      } else if (shiftType === "rest" && date >= today) {
        restDaysRemaining++;
      }
    });

    // History: Last 30 days
    const history = Array.from({ length: 30 }, (_, i) => {
      const date = addDays(today, -(29 - i));
      return {
        date,
        type: getTypeLinked(date),
      };
    });

    // Streak calculation: Consecutive work days (including today if it's a work day)
    let streak = 0;
    let checkingDate = today;
    while (true) {
      const type = getTypeLinked(checkingDate);
      if (["day", "evening", "night"].includes(type)) {
        streak += type === "day" && systemType === "3x8_industrial" ? 2 : 1;
        checkingDate = addDays(checkingDate, -1);
      } else {
        break;
      }
      if (streak > 365) break; // Safety break
    }

    // Each shift is 8 hours regardless of type
    const hoursThisMonth = workDays * 8;

    // Percentage of this month's work shifts that have already passed
    const completionPercent =
      workDays > 0 ? Math.round((completedShifts / workDays) * 100) : 0;

    // Annual Vacation Calculation logic
    const currentYear = today.getFullYear();
    const yearStart = new Date(currentYear, 0, 1);
    const yearEnd = new Date(currentYear, 11, 31);
    const daysInYear = eachDayOfInterval({ start: yearStart, end: yearEnd });

    let vacationsInYear = 0;
    let currentVacationIndex = 0;
    let daysUntilNextVacation = -1;
    let inVacationBlock = false;
    let foundNextVacation = false;

    // We also need to find the start of the CURRENT work block to calculate daysWorkedInCycle
    let currentWorkBlockStart: Date | null = null;
    let backtrackDate = today;

    // Scan backward to find the start of the current work block
    while (true) {
      const type = getTypeLinked(backtrackDate);
      if (type !== "leave") {
        currentWorkBlockStart = backtrackDate;
        backtrackDate = addDays(backtrackDate, -1);
      } else {
        break;
      }
      // Safety limit
      if (Math.abs(differenceInDays(today, backtrackDate)) > 365) break;
    }

    // Scan forward to count annual vacations
    daysInYear.forEach((date) => {
      const type = getShiftForDate(
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

      if (type === "leave") {
        if (!inVacationBlock) {
          vacationsInYear++;
          inVacationBlock = true;
          if (date <= today) {
            currentVacationIndex = vacationsInYear;
          }
        }

        if (!foundNextVacation && date > today) {
          daysUntilNextVacation = Math.ceil(
            (date.getTime() - today.getTime()) / 86400000,
          );
          foundNextVacation = true;
        }
      } else {
        inVacationBlock = false;
      }
    });

    // If we are currently in vacation, currentVacationIndex is already set.
    // Check if today IS vacation
    const todayType = getShiftForDate(
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
    if (todayType === "leave") {
      daysUntilNextVacation = 0;
    }

    const daysWorkedInCycle = currentWorkBlockStart
      ? Math.floor(
          (today.getTime() - currentWorkBlockStart.getTime()) / 86400000,
        ) + 1
      : 0;

    // Calculate Annual Leave consumption (from the blocks pool)
    const annualLeaveConsumed = annualLeaveBlocks.reduce((acc, block) => {
      const start = new Date(block.start);
      const end = new Date(block.end);
      // Ensure we only count days in THIS calendar year
      const currentYear = today.getFullYear();
      if (
        start.getFullYear() !== currentYear &&
        end.getFullYear() !== currentYear
      )
        return acc;

      const s =
        start.getFullYear() === currentYear
          ? start
          : new Date(currentYear, 0, 1);
      const e =
        end.getFullYear() === currentYear ? end : new Date(currentYear, 11, 31);

      return acc + (differenceInDays(e, s) + 1);
    }, 0);

    return {
      hoursThisMonth: Math.round(hoursThisMonth),
      shiftsCompleted: completedShifts,
      restDaysRemaining,
      completionPercent,
      distribution,
      streak,
      history,
      vacationsInYear,
      currentVacationIndex:
        currentVacationIndex || (vacationsInYear > 0 ? 1 : 0),
      vacationsRemaining: Math.max(0, vacationsInYear - currentVacationIndex),
      daysUntilNextVacation: Math.max(0, daysUntilNextVacation),
      daysWorkedInCycle:
        todayType === "leave"
          ? workDuration + workDurationExtension
          : daysWorkedInCycle,
      totalWorkBlockDays: workDuration + workDurationExtension,
      annualLeaveConsumed,
      annualLeaveTotal,
      annualLeaveRemaining: Math.max(0, annualLeaveTotal - annualLeaveConsumed),
      daysInMonthCount: daysInMonth.length,
    };
  }, [
    cycleStartDate,
    systemType,
    initialCycleDay,
    workDuration,
    vacationDuration,
    addRouteDays,
    today,
    annualLeaveBlocks,
    annualLeaveTotal,
    workDurationExtension,
  ]);
}
