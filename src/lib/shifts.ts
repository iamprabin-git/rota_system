import { addDays, addHoursToTime, isoDate } from "./format";
import type { DayHours, HourLog, RotaEntry, Weekday } from "./types";
import { WEEKDAYS } from "./types";

export type ShiftReminder = {
  id: string;
  date: string;
  startTime: string;
  endTime: string;
  hours: number;
  startAt: string;
  remindAt: string;
  source: "rota" | "hours";
};

export type DaySchedule = {
  day: Weekday;
  date: string;
  hours: number;
  startTime: string;
  endTime: string;
  overnight: boolean;
  off: boolean;
  fromLog: boolean;
};

function atTime(date: string, time: string) {
  const stamp = new Date(`${date}T${time.length === 5 ? `${time}:00` : time}`);
  return Number.isNaN(stamp.getTime()) ? null : stamp;
}

export function upcomingShifts(logs: HourLog[], rota: RotaEntry[], from = new Date()): ShiftReminder[] {
  const today = isoDate(from);
  const horizon = addDays(today, 14);
  const byDate = new Map<string, ShiftReminder>();

  for (const entry of rota) {
    WEEKDAYS.forEach((day, index) => {
      const hours = Number(entry.days[day]) || 0;
      if (hours <= 0) return;
      const date = addDays(entry.weekStart, index);
      if (date < today || date > horizon) return;
      const log = logs.find((item) => item.date === date && item.startTime);
      const startTime = log?.startTime || "09:00";
      const endTime = log?.endTime || addHoursToTime(startTime, hours);
      const start = atTime(date, startTime);
      if (!start) return;
      const remind = new Date(start.getTime() - 60 * 60 * 1000);
      byDate.set(date, {
        id: `shift-${date}`,
        date,
        startTime,
        endTime,
        hours,
        startAt: start.toISOString(),
        remindAt: remind.toISOString(),
        source: "rota",
      });
    });
  }

  for (const log of logs) {
    if (!log.startTime || log.date < today || log.date > horizon) continue;
    if (byDate.has(log.date)) continue;
    const start = atTime(log.date, log.startTime);
    if (!start) continue;
    const remind = new Date(start.getTime() - 60 * 60 * 1000);
    byDate.set(log.date, {
      id: `hours-${log.id}`,
      date: log.date,
      startTime: log.startTime,
      endTime: log.endTime || addHoursToTime(log.startTime, log.hours + log.overtimeHours),
      hours: log.hours + log.overtimeHours,
      startAt: start.toISOString(),
      remindAt: remind.toISOString(),
      source: "hours",
    });
  }

  return [...byDate.values()].sort((a, b) => a.startAt.localeCompare(b.startAt));
}

export function dueShiftReminders(shifts: ShiftReminder[], now = new Date()) {
  return shifts.filter((shift) => {
    const remind = new Date(shift.remindAt).getTime();
    const start = new Date(shift.startAt).getTime();
    return now.getTime() >= remind && now.getTime() < start + 15 * 60 * 1000;
  });
}

export function weekSchedule(weekStart: string, days: DayHours, logs: HourLog[] = []): DaySchedule[] {
  return WEEKDAYS.map((day, index) => {
    const date = addDays(weekStart, index);
    const log = logs.find((item) => item.date === date);
    const hours = Number(days[day]) || 0;
    const off = hours <= 0;
    const startTime = !off ? log?.startTime || "09:00" : "";
    const endTime = !off ? log?.endTime || addHoursToTime(startTime, hours) : "";
    return {
      day,
      date,
      hours,
      startTime,
      endTime,
      overnight: Boolean(startTime && endTime && endTime < startTime),
      off,
      fromLog: Boolean(!off && log?.startTime && log?.endTime),
    };
  });
}

