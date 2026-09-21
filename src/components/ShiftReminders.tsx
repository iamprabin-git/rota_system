"use client";

import { useEffect, useState } from "react";
import { Icon } from "@/components/Icon";
import { formatDateLong, hoursLabel } from "@/lib/format";
import type { ShiftReminder } from "@/lib/shifts";

const ASKED_KEY = "rs_shift_notify_asked";
const ALERT_PREFIX = "rs_shift_alerted_";

function alreadyAlerted(id: string) {
  try {
    return sessionStorage.getItem(`${ALERT_PREFIX}${id}`) === "1";
  } catch {
    return false;
  }
}

function markAlerted(id: string) {
  try {
    sessionStorage.setItem(`${ALERT_PREFIX}${id}`, "1");
  } catch {
    /* ignore */
  }
}

export function ShiftReminders() {
  const [due, setDue] = useState<ShiftReminder[]>([]);
  const [canAsk, setCanAsk] = useState(false);

  useEffect(() => {
    let cancelled = false;
    async function load() {
      const response = await fetch("/api/reminders", { cache: "no-store" });
      if (!response.ok) return;
      const data = (await response.json()) as { due?: ShiftReminder[] };
      const next = data.due || [];
      if (cancelled) return;
      setDue(next);
      if (typeof Notification === "undefined") return;
      if (Notification.permission === "default" && !sessionStorage.getItem(ASKED_KEY)) {
        setCanAsk(true);
      }
      if (Notification.permission === "granted") {
        for (const reminder of next) {
          if (alreadyAlerted(reminder.id)) continue;
          markAlerted(reminder.id);
          new Notification("Shift starts in 1 hour", {
            body: `${formatDateLong(reminder.date)} at ${reminder.startTime} · ${hoursLabel(reminder.hours)} scheduled.`,
          });
        }
      }
    }
    void load();
    const timer = window.setInterval(() => void load(), 60_000);
    return () => {
      cancelled = true;
      window.clearInterval(timer);
    };
  }, []);

  async function enableAlerts() {
    if (typeof Notification === "undefined") return;
    sessionStorage.setItem(ASKED_KEY, "1");
    setCanAsk(false);
    await Notification.requestPermission();
  }

  if (!due.length && !canAsk) return null;

  return (
    <div className="mb-4 space-y-2">
      {due.map((reminder) => (
        <aside key={reminder.id} className="card flex flex-wrap items-center gap-3 border-l-4 border-brass p-4">
          <span className="heading-icon compact">
            <Icon name="calendar" size={16} />
          </span>
          <div className="min-w-0">
            <p className="font-semibold">Shift starts in 1 hour</p>
            <p className="text-sm text-ink-soft">
              {formatDateLong(reminder.date)} at {reminder.startTime} · {hoursLabel(reminder.hours)} scheduled.
            </p>
          </div>
        </aside>
      ))}
      {canAsk ? (
        <aside className="flex flex-wrap items-center justify-between gap-3 rounded-lg border border-dashed border-rule px-4 py-3 text-sm">
          <p className="text-ink-soft">Turn on browser alerts for the 1-hour shift reminder.</p>
          <button className="btn btn-ghost" type="button" onClick={() => void enableAlerts()}>
            Enable alerts
          </button>
        </aside>
      ) : null}
    </div>
  );
}
