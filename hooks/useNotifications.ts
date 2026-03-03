import { useCallback, useEffect, useRef } from "react";
import { AppSettings } from "./useAppSettings";
import { ShiftInfo } from "./useShiftLogic";
import { parseISO, subMinutes, isBefore, format } from "date-fns";
import { sendOSNotification } from "@/lib/notifications";

export const useNotifications = (
  settings: AppSettings,
  shiftInfo?: ShiftInfo,
) => {
  const scheduledRef = useRef<Set<string>>(new Set());

  const requestPermission = useCallback(async () => {
    if (!("Notification" in window)) return false;
    if (Notification.permission === "granted") return true;

    const permission = await Notification.requestPermission();
    return permission === "granted";
  }, []);

  const showNotification = useCallback(
    async (title: string, options?: NotificationOptions) => {
      if (!("serviceWorker" in navigator)) return;

      const registration = await navigator.serviceWorker.ready;
      registration.showNotification(title, {
        icon: "/icons/icon-192x192.png",
        badge: "/icons/icon-192x192.png",
        vibrate: [200, 100, 200],
        ...options,
      } as any);
    },
    [],
  );

  const scheduleShiftNotifications = useCallback(() => {
    if (!settings.notifications) return;
    if (!shiftInfo) return;

    const now = new Date();

    // We want to schedule for today and tomorrow's upcoming shifts
    // For simplicity in this local-only version, we schedule based on the current ShiftInfo
    // derived from useShiftLogic.

    const startTimeStr = shiftInfo.startTime; // e.g. "2026-02-28T20:00:00"
    if (!startTimeStr) return;

    const startTime = parseISO(startTimeStr);
    const notificationTime = subMinutes(
      startTime,
      settings.notificationLeadTime,
    );

    // Unique ID for this specific shift notification
    const notificationId = `shift-${startTimeStr}-${settings.notificationLeadTime}`;

    if (
      isBefore(now, notificationTime) &&
      !scheduledRef.current.has(notificationId)
    ) {
      const delay = notificationTime.getTime() - now.getTime();

      console.log(
        `Scheduling notification for ${shiftInfo.label} at ${format(notificationTime, "HH:mm")}`,
      );

      const timeoutId = setTimeout(() => {
        // Trigger OS notification if enabled
        if (settings.osNotifications) {
          sendOSNotification(
            `التحضير لمناوبة الـ ${shiftInfo.label}`,
            `تبدأ مناوبتك في تمام الساعة ${format(startTime, "HH:mm")}. طاب يومك!`,
          );
        } else {
          // Fallback to legacy showNotification if they consider it "in-app" or just in case
          showNotification(`التحضير لمناوبة الـ ${shiftInfo.label}`, {
            body: `تبدأ مناوبتك في تمام الساعة ${format(startTime, "HH:mm")}. طاب يومك!`,
            tag: "shift-reminder",
            renotify: true,
          } as any);
        }
        scheduledRef.current.delete(notificationId);
      }, delay);

      scheduledRef.current.add(notificationId);

      return () => clearTimeout(timeoutId);
    }
  }, [
    settings.notifications,
    settings.notificationLeadTime,
    shiftInfo,
    showNotification,
    settings.osNotifications,
  ]);

  const scheduleEventNotifications = useCallback(() => {
    if (!settings.notifications) return;

    const now = new Date();
    const cleanups: (() => void)[] = [];

    (settings.calendarEvents || []).forEach((event) => {
      const eventTimeStr = `${event.date}T${event.time}:00`;
      const eventTime = parseISO(eventTimeStr);
      const notificationTime = subMinutes(
        eventTime,
        settings.notificationLeadTime,
      );
      const notificationId = `event-${event.id}-${settings.notificationLeadTime}`;

      if (
        isBefore(now, notificationTime) &&
        !scheduledRef.current.has(notificationId)
      ) {
        const delay = notificationTime.getTime() - now.getTime();

        // Schedule if within 24 hours
        if (delay < 24 * 60 * 60 * 1000) {
          const timeoutId = setTimeout(() => {
            if (settings.osNotifications) {
              sendOSNotification(
                `تذكير بحدث: ${event.title}`,
                `لديك حدث مبرمج في تمام الساعة ${event.time}`,
              );
            } else {
              showNotification(`تذكير بحدث: ${event.title}`, {
                body: `لديك حدث مبرمج في تمام الساعة ${event.time}`,
                tag: "event-reminder",
                renotify: true,
              } as any);
            }
            scheduledRef.current.delete(notificationId);
          }, delay);

          scheduledRef.current.add(notificationId);
          cleanups.push(() => clearTimeout(timeoutId));
        }
      }
    });

    return () => cleanups.forEach((c) => c());
  }, [
    settings.notifications,
    settings.calendarEvents,
    settings.notificationLeadTime,
    settings.osNotifications,
    showNotification,
  ]);

  useEffect(() => {
    const cleanupShift = scheduleShiftNotifications();
    const cleanupEvent = scheduleEventNotifications();
    return () => {
      if (cleanupShift) cleanupShift();
      if (cleanupEvent) cleanupEvent();
    };
  }, [scheduleShiftNotifications, scheduleEventNotifications]);

  return { requestPermission, showNotification };
};
