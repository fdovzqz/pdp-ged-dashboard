import { query, internalQuery } from "./_generated/server";
import { v } from "convex/values";

// Tipos para los retornos
type YearType = "2024" | "2025" | "2026";

// Días de fin de semana por año
const WEEKEND_DAYS: Record<number, number[]> = {
  2024: [6, 7, 13, 14, 20, 21, 27, 28],
  2025: [4, 5, 11, 12, 18, 19, 25, 26],
  2026: [3, 4, 10, 11, 17, 18, 24, 25, 31],
};

// Datos históricos completos para días 26-31 (hardcodeados para 2024/2025 que ya pasaron)
const HISTORICAL_FULL_2024: Record<number, number> = {
  26: 1697, 27: 1028, 28: 815, 29: 3373, 30: 4318, 31: 6290,
};

const HISTORICAL_FULL_2025: Record<number, number> = {
  26: 671, 27: 2003, 28: 2991, 29: 3116, 30: 3486, 31: 4639,
};

// ============ DATOS HISTÓRICOS ============

// Obtener todos los datos diarios formateados para el frontend
export const getHistoricalData = query({
  handler: async (ctx) => {
    const allData = await ctx.db.query("dailyData").collect();

    // Agrupar por día
    const dayMap = new Map<number, { "2024": number; "2025": number; "2026": number }>();

    for (const item of allData) {
      const yearKey = item.year.toString() as YearType;
      if (!dayMap.has(item.day)) {
        dayMap.set(item.day, { "2024": 0, "2025": 0, "2026": 0 });
      }
      const entry = dayMap.get(item.day)!;
      entry[yearKey] = item.events;
    }

    // Convertir a array y ordenar por día
    const result = Array.from(dayMap.entries())
      .map(([day, data]) => ({
        day,
        ...data,
      }))
      .sort((a, b) => a.day - b.day);

    return result;
  },
});

// Obtener el último día disponible con datos para 2026
export const getLastAvailableDay = query({
  handler: async (ctx) => {
    const data2026 = await ctx.db
      .query("dailyData")
      .withIndex("by_year_day", (q) => q.eq("year", 2026))
      .collect();

    const completeDays = data2026.filter((d) => d.isComplete);
    if (completeDays.length === 0) return 0;

    return Math.max(...completeDays.map((d) => d.day));
  },
});

// ============ TOTALES Y PROMEDIOS ============

// Obtener totales por año (solo días completos)
export const getTotals = query({
  handler: async (ctx) => {
    const allData = await ctx.db.query("dailyData").collect();

    const totals = { "2024": 0, "2025": 0, "2026": 0 };

    for (const item of allData) {
      if (item.isComplete) {
        const yearKey = item.year.toString() as YearType;
        totals[yearKey] += item.events;
      }
    }

    return totals;
  },
});

// Obtener totales hasta un día específico (para comparación justa entre años)
export const getTotalsUpToDay = query({
  args: { maxDay: v.number() },
  handler: async (ctx, args) => {
    const allData = await ctx.db.query("dailyData").collect();

    const totals = { "2024": 0, "2025": 0, "2026": 0 };

    for (const item of allData) {
      if (item.day <= args.maxDay && item.isComplete) {
        const yearKey = item.year.toString() as YearType;
        totals[yearKey] += item.events;
      }
    }

    return totals;
  },
});

// Obtener promedios diarios
export const getDailyAverages = query({
  handler: async (ctx) => {
    const allData = await ctx.db.query("dailyData").collect();

    const sums = { "2024": 0, "2025": 0, "2026": 0 };
    const counts = { "2024": 0, "2025": 0, "2026": 0 };

    for (const item of allData) {
      if (item.isComplete) {
        const yearKey = item.year.toString() as YearType;
        sums[yearKey] += item.events;
        counts[yearKey]++;
      }
    }

    return {
      "2024": counts["2024"] > 0 ? Math.round(sums["2024"] / counts["2024"]) : 0,
      "2025": counts["2025"] > 0 ? Math.round(sums["2025"] / counts["2025"]) : 0,
      "2026": counts["2026"] > 0 ? Math.round(sums["2026"] / counts["2026"]) : 0,
    };
  },
});

// ============ CRECIMIENTOS ============

