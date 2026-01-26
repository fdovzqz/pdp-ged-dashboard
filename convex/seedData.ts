import { mutation } from "./_generated/server";

// Datos históricos reales de Enero (Días 1-25) - De historicalData.ts
const historicalData = [
  { day: 1, "2024": 8, "2025": 180, "2026": 454 },
  { day: 2, "2024": 724, "2025": 1492, "2026": 2147 },
  { day: 3, "2024": 1083, "2025": 1329, "2026": 941 },
  { day: 4, "2024": 746, "2025": 853, "2026": 795 },
  { day: 5, "2024": 1259, "2025": 460, "2026": 2168 },
  { day: 6, "2024": 577, "2025": 1461, "2026": 1854 },
  { day: 7, "2024": 395, "2025": 1441, "2026": 1822 },
  { day: 8, "2024": 1298, "2025": 1532, "2026": 1709 },
  { day: 9, "2024": 1342, "2025": 1540, "2026": 1474 },
  { day: 10, "2024": 1044, "2025": 1285, "2026": 730 },
  { day: 11, "2024": 1269, "2025": 635, "2026": 565 },
  { day: 12, "2024": 1133, "2025": 652, "2026": 1503 },
  { day: 13, "2024": 535, "2025": 1968, "2026": 1457 },
  { day: 14, "2024": 402, "2025": 1877, "2026": 1651 },
  { day: 15, "2024": 1618, "2025": 1877, "2026": 1711 },
  { day: 16, "2024": 1867, "2025": 1625, "2026": 1478 },
  { day: 17, "2024": 2583, "2025": 1222, "2026": 519 },
  { day: 18, "2024": 1291, "2025": 579, "2026": 423 },
  { day: 19, "2024": 1027, "2025": 501, "2026": 1222 },
  { day: 20, "2024": 446, "2025": 1290, "2026": 2627 },
  { day: 21, "2024": 279, "2025": 1341, "2026": 1909 },
  { day: 22, "2024": 1344, "2025": 1535, "2026": 1904 },
  { day: 23, "2024": 1629, "2025": 1387, "2026": 1650 },
  { day: 24, "2024": 2568, "2025": 1181, "2026": 992 },
  { day: 25, "2024": 1483, "2025": 654, "2026": 865 },
];

// Datos históricos completos días 26-31 (solo 2024 y 2025)
const historicalDataFull2024: Record<number, number> = {
  26: 1697,
  27: 1028,
  28: 815,
  29: 3373,
  30: 4318,
  31: 6290,
};

const historicalDataFull2025: Record<number, number> = {
  26: 671,
  27: 2003,
  28: 2991,
  29: 3116,
  30: 3486,
  31: 4639,
};

// Días de fin de semana por año
const weekendDays: Record<number, number[]> = {
  2024: [6, 7, 13, 14, 20, 21, 27, 28], // Sáb: 6,13,20,27 | Dom: 7,14,21,28
  2025: [4, 5, 11, 12, 18, 19, 25, 26], // Sáb: 4,11,18,25 | Dom: 5,12,19,26
  2026: [3, 4, 10, 11, 17, 18, 24, 25, 31], // Sáb: 3,10,17,24,31 | Dom: 4,11,18,25
};

// Distribución horaria - Días de semana (L-V)
const hourlyDistributionWeekday = [
  { hour: 0, "2024": 105, "2025": 153, "2026": 303 },
  { hour: 1, "2024": 34, "2025": 44, "2026": 293 },
  { hour: 2, "2024": 13, "2025": 28, "2026": 22 },
  { hour: 3, "2024": 3, "2025": 58, "2026": 17 },
  { hour: 4, "2024": 7, "2025": 14, "2026": 11 },
  { hour: 5, "2024": 6, "2025": 20, "2026": 32 },
  { hour: 6, "2024": 23, "2025": 56, "2026": 52 },
  { hour: 7, "2024": 126, "2025": 215, "2026": 192 },
  { hour: 8, "2024": 504, "2025": 754, "2026": 795 },
  { hour: 9, "2024": 1327, "2025": 1522, "2026": 1560 },
  { hour: 10, "2024": 2049, "2025": 2089, "2026": 2255 },
  { hour: 11, "2024": 2593, "2025": 2634, "2026": 2743 },
  { hour: 12, "2024": 2782, "2025": 2695, "2026": 2939 },
  { hour: 13, "2024": 2909, "2025": 2609, "2026": 2557 },
  { hour: 14, "2024": 2229, "2025": 2069, "2026": 2241 },
  { hour: 15, "2024": 1957, "2025": 1823, "2026": 2144 },
  { hour: 16, "2024": 2304, "2025": 1812, "2026": 1999 },
  { hour: 17, "2024": 1460, "2025": 1768, "2026": 2077 },
  { hour: 18, "2024": 1157, "2025": 1426, "2026": 1641 },
  { hour: 19, "2024": 1058, "2025": 1328, "2026": 1385 },
  { hour: 20, "2024": 928, "2025": 1137, "2026": 1233 },
  { hour: 21, "2024": 811, "2025": 960, "2026": 1150 },
  { hour: 22, "2024": 590, "2025": 684, "2026": 735 },
  { hour: 23, "2024": 341, "2025": 319, "2026": 364 },
];

