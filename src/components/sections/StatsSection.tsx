import { useMemo } from 'react';
import { motion } from 'framer-motion';
import { Calendar, Activity, Loader2 } from 'lucide-react';
import { useQuery } from 'convex/react';
import { api } from '../../../convex/_generated/api';
import { YEAR_COLORS, type YearType } from '../../types';

// Días de fin de semana por año (para cálculos)
const WEEKEND_DAYS: Record<number, number[]> = {
  2024: [6, 7, 13, 14, 20, 21, 27, 28],
  2025: [4, 5, 11, 12, 18, 19, 25, 26],
  2026: [3, 4, 10, 11, 17, 18, 24, 25, 31],
};

export const StatsSection = () => {
  // Obtener datos desde Convex
  const weekdayWeekendStats = useQuery(api.queries.getWeekdayWeekendStats);
  const periodStats = useQuery(api.queries.getPeriodStats);
  const lastAvailableDay = useQuery(api.queries.getLastAvailableDay);

  // Calcular dinámicamente los conteos de días
  const weekdayCounts = useMemo(() => {
    if (lastAvailableDay === undefined) return null;
    
    const counts: Record<string, { weekdays: number; weekends: number }> = {};
    
    for (const year of [2024, 2025, 2026]) {
      const weekendDaysForYear = WEEKEND_DAYS[year].filter(d => d <= lastAvailableDay);
      counts[year.toString()] = {
        weekends: weekendDaysForYear.length,
        weekdays: lastAvailableDay - weekendDaysForYear.length,
      };
    }
    
    return counts;
  }, [lastAvailableDay]);

  // Calcular rangos de períodos
  const periodRanges = useMemo(() => {
    if (lastAvailableDay === undefined) return null;
    
    const arranqueEnd = Math.min(7, lastAvailableDay);
    const arranque = Array.from({ length: arranqueEnd }, (_, i) => i + 1);
    
    const medioStart = 8;
    const medioEnd = Math.min(14, lastAvailableDay);
    const medio = medioStart <= lastAvailableDay 
      ? Array.from({ length: Math.max(0, medioEnd - medioStart + 1) }, (_, i) => i + medioStart)
      : [];
    
    const cierreStart = 15;
    const cierre = cierreStart <= lastAvailableDay
      ? Array.from({ length: lastAvailableDay - cierreStart + 1 }, (_, i) => i + cierreStart)
      : [];
    
    return { arranque, medio, cierre };
  }, [lastAvailableDay]);

  const years: YearType[] = ['2024', '2025', '2026'];

  // Loading state
  if (weekdayWeekendStats === undefined || periodStats === undefined || lastAvailableDay === undefined || !weekdayCounts || !periodRanges) {
    return (
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.35 }}
          className="bg-slate-800/40 backdrop-blur-sm rounded-3xl border border-slate-700/50 p-6"
        >
          <div className="flex items-center justify-center min-h-[200px]">
            <div className="flex flex-col items-center gap-4">
              <Loader2 className="w-6 h-6 animate-spin text-cyan-400" />
              <p className="text-slate-400 text-sm">Cargando estadísticas...</p>
            </div>
          </div>
        </motion.div>
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.4 }}
          className="bg-slate-800/40 backdrop-blur-sm rounded-3xl border border-slate-700/50 p-6"
        >
          <div className="flex items-center justify-center min-h-[200px]">
            <div className="flex flex-col items-center gap-4">
              <Loader2 className="w-6 h-6 animate-spin text-amber-500" />
              <p className="text-slate-400 text-sm">Cargando estadísticas...</p>
            </div>
          </div>
        </motion.div>
      </div>
    );
  }

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
          {years.map((year) => {
            const counts = weekdayCounts[year];
            const stats = weekdayWeekendStats[year];
            
            return (
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
                  <div className="text-xs text-slate-400 mb-1">L-V ({counts.weekdays} días)</div>
                  <div className="font-bold text-white text-lg">
                    {stats.weekday.toLocaleString()}
                  </div>
                  <div className="text-sm font-medium mt-1" style={{ color: YEAR_COLORS[year] }}>
                    Ø {counts.weekdays > 0 ? Math.round(stats.weekday / counts.weekdays).toLocaleString() : 0}/día
                  </div>
                </div>
                
                <div className="bg-slate-700/40 rounded-lg p-4">
                  <div className="text-xs text-slate-400 mb-1">S-D ({counts.weekends} días)</div>
                  <div className="font-bold text-white text-lg">
                    {stats.weekend.toLocaleString()}
                  </div>
                  <div className="text-sm font-medium mt-1" style={{ color: YEAR_COLORS[year] }}>
                    Ø {counts.weekends > 0 ? Math.round(stats.weekend / counts.weekends).toLocaleString() : 0}/día
                  </div>
                </div>
              </div>
            );
          })}
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
          {years.map((year) => {
            const stats = periodStats[year];
            
            return (
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
                  <div className="text-[11px] text-slate-400 mb-1">
                    Sem 1 ({periodRanges.arranque[0]}-{periodRanges.arranque[periodRanges.arranque.length - 1]})
                  </div>
                  <div className="font-bold text-white">
                    {stats.arranque.toLocaleString()}
                  </div>
                  <div className="text-sm font-medium mt-1" style={{ color: YEAR_COLORS[year] }}>
                    Ø {Math.round(stats.arranque / periodRanges.arranque.length).toLocaleString()}/día
                  </div>
                </div>
                
                <div className="bg-slate-700/40 rounded-lg p-4">
                  <div className="text-[11px] text-slate-400 mb-1">
                    Sem 2 ({periodRanges.medio.length > 0 ? `${periodRanges.medio[0]}-${periodRanges.medio[periodRanges.medio.length - 1]}` : 'N/A'})
                  </div>
                  <div className="font-bold text-white">
                    {stats.medio.toLocaleString()}
                  </div>
                  <div className="text-sm font-medium mt-1" style={{ color: YEAR_COLORS[year] }}>
                    Ø {periodRanges.medio.length > 0 ? Math.round(stats.medio / periodRanges.medio.length).toLocaleString() : '0'}/día
                  </div>
                </div>
                
                <div className="bg-slate-700/40 rounded-lg p-4">
                  <div className="text-[11px] text-slate-400 mb-1">
                    Sem 3+ ({periodRanges.cierre.length > 0 ? `${periodRanges.cierre[0]}-${periodRanges.cierre[periodRanges.cierre.length - 1]}` : 'N/A'})
                  </div>
                  <div className="font-bold text-white">
                    {stats.cierre.toLocaleString()}
                  </div>
                  <div className="text-sm font-medium mt-1" style={{ color: YEAR_COLORS[year] }}>
                    Ø {periodRanges.cierre.length > 0 ? Math.round(stats.cierre / periodRanges.cierre.length).toLocaleString() : '0'}/día
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </motion.div>
    </div>
  );
};
