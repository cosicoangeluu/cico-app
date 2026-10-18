/** CICO's business timezone. All dates shown to the operator use it. */
export const BUSINESS_TIMEZONE = "Asia/Manila";

/** Manila has no daylight saving: it is always UTC+8. */
const MANILA_OFFSET = "+08:00";

const dateTimeFormat = new Intl.DateTimeFormat("en-PH", {
  timeZone: BUSINESS_TIMEZONE,
  dateStyle: "medium",
  timeStyle: "short",
});

const dateFormat = new Intl.DateTimeFormat("en-PH", {
  timeZone: BUSINESS_TIMEZONE,
  dateStyle: "medium",
});

/** "YYYY-MM-DD" and "HH:mm" for an instant, as a clock in Manila shows it. */
const partsFormat = new Intl.DateTimeFormat("en-CA", {
  timeZone: BUSINESS_TIMEZONE,
  year: "numeric",
  month: "2-digit",
  day: "2-digit",
  hour: "2-digit",
  minute: "2-digit",
  hourCycle: "h23",
});

function toDate(date: Date | string) {
  return typeof date === "string" ? new Date(date) : date;
}

/** e.g. "Oct 17, 2026, 10:05 PM" in Philippine time. */
export function formatManilaDateTime(date: Date | string): string {
  return dateTimeFormat.format(toDate(date));
}

/** A "YYYY-MM-DD" day key, e.g. from manilaDateKey, as "Oct 17, 2026". */
export function formatDateKey(key: string): string {
  return dateFormat.format(new Date(`${key}T12:00:00${MANILA_OFFSET}`));
}

/** The Manila calendar date and wall-clock time of an instant. */
export function manilaParts(date: Date | string = new Date()) {
  const parts = Object.fromEntries(
    partsFormat.formatToParts(toDate(date)).map((part) => [part.type, part.value]),
  );
  return {
    date: `${parts.year}-${parts.month}-${parts.day}`,
    time: `${parts.hour}:${parts.minute}`,
  };
}

/** The Manila calendar day ("YYYY-MM-DD") an instant falls on. */
export function manilaDateKey(date: Date | string): string {
  return manilaParts(date).date;
}

/** A date and time typed in Manila local time, as an ISO instant. */
export function manilaToIso(date: string, time: string): string | null {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(date) || !/^\d{2}:\d{2}$/.test(time)) {
    return null;
  }
  const instant = new Date(`${date}T${time}:00${MANILA_OFFSET}`);
  return Number.isNaN(instant.getTime()) ? null : instant.toISOString();
}

/** Moves a "YYYY-MM-DD" day key by a number of days. */
export function addDays(key: string, days: number): string {
  const day = new Date(`${key}T00:00:00Z`);
  day.setUTCDate(day.getUTCDate() + days);
  return day.toISOString().slice(0, 10);
}

export type Period = "today" | "week" | "month";

/** First and last day (inclusive) of a period containing `today`. Weeks start on Monday. */
export function periodRange(period: Period, today: string) {
  if (period === "today") return { from: today, to: today };
  if (period === "week") {
    const weekday = new Date(`${today}T00:00:00Z`).getUTCDay(); // 0 = Sunday
    const sinceMonday = (weekday + 6) % 7;
    return { from: addDays(today, -sinceMonday), to: today };
  }
  return { from: `${today.slice(0, 8)}01`, to: today };
}