// Obtener métricas de crecimiento
export const getGrowthMetrics = query({
  handler: async (ctx) => {
    // Obtener el último día con datos completos de 2026
    const data2026 = await ctx.db
      .query("dailyData")
      .withIndex("by_year_day", (q) => q.eq("year", 2026))
      .collect();

    const completeDays2026 = data2026.filter((d) => d.isComplete);
    const lastDay = completeDays2026.length > 0
      ? Math.max(...completeDays2026.map((d) => d.day))
      : 25;

    // Calcular totales hasta ese día para comparación justa
    const allData = await ctx.db.query("dailyData").collect();

    const totals = { "2024": 0, "2025": 0, "2026": 0 };

    for (const item of allData) {
      if (item.day <= lastDay && item.isComplete) {
        const yearKey = item.year.toString() as YearType;
        totals[yearKey] += item.events;
      }
    }

    const growth24vs25 =
      totals["2024"] > 0
        ? ((totals["2025"] - totals["2024"]) / totals["2024"]) * 100
        : 0;

    const growth25vs26 =
      totals["2025"] > 0
        ? ((totals["2026"] - totals["2025"]) / totals["2025"]) * 100
        : 0;

    const growth24vs26 =
      totals["2024"] > 0
        ? ((totals["2026"] - totals["2024"]) / totals["2024"]) * 100
        : 0;

    return {
      growth24vs25: growth24vs25.toFixed(1),
      growth25vs26: growth25vs26.toFixed(1),
      growth24vs26: growth24vs26.toFixed(1),
      comparisonDay: lastDay,
    };
  },
});

// ============ DISTRIBUCIÓN HORARIA ============

// Obtener distribución horaria
export const getHourlyDistribution = query({
  args: { dayType: v.optional(v.string()) },
  handler: async (ctx, args) => {
    let data;
    if (args.dayType) {
      data = await ctx.db
        .query("hourlyDistribution")
        .filter((q) => q.eq(q.field("dayType"), args.dayType))
        .collect();
    } else {
      data = await ctx.db.query("hourlyDistribution").collect();
    }

    // Si no se especifica dayType, sumar weekday + weekend para cada hora/año
    const hourMap = new Map<
      number,
      { "2024": number; "2025": number; "2026": number }
    >();

    for (const item of data) {
      const yearKey = item.year.toString() as YearType;
      if (!hourMap.has(item.hour)) {
        hourMap.set(item.hour, { "2024": 0, "2025": 0, "2026": 0 });
      }
      const entry = hourMap.get(item.hour)!;
      entry[yearKey] += item.events;
    }

    const hourLabels = [
      "12am", "1am", "2am", "3am", "4am", "5am", "6am", "7am",
      "8am", "9am", "10am", "11am", "12pm", "1pm", "2pm", "3pm",
      "4pm", "5pm", "6pm", "7pm", "8pm", "9pm", "10pm", "11pm",
    ];

    return Array.from(hourMap.entries())
      .map(([hour, data]) => ({
        hour,
        label: hourLabels[hour],
        ...data,
      }))
      .sort((a, b) => a.hour - b.hour);
  },
});

// Obtener distribución horaria separada por tipo de día
export const getHourlyDistributionByType = query({
  handler: async (ctx) => {
    const allData = await ctx.db.query("hourlyDistribution").collect();

    const weekdayMap = new Map<number, { "2024": number; "2025": number; "2026": number }>();
    const weekendMap = new Map<number, { "2024": number; "2025": number; "2026": number }>();

    for (const item of allData) {
      const yearKey = item.year.toString() as YearType;
      const targetMap = item.dayType === "weekday" ? weekdayMap : weekendMap;

      if (!targetMap.has(item.hour)) {
        targetMap.set(item.hour, { "2024": 0, "2025": 0, "2026": 0 });
      }
      const entry = targetMap.get(item.hour)!;
      entry[yearKey] = item.events;
    }

    const hourLabels = [
      "12am", "1am", "2am", "3am", "4am", "5am", "6am", "7am",
      "8am", "9am", "10am", "11am", "12pm", "1pm", "2pm", "3pm",
      "4pm", "5pm", "6pm", "7pm", "8pm", "9pm", "10pm", "11pm",
    ];

    const formatData = (map: Map<number, { "2024": number; "2025": number; "2026": number }>) =>
      Array.from(map.entries())
        .map(([hour, data]) => ({
          hour,
          label: hourLabels[hour],
          ...data,
        }))
        .sort((a, b) => a.hour - b.hour);

    return {
      weekday: formatData(weekdayMap),
      weekend: formatData(weekendMap),
    };
  },
});

