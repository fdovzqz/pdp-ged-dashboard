import { memo } from 'react';
import { motion } from 'framer-motion';
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from 'recharts';
import { Clock } from 'lucide-react';
import { CustomTooltip, YearBadge } from '../ui';
import { hourlyDistribution, lastAvailableDay } from '../../data/historicalData';
import { YEAR_COLORS, type YearType } from '../../types';

interface HourlyChartProps {
  activeYears: YearType[];
  onToggleYear: (year: YearType) => void;
}

export const HourlyChart = memo(function HourlyChart({ activeYears, onToggleYear }: HourlyChartProps) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 30 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.6, delay: 0.35 }}
      className="bg-slate-800/40 backdrop-blur-sm rounded-3xl border border-slate-700/50 p-6"
    >
      <div className="flex flex-col sm:flex-row flex-wrap items-start sm:items-center justify-between gap-2 sm:gap-4 mb-4">
        <div>
          <h3 className="text-lg font-bold text-white flex items-center gap-2 font-display">
            <Clock size={18} className="text-cyan-400" />
            Distribución por Hora del Día
          </h3>
          <p className="text-xs text-slate-400 mt-1">
            Total de pagos por hora · Días 1-{lastAvailableDay} de Enero
          </p>
        </div>
        <div className="flex flex-wrap gap-1 sm:gap-2">
          {(['2024', '2025', '2026'] as YearType[]).map((year) => (
            <YearBadge
              key={year}
              year={year}
              color={YEAR_COLORS[year]}
              active={activeYears.includes(year)}
              onClick={() => onToggleYear(year)}
            />
          ))}
        </div>
      </div>
      
      <div className="h-[200px] w-full">
        <ResponsiveContainer width="100%" height="100%">
          <AreaChart
            data={hourlyDistribution}
            margin={{ top: 10, right: 10, left: -20, bottom: 0 }}
          >
            <defs>
              <linearGradient id="hourly2024" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor="#f472b6" stopOpacity={0.3} />
                <stop offset="100%" stopColor="#f472b6" stopOpacity={0} />
              </linearGradient>
              <linearGradient id="hourly2025" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor="#8b5cf6" stopOpacity={0.3} />
                <stop offset="100%" stopColor="#8b5cf6" stopOpacity={0} />
              </linearGradient>
              <linearGradient id="hourly2026" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor="#10b981" stopOpacity={0.5} />
                <stop offset="100%" stopColor="#10b981" stopOpacity={0} />
              </linearGradient>
            </defs>
            
            <CartesianGrid strokeDasharray="3 3" stroke="#334155" vertical={false} />
            
            <XAxis
              dataKey="label"
              tick={{ fontSize: 10, fill: '#94a3b8' }}
              axisLine={false}
              tickLine={false}
              interval={2}
            />
            
            <YAxis
              tick={{ fontSize: 10, fill: '#94a3b8' }}
              axisLine={false}
              tickLine={false}
            />
            
            <Tooltip content={<CustomTooltip />} />
            
            {activeYears.includes('2024') && (
              <Area
                name="2024"
                type="monotone"
                dataKey="2024"
                stroke={YEAR_COLORS['2024']}
                strokeWidth={1.5}
                fill="url(#hourly2024)"
              />
            )}
            
            {activeYears.includes('2025') && (
              <Area
                name="2025"
                type="monotone"
                dataKey="2025"
                stroke={YEAR_COLORS['2025']}
                strokeWidth={1.5}
                fill="url(#hourly2025)"
              />
            )}
            
            {activeYears.includes('2026') && (
              <Area
                name="2026"
                type="monotone"
                dataKey="2026"
                stroke={YEAR_COLORS['2026']}
                strokeWidth={2}
                fill="url(#hourly2026)"
              />
            )}
          </AreaChart>
        </ResponsiveContainer>
      </div>
      
      {/* Peak hours indicator */}
      <div className="mt-4 flex items-center gap-4 text-xs">
        <div className="flex items-center gap-2">
          <div className="w-2 h-2 rounded-full bg-emerald-500" />
          <span className="text-slate-400">Pico: <span className="text-white font-semibold">12pm - 2pm</span></span>
        </div>
        <div className="flex items-center gap-2">
          <div className="w-2 h-2 rounded-full bg-slate-500" />
          <span className="text-slate-400">Valle: <span className="text-white font-semibold">2am - 5am</span></span>
        </div>
      </div>
    </motion.div>
  );
});
