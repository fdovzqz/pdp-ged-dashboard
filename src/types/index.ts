// Tipos base del dashboard

export interface DailyData {
  day: number;
  '2024': number;
  '2025': number;
  '2026': number;
}

export interface ForecastData {
  day: number;
  conservador: number;
  probable: number;
  optimista: number;
  actual?: number;
  '2024': number;
  '2025': number;
}

export type ForecastType = 'conservador' | 'probable' | 'optimista';
export type YearType = '2024' | '2025' | '2026';

export interface YearTotals {
  '2024': number;
  '2025': number;
  '2026': number;
}

export interface WeekdayStats {
  weekday: number;
  weekend: number;
}

export interface PeriodStats {
  arranque: number;
  medio: number;
  cierre: number;
}

export interface ForecastTotals {
  conservador: number;
  probable: number;
  optimista: number;
}

export interface HeatmapData {
  day: number;
  dayName: string;
  week: number;
  value: number;
  year: YearType;
}

export interface HourlyData {
  hour: number;
  label: string;
  '2024': number;
  '2025': number;
  '2026': number;
}

export interface TooltipPayload {
  color: string;
  name: string;
  value: number;
}

export interface KPICardProps {
  title: string;
  value: string;
  subtitle?: string;
  icon: React.ComponentType<{ size?: number; color?: string }>;
  trend?: 'up' | 'down';
  trendValue?: string;
  accent?: boolean;
}

export interface YearBadgeProps {
  year: string;
  color: string;
  active: boolean;
  onClick: () => void;
}

export interface ForecastBadgeProps {
  type: string;
  color: string;
  active: boolean;
  onClick: () => void;
}

// Colores del tema
export const YEAR_COLORS: Record<YearType, string> = {
  '2024': '#f472b6',
  '2025': '#8b5cf6',
  '2026': '#10b981',
};

export const FORECAST_COLORS: Record<ForecastType, string> = {
  conservador: '#f59e0b',
  probable: '#10b981',
  optimista: '#06b6d4',
};