// ============ DATOS INTRADÍA ============

// Sanitizar número para evitar NaN/Infinity que rompen la serialización de Convex
function sanitizeNum(x: number, fallback: number): number {
  if (typeof x !== "number" || !Number.isFinite(x)) return fallback;
  return x;
}

// Obtener datos intradía del día actual
export const getIntradayData = query({
  handler: async (ctx) => {
    try {
      // Obtener el último día completo para saber cuál es el día actual
      const processingControl = await ctx.db
        .query("processingControl")
        .withIndex("by_key", (q) => q.eq("key", "lastProcessedDay"))
        .unique();

      const lastCompleteDay = sanitizeNum(processingControl?.lastCompleteDay ?? 25, 25);
      const currentDay = Math.min(31, Math.max(1, lastCompleteDay + 1));

      // Obtener datos intradía
      const intradayData = await ctx.db
        .query("intradayData")
        .withIndex("by_day_hour", (q) => q.eq("day", currentDay))
        .collect();

      if (intradayData.length === 0) {
        return null;
      }

      // Obtener metadatos
      const meta = await ctx.db
        .query("intradayMeta")
        .withIndex("by_day", (q) => q.eq("day", currentDay))
        .unique();

      // Obtener datos históricos del mismo día
      const historical2024 = HISTORICAL_FULL_2024[currentDay] ?? 0;
      const historical2025 = HISTORICAL_FULL_2025[currentDay] ?? 0;

      // Si el día está en la BD (días 1-25 de años anteriores), obtenerlo
      const dbHistorical = await ctx.db
        .query("dailyData")
        .filter((q) =>
          q.and(
            q.eq(q.field("day"), currentDay),
            q.or(q.eq(q.field("year"), 2024), q.eq(q.field("year"), 2025))
          )
        )
        .collect();

      let hist2024 = historical2024;
      let hist2025 = historical2025;

      for (const item of dbHistorical) {
        if (item.year === 2024) hist2024 = item.events;
        if (item.year === 2025) hist2025 = item.events;
      }

      // Calcular totales y estadísticas (sanitizar hour para evitar NaN)
      const currentTotal = intradayData.reduce((sum, h) => sum + (Number(h.events) || 0), 0);
      const hours = intradayData.map((h) => (typeof h.hour === "number" && h.hour >= 0 && h.hour <= 23 ? h.hour : 0));
      const lastHour = hours.length > 0 ? Math.min(23, Math.max(0, Math.max(...hours))) : 0;
      const hoursRemaining = 24 - lastHour - 1;

      // Calcular proyecciones
      const forecast = calculateIntradayForecast(
        currentTotal,
        lastHour,
        currentDay,
        hist2024,
        hist2025
      );

      const sortedData = intradayData
        .map((h) => ({
          hour: sanitizeNum(h.hour, 0),
          events: sanitizeNum(h.events, 0),
          cumulative: sanitizeNum(h.cumulative, 0),
        }))
        .sort((a, b) => a.hour - b.hour);

      const vs2024 = hist2024 > 0 ? (currentTotal / hist2024 - 1) * 1000 / 10 : 0;
      const vs2025 = hist2025 > 0 ? (currentTotal / hist2025 - 1) * 1000 / 10 : 0;
      const averagePerHour = lastHour >= 0 ? currentTotal / (lastHour + 1) : 0;

      return {
        currentDay,
        currentHour: lastHour,
        hoursRemaining,
        todayData: sortedData,
        historicalComparison: {
          "2024": sanitizeNum(hist2024, 0),
          "2025": sanitizeNum(hist2025, 0),
          "2026": sanitizeNum(currentTotal, 0),
        },
        forecast: {
          conservador: sanitizeNum(forecast.conservador, 0),
          probable: sanitizeNum(forecast.probable, 0),
          optimista: sanitizeNum(forecast.optimista, 0),
        },
        statistics: {
          currentTotal: sanitizeNum(currentTotal, 0),
          projectedTotal: sanitizeNum(forecast.probable, 0),
          vs2024: sanitizeNum(Math.round(vs2024 * 10) / 10, 0),
          vs2025: sanitizeNum(Math.round(vs2025 * 10) / 10, 0),
          averagePerHour: sanitizeNum(Math.round(averagePerHour * 10) / 10, 0),
          projectedEndOfDay: sanitizeNum(forecast.probable, 0),
        },
        lastExtraction: meta?.lastExtraction ?? "",
        lastExtractionIso: meta?.lastExtractionIso ?? "",
      };
    } catch (_e) {
      return null;
    }
  },
});

