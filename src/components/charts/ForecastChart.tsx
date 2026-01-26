import { useMemo, useState, memo } from 'react';
import { motion } from 'framer-motion';
import {
  AreaChart,
  Area,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  ReferenceLine,
} from 'recharts';
import { Target, Shield, Zap, TrendingUp, BarChart2 } from 'lucide-react';
import { ForecastBadge, YearBadge, CustomTooltip } from '../ui';
import { generateForecast, calculateForecastTotals, fullMonthTotals, lastAvailableDay } from '../../data/historicalData';
import { getIntradayData } from '../../data/intradayData';
import { todayIntradayData } from '../../data/today-intraday';
import { FORECAST_COLORS, YEAR_COLORS, type ForecastType, type YearType } from '../../types';

type ViewMode = 'daily' | 'accumulated';

interface ForecastChartProps {
  activeForecast: ForecastType[];
  onToggleForecast: (type: ForecastType) => void;
  activeYears: YearType[];
  onToggleYear: (year: YearType) => void;
}

export const ForecastChart = memo(function ForecastChart({ activeForecast, onToggleForecast, activeYears, onToggleYear }: ForecastChartProps) {
  const [viewMode, setViewMode] = useState<ViewMode>('accumulated');
  
  // Obtener proyección intradía si está disponible
  const intradayProjection = useMemo(() => {
    const intradayData = getIntradayData(todayIntradayData);
    if (intradayData) {
      return {
        day: intradayData.currentDay,
        conservador: intradayData.forecast.conservador,
        probable: intradayData.forecast.probable,
        optimista: intradayData.forecast.optimista,
      };
    }
    return null;
  }, []);
  
  // Pasar proyección intradía a generateForecast para sincronizar
  const forecastData = useMemo(() => generateForecast(intradayProjection), [intradayProjection]);
  const forecastTotals = useMemo(() => calculateForecastTotals(forecastData), [forecastData]);

  // Calculate accumulated data
  const accumulatedData = useMemo(() => {
    let acc2024 = 0;
    let acc2025 = 0;
    let accActual = 0;
    let accConservador = 0;
    let accProbable = 0;
    let accOptimista = 0;

    return forecastData.map((d) => {
      acc2024 += d['2024'] ?? 0;
      acc2025 += d['2025'] ?? 0;
      accActual += d.actual ?? 0;
      accConservador += d.conservador ?? 0;
      accProbable += d.probable ?? 0;
      accOptimista += d.optimista ?? 0;
      return {
        day: d.day,
        '2024': acc2024,
        '2025': acc2025,
        actual: d.actual !== null ? accActual : null,
        conservador: accConservador,
        probable: accProbable,
        optimista: accOptimista,
      };
    });
  }, [forecastData]);

  const chartData = viewMode === 'daily' ? forecastData : accumulatedData;

  return (
    <motion.div
      initial={{ opacity: 0, y: 30 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.6, delay: 0.4 }}
      className="bg-linear-to-br from-slate-800/60 to-slate-900/60 backdrop-blur-sm rounded-3xl border border-slate-700/50 p-6"
    >
      <div className="flex flex-col sm:flex-row flex-wrap items-start sm:items-center justify-between gap-3 sm:gap-4 mb-6">
        <div>
          <h3 className="text-xl font-bold text-white flex items-center gap-2 font-display">
            <Target size={20} className="text-amber-500" />
            Proyección de Cierre de Mes
          </h3>
          <p className="text-sm text-slate-400 mt-1">
            {viewMode === 'daily' ? 'Pagos diarios' : 'Pagos acumulados'} · Forecast para días {lastAvailableDay + 1}-31
          </p>
        </div>
        
        <div className="flex flex-wrap items-center gap-2 sm:gap-4">
          {/* View Mode Toggle */}
          <div className="flex rounded-xl overflow-hidden border border-slate-600">
            <button
              onClick={() => setViewMode('daily')}
              className={`flex items-center gap-1 sm:gap-1.5 px-2 sm:px-3 py-1.5 text-xs sm:text-sm font-medium transition-all ${
                viewMode === 'daily'
                  ? 'bg-amber-500/20 text-amber-400'
                  : 'bg-slate-700/50 text-slate-400 hover:text-slate-300'
              }`}
            >
              <BarChart2 size={14} />
              <span className="hidden xs:inline">Diario</span>
            </button>
            <button
              onClick={() => setViewMode('accumulated')}
              className={`flex items-center gap-1 sm:gap-1.5 px-2 sm:px-3 py-1.5 text-xs sm:text-sm font-medium transition-all ${
                viewMode === 'accumulated'
                  ? 'bg-amber-500/20 text-amber-400'
                  : 'bg-slate-700/50 text-slate-400 hover:text-slate-300'
              }`}
            >
              <TrendingUp size={14} />
              <span className="hidden xs:inline">Acumulado</span>
            </button>
          </div>

          <div className="hidden sm:block w-px h-6 bg-slate-600" />

          {/* Year toggles */}
          <div className="flex flex-wrap gap-1 sm:gap-2">
            {(['2024', '2025'] as YearType[]).map((year) => (
              <YearBadge
                key={year}
                year={year}
                color={YEAR_COLORS[year]}
                active={activeYears.includes(year)}
                onClick={() => onToggleYear(year)}
              />
            ))}
          </div>
          
          <div className="hidden sm:block w-px h-6 bg-slate-600" />
          
          {/* Forecast toggles */}
          <div className="flex flex-wrap gap-1 sm:gap-2">
            {(Object.keys(FORECAST_COLORS) as ForecastType[]).map((type) => (
              <ForecastBadge
                key={type}
                type={type}
                color={FORECAST_COLORS[type]}
                active={activeForecast.includes(type)}
                onClick={() => onToggleForecast(type)}
              />
            ))}
          </div>
        </div>
      </div>

      <div className="h-[400px] w-full">
        <ResponsiveContainer width="100%" height="100%">
          <AreaChart
            data={chartData}
            margin={{ top: 20, right: 30, left: 0, bottom: 0 }}
          >
            <defs>
              <linearGradient id="gradientConservador" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor="#f59e0b" stopOpacity={0.3} />
                <stop offset="100%" stopColor="#f59e0b" stopOpacity={0} />
              </linearGradient>
              <linearGradient id="gradientProbable" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor="#10b981" stopOpacity={0.3} />
                <stop offset="100%" stopColor="#10b981" stopOpacity={0} />
              </linearGradient>
              <linearGradient id="gradientOptimista" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor="#06b6d4" stopOpacity={0.3} />
                <stop offset="100%" stopColor="#06b6d4" stopOpacity={0} />
              </linearGradient>
            </defs>
            
            <CartesianGrid strokeDasharray="3 3" stroke="#334155" vertical={false} />
            
            <XAxis
              dataKey="day"
              tick={{ fontSize: 12, fill: '#94a3b8' }}
              axisLine={false}
              tickLine={false}
              tickMargin={10}
            />
            
            <YAxis
              tick={{ fontSize: 12, fill: '#94a3b8' }}
              axisLine={false}
              tickLine={false}
              tickMargin={10}
            />
            
            <Tooltip content={<CustomTooltip />} />
            
            <ReferenceLine
              x={lastAvailableDay}
              stroke="#fbbf24"
              strokeDasharray="5 5"
              label={{
                value: 'Hoy',
                fill: '#fbbf24',
                fontSize: 12,
                position: 'top',
              }}
            />

            {/* Años históricos primero (líneas sólidas) */}
            {activeYears.includes('2024') && (
              <Line
                name="2024"
                type="monotone"
                dataKey="2024"
                stroke={YEAR_COLORS['2024']}
                strokeWidth={2}
                dot={false}
              />
            )}
            
            {activeYears.includes('2025') && (
              <Line
                name="2025"
                type="monotone"
                dataKey="2025"
                stroke={YEAR_COLORS['2025']}
                strokeWidth={2}
                dot={false}
              />
            )}

            {/* Forecasts después (líneas punteadas más gruesas) */}
            {activeForecast.includes('conservador') && (
              <Area
                name="Conservador"
                type="monotone"
                dataKey="conservador"
                stroke={FORECAST_COLORS.conservador}
                strokeWidth={3}
                strokeDasharray="8 4"
                fill="url(#gradientConservador)"
              />
            )}
            
            {activeForecast.includes('probable') && (
              <Area
                name="Probable"
                type="monotone"
                dataKey="probable"
                stroke={FORECAST_COLORS.probable}
                strokeWidth={3}
                strokeDasharray="8 4"
                fill="url(#gradientProbable)"
              />
            )}
            
            {activeForecast.includes('optimista') && (
              <Area
                name="Optimista"
                type="monotone"
                dataKey="optimista"
                stroke={FORECAST_COLORS.optimista}
                strokeWidth={3}
                strokeDasharray="8 4"
                fill="url(#gradientOptimista)"
              />
            )}

            {/* Actual 2026 al final (línea sólida blanca encima) */}
            <Line
              name="Actual 2026"
              type="monotone"
              dataKey="actual"
              stroke="#ffffff"
              strokeWidth={3}
              dot={{ r: 3, fill: '#fff', strokeWidth: 0 }}
            />
          </AreaChart>
        </ResponsiveContainer>
      </div>

      {/* Historical Comparison */}
      <div className="mt-6 mb-4">
        <h4 className="text-sm font-semibold text-slate-400 uppercase tracking-wider mb-3 flex items-center gap-2">
          <TrendingUp size={14} />
          Comparación con Enero Completo (días 1-31)
        </h4>
        <div className="grid grid-cols-2 sm:grid-cols-5 gap-3">
          {/* 2024 Total */}
          <div className="bg-pink-500/10 border border-pink-500/30 rounded-xl p-4">
            <span className="text-pink-400 text-xs font-medium">2024 Real</span>
            <p className="text-xl font-bold text-white mt-1">
              {fullMonthTotals['2024'].toLocaleString()}
            </p>
          </div>
          
          {/* 2025 Total */}
          <div className="bg-violet-500/10 border border-violet-500/30 rounded-xl p-4">
            <span className="text-violet-400 text-xs font-medium">2025 Real</span>
            <p className="text-xl font-bold text-white mt-1">
              {fullMonthTotals['2025'].toLocaleString()}
            </p>
          </div>
          
          {/* Forecast Cards */}
          <div className="bg-amber-500/10 border border-amber-500/30 rounded-xl p-4">
            <div className="flex items-center justify-between">
              <span className="text-amber-400 text-xs font-medium">2026 Conservador</span>
              <Shield size={14} className="text-amber-400" />
            </div>
            <p className="text-xl font-bold text-white mt-1">
              {forecastTotals.conservador.toLocaleString()}
            </p>
            <p className="text-xs text-emerald-400 mt-1">
              +{Math.round(((forecastTotals.conservador / fullMonthTotals['2025']) - 1) * 100)}% vs 2025
            </p>
          </div>
          
          <div className="bg-emerald-500/10 border border-emerald-500/30 rounded-xl p-4">
            <div className="flex items-center justify-between">
              <span className="text-emerald-400 text-xs font-medium">2026 Probable</span>
              <Target size={14} className="text-emerald-400" />
            </div>
            <p className="text-xl font-bold text-white mt-1">
              {forecastTotals.probable.toLocaleString()}
            </p>
            <p className="text-xs text-emerald-400 mt-1">
              +{Math.round(((forecastTotals.probable / fullMonthTotals['2025']) - 1) * 100)}% vs 2025
            </p>
          </div>
          
          <div className="bg-cyan-500/10 border border-cyan-500/30 rounded-xl p-4">
            <div className="flex items-center justify-between">
              <span className="text-cyan-400 text-xs font-medium">2026 Optimista</span>
              <Zap size={14} className="text-cyan-400" />
            </div>
            <p className="text-xl font-bold text-white mt-1">
              {forecastTotals.optimista.toLocaleString()}
            </p>
            <p className="text-xs text-emerald-400 mt-1">
              +{Math.round(((forecastTotals.optimista / fullMonthTotals['2025']) - 1) * 100)}% vs 2025
            </p>
          </div>
        </div>
      </div>

      {/* Growth comparison table */}
      <div className="bg-slate-700/30 rounded-xl p-4">
        <div className="grid grid-cols-4 gap-4 text-center text-sm">
          <div>
            <p className="text-slate-400 text-xs mb-1">2024 → 2025</p>
            <p className="text-violet-400 font-bold">
              +{Math.round(((fullMonthTotals['2025'] / fullMonthTotals['2024']) - 1) * 100)}%
            </p>
          </div>
          <div>
            <p className="text-slate-400 text-xs mb-1">2025 → Conservador</p>
            <p className="text-amber-400 font-bold">
              +{Math.round(((forecastTotals.conservador / fullMonthTotals['2025']) - 1) * 100)}%
            </p>
          </div>
          <div>
            <p className="text-slate-400 text-xs mb-1">2025 → Probable</p>
            <p className="text-emerald-400 font-bold">
              +{Math.round(((forecastTotals.probable / fullMonthTotals['2025']) - 1) * 100)}%
            </p>
          </div>
          <div>
            <p className="text-slate-400 text-xs mb-1">2025 → Optimista</p>
            <p className="text-cyan-400 font-bold">
              +{Math.round(((forecastTotals.optimista / fullMonthTotals['2025']) - 1) * 100)}%
            </p>
          </div>
        </div>
      </div>
    </motion.div>
  );
});
