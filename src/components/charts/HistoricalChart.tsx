import { useState, useMemo, memo } from 'react';
import { motion } from 'framer-motion';
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from 'recharts';
import { Layers, BarChart2, TrendingUp } from 'lucide-react';
import { YearBadge, CustomTooltip } from '../ui';
import { historicalData, lastAvailableDay } from '../../data/historicalData';
import { YEAR_COLORS, type YearType } from '../../types';

type ViewMode = 'daily' | 'accumulated';

interface HistoricalChartProps {
  activeYears: YearType[];
  onToggleYear: (year: YearType) => void;
}

export const HistoricalChart = memo(function HistoricalChart({ activeYears, onToggleYear }: HistoricalChartProps) {
  const [viewMode, setViewMode] = useState<ViewMode>('accumulated');

  // Calculate accumulated data
  const accumulatedData = useMemo(() => {
    let acc2024 = 0;
    let acc2025 = 0;
    let acc2026 = 0;

    return historicalData.map((d) => {
      acc2024 += d['2024'];
      acc2025 += d['2025'];
      acc2026 += d['2026'];
      return {
        day: d.day,
        '2024': acc2024,
        '2025': acc2025,
        '2026': acc2026,
      };
    });
  }, []);

  const chartData = viewMode === 'daily' ? historicalData : accumulatedData;

  return (
    <motion.div
      initial={{ opacity: 0, y: 30 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.6, delay: 0.2 }}
      className="col-span-2 bg-slate-800/40 backdrop-blur-sm rounded-3xl border border-slate-700/50 p-6"
    >
      <div className="flex flex-col sm:flex-row flex-wrap items-start sm:items-center justify-between gap-3 sm:gap-4 mb-6">
        <div>
          <h3 className="text-xl font-bold text-white flex items-center gap-2 font-display">
            <Layers size={20} className="text-emerald-500" />
            Tendencia Histórica Comparativa
          </h3>
          <p className="text-sm text-slate-400 mt-1">
            {viewMode === 'daily' ? 'Pagos diarios' : 'Pagos acumulados'} · Días 1-{lastAvailableDay} de Enero
          </p>
        </div>
        
        <div className="flex flex-wrap items-center gap-2 sm:gap-4">
          {/* View Mode Toggle */}
          <div className="flex rounded-xl overflow-hidden border border-slate-600">
            <button
              onClick={() => setViewMode('daily')}
              className={`flex items-center gap-1 sm:gap-1.5 px-2 sm:px-3 py-1.5 text-xs sm:text-sm font-medium transition-all ${
                viewMode === 'daily'
                  ? 'bg-emerald-500/20 text-emerald-400'
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
                  ? 'bg-emerald-500/20 text-emerald-400'
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
            {(Object.entries(YEAR_COLORS) as [YearType, string][]).map(([year, color]) => (
              <YearBadge
                key={year}
                year={year}
                color={color}
                active={activeYears.includes(year)}
                onClick={() => onToggleYear(year)}
              />
            ))}
          </div>
        </div>
      </div>

      <div className="h-[400px] w-full">
        <ResponsiveContainer width="100%" height="100%">
          <LineChart
            data={chartData}
            margin={{ top: 20, right: 30, left: 0, bottom: 0 }}
          >
            <defs>
              <linearGradient id="gradient2026" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor="#10b981" stopOpacity={0.3} />
                <stop offset="100%" stopColor="#10b981" stopOpacity={0} />
              </linearGradient>
            </defs>
            
            <CartesianGrid
              strokeDasharray="3 3"
              stroke="#334155"
              vertical={false}
            />
            
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
            
            {activeYears.includes('2024') && (
              <Line
                name="2024"
                type="monotone"
                dataKey="2024"
                stroke={YEAR_COLORS['2024']}
                strokeWidth={2.5}
                dot={false}
              />
            )}
            
            {activeYears.includes('2025') && (
              <Line
                name="2025"
                type="monotone"
                dataKey="2025"
                stroke={YEAR_COLORS['2025']}
                strokeWidth={2.5}
                dot={false}
              />
            )}
            
            {activeYears.includes('2026') && (
              <Line
                name="2026"
                type="monotone"
                dataKey="2026"
                stroke={YEAR_COLORS['2026']}
                strokeWidth={4}
                dot={{
                  r: 4,
                  fill: YEAR_COLORS['2026'],
                  strokeWidth: 2,
                  stroke: '#1e293b',
                }}
                activeDot={{ r: 8, strokeWidth: 0 }}
              />
            )}
          </LineChart>
        </ResponsiveContainer>
      </div>
    </motion.div>
  );
});
