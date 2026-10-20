import { describe, expect, it } from "vitest";
import { parseReceiptText } from "./parse";

// Shaped like real OCR output: odd spacing, stray symbols, misread characters.
const GCASH = `
Sent via GCash
JU*N D*L* C*UZ
+63 917 123 4567
Amount 1,000.00
Total Amount Sent ₱1,000.00
Ref No. 0012 345 678901 Oct 20, 2026 2:31 PM
`;

const MAYA = `
Transfer successful
₱ 500.00
Fee ₱15.00
Reference ID
1O23 4567 89I2
20 Oct 2026, 02:31:05 pm
`;

const BANK = `
InstaPay Transfer
Transaction Date 10/20/2026 14:05
Trace No: AB12CD34EF56
Amount PHP 2,500.50
Available Balance PHP 99,999.00
`;

// Tesseract's actual output for a tilted, softened photo of a GCash-style receipt.
const TESSERACT_PHOTO = `Sent via GCash
JUN D*L* cuz
+63 917 123 4567
Amount 1,000.00
Send Fee 0.00
Total Amount Sent
1,000.00
Ref No. 0012 345 678901
Oct 20, 2026 2:31 PM
`;

describe("parseReceiptText", () => {
  it("reads real Tesseract output from a phone photo", () => {
    expect(parseReceiptText(TESSERACT_PHOTO)).toEqual({
      reference: "0012345678901",
      amountCentavos: 100000,
      date: "2026-10-20",
      time: "14:31",
    });
  });

  it("reads a GCash receipt with the date on the reference line", () => {
    expect(parseReceiptText(GCASH)).toEqual({
      reference: "0012345678901",
      amountCentavos: 100000,
      date: "2026-10-20",
      time: "14:31",
    });
  });

  it("reads a Maya receipt, fixing letters misread as digits and skipping the fee", () => {
    expect(parseReceiptText(MAYA)).toEqual({
      reference: "102345678912",
      amountCentavos: 50000,
      date: "2026-10-20",
      time: "14:31",
    });
  });

  it("reads a bank receipt with a letter-and-digit reference and skips the balance", () => {
    expect(parseReceiptText(BANK)).toEqual({
      reference: "AB12CD34EF56",
      amountCentavos: 250050,
      date: "2026-10-20",
      time: "14:05",
    });
  });

  it("doesn't take a Transaction Date for a reference", () => {
    expect(parseReceiptText("Transaction Date 10/20/2026").reference).toBeNull();
  });

  it("leaves everything blank when the photo is unreadable", () => {
    expect(parseReceiptText("~~ ,,  %%\n  ")).toEqual({
      reference: null,
      amountCentavos: null,
      date: null,
      time: null,
    });
  });

  it("refuses too-short or impossible values", () => {
    const reading = parseReceiptText("Ref No. 123\nOct 40, 2026 13:75 PM");
    expect(reading.reference).toBeNull();
    expect(reading.date).toBeNull();
  });
});
