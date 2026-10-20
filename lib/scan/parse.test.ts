import { describe, expect, it } from "vitest";
import { parseReceiptText } from "./parse";

// Tesseract's actual output for GCash receipt screenshots. Phone numbers,
// reference numbers and name letters are changed; the OCR quirks are kept:
// mask dots read as small letters, "₱" read as "£" or "$", no space in "16,2026".
const GCASH_SCREENSHOTS = [
  {
    text: `MAeeeN JOeN B.
+63 900 000 1111
Sent via GCash
Amount 150.00
Total Amount Sent £150.00
Ref No. 1234 176 598482 Oct 16,2026 9:19 AM
`,
    expected: {
      reference: "1234176598482",
      name: "MA•••N JO•N B.",
      amountCentavos: 15000,
      date: "2026-10-16",
      time: "09:19",
    },
  },
  {
    text: `©
NAeH ANeeoeY B.
+63 900 000 2222
Sent via GCash
Amount 4,000.00
Total Amount Sent $4,000.00
Ref No. 1234 032 650064 Oct 12,2026 11:34 AM
`,
    expected: {
      reference: "1234032650064",
      name: "NA•H AN••••Y B.",
      amountCentavos: 400000,
      date: "2026-10-12",
      time: "11:34",
    },
  },
  {
    text: `DAeeceoE ERee AD.
+63 900 000 3333
Sent via GCash
Amount 190.00
Total Amount Sent £190.00
Ref No. 1234 186 440194 Oct 16,2026 1:46 PM
`,
    expected: {
      reference: "1234186440194",
      name: "DA•••••E ER•• AD.",
      amountCentavos: 19000,
      date: "2026-10-16",
      time: "13:46",
    },
  },
];

// Shaped like real OCR output: odd spacing, stray symbols, misread characters.
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

describe("parseReceiptText", () => {
  it.each(GCASH_SCREENSHOTS)("reads a GCash screenshot ($expected.reference)", ({ text, expected }) => {
    expect(parseReceiptText(text)).toEqual(expected);
  });

  it("reads a Maya receipt, fixing letters misread as digits and skipping the fee", () => {
    expect(parseReceiptText(MAYA)).toEqual({
      reference: "102345678912",
      name: null,
      amountCentavos: 50000,
      date: "2026-10-20",
      time: "14:31",
    });
  });

  it("reads a bank receipt with a letter-and-digit reference and skips the balance", () => {
    expect(parseReceiptText(BANK)).toEqual({
      reference: "AB12CD34EF56",
      name: null,
      amountCentavos: 250050,
      date: "2026-10-20",
      time: "14:05",
    });
  });

  it("doesn't take a Transaction Date for a reference", () => {
    expect(parseReceiptText("Transaction Date 10/20/2026").reference).toBeNull();
  });

  it("doesn't take a lowercase line above the number for a name", () => {
    expect(parseReceiptText("sent via gcash\n+63 900 000 1111").name).toBeNull();
  });

  it("leaves everything blank when the photo is unreadable", () => {
    expect(parseReceiptText("~~ ,,  %%\n  ")).toEqual({
      reference: null,
      name: null,
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
