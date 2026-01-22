import { motion } from 'framer-motion';
import { Calendar, Activity } from 'lucide-react';
import { calculateWeekdayStats, calculatePeriodStats } from '../../data/historicalData';
import { YEAR_COLORS, type YearType } from '../../types';

export const StatsSection = () => {
  const weekdayStats = calculateWeekdayStats();
  const periodStats = calculatePeriodStats();
  const years: YearType[] = ['2024', '2025', '2026'];

  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
      {/* Weekday vs Weekend */}
      <motion.div
        initial={{ opacity: 0, y: 30 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6, delay: 0.35 }}
        className="bg-slate-800/40 backdrop-blur-sm rounded-3xl border border-slate-700/50 p-6"
      >
        <h3 className="text-lg font-bold text-white mb-4 flex items-center gap-2 font-display">
          <Calendar size={18} className="text-cyan-400" />
          Lunes a Viernes vs Fin de Semana
        </h3>
        
        <div className="flex flex-col gap-3">
          {years.map((year) => (
            <div
              key={year}
              className="grid grid-cols-[50px_1fr_1fr] sm:grid-cols-[60px_1fr_1fr] gap-2 sm:gap-3 items-center"
            >
              <span
                className="font-semibold"
                style={{ color: YEAR_COLORS[year] }}
              >
                {year}
              </span>
              
              <div className="bg-slate-700/40 rounded-lg p-4">
                <div className="text-xs text-slate-400 mb-1">L-V (15 días)</div>
                <div className="font-bold text-white text-lg">
                  {weekdayStats[year].weekday.toLocaleString()}
                </div>
                <div className="text-sm font-medium mt-1" style={{ color: YEAR_COLORS[year] }}>
                  Ø {Math.round(weekdayStats[year].weekday / 15).toLocaleString()}/día
                </div>
              </div>
              
              <div className="bg-slate-700/40 rounded-lg p-4">
                <div className="text-xs text-slate-400 mb-1">S-D (6 días)</div>
                <div className="font-bold text-white text-lg">
                  {weekdayStats[year].weekend.toLocaleString()}
                </div>
                <div className="text-sm font-medium mt-1" style={{ color: YEAR_COLORS[year] }}>
                  Ø {Math.round(weekdayStats[year].weekend / 6).toLocaleString()}/día
                </div>
              </div>
            </div>
          ))}
        </div>
      </motion.div>

      {/* Period Distribution */}
      <motion.div
        initial={{ opacity: 0, y: 30 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6, delay: 0.4 }}
        className="bg-slate-800/40 backdrop-blur-sm rounded-3xl border border-slate-700/50 p-6"
      >
        <h3 className="text-lg font-bold text-white mb-4 flex items-center gap-2 font-display">
          <Activity size={18} className="text-amber-500" />
          Distribución por Semana
        </h3>
        
        <div className="flex flex-col gap-3">
          {years.map((year) => (
            <div
              key={year}
              className="grid grid-cols-[50px_1fr_1fr_1fr] sm:grid-cols-[60px_1fr_1fr_1fr] gap-1.5 sm:gap-3 items-center"
            >
              <span
                className="font-semibold"
                style={{ color: YEAR_COLORS[year] }}
              >
                {year}
              </span>
              
              <div className="bg-slate-700/40 rounded-lg p-4">
                <div className="text-[11px] text-slate-400 mb-1">Sem 1 (1-7)</div>
                <div className="font-bold text-white">
                  {periodStats[year].arranque.toLocaleString()}
                </div>
                <div className="text-sm font-medium mt-1" style={{ color: YEAR_COLORS[year] }}>
                  Ø {Math.round(periodStats[year].arranque / 7).toLocaleString()}/día
                </div>
              </div>
              
              <div className="bg-slate-700/40 rounded-lg p-4">
                <div className="text-[11px] text-slate-400 mb-1">Sem 2 (8-14)</div>
                <div className="font-bold text-white">
                  {periodStats[year].medio.toLocaleString()}
                </div>
                <div className="text-sm font-medium mt-1" style={{ color: YEAR_COLORS[year] }}>
                  Ø {Math.round(periodStats[year].medio / 7).toLocaleString()}/día
                </div>
              </div>
              
              <div className="bg-slate-700/40 rounded-lg p-4">
                <div className="text-[11px] text-slate-400 mb-1">Sem 3 (15-21)</div>
                <div className="font-bold text-white">
                  {periodStats[year].cierre.toLocaleString()}
                </div>
                <div className="text-sm font-medium mt-1" style={{ color: YEAR_COLORS[year] }}>
                  Ø {Math.round(periodStats[year].cierre / 7).toLocaleString()}/día
                </div>
              </div>
            </div>
          ))}
        </div>
      </motion.div>
    </div>
  );
};