// Helper para calcular proyecciones intradía.
// Sanitiza entradas y evita NaN/Infinity que rompen la serialización de Convex.
function calculateIntradayForecast(
  currentTotal: number,
  currentHour: number,
  _currentDay: number,
  historical2024: number,
  historical2025: number
): { conservador: number; probable: number; optimista: number } {
  const total = sanitizeNum(currentTotal, 0);
  const hour = Math.max(0, Math.min(23, Math.floor(Number(currentHour)) || 0));
  const h24 = sanitizeNum(historical2024, 0);
  const h25 = sanitizeNum(historical2025, 0);

  if (hour === 0) {
    const avg = (h24 + h25) / 2;
    return {
      conservador: sanitizeNum(Math.round(avg), 0),
      probable: sanitizeNum(Math.round(avg), 0),
      optimista: sanitizeNum(Math.round(avg), 0),
    };
  }

  const hourlyProgress = [
    0.01, 0.02, 0.02, 0.02, 0.02, 0.03, 0.04, 0.06, 0.10, 0.16,
    0.24, 0.34, 0.45, 0.55, 0.64, 0.72, 0.79, 0.85, 0.89, 0.93,
    0.96, 0.98, 0.99, 1.0,
  ];
  const rawProgress = hourlyProgress[hour];
  const expectedProgress = typeof rawProgress === "number" && rawProgress > 0 ? rawProgress : 0.5;
  const expectedTotal = expectedProgress > 0 ? total / expectedProgress : total * 2;

  return {
    conservador: sanitizeNum(Math.round(sanitizeNum(expectedTotal, 0) * 0.9), 0),
    probable: sanitizeNum(Math.round(sanitizeNum(expectedTotal, 0)), 0),
    optimista: sanitizeNum(Math.round(sanitizeNum(expectedTotal, 0) * 1.1), 0),
  };
}

// ============ FORECAST / PROYECCIONES ============

// Obtener datos de forecast para el gráfico
export const getForecastData = query({
  handler: async (ctx) => {
    const historicalData = await ctx.db.query("dailyData").collect();

    // Agrupar datos históricos por día
    const dayMap = new Map<number, { "2024": number; "2025": number; "2026"?: number }>();

    for (const item of historicalData) {
      if (!dayMap.has(item.day)) {
        dayMap.set(item.day, { "2024": 0, "2025": 0 });
      }
      const entry = dayMap.get(item.day)!;
      if (item.year === 2024) entry["2024"] = item.events;
      if (item.year === 2025) entry["2025"] = item.events;
      if (item.year === 2026 && item.isComplete) entry["2026"] = item.events;
    }

    // Obtener último día completo de 2026
    const data2026 = historicalData.filter((d) => d.year === 2026 && d.isComplete);
    const lastAvailableDay = data2026.length > 0 ? Math.max(...data2026.map((d) => d.day)) : 25;

    // Calcular factor de crecimiento de 2026
    let total2024 = 0;
    let total2025 = 0;
    let total2026 = 0;

    for (let day = 1; day <= lastAvailableDay; day++) {
      const data = dayMap.get(day);
      if (data) {
        total2024 += data["2024"] || 0;
        total2025 += data["2025"] || 0;
        total2026 += data["2026"] || 0;
      }
    }

    const avg2024_2025 = (total2024 + total2025) / 2;
    const growthFactor = avg2024_2025 > 0 ? total2026 / avg2024_2025 : 1;

    // Obtener datos intradía si existen
    const intradayData = await ctx.db.query("intradayData").collect();
    const intradayDay = intradayData.length > 0 ? intradayData[0].day : null;
    const intradayTotal = intradayData.reduce((sum, h) => sum + h.events, 0);

    // Generar resultado
    const result = [];

    for (let day = 1; day <= 31; day++) {
      const data = dayMap.get(day) || { "2024": 0, "2025": 0 };
      const hist2024 = data["2024"] || HISTORICAL_FULL_2024[day] || 0;
      const hist2025 = data["2025"] || HISTORICAL_FULL_2025[day] || 0;

      if (day <= lastAvailableDay) {
        // Día con datos reales de 2026
        result.push({
          day,
          conservador: data["2026"]!,
          probable: data["2026"]!,
          optimista: data["2026"]!,
          actual: data["2026"]!,
          "2024": hist2024,
          "2025": hist2025,
        });
      } else if (intradayDay === day) {
        // Día actual con datos intradía
        const forecast = calculateIntradayForecast(
          intradayTotal,
          Math.max(...intradayData.map((h) => h.hour)),
          day,
          hist2024,
          hist2025
        );
        result.push({
          day,
          conservador: forecast.conservador,
          probable: forecast.probable,
          optimista: forecast.optimista,
          actual: undefined,
          "2024": hist2024,
          "2025": hist2025,
        });
      } else {
        // Día futuro - proyección basada en históricos
        const avgHistorical = (hist2024 + hist2025) / 2;
        const isWeekend = WEEKEND_DAYS[2026]?.includes(day) ?? false;
        const weekendAdjustment = isWeekend ? 0.85 : 1.0;

        const probable = Math.round(avgHistorical * growthFactor * weekendAdjustment);
        const conservador = Math.round(probable * 0.85);
        const optimista = Math.round(probable * 1.15);

        result.push({
          day,
          conservador,
          probable,
          optimista,
          actual: undefined,
          "2024": hist2024,
          "2025": hist2025,
        });
      }
    }

    return result;
  },
});

