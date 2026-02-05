import { mutation, internalMutation } from "./_generated/server";
import type { Id, TableNames } from "./_generated/dataModel";
import { v } from "convex/values";

// ============ DAILY DATA ============

// Insertar o actualizar datos diarios
export const upsertDailyData = mutation({
  args: {
    year: v.number(),
    month: v.number(),
    day: v.number(),
    events: v.number(),
    isComplete: v.boolean(),
  },
  handler: async (ctx, args) => {
    const existing = await ctx.db
      .query("dailyData")
      .withIndex("by_year_month_day", (q) =>
        q.eq("year", args.year).eq("month", args.month).eq("day", args.day)
      )
      .unique();

    if (existing) {
      await ctx.db.patch(existing._id, {
        events: args.events,
        isComplete: args.isComplete,
      });
      return existing._id;
    } else {
      return await ctx.db.insert("dailyData", args);
    }
  },
});

// Versión interna para uso desde actions
export const internalUpsertDailyData = internalMutation({
  args: {
    year: v.number(),
    month: v.number(),
    day: v.number(),
    events: v.number(),
    isComplete: v.boolean(),
  },
  handler: async (ctx, args) => {
    const existing = await ctx.db
      .query("dailyData")
      .withIndex("by_year_month_day", (q) =>
        q.eq("year", args.year).eq("month", args.month).eq("day", args.day)
      )
      .unique();

    if (existing) {
      await ctx.db.patch(existing._id, {
        events: args.events,
        isComplete: args.isComplete,
      });
      return existing._id;
    }

    // Compatibilidad con documentos legacy (sin month): cuando month=1, buscar por year+day
    if (args.month === 1) {
      const legacy = await ctx.db
        .query("dailyData")
        .filter((q) =>
          q.and(
            q.eq(q.field("year"), args.year),
            q.eq(q.field("day"), args.day),
            q.or(q.eq(q.field("month"), 1), q.eq(q.field("month"), undefined))
          )
        )
        .first();
      if (legacy) {
        await ctx.db.patch(legacy._id, {
          month: 1,
          events: args.events,
          isComplete: args.isComplete,
        });
        return legacy._id;
      }
    }

    return await ctx.db.insert("dailyData", args);
  },
});

// Insertar múltiples datos diarios en batch
export const batchInsertDailyData = mutation({
  args: {
    data: v.array(
      v.object({
        year: v.number(),
        month: v.number(),
        day: v.number(),
        events: v.number(),
        isComplete: v.boolean(),
      })
    ),
  },
  handler: async (ctx, args) => {
    const ids = [];
    for (const item of args.data) {
      const existing = await ctx.db
        .query("dailyData")
        .withIndex("by_year_month_day", (q) =>
          q.eq("year", item.year).eq("month", item.month).eq("day", item.day)
        )
        .unique();

      if (existing) {
        await ctx.db.patch(existing._id, {
          events: item.events,
          isComplete: item.isComplete,
        });
        ids.push(existing._id);
      } else {
        const id = await ctx.db.insert("dailyData", item);
        ids.push(id);
      }
    }
    return ids;
  },
});

// ============ HOURLY DISTRIBUTION ============

// Insertar o actualizar distribución horaria
export const upsertHourlyDistribution = mutation({
  args: {
    year: v.number(),
    month: v.number(),
    dayType: v.string(),
    hour: v.number(),
    events: v.number(),
  },
  handler: async (ctx, args) => {
    const existing = await ctx.db
      .query("hourlyDistribution")
      .withIndex("by_year_month_type_hour", (q) =>
        q
          .eq("year", args.year)
          .eq("month", args.month)
          .eq("dayType", args.dayType)
          .eq("hour", args.hour)
      )
      .unique();

    if (existing) {
      await ctx.db.patch(existing._id, { events: args.events });
      return existing._id;
    } else {
      return await ctx.db.insert("hourlyDistribution", args);
    }
  },
});

