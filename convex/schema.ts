import { defineSchema, defineTable } from "convex/server";
import { v } from "convex/values";

export default defineSchema({
  // Datos diarios por año y mes (históricos + actuales)
  // month es opcional para compatibilidad con documentos existentes (se tratan como mes 1 = Enero)
  dailyData: defineTable({
    year: v.number(), // 2024, 2025, 2026
    month: v.optional(v.number()), // 1-12, opcional para migración
    day: v.number(), // 1-31
    events: v.number(), // Total de pagos del día
    isComplete: v.boolean(), // true si el día terminó (23:59 MX)
  }).index("by_year_month_day", ["year", "month", "day"]),

  // Datos mensuales por año (histórico anual 2024, 2025, 2026)
  monthlyData: defineTable({
    year: v.number(), // 2024, 2025, (2026)
    month: v.number(), // 1-12
    events: v.number(), // Total de pagos del mes
  }).index("by_year_month", ["year", "month"]),

  // Distribución horaria por tipo de día y mes
  // month es opcional para compatibilidad con documentos existentes
  hourlyDistribution: defineTable({
    year: v.number(),
    month: v.optional(v.number()), // 1-12, opcional para migración
    dayType: v.string(), // "weekday" | "weekend"
    hour: v.number(), // 0-23
    events: v.number(),
  }).index("by_year_month_type_hour", ["year", "month", "dayType", "hour"]),

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

  // Flags de sistema (no se borran en clear; p. ej. cronPaused, reextractCanceled)
  systemFlags: defineTable({
    key: v.string(),
    value: v.number(), // 1 = true, 0 = false
    updatedAt: v.string(),
  }).index("by_key", ["key"]),

  // Notas de análisis contextual (editables desde Convex)
  analysisNotes: defineTable({
    id: v.string(), // "2025-mit", "2026-defect", "cierre-mes"
    yearLabel: v.string(), // "2025", "2026", etc.
    title: v.optional(v.string()),
    content: v.string(),
    accentColor: v.string(), // "violet", "emerald", "cyan"
    order: v.number(),
  }).index("by_order", ["order"]),

  // Fuente única de verdad: detalles horarios desde CloudWatch (1 ene 2024 - hoy)
  rawHourlyData: defineTable({
    year: v.number(),
    month: v.number(),
    day: v.number(),
    hour: v.number(),
    events: v.number(),
  }).index("by_year_month_day_hour", ["year", "month", "day", "hour"]),
});
