import { useMemo } from 'react';
import { motion } from 'framer-motion';
import { Info, BarChart3, TrendingUp, Trophy, Calendar, Loader2 } from 'lucide-react';
import { useQuery } from 'convex/react';
import { api } from '../../convex/_generated/api';
import { KPICard } from '../components/ui';
import {
  AnnualComparisonSection,
  AnnualInsightsSection,
} from '../components/sections';

export const AnnualDashboard = () => {
  const totals = useQuery(api.queries.getAnnualTotals);
  const growth = useQuery(api.queries.getAnnualGrowth);
  const stats = useQuery(api.queries.getAnnualStats);

  const kpiData = useMemo(() => {
    if (!totals || !growth || !stats) return null;
    const avgMonthly2025 = Math.round(totals['2025'] / 12);
    const bestMonth = stats.maxMonth2026 ?? stats.maxMonth2025;
    return {
      total2025: totals['2025'].toLocaleString(),
      growthPct: `${Number(growth.percentage) >= 0 ? '+' : ''}${growth.percentage}%`,
      bestMonthName: bestMonth.monthName,
      bestMonthValue: (stats.maxMonth2026?.['2026'] ?? stats.maxMonth2025['2025']).toLocaleString(),
      avgMonthly: avgMonthly2025.toLocaleString(),
    };
  }, [totals, growth, stats]);

  return (
    <div className="space-y-10 animate-in fade-in duration-500 min-w-0 max-w-full">
      {/* Context Header */}
      <div className="flex items-center gap-3 mb-6 bg-slate-800/40 p-4 rounded-xl border border-slate-700/50 backdrop-blur-sm">
        <Info className="text-violet-400" size={24} />
        <div>
          <h2 className="text-lg font-bold text-white">Análisis Estratégico Anual</h2>
          <p className="text-sm text-slate-400">
            Comparativa de crecimiento mensual y tendencias macro: 2024 vs 2025 vs 2026 (Enero).
          </p>
        </div>
      </div>

      {/* Hero KPIs */}
      {kpiData ? (
        <motion.div
          className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4"
          initial="hidden"
          animate="visible"
          variants={{
            hidden: { opacity: 0 },
            visible: {
              opacity: 1,
              transition: { staggerChildren: 0.1, delayChildren: 0.1 },
            },
          }}
        >
          <KPICard
            title="Total 2025"
            value={kpiData.total2025}
            subtitle="Pagos anuales completos"
            icon={BarChart3}
          />
          <KPICard
            title="Crecimiento Anual"
            value={kpiData.growthPct}
            subtitle="2024 → 2025"
            icon={TrendingUp}
          />
          <KPICard
            title="Mejor Mes"
            value={kpiData.bestMonthName}
            subtitle={`${kpiData.bestMonthValue} pagos`}
            icon={Trophy}
          />
          <KPICard
            title="Promedio Mensual"
            value={kpiData.avgMonthly}
            subtitle="2025 (12 meses)"
            icon={Calendar}
          />
        </motion.div>
      ) : (
        <div className="flex items-center justify-center min-h-[120px]">
          <Loader2 className="w-6 h-6 animate-spin text-violet-500" />
        </div>
      )}

      <AnnualComparisonSection />

      <AnnualInsightsSection />
    </div>
  );
};
