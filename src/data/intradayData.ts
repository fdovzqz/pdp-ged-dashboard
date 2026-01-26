// Datos intradía - Progreso del día actual vs histórico
// Solo se muestra si el día actual está incompleto (no incluido en historicalData)
import { 
  historicalData, 
  lastAvailableDay,
  hourlyDistributionWeekday,
  hourlyDistributionWeekend 
} from './historicalData';

export interface IntradayHourData {
  hour: number;
  events: number;
  cumulative: number;
}

export interface IntradayData {
  currentDay: number;
  currentHour: number;
  hoursRemaining: number;
  todayData: IntradayHourData[];
  historicalComparison: {
    '2024': number;
    '2025': number;
    '2026': number; // Total acumulado hasta ahora hoy
  };
  forecast: {
    conservador: number;
    probable: number;
    optimista: number;
  };
  statistics: {
    currentTotal: number;
    projectedTotal: number;
    vs2024: number;
    vs2025: number;
    averagePerHour: number;
    projectedEndOfDay: number;
  };
}

// Datos históricos completos para días 26-31 (del año anterior completo)
const historicalDataFull2024: Record<number, number> = {
  26: 1697, 27: 1028, 28: 815, 29: 3373, 30: 4318, 31: 6290,
};

const historicalDataFull2025: Record<number, number> = {
  26: 671, 27: 2003, 28: 2991, 29: 3116, 30: 3486, 31: 4639,
};

// Función para obtener datos históricos del mismo día
function getHistoricalDayData(day: number): { '2024': number; '2025': number } {
  // Primero buscar en los datos del 1-25
  const dayData = historicalData.find(d => d.day === day);
  if (dayData) {
    return {
      '2024': dayData['2024'],
      '2025': dayData['2025'],
    };
  }
  
  // Si no está en 1-25, buscar en los datos completos (26-31)
  return {
    '2024': historicalDataFull2024[day] || 0,
    '2025': historicalDataFull2025[day] || 0,
  };
}

// Función para calcular proyección basada en distribución horaria histórica
function calculateProjection(
  currentTotal: number,
  currentHour: number,
  historicalTotal: number,
  currentDay: number
): { conservador: number; probable: number; optimista: number } {
  if (currentHour === 0) {
    return { conservador: historicalTotal, probable: historicalTotal, optimista: historicalTotal };
  }

  // Determinar si el día actual es fin de semana o día de semana
  // Calcular día de la semana (0=Domingo, 1=Lunes, ..., 6=Sábado)
  const year = 2026;
  const month = 0; // Enero (0-indexed)
  const date = new Date(year, month, currentDay);
  const dayOfWeek = date.getDay();
  const isWeekend = dayOfWeek === 0 || dayOfWeek === 6; // Domingo o Sábado
  
  // Seleccionar distribución horaria apropiada
  const distribution = isWeekend ? hourlyDistributionWeekend : hourlyDistributionWeekday;
  
  // Calcular totales históricos hasta la hora actual y restantes
  const totalUntilNow2024 = distribution
    .filter(h => h.hour <= currentHour)
    .reduce((sum, h) => sum + h['2024'], 0);
  const totalUntilNow2025 = distribution
    .filter(h => h.hour <= currentHour)
    .reduce((sum, h) => sum + h['2025'], 0);
  
  const remainingHours2024 = distribution
    .filter(h => h.hour > currentHour)
    .reduce((sum, h) => sum + h['2024'], 0);
  const remainingHours2025 = distribution
    .filter(h => h.hour > currentHour)
    .reduce((sum, h) => sum + h['2025'], 0);
  
  // Calcular el factor de rendimiento actual vs histórico
  const avgHistoricalUntilNow = (totalUntilNow2024 + totalUntilNow2025) / 2;
  const performanceFactor = avgHistoricalUntilNow > 0 ? currentTotal / avgHistoricalUntilNow : 1;
  
  // Proyección conservadora: aplicar 90% del factor de rendimiento actual
  const avgRemainingHistorical = (remainingHours2024 + remainingHours2025) / 2;
  const conservador = currentTotal + (avgRemainingHistorical * performanceFactor * 0.9);
  
  // Proyección probable: aplicar factor de rendimiento actual completo
  const probable = currentTotal + (avgRemainingHistorical * performanceFactor);
  
  // Proyección optimista: aplicar 110% del factor de rendimiento actual
  const optimista = currentTotal + (avgRemainingHistorical * performanceFactor * 1.1);

  return {
    conservador: Math.round(conservador),
    probable: Math.round(probable),
    optimista: Math.round(optimista),
  };
}