// Distribución horaria - Fines de semana (S-D)
const hourlyDistributionWeekend = [
  { hour: 0, "2024": 28, "2025": 32, "2026": 37 },
  { hour: 1, "2024": 16, "2025": 17, "2026": 28 },
  { hour: 2, "2024": 9, "2025": 4, "2026": 20 },
  { hour: 3, "2024": 0, "2025": 2, "2026": 6 },
  { hour: 4, "2024": 2, "2025": 6, "2026": 3 },
  { hour: 5, "2024": 3, "2025": 2, "2026": 3 },
  { hour: 6, "2024": 4, "2025": 7, "2026": 11 },
  { hour: 7, "2024": 10, "2025": 17, "2026": 28 },
  { hour: 8, "2024": 42, "2025": 71, "2026": 85 },
  { hour: 9, "2024": 91, "2025": 117, "2026": 188 },
  { hour: 10, "2024": 179, "2025": 193, "2026": 294 },
  { hour: 11, "2024": 245, "2025": 317, "2026": 517 },
  { hour: 12, "2024": 280, "2025": 373, "2026": 605 },
  { hour: 13, "2024": 265, "2025": 369, "2026": 564 },
  { hour: 14, "2024": 226, "2025": 274, "2026": 558 },
  { hour: 15, "2024": 199, "2025": 284, "2026": 456 },
  { hour: 16, "2024": 156, "2025": 331, "2026": 376 },
  { hour: 17, "2024": 164, "2025": 248, "2026": 385 },
  { hour: 18, "2024": 162, "2025": 223, "2026": 353 },
  { hour: 19, "2024": 118, "2025": 220, "2026": 386 },
  { hour: 20, "2024": 163, "2025": 190, "2026": 385 },
  { hour: 21, "2024": 111, "2025": 194, "2026": 263 },
  { hour: 22, "2024": 112, "2025": 125, "2026": 181 },
  { hour: 23, "2024": 49, "2025": 64, "2026": 98 },
];

// Mutation para hacer seed de todos los datos
export const seedAllData = mutation({
  handler: async (ctx) => {
    console.log("🌱 Iniciando seed de datos...");

    // 1. Insertar datos diarios (días 1-25 para los 3 años)
    console.log("📊 Insertando datos diarios (días 1-25)...");
    for (const row of historicalData) {
      for (const year of [2024, 2025, 2026] as const) {
        const yearKey = year.toString() as "2024" | "2025" | "2026";
        await ctx.db.insert("dailyData", {
          year,
          day: row.day,
          events: row[yearKey],
          isComplete: true,
        });
      }
    }

    // 2. Insertar datos completos días 26-31 para 2024 y 2025
    console.log("📊 Insertando datos completos (días 26-31) para 2024 y 2025...");
    for (let day = 26; day <= 31; day++) {
      // 2024
      await ctx.db.insert("dailyData", {
        year: 2024,
        day,
        events: historicalDataFull2024[day],
        isComplete: true,
      });
      // 2025
      await ctx.db.insert("dailyData", {
        year: 2025,
        day,
        events: historicalDataFull2025[day],
        isComplete: true,
      });
    }

    // 3. Insertar distribución horaria - Weekday
    console.log("⏰ Insertando distribución horaria (días de semana)...");
    for (const row of hourlyDistributionWeekday) {
      for (const year of [2024, 2025, 2026] as const) {
        const yearKey = year.toString() as "2024" | "2025" | "2026";
        await ctx.db.insert("hourlyDistribution", {
          year,
          dayType: "weekday",
          hour: row.hour,
          events: row[yearKey],
        });
      }
    }

    // 4. Insertar distribución horaria - Weekend
    console.log("⏰ Insertando distribución horaria (fines de semana)...");
    for (const row of hourlyDistributionWeekend) {
      for (const year of [2024, 2025, 2026] as const) {
        const yearKey = year.toString() as "2024" | "2025" | "2026";
        await ctx.db.insert("hourlyDistribution", {
          year,
          dayType: "weekend",
          hour: row.hour,
          events: row[yearKey],
        });
      }
    }

    // 5. Inicializar control de procesamiento
    console.log("🔧 Inicializando control de procesamiento...");
    await ctx.db.insert("processingControl", {
      key: "lastProcessedDay",
      lastCompleteDay: 25,
      lastProcessedTimestamp: new Date().toISOString(),
      year: 2026,
      month: 1,
    });

    // 6. Agregar entrada al log de extracción
    await ctx.db.insert("extractionLog", {
      timestamp: new Date().toISOString(),
      recordsProcessed: historicalData.length * 3 + 12 + 144, // dailyData + hourlyDistribution
      status: "success",
    });

    console.log("✅ Seed completado!");
    return {
      dailyDataRecords: historicalData.length * 3 + 12, // 25*3 + 6*2
      hourlyDistributionRecords: 24 * 3 * 2, // 24 horas * 3 años * 2 tipos
    };
  },
});

