"use client";

const MAX_SIDE = 1400;
const QUALITY = 0.72;

/**
 * Shrinks a photo to a JPEG data URL small enough to keep in the browser
 * (demo) while staying readable. Throws if the file isn't a readable image.
 */
export async function shrinkImage(file: File): Promise<string> {
  if (!file.type.startsWith("image/")) {
    throw new Error("That file isn't a picture. Choose a photo or screenshot of the receipt.");
  }

  const bitmap = await createImageBitmap(file).catch(() => {
    throw new Error("CICO couldn't open that picture. Try another photo or screenshot.");
  });

  const scale = Math.min(1, MAX_SIDE / Math.max(bitmap.width, bitmap.height));
  const canvas = document.createElement("canvas");
  canvas.width = Math.round(bitmap.width * scale);
  canvas.height = Math.round(bitmap.height * scale);
  canvas.getContext("2d")?.drawImage(bitmap, 0, 0, canvas.width, canvas.height);
  bitmap.close();

  return canvas.toDataURL("image/jpeg", QUALITY);
}