// Calcular totales de forecast
export const getForecastTotals = query({
  handler: async (ctx) => {
    // Replicar la lógica de getForecastData para obtener los totales
    const historicalData = await ctx.db.query("dailyData").collect();

    const dayMap = new Map<number, { "2024": number; "2025": number; "2026"?: number }>();

    for (const item of historicalData) {
      if (!dayMap.has(item.day)) {
        dayMap.set(item.day, { "2024": 0, "2025": 0 });
      }
      const entry = dayMap.get(item.day)!;
      if (item.year === 2024) entry["2024"] = item.events;
      if (item.year === 2025) entry["2025"] = item.events;
      if (item.year === 2026 && item.isComplete) entry["2026"] = item.events;
    }

    const data2026 = historicalData.filter((d) => d.year === 2026 && d.isComplete);
    const lastAvailableDay = data2026.length > 0 ? Math.max(...data2026.map((d) => d.day)) : 25;

    let total2024 = 0;
    let total2025 = 0;
    let total2026 = 0;

    for (let day = 1; day <= lastAvailableDay; day++) {
      const data = dayMap.get(day);
      if (data) {
        total2024 += data["2024"] || 0;
        total2025 += data["2025"] || 0;
        total2026 += data["2026"] || 0;
      }
    }

    const avg2024_2025 = (total2024 + total2025) / 2;
    const growthFactor = avg2024_2025 > 0 ? total2026 / avg2024_2025 : 1;

    const intradayData = await ctx.db.query("intradayData").collect();
    const intradayDay = intradayData.length > 0 ? intradayData[0].day : null;
    const intradayTotal = intradayData.reduce((sum, h) => sum + h.events, 0);

    let conservador = 0;
    let probable = 0;
    let optimista = 0;

    for (let day = 1; day <= 31; day++) {
      const data = dayMap.get(day) || { "2024": 0, "2025": 0 };
      const hist2024 = data["2024"] || HISTORICAL_FULL_2024[day] || 0;
      const hist2025 = data["2025"] || HISTORICAL_FULL_2025[day] || 0;

      if (day <= lastAvailableDay) {
        const value = data["2026"] || 0;
        conservador += value;
        probable += value;
        optimista += value;
      } else if (intradayDay === day) {
        const forecast = calculateIntradayForecast(
          intradayTotal,
          Math.max(...intradayData.map((h) => h.hour)),
          day,
          hist2024,
          hist2025
        );
        conservador += forecast.conservador;
        probable += forecast.probable;
        optimista += forecast.optimista;
      } else {
        const avgHistorical = (hist2024 + hist2025) / 2;
        const isWeekend = WEEKEND_DAYS[2026]?.includes(day) ?? false;
        const weekendAdjustment = isWeekend ? 0.85 : 1.0;

        const probableVal = Math.round(avgHistorical * growthFactor * weekendAdjustment);
        const conservadorVal = Math.round(probableVal * 0.85);
        const optimistaVal = Math.round(probableVal * 1.15);

        conservador += conservadorVal;
        probable += probableVal;
        optimista += optimistaVal;
      }
    }

    return { conservador, probable, optimista };
  },
});

