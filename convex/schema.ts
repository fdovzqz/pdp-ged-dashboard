import { defineSchema, defineTable } from "convex/server";
import { v } from "convex/values";

export default defineSchema({
  // Datos diarios por año (históricos + actuales)
  dailyData: defineTable({
    year: v.number(), // 2024, 2025, 2026
    day: v.number(), // 1-31
    events: v.number(), // Total de pagos del día
    isComplete: v.boolean(), // true si el día terminó (23:59 MX)
  }).index("by_year_day", ["year", "day"]),

  // Distribución horaria por tipo de día
  hourlyDistribution: defineTable({
    year: v.number(),
    dayType: v.string(), // "weekday" | "weekend"
    hour: v.number(), // 0-23
    events: v.number(),
  }).index("by_year_type_hour", ["year", "dayType", "hour"]),

  // Datos intradía del día actual
  intradayData: defineTable({
    day: v.number(),
    hour: v.number(),
    events: v.number(),
    cumulative: v.number(),
  }).index("by_day_hour", ["day", "hour"]),

  // Metadatos de intradía (última extracción)
  intradayMeta: defineTable({
    day: v.number(),
    lastExtraction: v.string(), // "14:41"
    lastExtractionIso: v.string(), // ISO timestamp
  }).index("by_day", ["day"]),

  // Control de procesamiento
  processingControl: defineTable({
    key: v.string(), // "lastProcessedDay"
    lastCompleteDay: v.number(),
    lastProcessedTimestamp: v.string(),
    year: v.number(),
    month: v.number(),
  }).index("by_key", ["key"]),

  // Log de extracciones
  extractionLog: defineTable({
    timestamp: v.string(),
    recordsProcessed: v.number(),
    status: v.string(), // "success" | "error"
    errorMessage: v.optional(v.string()),
  }),
});
