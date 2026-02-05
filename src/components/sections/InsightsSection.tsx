import { motion } from 'framer-motion';
import { BarChart3, ChevronRight, Trophy } from 'lucide-react';
import { useQuery } from 'convex/react';
import { api } from '../../../convex/_generated/api';

interface InsightsSectionProps {
  month?: number;
  monthName?: string;
}

export const InsightsSection = ({ month = 1, monthName = 'Enero' }: InsightsSectionProps) => {
  const historicalData = useQuery(api.queries.getHistoricalData, { month });
  const totals = useQuery(api.queries.getTotals, { month });
  const growthMetrics = useQuery(api.queries.getGrowthMetrics, { month });
  const lastAvailableDay = useQuery(api.queries.getLastAvailableDay, { month });

  if (
    !historicalData ||
    !totals ||
    !growthMetrics ||
    lastAvailableDay === undefined
  ) {
    return null;
  }

  // Primeros 7 días
  const first7Days2026 = historicalData
    .filter((d) => d.day <= 7)
    .reduce((acc, curr) => acc + curr['2026'], 0);
  const first7Days2025 = historicalData
    .filter((d) => d.day <= 7)
    .reduce((acc, curr) => acc + curr['2025'], 0);
  const growthFirst7Days =
    first7Days2025 > 0
      ? Math.round(((first7Days2026 - first7Days2025) / first7Days2025) * 100)
      : 0;

  // Días donde 2026 superó a 2025
  const daysWhere2026Beats2025 = historicalData.filter(
    (d) => d['2026'] > d['2025']
  ).length;

  // Promedio diario (mes completo)
  const avgDaily2026 =
    lastAvailableDay > 0 ? Math.round(totals['2026'] / lastAvailableDay) : 0;
  const avgDaily2025 =
    lastAvailableDay > 0 ? Math.round(totals['2025'] / lastAvailableDay) : 0;
  const avgGrowth =
    avgDaily2025 > 0
      ? Math.round(((avgDaily2026 - avgDaily2025) / avgDaily2025) * 100)
      : 0;

  // Últimos 5 días (27-31) — solo tiene sentido cuando hay datos de esos días
  const hasLast5DaysData = lastAvailableDay >= 27;
  const last5Days = historicalData.filter((d) => d.day >= 27);
  const last5Days2026 = last5Days.reduce((acc, d) => acc + d['2026'], 0);
  const last5Days2025 = last5Days.reduce((acc, d) => acc + d['2025'], 0);
  const growthLast5Vs2025 =
    last5Days2025 > 0
      ? Math.round(((last5Days2026 - last5Days2025) / last5Days2025) * 100)
      : 0;

  // Pico del día 31 (solo si existe ese día en el mes)
  const day31Data = historicalData.find((d) => d.day === 31);
  const day31Max = day31Data
    ? Math.max(day31Data['2024'], day31Data['2025'], day31Data['2026'])
    : 0;

  const growth24vs26 = Number(growthMetrics.growth24vs26);
  const growthFormatted =
    growth24vs26 >= 0 ? `+${growth24vs26}%` : `${growth24vs26}%`;
  const totalAllYears = totals['2024'] + totals['2025'] + totals['2026'];

  // Conclusiones condicionales según los datos reales
  const insight1Title =
    growthFirst7Days > 0 ? 'Arranque Acelerado' : 'Arranque del Mes';
  const insight1Conclusion =
    growthFirst7Days > 0
      ? 'indicando mayor adopción del portal.'
      : growthFirst7Days < 0
        ? 'reflejando menor actividad respecto al mismo período de 2025.'
        : 'sin variación respecto al mismo período de 2025.';

  const insight2Title =
    avgGrowth >= 0 ? 'Promedio Diario Superior' : 'Comparativa de Promedio';
  const insight2GrowthPhrase =
    avgGrowth > 0
      ? `un ${avgGrowth}% más que 2025`
      : avgGrowth < 0
        ? `un ${Math.abs(avgGrowth)}% menos que 2025`
        : 'igual que 2025';

  const insight3Conclusion =
    growth24vs26 > 0
      ? 'refleja una adopción orgánica y consistente del portal por los ciudadanos.'
      : growth24vs26 < 0
        ? 'refleja la evolución del portal en el período analizado.'
        : 'indica estabilidad en el uso del portal en el período analizado.';

  const insights = [
    {
      title: insight1Title,
      description: (
        <>
          Los primeros 7 días de {monthName.toLowerCase()} 2026 registraron{' '}
          <span className="text-emerald-400 font-semibold">
            {first7Days2026.toLocaleString()} pagos
          </span>
          , un crecimiento del {growthFirst7Days}% respecto al mismo período de
          2025,{' '}
          {insight1Conclusion}
        </>
      ),
      color: 'emerald',
      bgColor: 'bg-emerald-500/20',
      iconColor: '#34d399',
    },
    {
      title: insight2Title,
      description: (
        <>
          El promedio diario de 2026 fue de{' '}
          <span className="text-violet-400 font-semibold">
            {avgDaily2026.toLocaleString()} pagos/día
          </span>
          , {insight2GrowthPhrase}. En {daysWhere2026Beats2025} de{' '}
          {lastAvailableDay} días, 2026 superó al año anterior.
        </>
      ),
      color: 'violet',
      bgColor: 'bg-violet-500/20',
      iconColor: '#a78bfa',
    },
    {
      title: 'Tendencia en el Período',
      description: (
        <>
          El crecimiento del{' '}
          <span
            className={
              growth24vs26 >= 0
                ? 'text-cyan-400 font-semibold'
                : 'text-amber-400 font-semibold'
            }
          >
            {growthFormatted}
          </span>{' '}
          en dos años (2024 vs 2026) {insight3Conclusion}
        </>
      ),
      color: 'cyan',
      bgColor: 'bg-cyan-500/20',
      iconColor: '#22d3ee',
    },
  ];

  return (
    <>
      {/* Análisis Estratégico */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6, delay: 0.5 }}
        className="bg-slate-800/40 backdrop-blur-sm rounded-2xl border border-slate-700/50 p-6 min-w-0 overflow-hidden"
      >
        <h3 className="text-lg font-bold text-white mb-5 flex items-center gap-2 font-display">
          <BarChart3 size={20} className="text-violet-500 shrink-0" />
          Análisis Estratégico
        </h3>
        <div className="flex flex-col gap-4">
          {insights.map((insight, index) => (
            <div
              key={index}
              className="flex gap-3 p-4 bg-slate-700/30 rounded-xl hover:bg-slate-700/50 transition-colors"
            >
              <div className={`${insight.bgColor} p-2.5 rounded-lg h-fit shrink-0`}>
                <ChevronRight size={16} color={insight.iconColor} />
              </div>
              <div className="min-w-0">
                <h4 className="font-semibold text-white mb-1 text-sm">{insight.title}</h4>
                <p className="text-xs text-slate-400 leading-relaxed">
                  {insight.description}
                </p>
              </div>
            </div>
          ))}
        </div>
      </motion.div>

      {/* Resumen Cierre de Mes + Resumen Rápido — combinados para mejor distribución */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6, delay: 0.55 }}
        className="flex flex-col gap-6 bg-slate-800/40 backdrop-blur-sm rounded-2xl border border-slate-700/50 p-6 min-w-0 overflow-hidden"
      >
        {/* Resumen Cierre de Mes */}
        <div className="flex items-start gap-3 p-4 bg-linear-to-br from-emerald-500/15 to-cyan-500/5 rounded-xl border border-emerald-500/20">
          <div className="bg-emerald-500/30 p-2.5 rounded-xl shrink-0">
            <Trophy size={18} className="text-emerald-400" />
          </div>
          <div className="min-w-0 flex-1">
            <h4 className="font-bold text-white mb-2 text-sm">Resumen Cierre de Mes</h4>
            {hasLast5DaysData ? (
              <p className="text-xs text-slate-200 leading-relaxed">
                Los últimos 5 días (27-31) registraron{' '}
                <span className="text-emerald-400 font-bold">
                  {last5Days2026.toLocaleString()} pagos
                </span>{' '}
                en 2026, un{' '}
                <span
                  className={
                    Number(growthLast5Vs2025) >= 0
                      ? 'text-emerald-400 font-semibold'
                      : 'text-red-400 font-semibold'
                  }
                >
                  {growthLast5Vs2025 >= 0 ? '+' : ''}
                  {growthLast5Vs2025}%
                </span>{' '}
                vs 2025 ({last5Days2025.toLocaleString()}). Pico día 31:{' '}
                <span className="text-amber-400 font-bold">
                  {day31Max.toLocaleString()}
                </span>{' '}
                (2024: {day31Data?.['2024']?.toLocaleString() ?? '—'}, 2025:{' '}
                {day31Data?.['2025']?.toLocaleString() ?? '—'}, 2026:{' '}
                {day31Data?.['2026']?.toLocaleString() ?? '—'}).
              </p>
            ) : (
              <p className="text-xs text-slate-200 leading-relaxed">
                Cierre de mes aún no disponible. Días 1-{lastAvailableDay} de{' '}
                {monthName.toLowerCase()} analizados hasta el momento. El resumen
                de los últimos 5 días se mostrará cuando haya datos completos.
              </p>
            )}
          </div>
        </div>

        {/* Resumen Rápido */}
        <div>
          <h4 className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-3">
            Resumen Rápido
          </h4>
          <div className="grid grid-cols-2 gap-3">
            <div className="text-center p-3 bg-slate-700/30 rounded-xl">
              <p className="text-xl font-bold text-emerald-400 tabular-nums">{lastAvailableDay}</p>
              <p className="text-[10px] text-slate-400 mt-0.5">Días analizados</p>
            </div>
            <div className="text-center p-3 bg-slate-700/30 rounded-xl">
              <p className="text-xl font-bold text-violet-400">3</p>
              <p className="text-[10px] text-slate-400 mt-0.5">Años comparados</p>
            </div>
            <div className="text-center p-3 bg-slate-700/30 rounded-xl">
              <p className="text-xl font-bold text-cyan-400 tabular-nums">
                {(totalAllYears / 1000).toFixed(0)}K+
              </p>
              <p className="text-[10px] text-slate-400 mt-0.5">Pagos totales</p>
            </div>
            <div className="text-center p-3 bg-slate-700/30 rounded-xl">
              <p className="text-xl font-bold text-amber-400 tabular-nums">{growthFormatted}</p>
              <p className="text-[10px] text-slate-400 mt-0.5">Crecimiento</p>
            </div>
          </div>
        </div>
      </motion.div>
    </>
  );
};