// ============ ESTADÍSTICAS ADICIONALES ============

// Obtener estadísticas L-V vs S-D (solo hasta lastAvailableDay de 2026 para comparación equivalente)
// Devuelve { sum, days } por tipo para promedios correctos (suma / días efectivos)
export const getWeekdayWeekendStats = query({
  handler: async (ctx) => {
    const allData = await ctx.db.query("dailyData").collect();

    const data2026 = allData.filter((d) => d.year === 2026 && d.isComplete);
    const lastAvailableDay = data2026.length > 0 ? Math.max(...data2026.map((d) => d.day)) : 0;

    const stats = {
      "2024": { weekday: { sum: 0, days: 0 }, weekend: { sum: 0, days: 0 } },
      "2025": { weekday: { sum: 0, days: 0 }, weekend: { sum: 0, days: 0 } },
      "2026": { weekday: { sum: 0, days: 0 }, weekend: { sum: 0, days: 0 } },
    };

    for (const item of allData) {
      if (!item.isComplete || item.day > lastAvailableDay) continue;
      const yearKey = item.year.toString() as YearType;
      const isWeekend = WEEKEND_DAYS[item.year]?.includes(item.day) ?? false;

      if (isWeekend) {
        stats[yearKey].weekend.sum += item.events;
        stats[yearKey].weekend.days += 1;
      } else {
        stats[yearKey].weekday.sum += item.events;
        stats[yearKey].weekday.days += 1;
      }
    }

    return stats;
  },
});

// Obtener estadísticas por período del mes (Arranque 1-7, Medio 8-24, Cierre 25-31)
// Solo incluye días hasta lastAvailableDay (de 2026) para comparación equivalente entre años
export const getPeriodStats = query({
  handler: async (ctx) => {
    const allData = await ctx.db.query("dailyData").collect();

    // Último día con datos completos en 2026 → usamos ese tope para 2024, 2025 y 2026
    const data2026 = allData.filter((d) => d.year === 2026 && d.isComplete);
    const lastAvailableDay = data2026.length > 0 ? Math.max(...data2026.map((d) => d.day)) : 0;

    const stats = {
      "2024": {
        arranque: { sum: 0, days: 0 },
        medio: { sum: 0, days: 0 },
        cierre: { sum: 0, days: 0 },
      },
      "2025": {
        arranque: { sum: 0, days: 0 },
        medio: { sum: 0, days: 0 },
        cierre: { sum: 0, days: 0 },
      },
      "2026": {
        arranque: { sum: 0, days: 0 },
        medio: { sum: 0, days: 0 },
        cierre: { sum: 0, days: 0 },
      },
    };

    for (const item of allData) {
      if (!item.isComplete || item.day > lastAvailableDay) continue;
      const yearKey = item.year.toString() as YearType;

      // Arranque: 1-7 | Medio: 8-24 | Cierre: 25-31 (solo días ≤ lastAvailableDay)
      if (item.day <= 7) {
        stats[yearKey].arranque.sum += item.events;
        stats[yearKey].arranque.days += 1;
      } else if (item.day <= 24) {
        stats[yearKey].medio.sum += item.events;
        stats[yearKey].medio.days += 1;
      } else {
        stats[yearKey].cierre.sum += item.events;
        stats[yearKey].cierre.days += 1;
      }
    }

    return stats;
  },
});

// Obtener totales de mes completo (para 2024 y 2025)
export const getFullMonthTotals = query({
  handler: async (ctx) => {
    const allData = await ctx.db.query("dailyData").collect();

    const totals = { "2024": 0, "2025": 0 };

    for (const item of allData) {
      if (item.year === 2024 || item.year === 2025) {
        const yearKey = item.year.toString() as "2024" | "2025";
        totals[yearKey] += item.events;
      }
    }

    return totals;
  },
});

// Obtener máximo histórico
export const getHistoricalMax = query({
  handler: async (ctx) => {
    const allData = await ctx.db.query("dailyData").collect();

    let max = { value: 0, day: 1, year: 2024 };

    for (const item of allData) {
      if (item.events > max.value) {
        max = { value: item.events, day: item.day, year: item.year };
      }
    }

    return max;
  },
});

// ============ CONTROL Y MONITOREO ============

