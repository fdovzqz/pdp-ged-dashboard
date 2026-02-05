import { useQuery } from "convex/react";
import { api } from "../../convex/_generated/api";

export interface HourlyByDayRecord {
  hour: number;
  label: string;
  "2024": number;
  "2025": number;
  "2026": number;
}

export function useHourlyByDay(
  day: number | null,
  enabled: boolean,
  month: number = 1
): {
  data: HourlyByDayRecord[] | null;
  isLoading: boolean;
  error: Error | null;
} {
  const convexData = useQuery(
    api.queries.getHourlyByDay,
    day !== null && enabled ? { day, month } : "skip"
  );

  if (!day || !enabled) {
    return { data: null, isLoading: false, error: null };
  }

  if (convexData === undefined) {
    return { data: null, isLoading: true, error: null };
  }

  if (convexData === null) {
    return { data: null, isLoading: false, error: null };
  }

  return {
    data: convexData as HourlyByDayRecord[],
    isLoading: false,
    error: null,
  };
}
