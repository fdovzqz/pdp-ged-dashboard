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

type WeekdayWeekendValue = { sum: number; days: number } | number;
const isNewWeekdayShape = (v: WeekdayWeekendValue): v is { sum: number; days: number } =>
  typeof v === 'object' && v !== null && 'sum' in v && 'days' in v;

/** Normaliza { weekday, weekend } a { sum, days } para compatibilidad con backend legado. */
function normalizeWeekdayWeekend(
  raw: { weekday: WeekdayWeekendValue; weekend: WeekdayWeekendValue },
  year: YearType,
  lastAvailableDay: number
): { weekday: { sum: number; days: number }; weekend: { sum: number; days: number } } {
  if (isNewWeekdayShape(raw.weekday) && isNewWeekdayShape(raw.weekend)) {
    return { weekday: raw.weekday, weekend: raw.weekend };
  }
  const weekendDaysInRange = WEEKEND_DAYS[parseInt(year, 10)].filter((d) => d <= lastAvailableDay).length;
  const weekdayDaysInRange = Math.max(0, lastAvailableDay - weekendDaysInRange);
  return {
    weekday: { sum: typeof raw.weekday === 'number' ? raw.weekday : 0, days: weekdayDaysInRange },
    weekend: { sum: typeof raw.weekend === 'number' ? raw.weekend : 0, days: weekendDaysInRange },
  };
}

/** Normaliza arranque/medio/cierre a { sum, days } para compatibilidad con backend legado.
 *  Para comparación equivalente, 2024 y 2025 usan el mismo tope (lastAvailableDay) que 2026. */
function normalizePeriod(
  raw: PeriodValue,
  kind: 'arranque' | 'medio' | 'cierre',
  _year: YearType,
  lastAvailableDay: number
): { sum: number; days: number } {
  if (isNewPeriodShape(raw)) return raw;
  const sum = typeof raw === 'number' ? raw : 0;
  // Heurística: todos los años cap por lastAvailableDay (Arranque 1-7, Medio 8-24, Cierre 25-31)
  const days =
    kind === 'arranque'
      ? Math.min(7, lastAvailableDay)
      : kind === 'medio'
        ? Math.min(17, Math.max(0, lastAvailableDay - 7))
        : Math.max(0, lastAvailableDay - 24);
  return { sum, days };
}

interface StatsSectionProps {
  month?: number;
}

