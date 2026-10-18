import { describe, expect, it } from "vitest";
import { formatPesos, parsePesos } from "./money";

describe("parsePesos", () => {
  it.each([
    ["1000", 100000],
    ["1,000", 100000],
    ["1,000.5", 100050],
    ["1,000.50", 100050],
    ["0.10", 10],
    ["₱ 250", 25000],
    ["  75.25 ", 7525],
    ["1,234,567.89", 123456789],
  ])("reads %j as %i centavos", (input, centavos) => {
    expect(parsePesos(input)).toBe(centavos);
  });

  it.each(["", "abc", "-100", "1.234", "1,00", "10,0000", "1e3", "12.", ".5"])(
    "rejects %j",
    (input) => {
      expect(parsePesos(input)).toBeNull();
    },
  );

  it("adds decimal amounts exactly", () => {
    expect(parsePesos("0.10")! + parsePesos("0.20")!).toBe(parsePesos("0.30"));
  });
});

describe("formatPesos", () => {
  it.each([
    [0, "₱0.00"],
    [5, "₱0.05"],
    [100050, "₱1,000.50"],
    [123456789, "₱1,234,567.89"],
    [-1000, "-₱10.00"],
  ])("formats %i centavos as %j", (centavos, text) => {
    expect(formatPesos(centavos)).toBe(text);
  });

  it("refuses fractions of a centavo", () => {
    expect(() => formatPesos(10.5)).toThrow(RangeError);
  });
});
