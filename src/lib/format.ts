import { WEEKDAYS, type DayHours, type PayFrequency } from "./types";
import { PERIODS } from "./uk-payroll";

const GBP = new Intl.NumberFormat("en-GB", {
  style: "currency",
  currency: "GBP",
});

const GBP_PLAIN = new Intl.NumberFormat("en-GB", {
  style: "currency",
  currency: "GBP",
  currencyDisplay: "narrowSymbol",
});

export function money(value: number): string {
  return GBP.format(Number.isFinite(value) ? value : 0);
}

export function moneyPlain(value: number): string {
  return GBP_PLAIN.format(Number.isFinite(value) ? value : 0);
}

export function hoursFromTimes(start?: string, end?: string): number | null {
  if (!start || !end) return null;
  const toMins = (value: string) => {
    const [hours, minutes] = value.split(":").map(Number);
    if (!Number.isFinite(hours) || !Number.isFinite(minutes)) return null;
    return hours * 60 + minutes;
  };
  const from = toMins(start);
  const to = toMins(end);
  if (from == null || to == null) return null;
  let mins = to - from;
  if (mins < 0) mins += 24 * 60;
  return Math.round((mins / 60) * 100) / 100;
}

export function formatTimeRange(start?: string, end?: string) {
  if (!start || !end) return "";
  return `${start}–${end}`;
}

export function addHoursToTime(start: string, hours: number): string {
  const [hour, minute] = start.split(":").map(Number);
  if (!Number.isFinite(hour) || !Number.isFinite(minute)) return "";
  const total = hour * 60 + minute + Math.round(hours * 60);
  const mins = ((total % (24 * 60)) + 24 * 60) % (24 * 60);
  return `${String(Math.floor(mins / 60)).padStart(2, "0")}:${String(mins % 60).padStart(2, "0")}`;
}

export function hoursLabel(value: number): string {
  const n = Number.isFinite(value) ? value : 0;
  return `${n.toLocaleString("en-GB", { maximumFractionDigits: 2, minimumFractionDigits: n % 1 ? 2 : 0 })}h`;
}

export function formatRelative(iso: string): string {
  const date = new Date(iso);
  if (Number.isNaN(date.getTime())) return iso || "";
  const diff = Date.now() - date.getTime();
  if (diff < 45_000) return "Just now";
  const minutes = Math.round(diff / 60_000);
  if (minutes < 60) return `${minutes}m`;
  const hours = Math.round(minutes / 60);
  if (hours < 24) return `${hours}h`;
  const days = Math.round(hours / 24);
  if (days < 7) return `${days}d`;
  return formatDate(iso);
}

export function formatDate(iso: string): string {
  if (!iso) return "—";
  const date = new Date(iso);
  if (Number.isNaN(date.getTime())) return iso;
  return new Intl.DateTimeFormat("en-GB", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  }).format(date);
}

export function formatDateLong(iso: string): string {
  if (!iso) return "—";
  const date = new Date(iso);
  if (Number.isNaN(date.getTime())) return iso;
  return new Intl.DateTimeFormat("en-GB", {
    weekday: "short",
    day: "numeric",
    month: "long",
    year: "numeric",
  }).format(date);
}

export function isoDate(date: Date): string {
  const offset = date.getTimezoneOffset();
  const local = new Date(date.getTime() - offset * 60_000);
  return local.toISOString().slice(0, 10);
}

export function startOfWeek(from = new Date()): string {
  const date = new Date(from);
  const day = date.getDay();
  const diff = day === 0 ? -6 : 1 - day;
  date.setDate(date.getDate() + diff);
  return isoDate(date);
}

export function addDays(iso: string, days: number): string {
  const date = new Date(iso);
  date.setDate(date.getDate() + days);
  return isoDate(date);
}

export function periodRange(frequency: PayFrequency, endIso: string): { start: string; end: string } {
  const end = new Date(endIso);
  const start = new Date(endIso);
  if (frequency === "weekly") start.setDate(end.getDate() - 6);
  else if (frequency === "fortnightly") start.setDate(end.getDate() - 13);
  else if (frequency === "fourweekly") start.setDate(end.getDate() - 27);
  else start.setDate(1);
  return { start: isoDate(start), end: isoDate(end) };
}

export function frequencyLabel(frequency: PayFrequency): string {
  return PERIODS[frequency].label;
}

export function niNumberDisplay(value: string): string {
  const compact = value.replace(/\s+/g, "").toUpperCase();
  if (compact.length !== 9) return value || "—";
  return `${compact.slice(0, 2)} ${compact.slice(2, 4)} ${compact.slice(4, 6)} ${compact.slice(6, 8)} ${compact.slice(8)}`;
}

export function fullName(person: { firstName: string; lastName: string }): string {
  return `${person.firstName} ${person.lastName}`.trim();
}

export function hoursByDay(days: DayHours): string {
  return WEEKDAYS.map((day) => (days[day] ? `${day.slice(0, 1).toUpperCase()}${day.slice(1, 2)} ${days[day]}` : null))
    .filter(Boolean)
    .join(" · ");
}

export function maskAccount(last4: string): string {
  if (!last4) return "—";
  return `•••• ${last4}`;
}