// Función principal para obtener datos intradía
export function getIntradayData(todayHourlyData: IntradayHourData[] | null): IntradayData | null {
  // Obtener fecha actual en México (UTC-6)
  const now = new Date();
  const mexicoNow = new Date(now.getTime() - 6 * 60 * 60 * 1000);
  const currentDay = mexicoNow.getUTCDate();
  const currentHour = mexicoNow.getUTCHours();
  const currentMonth = mexicoNow.getUTCMonth();
  const currentYear = mexicoNow.getUTCFullYear();

  // Solo mostrar intradía si estamos en enero 2026 y el día actual no está completo
  if (currentYear !== 2026 || currentMonth !== 0 || currentDay <= lastAvailableDay) {
    return null;
  }

  // Si no hay datos del día actual, retornar null
  if (!todayHourlyData || todayHourlyData.length === 0) {
    return null;
  }

  // Calcular total acumulado hasta ahora
  const currentTotal = todayHourlyData.reduce((sum, h) => sum + h.events, 0);
  const hoursRemaining = 24 - currentHour - 1;

  // Obtener datos históricos del mismo día
  const historical = getHistoricalDayData(currentDay);
  const historical2024 = historical['2024'];
  const historical2025 = historical['2025'];

  // Calcular proyecciones
  const avgHistorical = (historical2024 + historical2025) / 2;
  const forecast = calculateProjection(currentTotal, currentHour, avgHistorical, currentDay);

  // Calcular estadísticas
  const averagePerHour = currentHour > 0 ? currentTotal / (currentHour + 1) : 0;
  const projectedEndOfDay = currentTotal + (averagePerHour * hoursRemaining);
  const vs2024 = historical2024 > 0 ? ((currentTotal / historical2024) - 1) * 100 : 0;
  const vs2025 = historical2025 > 0 ? ((currentTotal / historical2025) - 1) * 100 : 0;

  return {
    currentDay,
    currentHour,
    hoursRemaining,
    todayData: todayHourlyData,
    historicalComparison: {
      '2024': historical2024,
      '2025': historical2025,
      '2026': currentTotal,
    },
    forecast,
    statistics: {
      currentTotal,
      projectedTotal: Math.round(projectedEndOfDay),
      vs2024: Math.round(vs2024 * 10) / 10,
      vs2025: Math.round(vs2025 * 10) / 10,
      averagePerHour: Math.round(averagePerHour * 10) / 10,
      projectedEndOfDay: Math.round(projectedEndOfDay),
    },
  };
}

// Función helper para verificar si hay datos intradía disponibles
export function hasIntradayData(): boolean {
  const now = new Date();
  const mexicoNow = new Date(now.getTime() - 6 * 60 * 60 * 1000);
  const currentDay = mexicoNow.getUTCDate();
  const currentMonth = mexicoNow.getUTCMonth();
  const currentYear = mexicoNow.getUTCFullYear();

  return currentYear === 2026 && currentMonth === 0 && currentDay > lastAvailableDay;
}

// Función para obtener horas restantes formateadas
export function getHoursRemainingFormatted(): string {
  const now = new Date();
  const mexicoNow = new Date(now.getTime() - 6 * 60 * 60 * 1000);
  const currentHour = mexicoNow.getUTCHours();
  const hoursRemaining = 24 - currentHour - 1;
  
  if (hoursRemaining <= 0) {
    return 'Día completo';
  }
  
  return `${hoursRemaining} ${hoursRemaining === 1 ? 'hora' : 'horas'}`;
}
