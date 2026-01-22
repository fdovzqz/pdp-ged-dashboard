import type { 
  DailyData, 
  YearType, 
  WeekdayStats, 
  PeriodStats, 
  ForecastData,
  HeatmapData,
  HourlyData,
  ServiceData
} from '../types';

// Datos históricos reales de Enero (Días 1-21) - Actualizados desde CSV (UTC-6 México)
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
  { day: 21, '2024': 279, '2025': 1341, '2026': 1557 },
];

// Totales hasta el día 21 - Actualizados desde CSV (UTC-6 México)
export const totals = {
  '2024': 20926,
  '2025': 25140,
  '2026': 28807,
};

// Promedios diarios
export const dailyAverages = {
  '2024': Math.round(totals['2024'] / 21),
  '2025': Math.round(totals['2025'] / 21),
  '2026': Math.round(totals['2026'] / 21),
};

// Días de fin de semana por año (hasta día 21)
// Enero 2024: Día 1 = Lunes -> Sáb=6,13,20 Dom=7,14,21
// Enero 2025: Día 1 = Miércoles -> Sáb=4,11,18 Dom=5,12,19
// Enero 2026: Día 1 = Jueves -> Sáb=3,10,17 Dom=4,11,18
export const weekendDays: Record<YearType, number[]> = {
  '2024': [6, 7, 13, 14, 20, 21], // Sáb: 6,13,20 | Dom: 7,14,21
  '2025': [4, 5, 11, 12, 18, 19], // Sáb: 4,11,18 | Dom: 5,12,19
  '2026': [3, 4, 10, 11, 17, 18], // Sáb: 3,10,17 | Dom: 4,11,18
};

