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

  // Últimos 5 días (27-31)
  const last5Days = historicalData.filter((d) => d.day >= 27);
  const last5Days2026 = last5Days.reduce((acc, d) => acc + d['2026'], 0);
  const last5Days2025 = last5Days.reduce((acc, d) => acc + d['2025'], 0);
  const growthLast5Vs2025 =
    last5Days2025 > 0
      ? Math.round(((last5Days2026 - last5Days2025) / last5Days2025) * 100)
      : 0;

  // Pico del día 31
  const day31Data = historicalData.find((d) => d.day === 31);
  const day31Max = day31Data
    ? Math.max(day31Data['2024'], day31Data['2025'], day31Data['2026'])
    : 0;

  const growthFormatted = `+${growthMetrics.growth24vs26}%`;
  const totalAllYears = totals['2024'] + totals['2025'] + totals['2026'];

  const insights = [
    {
      title: 'Arranque Acelerado',
      description: (
        <>
          Los primeros 7 días de {monthName.toLowerCase()} 2026 registraron{' '}
          <span className="text-emerald-400 font-semibold">
            {first7Days2026.toLocaleString()} pagos
          </span>
          , un crecimiento del {growthFirst7Days}% respecto al mismo período de
          2025, indicando mayor adopción del portal.
        </>
      ),
      color: 'emerald',
      bgColor: 'bg-emerald-500/20',
      iconColor: '#34d399',
    },
    {
      title: 'Promedio Diario Superior',
      description: (
        <>
          El promedio diario de 2026 fue de{' '}
          <span className="text-violet-400 font-semibold">
            {avgDaily2026.toLocaleString()} pagos/día
          </span>
          , un {avgGrowth}% más que 2025. En {daysWhere2026Beats2025} de{' '}
          {lastAvailableDay} días, 2026 superó al año anterior.
        </>
      ),
      color: 'violet',
      bgColor: 'bg-violet-500/20',
      iconColor: '#a78bfa',
    },
    {
      title: 'Tendencia Sostenible',
      description: (
        <>
          El crecimiento del{' '}
          <span className="text-cyan-400 font-semibold">{growthFormatted}</span>{' '}
          en dos años refleja una adopción orgánica y consistente del portal por
          los ciudadanos.
        </>
      ),
      color: 'cyan',
      bgColor: 'bg-cyan-500/20',
      iconColor: '#22d3ee',
    },
  ];

  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
      {/* Strategic Analysis */}
      <motion.div
        initial={{ opacity: 0, x: -30 }}
        animate={{ opacity: 1, x: 0 }}
        transition={{ duration: 0.6, delay: 0.5 }}
        className="bg-slate-800/40 backdrop-blur-sm rounded-3xl border border-slate-700/50 p-6"
      >
        <h3 className="text-xl font-bold text-white mb-6 flex items-center gap-2 font-display">
          <BarChart3 size={20} className="text-violet-500" />
          Análisis Estratégico
        </h3>
        
        <div className="flex flex-col gap-4">
          {insights.map((insight, index) => (
            <div
              key={index}
              className="flex gap-4 p-4 bg-slate-700/30 rounded-xl hover:bg-slate-700/50 transition-colors duration-200"
            >
              <div className={`${insight.bgColor} p-3 rounded-xl h-fit`}>
                <ChevronRight size={18} color={insight.iconColor} />
              </div>
              <div>
                <h4 className="font-semibold text-white mb-1">{insight.title}</h4>
                <p className="text-sm text-slate-400 leading-relaxed">
                  {insight.description}
                </p>
              </div>
            </div>
          ))}
        </div>
      </motion.div>

      {/* Alert Card */}
      <motion.div
        initial={{ opacity: 0, x: 30 }}
        animate={{ opacity: 1, x: 0 }}
        transition={{ duration: 0.6, delay: 0.5 }}
        className="flex flex-col gap-6"
      >
        <div className="bg-linear-to-br from-emerald-500/20 to-cyan-500/10 border border-emerald-500/30 rounded-3xl p-6">
          <div className="flex items-start gap-4">
            <div className="bg-emerald-500/30 p-3 rounded-xl">
              <Trophy size={24} className="text-emerald-400" />
            </div>
            <div>
              <h4 className="font-bold text-white mb-2">
                Resumen Cierre de Mes
              </h4>
              <p className="text-sm text-slate-200 leading-relaxed mb-4">
                Los últimos 5 días (27-31) registraron{' '}
                <span className="text-emerald-400 font-bold">
                  {last5Days2026.toLocaleString()} pagos
                </span>{' '}
                en 2026, un{' '}
                <span
                  className={
                    growthLast5Vs2025 >= 0
                      ? 'text-emerald-400 font-semibold'
                      : 'text-red-400 font-semibold'
                  }
                >
                  {growthLast5Vs2025 >= 0 ? '+' : ''}
                  {growthLast5Vs2025}%
                </span>{' '}
                vs 2025 ({last5Days2025.toLocaleString()}). El pico del día 31
                alcanzó{' '}
                <span className="text-amber-400 font-bold">
                  {day31Max.toLocaleString()} pagos
                </span>{' '}
                (2024: {day31Data?.['2024']?.toLocaleString() ?? '—'}, 2025:{' '}
                {day31Data?.['2025']?.toLocaleString() ?? '—'}, 2026:{' '}
                {day31Data?.['2026']?.toLocaleString() ?? '—'}).
              </p>
            </div>
          </div>
        </div>

        {/* Quick Stats */}
        <div className="bg-slate-800/40 backdrop-blur-sm rounded-3xl border border-slate-700/50 p-6">
          <h4 className="text-sm font-semibold text-slate-400 uppercase tracking-wider mb-4">
            Resumen Rápido
          </h4>
          <div className="grid grid-cols-2 gap-4">
            <div className="text-center p-4 bg-slate-700/30 rounded-xl">
              <p className="text-2xl font-bold text-emerald-400">{lastAvailableDay}</p>
              <p className="text-xs text-slate-400 mt-1">Días analizados</p>
            </div>
            <div className="text-center p-4 bg-slate-700/30 rounded-xl">
              <p className="text-2xl font-bold text-violet-400">3</p>
              <p className="text-xs text-slate-400 mt-1">Años comparados</p>
            </div>
            <div className="text-center p-4 bg-slate-700/30 rounded-xl">
              <p className="text-2xl font-bold text-cyan-400">
                {(totalAllYears / 1000).toFixed(0)}K+
              </p>
              <p className="text-xs text-slate-400 mt-1">Pagos totales</p>
            </div>
            <div className="text-center p-4 bg-slate-700/30 rounded-xl">
              <p className="text-2xl font-bold text-amber-400">{growthFormatted}</p>
              <p className="text-xs text-slate-400 mt-1">Crecimiento</p>
            </div>
          </div>
        </div>
      </motion.div>
    </div>
  );
};
