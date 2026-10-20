"use client";

import type { Worker } from "tesseract.js";
import { parseReceiptText, type ReceiptReading } from "./parse";

/** Tesseract reads small screen text best at roughly this many pixels on the long side. */
const TARGET_SIDE = 2000;

let worker: Promise<Worker> | null = null;

/**
 * One OCR worker for the whole visit. The first scan downloads the reading
 * engine and English data (a few MB, then cached by the browser), so it is
 * slower than the rest.
 */
function getWorker() {
  worker ??= import("tesseract.js")
    .then(({ createWorker }) => createWorker("eng"))
    .catch((problem) => {
      worker = null; // Let the next scan try again, e.g. once back online.
      throw problem;
    });
  return worker;
}

/**
 * Prepares a photo for OCR: resized, grey, high contrast, and dark text on a
 * light background (some wallets use dark receipts, which Tesseract misreads).
 */
async function prepare(file: File): Promise<HTMLCanvasElement> {
  const bitmap = await createImageBitmap(file);
  const scale = Math.min(2, TARGET_SIDE / Math.max(bitmap.width, bitmap.height));
  const canvas = document.createElement("canvas");
  canvas.width = Math.round(bitmap.width * scale);
  canvas.height = Math.round(bitmap.height * scale);
  const context = canvas.getContext("2d", { willReadFrequently: true });
  if (!context) throw new Error("This browser can't prepare pictures for reading.");
  context.drawImage(bitmap, 0, 0, canvas.width, canvas.height);
  bitmap.close();

  const image = context.getImageData(0, 0, canvas.width, canvas.height);
  const pixels = image.data;
  const grey = new Uint8ClampedArray(pixels.length / 4);
  let total = 0;
  for (let i = 0; i < grey.length; i++) {
    grey[i] = 0.299 * pixels[i * 4] + 0.587 * pixels[i * 4 + 1] + 0.114 * pixels[i * 4 + 2];
    total += grey[i];
  }
  const invert = total / grey.length < 110;
  for (let i = 0; i < grey.length; i++) {
    const value = invert ? 255 - grey[i] : grey[i];
    // Stretch contrast around the middle so faint digits stand out from glare.
    const stretched = (value - 128) * 1.5 + 128;
    pixels[i * 4] = pixels[i * 4 + 1] = pixels[i * 4 + 2] = stretched;
  }
  context.putImageData(image, 0, 0);
  return canvas;
}

/** Reads a receipt photo on this device. Nothing is sent to a server. */
export async function scanReceipt(file: File): Promise<ReceiptReading> {
  const [ocr, canvas] = await Promise.all([getWorker(), prepare(file)]);
  const { data } = await ocr.recognize(canvas);
  return parseReceiptText(data.text);
}