// Versión interna para uso desde actions
export const internalUpsertHourlyDistribution = internalMutation({
  args: {
    year: v.number(),
    month: v.number(),
    dayType: v.string(),
    hour: v.number(),
    events: v.number(),
  },
  handler: async (ctx, args) => {
    const existing = await ctx.db
      .query("hourlyDistribution")
      .withIndex("by_year_month_type_hour", (q) =>
        q
          .eq("year", args.year)
          .eq("month", args.month)
          .eq("dayType", args.dayType)
          .eq("hour", args.hour)
      )
      .unique();

    if (existing) {
      await ctx.db.patch(existing._id, { events: args.events });
      return existing._id;
    } else {
      return await ctx.db.insert("hourlyDistribution", args);
    }
  },
});

// Incrementar distribución horaria (para actualización incremental)
export const incrementHourlyDistribution = internalMutation({
  args: {
    year: v.number(),
    month: v.number(),
    dayType: v.string(),
    hour: v.number(),
    additionalEvents: v.number(),
  },
  handler: async (ctx, args) => {
    const existing = await ctx.db
      .query("hourlyDistribution")
      .withIndex("by_year_month_type_hour", (q) =>
        q
          .eq("year", args.year)
          .eq("month", args.month)
          .eq("dayType", args.dayType)
          .eq("hour", args.hour)
      )
      .unique();

    if (existing) {
      await ctx.db.patch(existing._id, {
        events: existing.events + args.additionalEvents,
      });
      return existing._id;
    }

    // Compatibilidad con documentos legacy (sin month): cuando month=1, buscar por year+dayType+hour
    if (args.month === 1) {
      const legacy = await ctx.db
        .query("hourlyDistribution")
        .filter((q) =>
          q.and(
            q.eq(q.field("year"), args.year),
            q.eq(q.field("dayType"), args.dayType),
            q.eq(q.field("hour"), args.hour),
            q.or(q.eq(q.field("month"), 1), q.eq(q.field("month"), undefined))
          )
        )
        .first();
      if (legacy) {
        await ctx.db.patch(legacy._id, {
          month: 1,
          events: legacy.events + args.additionalEvents,
        });
        return legacy._id;
      }
    }

    return await ctx.db.insert("hourlyDistribution", {
      year: args.year,
      month: args.month,
      dayType: args.dayType,
      hour: args.hour,
      events: args.additionalEvents,
    });
  },
});

// Batch insert hourly distribution
export const batchInsertHourlyDistribution = mutation({
  args: {
    data: v.array(
      v.object({
        year: v.number(),
        month: v.number(),
        dayType: v.string(),
        hour: v.number(),
        events: v.number(),
      })
    ),
  },
  handler: async (ctx, args) => {
    const ids = [];
    for (const item of args.data) {
      const existing = await ctx.db
        .query("hourlyDistribution")
        .withIndex("by_year_month_type_hour", (q) =>
          q
            .eq("year", item.year)
            .eq("month", item.month)
            .eq("dayType", item.dayType)
            .eq("hour", item.hour)
        )
        .unique();

      if (existing) {
        await ctx.db.patch(existing._id, { events: item.events });
        ids.push(existing._id);
      } else {
        const id = await ctx.db.insert("hourlyDistribution", item);
        ids.push(id);
      }
    }
    return ids;
  },
});

// ============ RAW HOURLY DATA (fuente única desde CloudWatch) ============

// Batch upsert para rawHourlyData (usado por fullReextractFromCloudWatch)
export const batchInsertRawHourlyData = internalMutation({
  args: {
    data: v.array(
      v.object({
        year: v.number(),
        month: v.number(),
        day: v.number(),
        hour: v.number(),
        events: v.number(),
      })
    ),
  },
  handler: async (ctx, args) => {
    const ids = [];
    for (const item of args.data) {
      const existing = await ctx.db
        .query("rawHourlyData")
        .withIndex("by_year_month_day_hour", (q) =>
          q
            .eq("year", item.year)
            .eq("month", item.month)
            .eq("day", item.day)
            .eq("hour", item.hour)
        )
        .unique();

      if (existing) {
        await ctx.db.patch(existing._id, { events: item.events });
        ids.push(existing._id);
      } else {
        const id = await ctx.db.insert("rawHourlyData", item);
        ids.push(id);
      }
    }
    return ids;
  },
});

// ============ CLEAR AGGREGATES (para rebuild) ============
// Para vaciar TODAS las tablas, usa: npm run convex:clear
// (convex import --replace es el método recomendado por Convex)

