import type { 
  DailyData, 
  YearType, 
  WeekdayStats, 
  PeriodStats, 
  ForecastData,
  HeatmapData,
  HourlyData,
} from '../types';

// Datos históricos reales de Enero (Días 1-25) - Actualizados desde CSV (UTC-6 México)
export const historicalData: DailyData[] = [
  { day: 1, '2024': 8, '2025': 180, '2026': 454 },
  { day: 2, '2024': 724, '2025': 1492, '2026': 2147 },
  { day: 3, '2024': 1083, '2025': 1329, '2026': 941 },
  { day: 4, '2024': 746, '2025': 853, '2026': 795 },
  { day: 5, '2024': 1259, '2025': 460, '2026': 2168 },
  { day: 6, '2024': 577, '2025': 1461, '2026': 1854 },
  { day: 7, '2024': 395, '2025': 1441, '2026': 1822 },
  { day: 8, '2024': 1298, '2025': 1532, '2026': 1709 },
  { day: 9, '2024': 1342, '2025': 1540, '2026': 1474 },
  { day: 10, '2024': 1044, '2025': 1285, '2026': 730 },
  { day: 11, '2024': 1269, '2025': 635, '2026': 565 },
  { day: 12, '2024': 1133, '2025': 652, '2026': 1503 },
  { day: 13, '2024': 535, '2025': 1968, '2026': 1457 },
  { day: 14, '2024': 402, '2025': 1877, '2026': 1651 },
  { day: 15, '2024': 1618, '2025': 1877, '2026': 1711 },
  { day: 16, '2024': 1867, '2025': 1625, '2026': 1478 },
  { day: 17, '2024': 2583, '2025': 1222, '2026': 519 },
  { day: 18, '2024': 1291, '2025': 579, '2026': 423 },
  { day: 19, '2024': 1027, '2025': 501, '2026': 1222 },
  { day: 20, '2024': 446, '2025': 1290, '2026': 2627 },
  { day: 21, '2024': 279, '2025': 1341, '2026': 1909 },
  { day: 22, '2024': 1344, '2025': 1535, '2026': 1904 },
  { day: 23, '2024': 1629, '2025': 1387, '2026': 1650 },
  { day: 24, '2024': 2568, '2025': 1181, '2026': 992 },
  { day: 25, '2024': 1483, '2025': 654, '2026': 865 },
];

// Totales hasta el día 25 - Actualizados desde CSV (UTC-6 México)
export const totals = {
  '2024': 27950,
  '2025': 29897,
  '2026': 34570,
};

// Promedios diarios
export const dailyAverages = {
  '2024': Math.round(totals['2024'] / 25),
  '2025': Math.round(totals['2025'] / 25),
  '2026': Math.round(totals['2026'] / 25),
};

// Días de fin de semana por año (hasta día 25)
// Enero 2024: Día 1 = Lunes -> Sáb=6,13,20 Dom=7,14,21
// Enero 2025: Día 1 = Miércoles -> Sáb=4,11,18 Dom=5,12,19
// Enero 2026: Día 1 = Jueves -> Sáb=3,10,17 Dom=4,11,18
export const weekendDays: Record<YearType, number[]> = {
  '2024': [6, 7, 13, 14, 20, 21], // Sáb: 6,13,20 | Dom: 7,14,21
  '2025': [4, 5, 11, 12, 18, 19], // Sáb: 4,11,18 | Dom: 5,12,19
  '2026': [3, 4, 10, 11, 17, 18], // Sáb: 3,10,17 | Dom: 4,11,18
};

// Calcular cantidad de días L-V y S-D hasta el día 25 para cada año
export const weekdayCount: Record<YearType, { weekdays: number; weekends: number }> = {
  '2024': { weekdays: 19, weekends: 6 }, // L-V: 19 días, S-D: 6 días (día 25 es jueves)
  '2025': { weekdays: 19, weekends: 6 }, // L-V: 19 días, S-D: 6 días (día 25 es sábado)
  '2026': { weekdays: 19, weekends: 6 }, // L-V: 19 días, S-D: 6 días (día 25 es domingo)
};

// Nombres de días de la semana
const dayNames = ['Dom', 'Lun', 'Mar', 'Mié', 'Jue', 'Vie', 'Sáb'];

// Mapeo de día del mes a día de la semana para cada año
// Enero 2024: Lunes=1
// Enero 2025: Miércoles=1
// Enero 2026: Jueves=1
const getStartDayOfWeek = (year: YearType): number => {
  const startDays: Record<YearType, number> = {
    '2024': 1, // Lunes
    '2025': 3, // Miércoles
    '2026': 4, // Jueves
  };
  return startDays[year];
};

