import type { CSSProperties } from "react";

/** Position of an item in a `.rise` entrance sequence (0 enters first). */
export function stagger(index: number): CSSProperties {
  return { "--i": index } as CSSProperties;
}
