import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from 'recharts';
import { X, Clock, Loader2 } from 'lucide-react';
import { useQuery } from 'convex/react';
import { api } from '../../../convex/_generated/api';
import { CustomTooltip } from '../ui';
import { useHourlyByDay } from '../../hooks';
import { YEAR_COLORS, type YearType } from '../../types';

interface DayDetailModalProps {
  day: number | null;
  onClose: () => void;
  month?: number;
  monthName?: string;
}

const formatDayMonth = (day: number, month: string = 'Enero'): string => {
  return `${day} de ${month}`;
};

export const DayDetailModal = ({ day, onClose, month = 1, monthName = 'Enero' }: DayDetailModalProps) => {
  const [showIntraday, setShowIntraday] = useState(false);
  const historicalData = useQuery(api.queries.getHistoricalData, { month });
  const { data: hourlyData, isLoading: hourlyLoading, error: hourlyError } = useHourlyByDay(
    day,
    showIntraday,
    month
  );

  const dayData = day && historicalData
    ? historicalData.find((d) => d.day === day)
    : null;

  const chartData = dayData
    ? [
        { name: '2024', value: dayData['2024'], fill: YEAR_COLORS['2024'] },
        { name: '2025', value: dayData['2025'], fill: YEAR_COLORS['2025'] },
        { name: '2026', value: dayData['2026'], fill: YEAR_COLORS['2026'] },
      ]
    : [];

  const growthVs2025 =
    dayData && dayData['2025'] > 0
      ? (((dayData['2026'] - dayData['2025']) / dayData['2025']) * 100).toFixed(1)
      : null;

  const growthVs2024 =
    dayData && dayData['2024'] > 0
      ? (((dayData['2026'] - dayData['2024']) / dayData['2024']) * 100).toFixed(1)
      : null;

  return (
    <AnimatePresence>
      {day !== null && (
        <>
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/60 backdrop-blur-sm z-40"
            onClick={onClose}
            aria-hidden="true"
          />
          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 20 }}
            transition={{ type: 'spring', damping: 25, stiffness: 300 }}
            className="fixed left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 w-full max-w-lg max-h-[90vh] overflow-y-auto bg-slate-800/95 backdrop-blur-md rounded-2xl border border-slate-700/50 shadow-2xl z-50 p-6"
            role="dialog"
            aria-modal="true"
            aria-labelledby="day-detail-title"
          >
            <div className="flex items-center justify-between mb-6">
              <h3 id="day-detail-title" className="text-xl font-bold text-white">
                Día {formatDayMonth(day, monthName)}
              </h3>
              <button
                onClick={onClose}
                className="p-2 rounded-lg hover:bg-slate-700/50 text-slate-400 hover:text-white transition-colors"
                aria-label="Cerrar"
              >
                <X size={20} />
              </button>
            </div>

            {dayData ? (
              <>
                <div className="grid grid-cols-3 gap-3 mb-6">
                  {(['2024', '2025', '2026'] as YearType[]).map((year) => (
                    <div
                      key={year}
                      className="bg-slate-700/30 rounded-xl p-4 text-center"
                    >
                      <p
                        className="text-xs font-medium uppercase tracking-wider text-slate-400 mb-1"
                        style={{ color: YEAR_COLORS[year] }}
                      >
                        {year}
                      </p>
                      <p className="text-2xl font-bold text-white">
                        {dayData[year].toLocaleString()}
                      </p>
                      <p className="text-xs text-slate-400 mt-1">pagos</p>
                    </div>
                  ))}
                </div>

                {growthVs2025 !== null && (
                  <div className="flex gap-4 mb-6 text-sm">
                    <span className="text-slate-400">
                      vs 2025:{' '}
                      <span
                        className={
                          Number(growthVs2025) >= 0
                            ? 'text-emerald-400 font-semibold'
                            : 'text-red-400 font-semibold'
                        }
                      >
                        {Number(growthVs2025) >= 0 ? '+' : ''}
                        {growthVs2025}%
                      </span>
                    </span>
                    {growthVs2024 !== null && (
                      <span className="text-slate-400">
                        vs 2024:{' '}
                        <span
                          className={
                            Number(growthVs2024) >= 0
                              ? 'text-emerald-400 font-semibold'
                              : 'text-red-400 font-semibold'
                          }
                        >
                          {Number(growthVs2024) >= 0 ? '+' : ''}
                          {growthVs2024}%
                        </span>
                      </span>
                    )}
                  </div>
                )}

                <div className="h-[200px]">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={chartData} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
                      <CartesianGrid strokeDasharray="3 3" stroke="#334155" vertical={false} />
                      <XAxis
                        dataKey="name"
                        tick={{ fontSize: 12, fill: '#94a3b8' }}
                        axisLine={false}
                        tickLine={false}
                      />
                      <YAxis
                        tick={{ fontSize: 12, fill: '#94a3b8' }}
                        axisLine={false}
                        tickLine={false}
                      />
                      <Tooltip content={<CustomTooltip />} />
                      <Bar dataKey="value" radius={[4, 4, 0, 0]} />
                    </BarChart>
                  </ResponsiveContainer>
                </div>

                <p className="text-xs text-slate-500 mt-4 text-center">
                  Comparativa de pagos del día {formatDayMonth(day, monthName)} entre años
                </p>

                {/* Toggle intradía */}
                <div className="mt-6 pt-6 border-t border-slate-700/50">
                  <button
                    type="button"
                    onClick={() => setShowIntraday((v) => !v)}
                    className="flex items-center gap-2 w-full justify-center py-2 px-4 rounded-xl bg-slate-700/40 hover:bg-slate-700/60 text-slate-300 hover:text-white transition-colors text-sm font-medium"
                  >
                    <Clock size={16} />
                    {showIntraday ? 'Ocultar intradía' : 'Mostrar intradía'}
                  </button>

                  {showIntraday && (
                    <div className="mt-4">
                      {hourlyLoading ? (
                        <div className="flex items-center justify-center h-[180px] gap-2">
                          <Loader2 className="w-5 h-5 animate-spin text-cyan-400" />
                          <span className="text-slate-400 text-sm">Cargando datos por hora...</span>
                        </div>
                      ) : hourlyError ? (
                        <p className="text-red-400 text-sm text-center py-4">
                          No se pudieron cargar los datos intradía.
                        </p>
                      ) : hourlyData && hourlyData.length > 0 ? (
                        <>
                          <div className="h-[200px]">
                            <ResponsiveContainer width="100%" height="100%">
                              <BarChart
                                data={hourlyData.map((d) => ({
                                  name: d.label,
                                  value: d['2026'],
                                  fill: YEAR_COLORS['2026'],
                                }))}
                                margin={{ top: 10, right: 10, left: -20, bottom: 0 }}
                              >
                                <CartesianGrid strokeDasharray="3 3" stroke="#334155" vertical={false} />
                                <XAxis
                                  dataKey="name"
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
                                <Bar dataKey="value" radius={[4, 4, 0, 0]} />
                              </BarChart>
                            </ResponsiveContainer>
                          </div>
                          <p className="text-xs text-slate-500 mt-2 text-center">
                            Pagos por hora del día {formatDayMonth(day, monthName)} · 2026 · Hora México (America/Mexico_City)
                          </p>
                        </>
                      ) : null}
                    </div>
                  )}
                </div>
              </>
            ) : (
              <p className="text-slate-400 text-center py-8">
                No hay datos disponibles para este día.
              </p>
            )}
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
};