// Query interna para obtener el control de procesamiento
export const getProcessingControl = internalQuery({
  handler: async (ctx) => {
    return await ctx.db
      .query("processingControl")
      .withIndex("by_key", (q) => q.eq("key", "lastProcessedDay"))
      .unique();
  },
});

// Query pública para última extracción
export const getLastExtraction = query({
  handler: async (ctx) => {
    const logs = await ctx.db
      .query("extractionLog")
      .order("desc")
      .take(1);

    return logs[0] ?? null;
  },
});

// Obtener últimas N extracciones
export const getExtractionHistory = query({
  args: { limit: v.optional(v.number()) },
  handler: async (ctx, args) => {
    const limit = args.limit ?? 10;
    return await ctx.db
      .query("extractionLog")
      .order("desc")
      .take(limit);
  },
});

// ============ DATOS PARA HEATMAP ============

// Generar datos para heatmap
export const getHeatmapData = query({
  args: { year: v.number() },
  handler: async (ctx, args) => {
    const yearData = await ctx.db
      .query("dailyData")
      .withIndex("by_year_day", (q) => q.eq("year", args.year))
      .collect();

    const dayNames = ["Dom", "Lun", "Mar", "Mié", "Jue", "Vie", "Sáb"];

    // Primer día de la semana para cada año
    const startDays: Record<number, number> = {
      2024: 1, // Lunes
      2025: 3, // Miércoles
      2026: 4, // Jueves
    };

    const startDay = startDays[args.year] ?? 0;

    return yearData
      .filter((d) => d.isComplete)
      .map((d) => {
        const dayOfWeek = (startDay + d.day - 1) % 7;
        const week = Math.ceil((d.day + startDay - 1) / 7);

        return {
          day: d.day,
          dayName: dayNames[dayOfWeek],
          week,
          value: d.events,
          year: args.year.toString(),
        };
      })
      .sort((a, b) => a.day - b.day);
  },
});

// ============ HISTÓRICO ANUAL (monthlyData) ============

const MONTH_NAMES = [
  "Enero", "Febrero", "Marzo", "Abril", "Mayo", "Junio",
  "Julio", "Agosto", "Septiembre", "Octubre", "Noviembre", "Diciembre",
];

type MonthlyRow = { year: number; month: number; events: number };

function aggregateMonthlyData(rows: MonthlyRow[]) {
  const monthly2024 = Array(12).fill(0) as number[];
  const monthly2025 = Array(12).fill(0) as number[];
  for (const r of rows) {
    if (r.year === 2024) monthly2024[r.month - 1] += r.events;
    if (r.year === 2025) monthly2025[r.month - 1] += r.events;
  }
  const total2024 = monthly2024.reduce((a, b) => a + b, 0);
  const total2025 = monthly2025.reduce((a, b) => a + b, 0);
  return { monthly2024, monthly2025, total2024, total2025 };
}

// Equivalente a monthlyComparisonData
export const getAnnualMonthlyData = query({
  handler: async (ctx) => {
    const rows = await ctx.db.query("monthlyData").collect();
    const { monthly2024, monthly2025 } = aggregateMonthlyData(rows);
    return MONTH_NAMES.map((name, i) => {
      const v4 = monthly2024[i];
      const v5 = monthly2025[i];
      const difference = v5 - v4;
      const growthRate = v4 > 0 ? (difference / v4) * 100 : 0;
      return {
        month: i + 1,
        monthName: name,
        "2024": v4,
        "2025": v5,
        difference,
        growthRate,
      };
    });
  },
});

// Equivalente a monthlyAccumulatedData
export const getAnnualMonthlyAccumulated = query({
  handler: async (ctx) => {
    const rows = await ctx.db.query("monthlyData").collect();
    const { monthly2024, monthly2025 } = aggregateMonthlyData(rows);
    let acc2024 = 0;
    let acc2025 = 0;
    return MONTH_NAMES.map((name, i) => {
      acc2024 += monthly2024[i];
      acc2025 += monthly2025[i];
      return {
        month: i + 1,
        monthName: name,
        "2024": monthly2024[i],
        "2025": monthly2025[i],
        accumulated2024: acc2024,
        accumulated2025: acc2025,
      };
    });
  },
});

// Totales anuales 2024 y 2025
export const getAnnualTotals = query({
  handler: async (ctx) => {
    const rows = await ctx.db.query("monthlyData").collect();
    const { total2024, total2025 } = aggregateMonthlyData(rows);
    return { "2024": total2024, "2025": total2025 };
  },
});

