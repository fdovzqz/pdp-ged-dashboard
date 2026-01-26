import { mutation, internalMutation } from "./_generated/server";
import { v } from "convex/values";

// ============ DAILY DATA ============

// Insertar o actualizar datos diarios
export const upsertDailyData = mutation({
  args: {
    year: v.number(),
    day: v.number(),
    events: v.number(),
    isComplete: v.boolean(),
  },
  handler: async (ctx, args) => {
    const existing = await ctx.db
      .query("dailyData")
      .withIndex("by_year_day", (q) => q.eq("year", args.year).eq("day", args.day))
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
    day: v.number(),
    events: v.number(),
    isComplete: v.boolean(),
  },
  handler: async (ctx, args) => {
    const existing = await ctx.db
      .query("dailyData")
      .withIndex("by_year_day", (q) => q.eq("year", args.year).eq("day", args.day))
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

// Insertar múltiples datos diarios en batch
export const batchInsertDailyData = mutation({
  args: {
    data: v.array(
      v.object({
        year: v.number(),
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
        .withIndex("by_year_day", (q) => q.eq("year", item.year).eq("day", item.day))
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
    dayType: v.string(),
    hour: v.number(),
    events: v.number(),
  },
  handler: async (ctx, args) => {
    const existing = await ctx.db
      .query("hourlyDistribution")
      .withIndex("by_year_type_hour", (q) =>
        q.eq("year", args.year).eq("dayType", args.dayType).eq("hour", args.hour)
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
    dayType: v.string(),
    hour: v.number(),
    events: v.number(),
  },
  handler: async (ctx, args) => {
    const existing = await ctx.db
      .query("hourlyDistribution")
      .withIndex("by_year_type_hour", (q) =>
        q.eq("year", args.year).eq("dayType", args.dayType).eq("hour", args.hour)
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
    dayType: v.string(),
    hour: v.number(),
    additionalEvents: v.number(),
  },
  handler: async (ctx, args) => {
    const existing = await ctx.db
      .query("hourlyDistribution")
      .withIndex("by_year_type_hour", (q) =>
        q.eq("year", args.year).eq("dayType", args.dayType).eq("hour", args.hour)
      )
      .unique();

    if (existing) {
      await ctx.db.patch(existing._id, {
        events: existing.events + args.additionalEvents,
      });
      return existing._id;
    } else {
      return await ctx.db.insert("hourlyDistribution", {
        year: args.year,
        dayType: args.dayType,
        hour: args.hour,
        events: args.additionalEvents,
      });
    }
  },
});

// Batch insert hourly distribution
export const batchInsertHourlyDistribution = mutation({
  args: {
    data: v.array(
      v.object({
        year: v.number(),
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
        .withIndex("by_year_type_hour", (q) =>
          q.eq("year", item.year).eq("dayType", item.dayType).eq("hour", item.hour)
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