// Calcular cantidad de días L-V y S-D hasta el día 21 para cada año
export const weekdayCount: Record<YearType, { weekdays: number; weekends: number }> = {
  '2024': { weekdays: 15, weekends: 6 }, // L-V: 15 días, S-D: 6 días
  '2025': { weekdays: 15, weekends: 6 }, // L-V: 15 días, S-D: 6 días
  '2026': { weekdays: 15, weekends: 6 }, // L-V: 15 días, S-D: 6 días
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

// Estadísticas por período del mes (solo hasta día 21)
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

// Datos históricos completos del mes (días 22-31 de años anteriores) - Actualizados desde CSV (UTC-6 México)
const historicalDataFull2024: Record<number, number> = {
  22: 1344, 23: 1629, 24: 2568, 25: 1483, 26: 1697,
  27: 1028, 28: 815, 29: 3373, 30: 4318, 31: 6290,
};

const historicalDataFull2025: Record<number, number> = {
  22: 1535, 23: 1387, 24: 1181, 25: 654, 26: 671,
  27: 2003, 28: 2991, 29: 3116, 30: 3486, 31: 4639,
};

// Calcular totales de días 22-31
const total2024Days22to31 = Object.values(historicalDataFull2024).reduce((a, b) => a + b, 0);
const total2025Days22to31 = Object.values(historicalDataFull2025).reduce((a, b) => a + b, 0);

// Totales completos de enero (días 1-31) - Actualizados desde CSV (UTC-6 México)
export const fullMonthTotals = {
  '2024': totals['2024'] + total2024Days22to31, // 20,926 + 24,545 = 45,471
  '2025': totals['2025'] + total2025Days22to31, // 25,140 + 21,663 = 46,803
};

// Generar proyecciones para días 22-31
export const generateForecast = (): ForecastData[] => {
  const result: ForecastData[] = [];

  // Agregar datos actuales (días 1-21)
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

  // Proyecciones para días 22-31 (basadas en datos reales de 2024 y 2025)
  // 2024: 22=1344, 23=1629, 24=2568, 25=1483, 26=1697, 27=1028, 28=815, 29=3373, 30=4318, 31=6290
  // 2025: 22=1535, 23=1387, 24=1181, 25=654, 26=671, 27=2003, 28=2991, 29=3116, 30=3486, 31=4639
  const baseProjections = [
    { day: 22, conservador: 1400, probable: 1600, optimista: 1850 },
    { day: 23, conservador: 1400, probable: 1650, optimista: 1900 },
    { day: 24, conservador: 1200, probable: 1800, optimista: 2600 },
    { day: 25, conservador: 700, probable: 1100, optimista: 1500 },
    { day: 26, conservador: 700, probable: 1200, optimista: 1700 },
    { day: 27, conservador: 1500, probable: 2200, optimista: 2800 },
    { day: 28, conservador: 2000, probable: 3200, optimista: 4000 },
    { day: 29, conservador: 3200, probable: 3800, optimista: 4500 },
    { day: 30, conservador: 3600, probable: 4500, optimista: 5500 },
    { day: 31, conservador: 4800, probable: 5800, optimista: 7000 },
  ];

  baseProjections.forEach((p) => {
    result.push({
      day: p.day,
      conservador: p.conservador,
      probable: p.probable,
      optimista: p.optimista,
      '2024': historicalDataFull2024[p.day],
      '2025': historicalDataFull2025[p.day],
    });
  });

  return result;
};

// Calcular totales de proyección
export const calculateForecastTotals = (forecastData: ForecastData[]) => {
  return {
    conservador:
      totals['2026'] +
      forecastData.slice(21).reduce((sum, d) => sum + d.conservador, 0),
    probable:
      totals['2026'] +
      forecastData.slice(21).reduce((sum, d) => sum + d.probable, 0),
    optimista:
      totals['2026'] +
      forecastData.slice(21).reduce((sum, d) => sum + d.optimista, 0),
  };
};

// Crecimiento
export const growth25vs26 = ((totals['2026'] / totals['2025'] - 1) * 100).toFixed(1);
export const growth24vs26 = ((totals['2026'] / totals['2024'] - 1) * 100).toFixed(1);
export const growth24vs25 = (((totals['2025'] - totals['2024']) / totals['2024']) * 100).toFixed(1);

// Datos para el gráfico de barras comparativo
export const comparisonData = [
  { name: '2024', eventos: totals['2024'], fill: '#f472b6' },
  { name: '2025', eventos: totals['2025'], fill: '#8b5cf6' },
  { name: '2026', eventos: totals['2026'], fill: '#10b981' },
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

// Datos de distribución por hora - Actualizados desde CSV (UTC-6 México, días 1-21)
export const hourlyDistribution: HourlyData[] = [
  { hour: 0, label: '12am', '2024': 121, '2025': 156, '2026': 314 },
  { hour: 1, label: '1am', '2024': 44, '2025': 49, '2026': 300 },
  { hour: 2, label: '2am', '2024': 22, '2025': 25, '2026': 34 },
  { hour: 3, label: '3am', '2024': 2, '2025': 58, '2026': 21 },
  { hour: 4, label: '4am', '2024': 6, '2025': 15, '2026': 13 },
  { hour: 5, label: '5am', '2024': 6, '2025': 14, '2026': 25 },
  { hour: 6, label: '6am', '2024': 12, '2025': 54, '2026': 57 },
  { hour: 7, label: '7am', '2024': 93, '2025': 186, '2026': 190 },
  { hour: 8, label: '8am', '2024': 388, '2025': 714, '2026': 739 },
  { hour: 9, label: '9am', '2024': 1047, '2025': 1396, '2026': 1502 },
  { hour: 10, label: '10am', '2024': 1760, '2025': 1908, '2026': 2145 },
  { hour: 11, label: '11am', '2024': 2174, '2025': 2490, '2026': 2734 },
  { hour: 12, label: '12pm', '2024': 2334, '2025': 2588, '2026': 3010 },
  { hour: 13, label: '1pm', '2024': 2194, '2025': 2479, '2026': 2655 },
  { hour: 14, label: '2pm', '2024': 1978, '2025': 1928, '2026': 2416 },
  { hour: 15, label: '3pm', '2024': 1720, '2025': 1734, '2026': 2086 },
  { hour: 16, label: '4pm', '2024': 1524, '2025': 1821, '2026': 1987 },
  { hour: 17, label: '5pm', '2024': 1210, '2025': 1728, '2026': 2149 },
  { hour: 18, label: '6pm', '2024': 1000, '2025': 1396, '2026': 1662 },
  { hour: 19, label: '7pm', '2024': 907, '2025': 1282, '2026': 1397 },
  { hour: 20, label: '8pm', '2024': 843, '2025': 1113, '2026': 1246 },
  { hour: 21, label: '9pm', '2024': 690, '2025': 1010, '2026': 1082 },
  { hour: 22, label: '10pm', '2024': 548, '2025': 685, '2026': 694 },
  { hour: 23, label: '11pm', '2024': 303, '2025': 311, '2026': 349 },
];

// Top servicios (datos simulados)
export const topServices: ServiceData[] = [
  { 
    name: 'Tenencia Vehicular', 
    transactions: 8542, 
    amount: 12500000, 
    growth: 28.5,
    icon: '🚗'
  },
  { 
    name: 'Predial', 
    transactions: 6234, 
    amount: 8900000, 
    growth: 22.3,
    icon: '🏠'
  },
  { 
    name: 'Licencias de Conducir', 
    transactions: 4521, 
    amount: 3200000, 
    growth: 35.2,
    icon: '🪪'
  },
  { 
    name: 'Actas de Nacimiento', 
    transactions: 3876, 
    amount: 1500000, 
    growth: 18.7,
    icon: '📄'
  },
  { 
    name: 'Agua Potable', 
    transactions: 2908, 
    amount: 4200000, 
    growth: 15.4,
    icon: '💧'
  },
];

// Métricas adicionales
export const additionalMetrics = {
  successRate: 98.7,
  avgProcessingTime: 2.3, // segundos
  totalAmount: 45800000, // pesos
  uniqueUsers: 18234,
  returningUsers: 67.8, // porcentaje
};

// Calcular el máximo valor para el heatmap
export const getMaxHeatmapValue = (year: YearType): number => {
  return Math.max(...historicalData.map(d => d[year]));
};

// Calcular intensidad del color para heatmap (0-1)
export const getHeatmapIntensity = (value: number, max: number): number => {
  return Math.min(value / max, 1);
};