const BATCH_DELETE_SIZE = 500;

// Vaciar solo tablas agregadas (para rebuild desde rawHourlyData)
// Usa borrado por lotes para evitar el límite de 4096 lecturas
export const clearAggregatesOnly = internalMutation({
  args: {},
  handler: async (ctx) => {
    for (const table of ["dailyData", "monthlyData", "hourlyDistribution"] as const) {
      let batch: { _id: Id<TableNames> }[];
      do {
        batch = await ctx.db.query(table).take(BATCH_DELETE_SIZE) as { _id: Id<TableNames> }[];
        for (const doc of batch) await ctx.db.delete(doc._id);
      } while (batch.length === BATCH_DELETE_SIZE);
    }
  },
});

// Batch insert monthlyData (para rebuildAggregatesFromRaw)
export const batchInsertMonthlyData = internalMutation({
  args: {
    data: v.array(
      v.object({
        year: v.number(),
        month: v.number(),
        events: v.number(),
      })
    ),
  },
  handler: async (ctx, args) => {
    for (const item of args.data) {
      const existing = await ctx.db
        .query("monthlyData")
        .withIndex("by_year_month", (q) =>
          q.eq("year", item.year).eq("month", item.month)
        )
        .unique();

      if (existing) {
        await ctx.db.patch(existing._id, { events: item.events });
      } else {
        await ctx.db.insert("monthlyData", item);
      }
    }
  },
});

// ============ INTRADAY DATA ============

// Limpiar e insertar datos intradía para un día
export const replaceIntradayData = internalMutation({
  args: {
    day: v.number(),
    data: v.array(
      v.object({
        hour: v.number(),
        events: v.number(),
        cumulative: v.number(),
      })
    ),
  },
  handler: async (ctx, args) => {
    // Eliminar datos existentes del día
    const existing = await ctx.db
      .query("intradayData")
      .withIndex("by_day_hour", (q) => q.eq("day", args.day))
      .collect();

    for (const item of existing) {
      await ctx.db.delete(item._id);
    }

    // Insertar nuevos datos
    for (const item of args.data) {
      await ctx.db.insert("intradayData", {
        day: args.day,
        hour: item.hour,
        events: item.events,
        cumulative: item.cumulative,
      });
    }
  },
});

// Actualizar metadatos de intradía
export const updateIntradayMeta = internalMutation({
  args: {
    day: v.number(),
    lastExtraction: v.string(),
    lastExtractionIso: v.string(),
  },
  handler: async (ctx, args) => {
    const existing = await ctx.db
      .query("intradayMeta")
      .withIndex("by_day", (q) => q.eq("day", args.day))
      .unique();

    if (existing) {
      await ctx.db.patch(existing._id, {
        lastExtraction: args.lastExtraction,
        lastExtractionIso: args.lastExtractionIso,
      });
      return existing._id;
    } else {
      return await ctx.db.insert("intradayMeta", args);
    }
  },
});

// ============ SYSTEM FLAGS ============

// Pausar o reactivar el cron (para clear + re-extracción)
export const setCronPaused = mutation({
  args: { paused: v.boolean() },
  handler: async (ctx, args) => {
    const value = args.paused ? 1 : 0;
    const existing = await ctx.db
      .query("systemFlags")
      .withIndex("by_key", (q) => q.eq("key", "cronPaused"))
      .unique();
    const now = new Date().toISOString();
    if (existing) {
      await ctx.db.patch(existing._id, { value, updatedAt: now });
    } else {
      await ctx.db.insert("systemFlags", {
        key: "cronPaused",
        value,
        updatedAt: now,
      });
    }
    return { paused: args.paused };
  },
});

// Solicitar cancelación de la re-extracción en curso (el job saldrá en la siguiente iteración)
export const cancelReextract = mutation({
  args: {},
  handler: async (ctx) => {
    const now = new Date().toISOString();
    const existing = await ctx.db
      .query("systemFlags")
      .withIndex("by_key", (q) => q.eq("key", "reextractCanceled"))
      .unique();
    if (existing) {
      await ctx.db.patch(existing._id, { value: 1, updatedAt: now });
    } else {
      await ctx.db.insert("systemFlags", {
        key: "reextractCanceled",
        value: 1,
        updatedAt: now,
      });
    }
    return { canceled: true };
  },
});

