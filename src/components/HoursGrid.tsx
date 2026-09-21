"use client";

import { WEEKDAY_LABELS, WEEKDAYS, type DayHours } from "@/lib/types";

export function HoursGrid({
  days,
  onChange,
  compact = false,
  readOnly = false,
}: {
  days: DayHours;
  onChange?: (days: DayHours) => void;
  compact?: boolean;
  readOnly?: boolean;
}) {
  return (
    <div className={`grid grid-cols-7 ${compact ? "gap-1" : "gap-2"}`}>
      {WEEKDAYS.map((day) => (
        <label key={day} className="field">
          <span className={compact ? "text-center text-[0.65rem]" : ""}>{WEEKDAY_LABELS[day]}</span>
          <input
            inputMode="decimal"
            value={days[day] || ""}
            placeholder="0"
            className={compact ? "px-1 py-1.5 text-center text-sm" : ""}
            readOnly={readOnly}
            disabled={readOnly}
            onChange={(event) =>
              onChange?.({
                ...days,
                [day]: event.target.value === "" ? 0 : Number(event.target.value),
              })
            }
          />
        </label>
      ))}
    </div>
  );
}
