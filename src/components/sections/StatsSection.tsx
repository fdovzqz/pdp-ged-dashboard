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

// Tipo devuelto por getPeriodStats (nuevo: { sum, days }; legado: number)
type PeriodValue = { sum: number; days: number } | number;

const isNewPeriodShape = (v: PeriodValue): v is { sum: number; days: number } =>
  typeof v === 'object' && v !== null && 'sum' in v && 'days' in v;

/** Normaliza arranque/medio/cierre a { sum, days } para compatibilidad con backend legado. */
function normalizePeriod(
  raw: PeriodValue,
  kind: 'arranque' | 'medio' | 'cierre',
  year: YearType,
  lastAvailableDay: number
): { sum: number; days: number } {
  if (isNewPeriodShape(raw)) return raw;
  const sum = typeof raw === 'number' ? raw : 0;
  // Heurística de días efectivos cuando el backend no envía { sum, days }
  // Arranque 1-7 | Medio 8-24 | Cierre 25-31
  const is2026 = year === '2026';
  const days =
    kind === 'arranque'
      ? is2026 ? Math.min(7, lastAvailableDay) : 7
      : kind === 'medio'
        ? is2026 ? Math.min(17, Math.max(0, lastAvailableDay - 7)) : 17
        : is2026
          ? Math.max(0, lastAvailableDay - 24)
          : 7;
  return { sum, days };
}

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


  const years: YearType[] = ['2024', '2025', '2026'];

  // Loading state
  if (weekdayWeekendStats === undefined || periodStats === undefined || lastAvailableDay === undefined || !weekdayCounts) {
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
            const a = normalizePeriod(periodStats[year].arranque, 'arranque', year, lastAvailableDay);
            const m = normalizePeriod(periodStats[year].medio, 'medio', year, lastAvailableDay);
            const c = normalizePeriod(periodStats[year].cierre, 'cierre', year, lastAvailableDay);
            // Rangos efectivos según días con datos: Arranque 1-7, Medio 8-24, Cierre 25-31
            const labelArranque = a.days > 0 ? `1-${Math.min(7, a.days)}` : '1-7';
            const labelMedio = m.days > 0 ? `8-${Math.min(24, 7 + m.days)}` : '8-24';
            const labelCierre = c.days > 0 ? `25-${Math.min(31, 24 + c.days)}` : '25-31';
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
                    Arranque ({labelArranque})
                  </div>
                  <div className="font-bold text-white">
                    Ø {a.days > 0 ? Math.round(a.sum / a.days).toLocaleString() : 0}/día
                  </div>
                  <div className="text-sm font-medium mt-1" style={{ color: YEAR_COLORS[year] }}>
                    Σ {a.sum.toLocaleString()}
                  </div>
                </div>

                <div className="bg-slate-700/40 rounded-lg p-4">
                  <div className="text-[11px] text-slate-400 mb-1">
                    Medio ({labelMedio})
                  </div>
                  <div className="font-bold text-white">
                    Ø {m.days > 0 ? Math.round(m.sum / m.days).toLocaleString() : 0}/día
                  </div>
                  <div className="text-sm font-medium mt-1" style={{ color: YEAR_COLORS[year] }}>
                    Σ {m.sum.toLocaleString()}
                  </div>
                </div>

                <div className="bg-slate-700/40 rounded-lg p-4">
                  <div className="text-[11px] text-slate-400 mb-1">
                    Cierre ({labelCierre})
                  </div>
                  <div className="font-bold text-white">
                    Ø {c.days > 0 ? Math.round(c.sum / c.days).toLocaleString() : 0}/día
                  </div>
                  <div className="text-sm font-medium mt-1" style={{ color: YEAR_COLORS[year] }}>
                    Σ {c.sum.toLocaleString()}
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