export const StatsSection = ({ month = 1 }: StatsSectionProps) => {
  // Obtener datos desde Convex
  const weekdayWeekendStats = useQuery(api.queries.getWeekdayWeekendStats, { month });
  const periodStats = useQuery(api.queries.getPeriodStats, { month });
  const lastAvailableDay = useQuery(api.queries.getLastAvailableDay, { month });

  const years: YearType[] = ['2024', '2025', '2026'];

  // Loading state
  if (weekdayWeekendStats === undefined || periodStats === undefined || lastAvailableDay === undefined) {
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
    <div className="grid grid-cols-1 xl:grid-cols-2 gap-8 min-w-0">
      {/* Weekday vs Weekend */}
      <motion.div
        initial={{ opacity: 0, y: 30 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6, delay: 0.35 }}
        className="bg-slate-800/40 backdrop-blur-sm rounded-2xl border border-slate-700/50 p-6 min-w-0 overflow-hidden"
      >
        <h3 className="text-lg font-bold text-white mb-5 flex items-center gap-2 font-display">
          <Calendar size={18} className="text-cyan-400 shrink-0" />
          Lunes a Viernes vs Fin de Semana
        </h3>
        
        <div className="flex flex-col gap-4">
          {years.map((year) => {
            const { weekday: w, weekend: s } = normalizeWeekdayWeekend(
              weekdayWeekendStats[year],
              year,
              lastAvailableDay
            );
            return (
              <div
                key={year}
                className="grid grid-cols-[auto_1fr_1fr] gap-3 items-center min-w-0"
              >
                <span
                  className="font-semibold inline-flex items-center justify-center -rotate-90 text-xs sm:text-sm"
                  style={{ color: YEAR_COLORS[year] }}
                >
                  {year}
                </span>

                <div className="bg-slate-700/40 rounded-lg p-4">
                  <div className="text-[11px] text-slate-400 mb-1">L-V ({w.days} días)</div>
                  <div className="font-bold text-white">
                    Ø {w.days > 0 ? Math.round(w.sum / w.days).toLocaleString() : 0}
                  </div>
                  <div className="text-sm font-medium mt-1" style={{ color: YEAR_COLORS[year] }}>
                    Σ {w.sum.toLocaleString()}
                  </div>
                </div>

                <div className="bg-slate-700/40 rounded-lg p-4 min-w-0">
                  <div className="text-[11px] text-slate-400 mb-1">S-D ({s.days} días)</div>
                  <div className="font-bold text-white">
                    Ø {s.days > 0 ? Math.round(s.sum / s.days).toLocaleString() : 0}
                  </div>
                  <div className="text-sm font-medium mt-1" style={{ color: YEAR_COLORS[year] }}>
                    Σ {s.sum.toLocaleString()}
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
        className="bg-slate-800/40 backdrop-blur-sm rounded-2xl border border-slate-700/50 p-6 min-w-0 overflow-hidden"
      >
        <h3 className="text-lg font-bold text-white mb-5 flex items-center gap-2 font-display">
          <Activity size={18} className="text-amber-500 shrink-0" />
          Distribución por Semana
        </h3>
        
        <div className="flex flex-col gap-4 overflow-x-auto">
          {years.map((year) => {
            const a = normalizePeriod(periodStats[year].arranque, 'arranque', year, lastAvailableDay);
            const m = normalizePeriod(periodStats[year].medio, 'medio', year, lastAvailableDay);
            const c = normalizePeriod(periodStats[year].cierre, 'cierre', year, lastAvailableDay);
            const labelArranque = a.days > 0 ? `1-${Math.min(7, a.days)}` : '1-7';
            const labelMedio = m.days > 0 ? `8-${Math.min(24, 7 + m.days)}` : '8-24';
            const labelCierre = c.days > 0 ? `25-${Math.min(31, 24 + c.days)}` : '25-31';
            return (
              <div
                key={year}
                className="grid grid-cols-[auto_1fr_1fr_1fr] gap-3 items-center min-w-0"
              >
                <span
                  className="font-semibold w-10 shrink-0 text-center text-xs sm:text-sm"
                  style={{ color: YEAR_COLORS[year] }}
                >
                  {year}
                </span>

                <div className="bg-slate-700/40 rounded-lg p-4 min-w-0">
                  <div className="text-[11px] text-slate-400 mb-1">
                    Arranque ({labelArranque})
                  </div>
                  <div className="font-bold text-white">
                    Ø {a.days > 0 ? Math.round(a.sum / a.days).toLocaleString() : 0}
                  </div>
                  <div className="text-sm font-medium mt-1" style={{ color: YEAR_COLORS[year] }}>
                    Σ {a.sum.toLocaleString()}
                  </div>
                </div>

                <div className="bg-slate-700/40 rounded-lg p-4 min-w-0">
                  <div className="text-[11px] text-slate-400 mb-1">
                    Medio ({labelMedio})
                  </div>
                  <div className="font-bold text-white">
                    Ø {m.days > 0 ? Math.round(m.sum / m.days).toLocaleString() : 0}
                  </div>
                  <div className="text-sm font-medium mt-1" style={{ color: YEAR_COLORS[year] }}>
                    Σ {m.sum.toLocaleString()}
                  </div>
                </div>

                <div className="bg-slate-700/40 rounded-lg p-4 min-w-0">
                  <div className="text-[11px] text-slate-400 mb-1">
                    Cierre ({labelCierre})
                  </div>
                  <div className="font-bold text-white">
                    Ø {c.days > 0 ? Math.round(c.sum / c.days).toLocaleString() : 0}
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
