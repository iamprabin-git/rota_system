"use client";

import { useMemo, useState } from "react";
import { addDays, formatDate, formatDateLong, formatTimeRange, hoursLabel, isoDate, startOfWeek } from "@/lib/format";
import { weekSchedule, type ShiftReminder } from "@/lib/shifts";
import type { HourLog, RotaEntry } from "@/lib/types";
import { WEEKDAY_LABELS } from "@/lib/types";
import { emptyDays, sumHours } from "@/lib/uk-payroll";

export function MyRota({
  initialWeek,
  initialRota,
  logs = [],
  nextShift,
}: {
  initialWeek: string;
  initialRota: RotaEntry[];
  logs?: HourLog[];
  nextShift?: ShiftReminder | null;
}) {
  const [weekStart, setWeekStart] = useState(initialWeek);
  const [rota, setRota] = useState(initialRota);
  const weekEnd = addDays(weekStart, 6);
  const thisWeek = startOfWeek();
  const today = isoDate(new Date());
  const entry =
    rota.find((item) => item.weekStart === weekStart) ||
    ({
      id: `rota_self_${weekStart}`,
      employeeId: "",
      weekStart,
      days: emptyDays(),
      overtimeHours: 0,
      notes: "",
    } satisfies RotaEntry);
  const hours = sumHours(entry.days);
  const overtime = entry.overtimeHours || 0;
  const schedule = useMemo(() => weekSchedule(weekStart, entry.days, logs), [entry.days, logs, weekStart]);
  const working = schedule.filter((day) => !day.off);
  const advance = working.map((day) => `${WEEKDAY_LABELS[day.day]} ${formatTimeRange(day.startTime, day.endTime)}`).join(" · ");

  async function loadWeek(nextWeek: string) {
    setWeekStart(nextWeek);
    const response = await fetch(`/api/rota?weekStart=${nextWeek}`);
    const text = await response.text();
    setRota(text ? (JSON.parse(text) as RotaEntry[]) : []);
  }

  return (
    <div className="space-y-6">
      {nextShift ? (
        <article className="card p-5">
          <p className="text-[0.68rem] uppercase tracking-[0.18em] text-brass">Next shift</p>
          <p className="serif mt-1 text-2xl">
            {formatDateLong(nextShift.date)} · {formatTimeRange(nextShift.startTime, nextShift.endTime)}
          </p>
          <p className="mt-1 text-ink-soft">
            {hoursLabel(nextShift.hours)} scheduled. A reminder appears 1 hour before start.
          </p>
        </article>
      ) : null}

      <div className="card overflow-hidden">
        <div className="flex flex-wrap items-center justify-between gap-3 px-5 py-4">
          <div>
            <p className="text-[0.68rem] uppercase tracking-[0.18em] text-brass">Advance schedule</p>
            <p className="font-semibold">
              Week of {formatDate(weekStart)} – {formatDate(weekEnd)}
            </p>
            <p className="text-sm text-ink-soft">
              {working.length
                ? `${hoursLabel(hours)}${overtime ? ` + ${hoursLabel(overtime)} overtime` : ""} · ${advance}`
                : "No hours scheduled this week."}
            </p>
          </div>
          <div className="flex flex-wrap gap-2">
            <button className="btn btn-ghost" type="button" onClick={() => void loadWeek(addDays(weekStart, -7))}>
              Previous
            </button>
            {weekStart !== thisWeek ? (
              <button className="btn btn-ghost" type="button" onClick={() => void loadWeek(thisWeek)}>
                This week
              </button>
            ) : null}
            <button className="btn btn-ghost" type="button" onClick={() => void loadWeek(addDays(weekStart, 7))}>
              Next
            </button>
          </div>
        </div>

        <table className="data">
          <thead>
            <tr>
              <th>Day</th>
              <th>Start</th>
              <th>End</th>
              <th>Hours</th>
              <th>Notice</th>
            </tr>
          </thead>
          <tbody>
            {schedule.map((day) => {
              const isToday = day.date === today;
              const upcoming = day.date > today && !day.off;
              return (
                <tr key={day.date} className={isToday ? "bg-[color-mix(in_srgb,var(--brass)_10%,transparent)]" : undefined}>
                  <td>
                    <p className="font-semibold">
                      {WEEKDAY_LABELS[day.day]} {formatDate(day.date)}
                    </p>
                    {isToday ? <p className="text-xs text-brass">Today</p> : null}
                  </td>
                  <td className="tabular-nums">{day.off ? "—" : day.startTime}</td>
                  <td className="tabular-nums">
                    {day.off ? "—" : day.endTime}
                    {day.overnight ? <p className="text-xs text-ink-soft">Next day</p> : null}
                  </td>
                  <td className="tabular-nums">{day.off ? "Off" : hoursLabel(day.hours)}</td>
                  <td className="text-ink-soft">
                    {day.off ? "Rest day" : upcoming ? "Advance notice" : isToday ? "On shift today" : "Completed"}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
        {entry.notes ? <p className="px-5 py-3 text-sm text-ink-soft">{entry.notes}</p> : null}
      </div>
    </div>
  );
}
