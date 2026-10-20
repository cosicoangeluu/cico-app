import { parsePesos } from "@/lib/money";

/**
 * What CICO could pick out of a receipt's OCR text. Each field is null when
 * it wasn't found with enough confidence: a blank box is safer than a wrong
 * one, because the operator types whatever is missing.
 */
export type ReceiptReading = {
  reference: string | null;
  amountCentavos: number | null;
  /** "YYYY-MM-DD", as printed (receipts show Philippine time). */
  date: string | null;
  /** "HH:mm", 24-hour. */
  time: string | null;
};

const MONTHS = ["jan", "feb", "mar", "apr", "may", "jun", "jul", "aug", "sep", "oct", "nov", "dec"];

/**
 * A reference label: "Ref No.", "Reference Number", "Reference ID", "Ref #",
 * "Trace No.", "Transaction ID"… ("Transaction Date" is not one.)
 */
const REFERENCE_LABEL =
  /\b(?:ref(?:erence)?\.?(?:\s*(?:no|number|id|code|#))?|(?:trace|transaction)\s*(?:no|number|id|code|#))\.?\s*[:#]?/i;

/** Letters OCR commonly reads in place of digits. Only used inside tokens that also hold digits. */
const DIGIT_LOOKALIKES: Record<string, string> = { O: "0", o: "0", D: "0", I: "1", l: "1", "|": "1", S: "5", B: "8" };

export function parseReceiptText(text: string): ReceiptReading {
  const lines = text
    .split(/\r?\n/)
    .map((line) => line.replace(/\s+/g, " ").trim())
    .filter(Boolean);
  const { date, time } = findDateTime(lines.join("\n"));
  return { reference: findReference(lines), amountCentavos: findAmount(lines), date, time };
}

/** "1O23" -> "1023". Null for words, or for tokens with no real digit in them. */
function asDigits(token: string): string | null {
  if (!/\d/.test(token) || !/^[0-9OoDIl|SB]+$/.test(token)) return null;
  return [...token].map((c) => DIGIT_LOOKALIKES[c] ?? c).join("");
}

/**
 * The reference number in the text after its label: the first run of digit
 * groups ("1234 567 890123" -> "1234567890123"), or a single letter-and-digit
 * code some banks use. Stops at the next word, so a date on the same line
 * isn't swallowed.
 */
function readReference(text: string): string | null {
  const groups: string[] = [];
  for (const raw of text.split(/[\s-]+/)) {
    const token = raw.replace(/^[:#.]+|[.,:;]+$/g, "");
    if (!token) continue;
    const digits = asDigits(token);
    if (digits) {
      groups.push(digits);
      continue;
    }
    if (groups.length) break;
    // The number must come first: a line that starts with a word isn't a reference.
    return /^[A-Z0-9]{8,}$/.test(token) && (token.match(/\d/g)?.length ?? 0) >= 4 ? token : null;
  }
  const reference = groups.join("");
  return reference.length >= 6 ? reference : null;
}

function findReference(lines: string[]): string | null {
  for (let i = 0; i < lines.length; i++) {
    const label = REFERENCE_LABEL.exec(lines[i]);
    if (!label) continue;
    // The number is after the label on the same line, or alone on the next one.
    const reference =
      readReference(lines[i].slice(label.index + label[0].length)) ?? readReference(lines[i + 1] ?? "");
    if (reference) return reference;
  }
  return null;
}

const MONEY = /(\d{1,3}(?:,\d{3})+|\d+)\.(\d{2})\b/g;

/**
 * The amount transferred. Prefers lines labelled "total", then "amount", and
 * skips fee and balance lines, so a ₱15 fee isn't taken for the transfer.
 */
function findAmount(lines: string[]): number | null {
  const found: { centavos: number; rank: number }[] = [];
  lines.forEach((line, i) => {
    if (/\b(fee|charge|balance|points?|discount)\b/i.test(line)) return;
    // A label can sit on the line above its amount.
    const label = `${lines[i - 1] ?? ""} ${line}`;
    const rank = /total/i.test(label) ? 0 : /amount|sent|received|paid/i.test(label) ? 1 : /₱|PHP/i.test(line) ? 2 : -1;
    if (rank < 0) return;
    for (const match of line.matchAll(MONEY)) {
      const centavos = parsePesos(`${match[1]}.${match[2]}`);
      if (centavos) found.push({ centavos, rank });
    }
  });
  found.sort((a, b) => a.rank - b.rank);
  return found[0]?.centavos ?? null;
}

function isoDate(year: number, month: number, day: number): string | null {
  if (month < 1 || month > 12 || day < 1 || day > 31 || year < 2000 || year > 2100) return null;
  return `${year}-${String(month).padStart(2, "0")}-${String(day).padStart(2, "0")}`;
}

const monthNumber = (name: string) => MONTHS.indexOf(name.slice(0, 3).toLowerCase()) + 1;

const DATE_FORMATS: [RegExp, (m: RegExpMatchArray) => string | null][] = [
  // "Oct 20, 2026" / "October 20 2026"
  [/\b([A-Za-z]{3,9})\.? (\d{1,2}),? (\d{4})\b/g, (m) => isoDate(+m[3], monthNumber(m[1]), +m[2])],
  // "20 Oct 2026"
  [/\b(\d{1,2}) ([A-Za-z]{3,9})\.?,? (\d{4})\b/g, (m) => isoDate(+m[3], monthNumber(m[2]), +m[1])],
  // "2026-10-20" / "2026/10/20"
  [/\b(\d{4})[-/](\d{1,2})[-/](\d{1,2})\b/g, (m) => isoDate(+m[1], +m[2], +m[3])],
  // "10/20/2026" (the Philippines writes the month first)
  [/\b(\d{1,2})[/-](\d{1,2})[/-](\d{4})\b/g, (m) => isoDate(+m[3], +m[1], +m[2])],
];

/** "2:31 PM", "02:31:05 pm", "14:31". */
const CLOCK = /\b(\d{1,2})[:.](\d{2})(?:[:.]\d{2})?\s*([AaPp])\.?\s*[Mm]\b|\b([01]?\d|2[0-3]):([0-5]\d)(?::[0-5]\d)?\b/;

function findDateTime(text: string): { date: string | null; time: string | null } {
  let date: string | null = null;
  for (const [pattern, read] of DATE_FORMATS) {
    for (const match of text.matchAll(pattern)) {
      date ??= read(match);
    }
    if (date) break;
  }

  let time: string | null = null;
  const clock = CLOCK.exec(text);
  if (clock) {
    let hour = Number(clock[1] ?? clock[4]);
    const minute = Number(clock[2] ?? clock[5]);
    const meridiem = clock[3]?.toLowerCase();
    if (meridiem) hour = hour >= 1 && hour <= 12 ? (hour % 12) + (meridiem === "p" ? 12 : 0) : -1;
    if (hour >= 0 && minute < 60) {
      time = `${String(hour).padStart(2, "0")}:${String(minute).padStart(2, "0")}`;
    }
  }
  return { date, time };
}