// Estadísticas por temporalidad (L-V vs S-D)
export const calculateWeekdayStats = (): Record<YearType, WeekdayStats> => {
  const stats: Record<string, WeekdayStats> = {};

  (['2024', '2025', '2026'] as const).forEach((year) => {
    let weekdayTotal = 0;
    let weekendTotal = 0;

    historicalData.forEach((d) => {
      if (weekendDays[year].includes(d.day)) {
        weekendTotal += d[year];
      } else {
        weekdayTotal += d[year];
      }
    });

    stats[year] = { weekday: weekdayTotal, weekend: weekendTotal };
  });

  return stats as Record<YearType, WeekdayStats>;
};

// Estadísticas por período del mes (hasta día 25)
// Arranque: días 1-7, Medio: días 8-14, Cierre: días 15-21
export const calculatePeriodStats = (): Record<YearType, PeriodStats> => {
  const stats: Record<string, PeriodStats> = {};

  (['2024', '2025', '2026'] as const).forEach((year) => {
    let arranque = 0;
    let medio = 0;
    let cierre = 0;

    historicalData.forEach((d) => {
      if (d.day <= 7) {
        arranque += d[year];
      } else if (d.day <= 14) {
        medio += d[year];
      } else {
        cierre += d[year];
      }
    });

    stats[year] = { arranque, medio, cierre };
  });

  return stats as Record<YearType, PeriodStats>;
};

// Datos históricos completos del mes (días 23-31 de años anteriores) - Actualizados desde CSV (UTC-6 México)
const historicalDataFull2024: Record<number, number> = {
  23: 1629, 24: 2568, 25: 1483, 26: 1697,
  27: 1028, 28: 815, 29: 3373, 30: 4318, 31: 6290,
};

const historicalDataFull2025: Record<number, number> = {
  23: 1387, 24: 1181, 25: 654, 26: 671,
  27: 2003, 28: 2991, 29: 3116, 30: 3486, 31: 4639,
};

// Calcular totales de días 26-31 (solo los días que faltan después del último día disponible)
const total2024Days26to31 = [26, 27, 28, 29, 30, 31]
  .map(day => historicalDataFull2024[day] || 0)
  .reduce((a, b) => a + b, 0);
const total2025Days26to31 = [26, 27, 28, 29, 30, 31]
  .map(day => historicalDataFull2025[day] || 0)
  .reduce((a, b) => a + b, 0);

// Totales completos de enero (días 1-31) - Actualizados desde CSV (UTC-6 México)
// totals ya incluye días 1-25, solo sumamos días 26-31
export const fullMonthTotals = {
  '2024': totals['2024'] + total2024Days26to31,
  '2025': totals['2025'] + total2025Days26to31,
};

// Calcular factor de crecimiento de 2026 vs años anteriores (basado en días 1-25)
const calculateGrowthFactor = (): number => {
  const avg2024_2025 = (totals['2024'] + totals['2025']) / 2;
  return totals['2026'] / avg2024_2025;
};

// Determinar si un día es fin de semana en 2026
// Enero 2026: Día 1 = Jueves -> Sáb=3,10,17,24,31 | Dom=4,11,18,25
const isWeekend2026 = (day: number): boolean => {
  const weekendDays2026 = [3, 4, 10, 11, 17, 18, 24, 25, 31];
  return weekendDays2026.includes(day);
};

// Interface para proyecciones intradía
interface IntradayProjection {
  day: number;
  conservador: number;
  probable: number;
  optimista: number;
}

