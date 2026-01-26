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

// Obtener datos intradía del día actual
export const getIntradayData = query({
  handler: async (ctx) => {
    // Obtener el último día completo para saber cuál es el día actual
    const processingControl = await ctx.db
      .query("processingControl")
      .withIndex("by_key", (q) => q.eq("key", "lastProcessedDay"))
      .unique();

    const lastCompleteDay = processingControl?.lastCompleteDay ?? 25;
    const currentDay = lastCompleteDay + 1;

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

    // Calcular totales y estadísticas
    const currentTotal = intradayData.reduce((sum, h) => sum + h.events, 0);
    const lastHour = Math.max(...intradayData.map((h) => h.hour));
    const hoursRemaining = 24 - lastHour - 1;

    // Calcular proyecciones basadas en distribución horaria histórica
    const forecast = calculateIntradayForecast(
      currentTotal,
      lastHour,
      currentDay,
      hist2024,
      hist2025
    );

    const sortedData = intradayData
      .map((h) => ({
        hour: h.hour,
        events: h.events,
        cumulative: h.cumulative,
      }))
      .sort((a, b) => a.hour - b.hour);

    return {
      currentDay,
      currentHour: lastHour,
      hoursRemaining,
      todayData: sortedData,
      historicalComparison: {
        "2024": hist2024,
        "2025": hist2025,
        "2026": currentTotal,
      },
      forecast,
      statistics: {
        currentTotal,
        projectedTotal: forecast.probable,
        vs2024: hist2024 > 0 ? Math.round(((currentTotal / hist2024) - 1) * 1000) / 10 : 0,
        vs2025: hist2025 > 0 ? Math.round(((currentTotal / hist2025) - 1) * 1000) / 10 : 0,
        averagePerHour: lastHour > 0 ? Math.round((currentTotal / (lastHour + 1)) * 10) / 10 : 0,
        projectedEndOfDay: forecast.probable,
      },
      lastExtraction: meta?.lastExtraction ?? "",
      lastExtractionIso: meta?.lastExtractionIso ?? "",
    };
  },
});

// Helper para calcular proyecciones intradía
function calculateIntradayForecast(
  currentTotal: number,
  currentHour: number,
  _currentDay: number, // Prefijo _ para indicar que es intencional
  historical2024: number,
  historical2025: number
): { conservador: number; probable: number; optimista: number } {
  if (currentHour === 0) {
    const avg = (historical2024 + historical2025) / 2;
    return { conservador: Math.round(avg), probable: Math.round(avg), optimista: Math.round(avg) };
  }

  // Factor de rendimiento basado en progreso vs histórico
  const avgHistorical = (historical2024 + historical2025) / 2;
  
  // Asumimos una distribución aproximada (pico en horas de oficina)
  // Porcentaje acumulado aproximado hasta cada hora
  const hourlyProgress = [
    0.01, 0.02, 0.02, 0.02, 0.02, 0.03, 0.04, 0.06, 0.10, 0.16,
    0.24, 0.34, 0.45, 0.55, 0.64, 0.72, 0.79, 0.85, 0.89, 0.93,
    0.96, 0.98, 0.99, 1.0,
  ];

  const expectedProgress = hourlyProgress[Math.min(currentHour, 23)];
  const expectedTotal = avgHistorical > 0 ? currentTotal / expectedProgress : currentTotal * 2;

  const conservador = Math.round(expectedTotal * 0.9);
  const probable = Math.round(expectedTotal);
  const optimista = Math.round(expectedTotal * 1.1);

  return { conservador, probable, optimista };
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

// Obtener estadísticas weekday vs weekend
export const getWeekdayWeekendStats = query({
  handler: async (ctx) => {
    const allData = await ctx.db.query("dailyData").collect();

    const stats = {
      "2024": { weekday: 0, weekend: 0 },
      "2025": { weekday: 0, weekend: 0 },
      "2026": { weekday: 0, weekend: 0 },
    };

    for (const item of allData) {
      if (!item.isComplete) continue;
      const yearKey = item.year.toString() as YearType;
      const isWeekend = WEEKEND_DAYS[item.year]?.includes(item.day) ?? false;

      if (isWeekend) {
        stats[yearKey].weekend += item.events;
      } else {
        stats[yearKey].weekday += item.events;
      }
    }

    return stats;
  },
});

// Obtener estadísticas por período del mes
export const getPeriodStats = query({
  handler: async (ctx) => {
    const allData = await ctx.db.query("dailyData").collect();

    const stats = {
      "2024": { arranque: 0, medio: 0, cierre: 0 },
      "2025": { arranque: 0, medio: 0, cierre: 0 },
      "2026": { arranque: 0, medio: 0, cierre: 0 },
    };

    for (const item of allData) {
      if (!item.isComplete) continue;
      const yearKey = item.year.toString() as YearType;

      if (item.day <= 7) {
        stats[yearKey].arranque += item.events;
      } else if (item.day <= 14) {
        stats[yearKey].medio += item.events;
      } else {
        stats[yearKey].cierre += item.events;
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
