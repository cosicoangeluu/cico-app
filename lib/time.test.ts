import { describe, expect, it } from "vitest";
import {
  formatManilaDateTime,
  manilaDateKey,
  manilaParts,
  manilaToIso,
  periodRange,
} from "./time";

describe("formatManilaDateTime", () => {
  it("shows UTC instants in Philippine time (UTC+8)", () => {
    // 16:30 UTC is 00:30 the next day in Manila.
    expect(formatManilaDateTime("2026-10-17T16:30:00Z")).toMatch(
      /Oct 18, 2026.*12:30/,
    );
  });
});

describe("Manila dates", () => {
  it("reads the Manila calendar day and clock", () => {
    expect(manilaDateKey("2026-10-17T16:30:00Z")).toBe("2026-10-18");
    expect(manilaParts("2026-10-17T16:30:00Z")).toEqual({
      date: "2026-10-18",
      time: "00:30",
    });
  });

  it("turns a typed Manila date and time into an instant", () => {
    expect(manilaToIso("2026-10-18", "00:30")).toBe("2026-10-17T16:30:00.000Z");
    expect(manilaToIso("2026-10-18", "")).toBeNull();
  });
});

describe("periodRange", () => {
  // 2026-10-18 is a Sunday.
  it("starts weeks on Monday", () => {
    expect(periodRange("week", "2026-10-18")).toEqual({ from: "2026-10-12", to: "2026-10-18" });
  });

  it("starts months on the 1st", () => {
    expect(periodRange("month", "2026-10-18")).toEqual({ from: "2026-10-01", to: "2026-10-18" });
  });
});
