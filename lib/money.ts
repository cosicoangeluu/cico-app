/**
 * Money is stored and calculated as whole centavos (integers), never as
 * floating-point pesos, so PHP 0.10 + PHP 0.20 is always exactly PHP 0.30.
 */

const PESO_INPUT = /^(\d{1,3}(,\d{3})+|\d+)(\.(\d{1,2}))?$/;

/**
 * Reads an amount typed by the operator ("1000", "1,000", "1,000.50") into
 * centavos. Returns null for anything that is not a plain positive amount
 * with at most two decimal places.
 */
export function parsePesos(input: string): number | null {
  const text = input.trim().replace(/^₱\s*/, "");
  const match = PESO_INPUT.exec(text);
  if (!match) return null;

  const pesos = Number(match[1].replaceAll(",", ""));
  const centavos = Number((match[4] ?? "").padEnd(2, "0"));
  const total = pesos * 100 + centavos;

  return Number.isSafeInteger(total) ? total : null;
}

/** Centavos as plain text for an input box, e.g. 100050 -> "1000.50", 50000 -> "500". */
export function centavosToInput(centavos: number): string {
  const pesos = Math.trunc(centavos / 100);
  const cents = centavos % 100;
  return cents === 0 ? String(pesos) : `${pesos}.${String(cents).padStart(2, "0")}`;
}

/** Formats centavos for display, e.g. 100050 -> "₱1,000.50". */
export function formatPesos(centavos: number): string {
  if (!Number.isSafeInteger(centavos)) {
    throw new RangeError(`Not a whole number of centavos: ${centavos}`);
  }
  const sign = centavos < 0 ? "-" : "";
  const absolute = Math.abs(centavos);
  const pesos = Math.trunc(absolute / 100).toLocaleString("en-PH");
  const cents = String(absolute % 100).padStart(2, "0");
  return `${sign}₱${pesos}.${cents}`;
}
