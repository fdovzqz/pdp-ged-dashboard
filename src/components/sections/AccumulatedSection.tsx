import { useMemo } from 'react';
import { motion } from 'framer-motion';
import { TrendingUp, Calendar, BarChart3, Loader2 } from 'lucide-react';
import { useQuery } from 'convex/react';
import { api } from '../../../convex/_generated/api';
import { YEAR_COLORS, type YearType } from '../../types';

// Helper para formatear fecha
const formatDayMonth = (day: number, month: string = 'Enero'): string => {
  return `${day} de ${month}`;
};

interface AccumulatedSectionProps {
  month?: number;
  monthName?: string;
}

export const AccumulatedSection = ({ month = 1, monthName = 'Enero' }: AccumulatedSectionProps) => {
  // Obtener datos desde Convex
  const historicalData = useQuery(api.queries.getHistoricalData, { month });
  const lastAvailableDay = useQuery(api.queries.getLastAvailableDay, { month });
  const totals = useQuery(
    api.queries.getTotalsUpToDay,
    lastAvailableDay !== undefined
      ? { maxDay: lastAvailableDay, month }
      : "skip"
  );

  // Calculate accumulated data for each day
  const accumulatedData = useMemo(() => {
    if (!historicalData) return [];
    
    const result: { day: number; '2024': number; '2025': number; '2026': number }[] = [];
    let acc2024 = 0;
    let acc2025 = 0;
    let acc2026 = 0;

    historicalData.forEach((d) => {
      acc2024 += d['2024'];
      acc2025 += d['2025'];
      acc2026 += d['2026'];
      result.push({
        day: d.day,
        '2024': acc2024,
        '2025': acc2025,
        '2026': acc2026,
      });
    });

    return result;
  }, [historicalData]);

  // Loading state
  if (historicalData === undefined || totals === undefined || lastAvailableDay === undefined) {
    return (
      <motion.div
        initial={{ opacity: 0, y: 30 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6, delay: 0.2 }}
        className="bg-slate-800/40 backdrop-blur-sm rounded-3xl border border-slate-700/50 p-6"
      >
        <div className="flex items-center justify-center min-h-[300px]">
          <div className="flex flex-col items-center gap-4">
            <Loader2 className="w-6 h-6 animate-spin text-emerald-400" />
            <p className="text-slate-400 text-sm">Cargando datos acumulados...</p>
          </div>
        </div>
      </motion.div>
    );
  }

  // Get the current day data - usar el día específico que tenemos datos de 2026
  // Para comparación justa, usamos el último día disponible de 2026
  const currentDayData = accumulatedData.find(d => d.day === lastAvailableDay) || 
    accumulatedData[accumulatedData.length - 1] || 
    { '2024': 0, '2025': 0, '2026': 0 };

  // Calculate growth rates usando los totales hasta el día actual
  const growth2025vs2024 = totals['2024'] > 0
    ? ((totals['2025'] / totals['2024'] - 1) * 100).toFixed(1)
    : '0.0';
  const growth2026vs2025 = totals['2025'] > 0
    ? ((totals['2026'] / totals['2025'] - 1) * 100).toFixed(1)
    : '0.0';
  const growth2026vs2024 = totals['2024'] > 0
    ? ((totals['2026'] / totals['2024'] - 1) * 100).toFixed(1)
    : '0.0';

  const years: YearType[] = ['2024', '2025', '2026'];

  return (
    <motion.div
      initial={{ opacity: 0, y: 30 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.6, delay: 0.2 }}
      className="bg-slate-800/40 backdrop-blur-sm rounded-3xl border border-slate-700/50 p-6"
    >
      <div className="flex items-center gap-2 mb-6">
        <BarChart3 size={20} className="text-emerald-400" />
        <h3 className="text-xl font-bold text-white font-display">
          Acumulado al Día {formatDayMonth(lastAvailableDay, monthName)}
        </h3>
      </div>

      {/* Main comparison cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
        {years.map((year) => (
          <div
            key={year}
            className="relative overflow-hidden rounded-2xl p-5"
            style={{
              background: `linear-gradient(135deg, ${YEAR_COLORS[year]}15, ${YEAR_COLORS[year]}05)`,
              border: `1px solid ${YEAR_COLORS[year]}40`,
            }}
          >
            <div className="flex items-center justify-between mb-3">
              <span
                className="text-sm font-bold px-3 py-1 rounded-full"
                style={{ backgroundColor: `${YEAR_COLORS[year]}30`, color: YEAR_COLORS[year] }}
              >
                {year}
              </span>
              <Calendar size={16} style={{ color: YEAR_COLORS[year] }} />
            </div>
            <p className="text-3xl font-bold text-white mb-1">
              {totals[year].toLocaleString()}
            </p>
            <p className="text-sm text-slate-400">
              pagos totales
            </p>
            
            {/* Daily average */}
            <div className="mt-4 pt-4 border-t border-slate-700/50">
              <div className="flex justify-between items-center text-sm">
                <span className="text-slate-400">Promedio diario</span>
                <span className="font-semibold text-white">
                  {Math.round(totals[year] / lastAvailableDay).toLocaleString()}
                </span>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Growth comparison */}
      <div className="bg-slate-700/30 rounded-xl p-4">
        <div className="flex items-center gap-2 mb-4">
          <TrendingUp size={16} className="text-emerald-400" />
          <h4 className="text-sm font-semibold text-white">Crecimiento Año vs Año (al día {lastAvailableDay})</h4>
        </div>
        
        <div className="grid grid-cols-3 gap-4 text-center">
          <div className="p-3 bg-slate-800/50 rounded-lg">
            <p className="text-xs text-slate-400 mb-1">2024 → 2025</p>
            <p className="text-lg font-bold text-violet-400">+{growth2025vs2024}%</p>
            <p className="text-xs text-slate-500 mt-1">
              +{(currentDayData['2025'] - currentDayData['2024']).toLocaleString()} pagos
            </p>
          </div>
          <div className="p-3 bg-slate-800/50 rounded-lg">
            <p className="text-xs text-slate-400 mb-1">2025 → 2026</p>
            <p className="text-lg font-bold text-emerald-400">+{growth2026vs2025}%</p>
            <p className="text-xs text-slate-500 mt-1">
              +{(currentDayData['2026'] - currentDayData['2025']).toLocaleString()} pagos
            </p>
          </div>
          <div className="p-3 bg-emerald-500/10 border border-emerald-500/30 rounded-lg">
            <p className="text-xs text-slate-400 mb-1">2024 → 2026</p>
            <p className="text-lg font-bold text-emerald-400">+{growth2026vs2024}%</p>
            <p className="text-xs text-slate-500 mt-1">
              +{(currentDayData['2026'] - currentDayData['2024']).toLocaleString()} pagos
            </p>
          </div>
        </div>
      </div>

      {/* Progress bars */}
      <div className="mt-6">
        <h4 className="text-sm font-semibold text-slate-400 mb-3">Comparativa visual</h4>
        <div className="space-y-3">
          {years.map((year) => {
            const percentage = totals['2026'] > 0 ? (totals[year] / totals['2026']) * 100 : 0;
            return (
              <div key={year} className="flex items-center gap-4">
                <span className="text-sm font-medium w-12" style={{ color: YEAR_COLORS[year] }}>
                  {year}
                </span>
                <div className="flex-1 h-8 bg-slate-700/50 rounded-full overflow-hidden">
                  <motion.div
                    initial={{ width: 0 }}
                    animate={{ width: `${percentage}%` }}
                    transition={{ duration: 1, delay: 0.5 }}
                    className="h-full rounded-full flex items-center justify-end pr-3"
                    style={{ backgroundColor: `${YEAR_COLORS[year]}80` }}
                  >
                    <span className="text-xs font-bold text-white">
                      {totals[year].toLocaleString()}
                    </span>
                  </motion.div>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </motion.div>
  );
};