// Generar proyecciones DINÁMICAS para días 26-31
// Basadas en: históricos reales + factor de crecimiento de 2026 + día de la semana
// Si hay proyección intradía disponible para el día actual, la usa en lugar de la estática
export const generateForecast = (intradayProjection?: IntradayProjection | null): ForecastData[] => {
  const result: ForecastData[] = [];
  const growthFactor = calculateGrowthFactor(); // ~1.19 (2026 crece ~19% vs promedio 2024-2025)

  // Agregar datos actuales (días 1-25)
  historicalData.forEach((d) => {
    result.push({
      day: d.day,
      conservador: d['2026'],
      probable: d['2026'],
      optimista: d['2026'],
      actual: d['2026'],
      '2024': d['2024'],
      '2025': d['2025'],
    });
  });

  // Proyecciones dinámicas para días 26-31
  // Basadas en promedio histórico × factor de crecimiento
  for (let day = 26; day <= 31; day++) {
    const hist2024 = historicalDataFull2024[day] || 0;
    const hist2025 = historicalDataFull2025[day] || 0;
    
    // Si hay proyección intradía para este día específico, usarla
    if (intradayProjection && intradayProjection.day === day) {
      result.push({
        day,
        conservador: intradayProjection.conservador,
        probable: intradayProjection.probable,
        optimista: intradayProjection.optimista,
        '2024': hist2024,
        '2025': hist2025,
      });
      continue;
    }
    
    // Promedio histórico del día específico
    const avgHistorical = (hist2024 + hist2025) / 2;
    
    // Aplicar factor de crecimiento de 2026
    const baseProjection = Math.round(avgHistorical * growthFactor);
    
    // Ajustar por día de la semana si es necesario
    // Los fines de semana tienden a ser más bajos
    const isWeekend = isWeekend2026(day);
    const weekendAdjustment = isWeekend ? 0.85 : 1.0; // Fines de semana ~15% menos
    
    // Calcular proyecciones con variabilidad
    const probable = Math.round(baseProjection * weekendAdjustment);
    const conservador = Math.round(probable * 0.85); // 15% menos
    const optimista = Math.round(probable * 1.15);   // 15% más
    
    result.push({
      day,
      conservador,
      probable,
      optimista,
      '2024': hist2024,
      '2025': hist2025,
    });
  }

  return result;
};

// Calcular totales de proyección
export const calculateForecastTotals = (forecastData: ForecastData[]) => {
  // Solo sumar proyecciones desde el día 26 en adelante (índice 25)
  return {
    conservador:
      totals['2026'] +
      forecastData.slice(25).reduce((sum, d) => sum + d.conservador, 0),
    probable:
      totals['2026'] +
      forecastData.slice(25).reduce((sum, d) => sum + d.probable, 0),
    optimista:
      totals['2026'] +
      forecastData.slice(25).reduce((sum, d) => sum + d.optimista, 0),
  };
};

// Crecimiento
export const growth25vs26 = ((totals['2026'] / totals['2025'] - 1) * 100).toFixed(1);
export const growth24vs26 = ((totals['2026'] / totals['2024'] - 1) * 100).toFixed(1);
export const growth24vs25 = (((totals['2025'] - totals['2024']) / totals['2024']) * 100).toFixed(1);

// Datos para el gráfico de barras comparativo
export const comparisonData = [
  { name: '2024', pagos: totals['2024'], fill: '#f472b6' },
  { name: '2025', pagos: totals['2025'], fill: '#8b5cf6' },
  { name: '2026', pagos: totals['2026'], fill: '#10b981' },
];

// Generar datos para heatmap semanal
export const generateHeatmapData = (year: YearType): HeatmapData[] => {
  const data: HeatmapData[] = [];
  const startDay = getStartDayOfWeek(year);

  historicalData.forEach((d) => {
    const dayOfWeek = (startDay + d.day - 1) % 7;
    const week = Math.ceil((d.day + startDay - 1) / 7);
    
    data.push({
      day: d.day,
      dayName: dayNames[dayOfWeek],
      week,
      value: d[year],
      year,
    });
  });

  return data;
};

// Datos de distribución por hora - Actualizados desde CSV (UTC-6 México, días 1-25)
export const hourlyDistribution: HourlyData[] = [
  { hour: 0, label: '12am', '2024': 133, '2025': 185, '2026': 340 },
  { hour: 1, label: '1am', '2024': 50, '2025': 61, '2026': 321 },
  { hour: 2, label: '2am', '2024': 22, '2025': 32, '2026': 42 },
  { hour: 3, label: '3am', '2024': 3, '2025': 60, '2026': 23 },
  { hour: 4, label: '4am', '2024': 9, '2025': 20, '2026': 14 },
  { hour: 5, label: '5am', '2024': 9, '2025': 22, '2026': 35 },
  { hour: 6, label: '6am', '2024': 27, '2025': 63, '2026': 63 },
  { hour: 7, label: '7am', '2024': 136, '2025': 232, '2026': 220 },
  { hour: 8, label: '8am', '2024': 546, '2025': 825, '2026': 880 },
  { hour: 9, label: '9am', '2024': 1418, '2025': 1639, '2026': 1748 },
  { hour: 10, label: '10am', '2024': 2228, '2025': 2282, '2026': 2549 },
  { hour: 11, label: '11am', '2024': 2838, '2025': 2951, '2026': 3260 },
  { hour: 12, label: '12pm', '2024': 3062, '2025': 3068, '2026': 3544 },
  { hour: 13, label: '1pm', '2024': 3174, '2025': 2978, '2026': 3121 },
  { hour: 14, label: '2pm', '2024': 2455, '2025': 2343, '2026': 2799 },
  { hour: 15, label: '3pm', '2024': 2156, '2025': 2107, '2026': 2600 },
  { hour: 16, label: '4pm', '2024': 2460, '2025': 2143, '2026': 2375 },
  { hour: 17, label: '5pm', '2024': 1624, '2025': 2016, '2026': 2462 },
  { hour: 18, label: '6pm', '2024': 1319, '2025': 1649, '2026': 1994 },
  { hour: 19, label: '7pm', '2024': 1176, '2025': 1548, '2026': 1771 },
  { hour: 20, label: '8pm', '2024': 1091, '2025': 1327, '2026': 1618 },
  { hour: 21, label: '9pm', '2024': 922, '2025': 1154, '2026': 1413 },
  { hour: 22, label: '10pm', '2024': 702, '2025': 809, '2026': 916 },
  { hour: 23, label: '11pm', '2024': 390, '2025': 383, '2026': 462 },
];