// Limpiar flag de cancelación (para iniciar nueva re-extracción)
export const clearReextractCanceled = internalMutation({
  args: {},
  handler: async (ctx) => {
    const existing = await ctx.db
      .query("systemFlags")
      .withIndex("by_key", (q) => q.eq("key", "reextractCanceled"))
      .unique();
    if (existing) {
      await ctx.db.patch(existing._id, { value: 0, updatedAt: new Date().toISOString() });
    }
  },
});

// ============ PROCESSING CONTROL ============

// Actualizar control de procesamiento
export const updateProcessingControl = internalMutation({
  args: {
    key: v.string(),
    lastCompleteDay: v.number(),
    lastProcessedTimestamp: v.string(),
    year: v.number(),
    month: v.number(),
  },
  handler: async (ctx, args) => {
    const existing = await ctx.db
      .query("processingControl")
      .withIndex("by_key", (q) => q.eq("key", args.key))
      .unique();

    if (existing) {
      await ctx.db.patch(existing._id, {
        lastCompleteDay: args.lastCompleteDay,
        lastProcessedTimestamp: args.lastProcessedTimestamp,
        year: args.year,
        month: args.month,
      });
      return existing._id;
    } else {
      return await ctx.db.insert("processingControl", args);
    }
  },
});

// Inicializar control de procesamiento (para seed)
export const initProcessingControl = mutation({
  args: {
    key: v.string(),
    lastCompleteDay: v.number(),
    lastProcessedTimestamp: v.string(),
    year: v.number(),
    month: v.number(),
  },
  handler: async (ctx, args) => {
    const existing = await ctx.db
      .query("processingControl")
      .withIndex("by_key", (q) => q.eq("key", args.key))
      .unique();

    if (existing) {
      await ctx.db.patch(existing._id, {
        lastCompleteDay: args.lastCompleteDay,
        lastProcessedTimestamp: args.lastProcessedTimestamp,
        year: args.year,
        month: args.month,
      });
      return existing._id;
    } else {
      return await ctx.db.insert("processingControl", args);
    }
  },
});

// ============ MONTHLY DATA (agregación desde dailyData) ============

// Incrementar o crear registro mensual cuando se completa un día
export const internalIncrementMonthlyData = internalMutation({
  args: {
    year: v.number(),
    month: v.number(),
    additionalEvents: v.number(),
  },
  handler: async (ctx, args) => {
    const existing = await ctx.db
      .query("monthlyData")
      .withIndex("by_year_month", (q) =>
        q.eq("year", args.year).eq("month", args.month)
      )
      .unique();

    if (existing) {
      await ctx.db.patch(existing._id, {
        events: existing.events + args.additionalEvents,
      });
      return existing._id;
    } else {
      return await ctx.db.insert("monthlyData", {
        year: args.year,
        month: args.month,
        events: args.additionalEvents,
      });
    }
  },
});

// ============ EXTRACTION LOG ============

// Agregar entrada al log de extracción
export const addExtractionLog = internalMutation({
  args: {
    timestamp: v.string(),
    recordsProcessed: v.number(),
    status: v.string(),
    errorMessage: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    return await ctx.db.insert("extractionLog", args);
  },
});

// ============ CLEANUP ============

// Limpiar datos intradía de días anteriores (llamar cuando un día se completa)
export const cleanupOldIntradayData = internalMutation({
  args: {
    currentDay: v.number(),
  },
  handler: async (ctx, args) => {
    // Obtener todos los datos intradía que no son del día actual
    const allIntraday = await ctx.db.query("intradayData").collect();
    
    for (const item of allIntraday) {
      if (item.day !== args.currentDay) {
        await ctx.db.delete(item._id);
      }
    }

    // Limpiar también metadatos de días anteriores
    const allMeta = await ctx.db.query("intradayMeta").collect();
    for (const item of allMeta) {
      if (item.day !== args.currentDay) {
        await ctx.db.delete(item._id);
      }
    }
  },
});
