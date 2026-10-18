"use client";

import { useEffect } from "react";
import { isSupabaseConfigured } from "@/lib/env";
import { demoSource } from "./demo";
import { supabaseSource } from "./supabase";
import type { CicoSource } from "./types";

export type * from "./types";

/**
 * Where CICO's records live: the Supabase database once it's connected,
 * otherwise this browser (demo mode, only while developing).
 */
export const cico: CicoSource = isSupabaseConfigured ? supabaseSource : demoSource;

export function useCicoData() {
  return cico.useData();
}

/** Re-reads records every few seconds while a screen that waits on others is open. */
export function useAutoRefresh(intervalMs = 10_000) {
  useEffect(() => {
    const timer = window.setInterval(() => void cico.refresh(), intervalMs);
    return () => window.clearInterval(timer);
  }, [intervalMs]);
}