// Distribución horaria para días de semana (L-V) - Actualizados desde CSV (UTC-6 México, días 1-25)
export const hourlyDistributionWeekday: HourlyData[] = [
  { hour: 0, label: '12am', '2024': 105, '2025': 153, '2026': 303 },
  { hour: 1, label: '1am', '2024': 34, '2025': 44, '2026': 293 },
  { hour: 2, label: '2am', '2024': 13, '2025': 28, '2026': 22 },
  { hour: 3, label: '3am', '2024': 3, '2025': 58, '2026': 17 },
  { hour: 4, label: '4am', '2024': 7, '2025': 14, '2026': 11 },
  { hour: 5, label: '5am', '2024': 6, '2025': 20, '2026': 32 },
  { hour: 6, label: '6am', '2024': 23, '2025': 56, '2026': 52 },
  { hour: 7, label: '7am', '2024': 126, '2025': 215, '2026': 192 },
  { hour: 8, label: '8am', '2024': 504, '2025': 754, '2026': 795 },
  { hour: 9, label: '9am', '2024': 1327, '2025': 1522, '2026': 1560 },
  { hour: 10, label: '10am', '2024': 2049, '2025': 2089, '2026': 2255 },
  { hour: 11, label: '11am', '2024': 2593, '2025': 2634, '2026': 2743 },
  { hour: 12, label: '12pm', '2024': 2782, '2025': 2695, '2026': 2939 },
  { hour: 13, label: '1pm', '2024': 2909, '2025': 2609, '2026': 2557 },
  { hour: 14, label: '2pm', '2024': 2229, '2025': 2069, '2026': 2241 },
  { hour: 15, label: '3pm', '2024': 1957, '2025': 1823, '2026': 2144 },
  { hour: 16, label: '4pm', '2024': 2304, '2025': 1812, '2026': 1999 },
  { hour: 17, label: '5pm', '2024': 1460, '2025': 1768, '2026': 2077 },
  { hour: 18, label: '6pm', '2024': 1157, '2025': 1426, '2026': 1641 },
  { hour: 19, label: '7pm', '2024': 1058, '2025': 1328, '2026': 1385 },
  { hour: 20, label: '8pm', '2024': 928, '2025': 1137, '2026': 1233 },
  { hour: 21, label: '9pm', '2024': 811, '2025': 960, '2026': 1150 },
  { hour: 22, label: '10pm', '2024': 590, '2025': 684, '2026': 735 },
  { hour: 23, label: '11pm', '2024': 341, '2025': 319, '2026': 364 },
];