// Mutation para limpiar todos los datos (útil para re-seed)
export const clearAllData = mutation({
  handler: async (ctx) => {
    console.log("🗑️ Limpiando todos los datos...");

    // Limpiar dailyData
    const dailyData = await ctx.db.query("dailyData").collect();
    for (const item of dailyData) {
      await ctx.db.delete(item._id);
    }

    // Limpiar hourlyDistribution
    const hourlyDistribution = await ctx.db.query("hourlyDistribution").collect();
    for (const item of hourlyDistribution) {
      await ctx.db.delete(item._id);
    }

    // Limpiar intradayData
    const intradayData = await ctx.db.query("intradayData").collect();
    for (const item of intradayData) {
      await ctx.db.delete(item._id);
    }

    // Limpiar intradayMeta
    const intradayMeta = await ctx.db.query("intradayMeta").collect();
    for (const item of intradayMeta) {
      await ctx.db.delete(item._id);
    }

    // Limpiar processingControl
    const processingControl = await ctx.db.query("processingControl").collect();
    for (const item of processingControl) {
      await ctx.db.delete(item._id);
    }

    // Limpiar extractionLog
    const extractionLog = await ctx.db.query("extractionLog").collect();
    for (const item of extractionLog) {
      await ctx.db.delete(item._id);
    }

    console.log("✅ Datos limpiados!");
    return { success: true };
  },
});

// Helper para verificar si ya hay datos en la base de datos
export const checkIfSeeded = mutation({
  handler: async (ctx) => {
    const dailyDataCount = (await ctx.db.query("dailyData").collect()).length;
    const hourlyCount = (await ctx.db.query("hourlyDistribution").collect()).length;
    const controlExists = await ctx.db
      .query("processingControl")
      .withIndex("by_key", (q) => q.eq("key", "lastProcessedDay"))
      .unique();

    return {
      isSeeded: dailyDataCount > 0 && hourlyCount > 0 && controlExists !== null,
      dailyDataCount,
      hourlyCount,
      hasProcessingControl: controlExists !== null,
    };
  },
});

// Cargar datos intradía del día 26 (para testing/desarrollo)
export const seedIntradayData = mutation({
  handler: async (ctx) => {
    console.log("🕐 Cargando datos intradía del día 26...");

    // Datos del archivo today-intraday.json
    const intradayData = [
      { hour: 0, events: 8, cumulative: 8 },
      { hour: 1, events: 5, cumulative: 13 },
      { hour: 3, events: 4, cumulative: 17 },
      { hour: 4, events: 1, cumulative: 18 },
      { hour: 5, events: 2, cumulative: 20 },
      { hour: 6, events: 4, cumulative: 24 },
      { hour: 7, events: 10, cumulative: 34 },
      { hour: 8, events: 48, cumulative: 82 },
      { hour: 9, events: 120, cumulative: 202 },
      { hour: 10, events: 152, cumulative: 354 },
      { hour: 11, events: 228, cumulative: 582 },
      { hour: 12, events: 268, cumulative: 850 },
      { hour: 13, events: 220, cumulative: 1070 },
      { hour: 14, events: 130, cumulative: 1200 },
    ];

    const day = 26;

    // Limpiar datos intradía existentes del día 26
    const existingIntraday = await ctx.db
      .query("intradayData")
      .withIndex("by_day_hour", (q) => q.eq("day", day))
      .collect();
    
    for (const item of existingIntraday) {
      await ctx.db.delete(item._id);
    }

    // Limpiar meta existente
    const existingMeta = await ctx.db
      .query("intradayMeta")
      .withIndex("by_day", (q) => q.eq("day", day))
      .unique();
    
    if (existingMeta) {
      await ctx.db.delete(existingMeta._id);
    }

    // Insertar nuevos datos intradía
    for (const hourData of intradayData) {
      await ctx.db.insert("intradayData", {
        day,
        hour: hourData.hour,
        events: hourData.events,
        cumulative: hourData.cumulative,
      });
    }

    // Insertar metadatos
    await ctx.db.insert("intradayMeta", {
      day,
      lastExtraction: "14:41",
      lastExtractionIso: "2026-01-26T20:41:13.914Z",
    });

    console.log("✅ Datos intradía del día 26 cargados!");
    return { 
      success: true, 
      recordsInserted: intradayData.length,
      totalEvents: 1200,
    };
  },
});

// Exportar constantes para uso en otros archivos
export const WEEKEND_DAYS = weekendDays;