// Crecimiento año vs año
export const getAnnualGrowth = query({
  handler: async (ctx) => {
    const rows = await ctx.db.query("monthlyData").collect();
    const { total2024, total2025 } = aggregateMonthlyData(rows);
    const absolute = total2025 - total2024;
    const percentage =
      total2024 > 0 ? ((absolute / total2024) * 100).toFixed(1) : "0";
    return { absolute, percentage };
  },
});

// Promedios diarios por año: { sum, days } para que el cliente calcule sum/days
// 2024 bisiesto (366), 2025 no (365)
export const getAnnualDailyAverages = query({
  handler: async (ctx) => {
    const rows = await ctx.db.query("monthlyData").collect();
    const { total2024, total2025 } = aggregateMonthlyData(rows);
    return {
      "2024": { sum: total2024, days: 366 },
      "2025": { sum: total2025, days: 365 },
    };
  },
});

// Trimestres: Q1=1-3, Q2=4-6, Q3=7-9, Q4=10-12
export const getAnnualQuarterlyData = query({
  handler: async (ctx) => {
    const rows = await ctx.db.query("monthlyData").collect();
    const { monthly2024, monthly2025 } = aggregateMonthlyData(rows);
    const sum = (arr: number[], a: number, b: number) =>
      arr.slice(a, b).reduce((x, y) => x + y, 0);
    return {
      "2024": {
        Q1: sum(monthly2024, 0, 3),
        Q2: sum(monthly2024, 3, 6),
        Q3: sum(monthly2024, 6, 9),
        Q4: sum(monthly2024, 9, 12),
      },
      "2025": {
        Q1: sum(monthly2025, 0, 3),
        Q2: sum(monthly2025, 3, 6),
        Q3: sum(monthly2025, 6, 9),
        Q4: sum(monthly2025, 9, 12),
      },
    };
  },
});

// Estadísticas: max/min por año, meses con crecimiento/descenso, mejor/peor mes
export const getAnnualStats = query({
  handler: async (ctx) => {
    const rows = await ctx.db.query("monthlyData").collect();
    const { monthly2024, monthly2025 } = aggregateMonthlyData(rows);
    const monthly = MONTH_NAMES.map((name, i) => {
      const v4 = monthly2024[i];
      const v5 = monthly2025[i];
      const difference = v5 - v4;
      const growthRate = v4 > 0 ? (difference / v4) * 100 : 0;
      return {
        month: i + 1,
        monthName: name,
        "2024": v4,
        "2025": v5,
        difference,
        growthRate,
      };
    });
    type M = (typeof monthly)[number];
    const by = (f: (a: M, b: M) => boolean) => (arr: M[]) =>
      arr.reduce((acc, curr) => (f(acc, curr) ? acc : curr));
    return {
      maxMonth2024: by((a, b) => a["2024"] >= b["2024"])(monthly),
      minMonth2024: by((a, b) => a["2024"] <= b["2024"])(monthly),
      maxMonth2025: by((a, b) => a["2025"] >= b["2025"])(monthly),
      minMonth2025: by((a, b) => a["2025"] <= b["2025"])(monthly),
      monthsWithGrowth: monthly.filter((m: M) => m.growthRate > 0).length,
      monthsWithDecline: monthly.filter((m: M) => m.growthRate < 0).length,
      bestGrowthMonth: by((a, b) => a.growthRate >= b.growthRate)(monthly),
      worstGrowthMonth: by((a, b) => a.growthRate <= b.growthRate)(monthly),
    };
  },
});

// ============ DATOS DE COMPARACIÓN ============

// Datos para gráfico de barras comparativo
export const getComparisonData = query({
  handler: async (ctx) => {
    // Calcular totales directamente en lugar de usar runQuery
    const allData = await ctx.db.query("dailyData").collect();

    const totals = { "2024": 0, "2025": 0, "2026": 0 };

    for (const item of allData) {
      if (item.isComplete) {
        const yearKey = item.year.toString() as YearType;
        totals[yearKey] += item.events;
      }
    }

    return [
      { name: "2024", pagos: totals["2024"], fill: "#f472b6" },
      { name: "2025", pagos: totals["2025"], fill: "#8b5cf6" },
      { name: "2026", pagos: totals["2026"], fill: "#10b981" },
    ];
  },
});
