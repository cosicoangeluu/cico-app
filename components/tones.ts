/**
 * Each colour means one thing everywhere in CICO, so the operator can tell
 * what they are looking at before reading a word.
 */
export const tones = {
  "cash-in": "bg-cash-in text-cash-in-ink",
  "cash-out": "bg-cash-out text-cash-out-ink",
  pending: "bg-pending text-pending-ink",
  night: "bg-night text-night-ink",
  surface: "bg-surface text-ink",
} as const;

export type Tone = keyof typeof tones;