// Distribución horaria para fines de semana (S-D) - Actualizados desde CSV (UTC-6 México, días 1-25)
export const hourlyDistributionWeekend: HourlyData[] = [
  { hour: 0, label: '12am', '2024': 28, '2025': 32, '2026': 37 },
  { hour: 1, label: '1am', '2024': 16, '2025': 17, '2026': 28 },
  { hour: 2, label: '2am', '2024': 9, '2025': 4, '2026': 20 },
  { hour: 3, label: '3am', '2024': 0, '2025': 2, '2026': 6 },
  { hour: 4, label: '4am', '2024': 2, '2025': 6, '2026': 3 },
  { hour: 5, label: '5am', '2024': 3, '2025': 2, '2026': 3 },
  { hour: 6, label: '6am', '2024': 4, '2025': 7, '2026': 11 },
  { hour: 7, label: '7am', '2024': 10, '2025': 17, '2026': 28 },
  { hour: 8, label: '8am', '2024': 42, '2025': 71, '2026': 85 },
  { hour: 9, label: '9am', '2024': 91, '2025': 117, '2026': 188 },
  { hour: 10, label: '10am', '2024': 179, '2025': 193, '2026': 294 },
  { hour: 11, label: '11am', '2024': 245, '2025': 317, '2026': 517 },
  { hour: 12, label: '12pm', '2024': 280, '2025': 373, '2026': 605 },
  { hour: 13, label: '1pm', '2024': 265, '2025': 369, '2026': 564 },
  { hour: 14, label: '2pm', '2024': 226, '2025': 274, '2026': 558 },
  { hour: 15, label: '3pm', '2024': 199, '2025': 284, '2026': 456 },
  { hour: 16, label: '4pm', '2024': 156, '2025': 331, '2026': 376 },
  { hour: 17, label: '5pm', '2024': 164, '2025': 248, '2026': 385 },
  { hour: 18, label: '6pm', '2024': 162, '2025': 223, '2026': 353 },
  { hour: 19, label: '7pm', '2024': 118, '2025': 220, '2026': 386 },
  { hour: 20, label: '8pm', '2024': 163, '2025': 190, '2026': 385 },
  { hour: 21, label: '9pm', '2024': 111, '2025': 194, '2026': 263 },
  { hour: 22, label: '10pm', '2024': 112, '2025': 125, '2026': 181 },
  { hour: 23, label: '11pm', '2024': 49, '2025': 64, '2026': 98 },
];

// Calcular el máximo valor para el heatmap
export const getMaxHeatmapValue = (year: YearType): number => {
  return Math.max(...historicalData.map(d => d[year]));
};

// Calcular intensidad del color para heatmap (0-1)
export const getHeatmapIntensity = (value: number, max: number): number => {
  return Math.min(value / max, 1);
};

// ========== METADATA DINÁMICO (calculado automáticamente) ==========

// Calcular dinámicamente el último día disponible
export const lastAvailableDay = historicalData[historicalData.length - 1].day;

// Calcular el total de días disponibles
export const totalDaysAvailable = historicalData.length;

// Calcular días restantes del mes
export const remainingDays = 31 - lastAvailableDay;

// Calcular dinámicamente weekday/weekend counts
export const calculateDynamicWeekdayCount = (year: YearType): { weekdays: number; weekends: number } => {
  const weekdayDays = historicalData.filter(d => !weekendDays[year].includes(d.day)).length;
  const weekendDaysCount = historicalData.filter(d => weekendDays[year].includes(d.day)).length;
  return { weekdays: weekdayDays, weekends: weekendDaysCount };
};

// Calcular dinámicamente los rangos de períodos
export const calculatePeriodRanges = (): { arranque: number[]; medio: number[]; cierre: number[] } => {
  // Primera semana: días 1-7
  const arranqueEnd = Math.min(7, lastAvailableDay);
  const arranque = Array.from({ length: arranqueEnd }, (_, i) => i + 1);
  
  // Segunda semana: días 8-14
  const medioStart = 8;
  const medioEnd = Math.min(14, lastAvailableDay);
  const medio = medioStart <= lastAvailableDay 
    ? Array.from({ length: Math.max(0, medioEnd - medioStart + 1) }, (_, i) => i + medioStart)
    : [];
  
  // Tercera semana en adelante: días 15+
  const cierreStart = 15;
  const cierre = cierreStart <= lastAvailableDay
    ? Array.from({ length: lastAvailableDay - cierreStart + 1 }, (_, i) => i + cierreStart)
    : [];
  
  return { arranque, medio, cierre };
};

// Encontrar el máximo histórico de todos los años
export const getHistoricalMax = (): { value: number; day: number; year: YearType } => {
  let max = { value: 0, day: 1, year: '2024' as YearType };
  
  // Buscar en datos disponibles del mes actual
  historicalData.forEach(d => {
    (['2024', '2025', '2026'] as const).forEach(year => {
      if (d[year] > max.value) {
        max = { value: d[year], day: d.day, year };
      }
    });
  });
  
  // También verificar datos completos de meses anteriores
  Object.entries(historicalDataFull2024).forEach(([day, value]) => {
    if (value > max.value) {
      max = { value, day: parseInt(day), year: '2024' };
    }
  });
  
  Object.entries(historicalDataFull2025).forEach(([day, value]) => {
    if (value > max.value) {
      max = { value, day: parseInt(day), year: '2025' };
    }
  });
  
  return max;
};

// Formatear fecha en español
export const formatDayMonth = (day: number, month: string = 'Enero'): string => {
  return `${day} de ${month}`;
};
