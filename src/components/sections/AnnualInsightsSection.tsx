import { motion } from 'framer-motion';
import {
  BarChart3,
  Trophy,
  TrendingUp,
  TrendingDown,
  Calendar,
} from 'lucide-react';
import { useQuery } from 'convex/react';
import { api } from '../../../convex/_generated/api';

export const AnnualInsightsSection = () => {
  const totals = useQuery(api.queries.getAnnualTotals);
  const growth = useQuery(api.queries.getAnnualGrowth);
  const stats = useQuery(api.queries.getAnnualStats);
  const quarterly = useQuery(api.queries.getAnnualQuarterlyData);
  const dailyAverages = useQuery(api.queries.getAnnualDailyAverages);

  if (!totals || !growth || !stats || !quarterly || !dailyAverages) {
    return null;
  }

  const growthPct = Number(growth.percentage);
  const growthPct2026 = Number(growth.percentage2026);
  const totalAllYears = totals['2024'] + totals['2025'] + totals['2026'];

  const dailyAvg2025 = Math.round(
    dailyAverages['2025'].sum / dailyAverages['2025'].days
  );
  const dailyAvg2026 =
    dailyAverages['2026'].days > 0
      ? Math.round(dailyAverages['2026'].sum / dailyAverages['2026'].days)
      : 0;

  // Mejor trimestre por crecimiento 2024→2025
  const quarterLabels = ['Q1 (Ene-Mar)', 'Q2 (Abr-Jun)', 'Q3 (Jul-Sep)', 'Q4 (Oct-Dic)'] as const;
  const quarters = (['Q1', 'Q2', 'Q3', 'Q4'] as const).map((q, idx) => {
    const v2024 = quarterly['2024'][q];
    const v2025 = quarterly['2025'][q];
    const growthQ = v2024 > 0 ? ((v2025 - v2024) / v2024) * 100 : 0;
    return { quarter: q, label: quarterLabels[idx], growth: growthQ };
  });
  const bestQuarter = quarters.reduce((a, b) =>
    a.growth >= b.growth ? a : b
  );
  const worstQuarter = quarters.reduce((a, b) =>
    a.growth <= b.growth ? a : b
  );

  // Conclusiones condicionales
  const insight1Title =
    growthPct > 0 ? 'Crecimiento Anual Sólido' : 'Evolución Anual';
  const insight1Conclusion =
    growthPct > 0
      ? `El crecimiento del ${growthPct >= 0 ? '+' : ''}${growthPct}% en 2025 respecto a 2024 refleja una adopción sostenida del portal de pagos.`
      : growthPct < 0
        ? `La variación del ${growthPct}% entre 2024 y 2025 indica ajustes en el patrón de uso del portal.`
        : 'El volumen se mantuvo estable entre 2024 y 2025.';

  const insight2Title =
    stats.monthsWithGrowth >= 7
      ? 'Consistencia Mensual'
      : stats.monthsWithDecline >= 7
        ? 'Variabilidad Mensual'
        : 'Patrón Mixto';
  const insight2Conclusion =
    stats.monthsWithGrowth >= 7
      ? `${stats.monthsWithGrowth} de 12 meses registraron crecimiento en 2025 vs 2024, indicando una tendencia positiva generalizada.`
      : stats.monthsWithDecline >= 7
        ? `${stats.monthsWithDecline} de 12 meses mostraron descenso, sugiriendo factores estacionales o externos.`
        : `Balance mixto: ${stats.monthsWithGrowth} meses con crecimiento y ${stats.monthsWithDecline} con descenso.`;

  const insight3Title = 'Trimestre Destacado';
  const insight3Conclusion =
    bestQuarter.growth > 0
      ? `${bestQuarter.label} fue el trimestre con mayor crecimiento (${bestQuarter.growth >= 0 ? '+' : ''}${bestQuarter.growth.toFixed(1)}% 2024→2025), impulsando el resultado anual.`
      : `Todos los trimestres mostraron variaciones; ${worstQuarter.label} registró ${worstQuarter.growth.toFixed(1)}% (2024→2025).`;

  const insight4Title = stats.maxMonth2026 ? '2026 en Curso' : 'Mejor Mes Histórico';
  const insight4Conclusion = stats.maxMonth2026
    ? growthPct2026 > 0
      ? `Enero 2026 registró ${totals['2026'].toLocaleString()} pagos, un ${growthPct2026 >= 0 ? '+' : ''}${growthPct2026}% vs mismo período de 2025. Promedio diario: ${dailyAvg2026.toLocaleString()} (2025: ${dailyAvg2025.toLocaleString()}).`
      : `Enero 2026: ${totals['2026'].toLocaleString()} pagos (${growthPct2026}% vs 2025). Datos parciales del año en curso.`
    : `${stats.maxMonth2025.monthName} fue el mes más activo de 2025 con ${stats.maxMonth2025['2025'].toLocaleString()} pagos (+${stats.maxMonth2025.growthRate.toFixed(1)}% vs 2024).`;

  const insights = [
    {
      title: insight1Title,
      description: insight1Conclusion,
      color: 'emerald',
      bgColor: 'bg-emerald-500/20',
      iconColor: '#34d399',
      icon: growthPct >= 0 ? TrendingUp : TrendingDown,
    },
    {
      title: insight2Title,
      description: insight2Conclusion,
      color: 'violet',
      bgColor: 'bg-violet-500/20',
      iconColor: '#a78bfa',
      icon: BarChart3,
    },
    {
      title: insight3Title,
      description: insight3Conclusion,
      color: 'cyan',
      bgColor: 'bg-cyan-500/20',
      iconColor: '#22d3ee',
      icon: Calendar,
    },
    {
      title: insight4Title,
      description: insight4Conclusion,
      color: 'amber',
      bgColor: 'bg-amber-500/20',
      iconColor: '#f59e0b',
      icon: Trophy,
    },
  ];

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.6, delay: 0.3 }}
      className="bg-slate-800/40 backdrop-blur-sm rounded-2xl border border-slate-700/50 p-6 min-w-0 overflow-hidden"
    >
      <h3 className="text-lg font-bold text-white mb-5 flex items-center gap-2 font-display">
        <BarChart3 size={20} className="text-violet-500 shrink-0" />
        Análisis y Conclusiones
      </h3>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {insights.map((insight, index) => {
          const Icon = insight.icon;
          return (
            <motion.div
              key={index}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.4, delay: 0.35 + index * 0.05 }}
              className="flex gap-3 p-4 bg-slate-700/30 rounded-xl hover:bg-slate-700/50 transition-colors"
            >
              <div
                className={`${insight.bgColor} p-2.5 rounded-lg h-fit shrink-0`}
              >
                <Icon size={16} color={insight.iconColor} />
              </div>
              <div className="min-w-0">
                <h4 className="font-semibold text-white mb-1 text-sm">
                  {insight.title}
                </h4>
                <p className="text-xs text-slate-400 leading-relaxed">
                  {insight.description}
                </p>
              </div>
            </motion.div>
          );
        })}
      </div>

      {/* Resumen Rápido */}
      <div className="mt-6 pt-6 border-t border-slate-700/50">
        <h4 className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-4">
          Resumen Ejecutivo
        </h4>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          <div className="text-center p-3 bg-slate-700/30 rounded-xl">
            <p className="text-xl font-bold text-emerald-400 tabular-nums">
              {(totalAllYears / 1000).toFixed(0)}K+
            </p>
            <p className="text-[10px] text-slate-400 mt-0.5">Pagos totales</p>
          </div>
          <div className="text-center p-3 bg-slate-700/30 rounded-xl">
            <p
              className={`text-xl font-bold tabular-nums ${
                growthPct >= 0 ? 'text-emerald-400' : 'text-red-400'
              }`}
            >
              {growthPct >= 0 ? '+' : ''}
              {growthPct}%
            </p>
            <p className="text-[10px] text-slate-400 mt-0.5">2024→2025</p>
          </div>
          <div className="text-center p-3 bg-slate-700/30 rounded-xl">
            <p
              className={`text-xl font-bold tabular-nums ${
                growthPct2026 >= 0 ? 'text-emerald-400' : 'text-amber-400'
              }`}
            >
              {growthPct2026 >= 0 ? '+' : ''}
              {growthPct2026}%
            </p>
            <p className="text-[10px] text-slate-400 mt-0.5">2025→2026</p>
          </div>
          <div className="text-center p-3 bg-slate-700/30 rounded-xl">
            <p className="text-xl font-bold text-violet-400 tabular-nums">
              {dailyAvg2025.toLocaleString()}
            </p>
            <p className="text-[10px] text-slate-400 mt-0.5">Prom. diario 2025</p>
          </div>
        </div>
      </div>
    </motion.div>
  );
};
