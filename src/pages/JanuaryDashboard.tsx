import { useMemo, useState } from 'react';
import { motion } from 'framer-motion';
import { BarChart3, TrendingUp, Activity, Award, Info, Loader2 } from 'lucide-react';
import { useQuery } from 'convex/react';
import { api } from '../../convex/_generated/api';

// Components
import { KPICard } from '../components/ui';
import {
  HistoricalChart,
  HourlyChart,
  HeatmapChart,
} from '../components/charts';
import {
  NotesSection,
  InsightsSection,
  AccumulatedSection,
  StatsSection,
  DayDetailModal,
} from '../components/sections';

// Hooks
import { useToggleState } from '../hooks';

// Types
import type { YearType } from '../types';

export const JanuaryDashboard = () => {
  const [activeYears, toggleYear] = useToggleState<YearType>(['2024', '2025', '2026']);
  const [selectedDay, setSelectedDay] = useState<number | null>(null);

  // Convex queries (mes 1 = Enero)
  const totals = useQuery(api.queries.getTotals, { month: 1 });
  const historicalData = useQuery(api.queries.getHistoricalData, { month: 1 });
  const dailyAverages = useQuery(api.queries.getDailyAverages, { month: 1 });
  const growthMetrics = useQuery(api.queries.getGrowthMetrics, { month: 1 });
  const historicalMax = useQuery(api.queries.getHistoricalMax, { month: 1 });
  const lastAvailableDay = useQuery(api.queries.getLastAvailableDay, { month: 1 });

  // Memoized KPI data (mes completo - sin intradía)
  const kpiData = useMemo(() => {
    if (!totals || !dailyAverages || !growthMetrics || !historicalMax) {
      return null;
    }

    const currentDay = lastAvailableDay ?? 31;
    const absoluteDelta = totals['2026'] - totals['2025'];
    const sparklineData = historicalData
      ? historicalData.slice(-7).map((d) => d['2026'])
      : undefined;

    return {
      totalEvents: totals['2026'].toLocaleString(),
      totalEventsSubtitle: `Enero completo (días 1-${currentDay})`,
      biannualGrowth: `+${growthMetrics.growth24vs26}%`,
      dailyAverage: dailyAverages['2026'].toLocaleString(),
      prevDailyAverage: dailyAverages['2025'].toLocaleString(),
      growthVs2025: `+${growthMetrics.growth25vs26}%`,
      maxValue: historicalMax.value.toLocaleString(),
      maxDate: `${historicalMax.day} de Enero ${historicalMax.year}`,
      absoluteDelta,
      sparklineData,
    };
  }, [totals, dailyAverages, growthMetrics, historicalMax, lastAvailableDay, historicalData]);

  // Loading state
  if (!kpiData) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="flex flex-col items-center gap-4">
          <Loader2 className="w-8 h-8 animate-spin text-emerald-500" />
          <p className="text-slate-400">Cargando datos del dashboard...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-10 animate-in fade-in duration-500 min-w-0 max-w-full">
      {/* Context Header */}
      <div className="flex items-center gap-3 mb-6 bg-slate-800/40 p-5 rounded-xl border border-slate-700/50 backdrop-blur-sm min-w-0">
        <Info className="text-emerald-400" size={24} />
        <div>
          <h2 className="text-lg font-bold text-white">Análisis Completo: Enero 2026</h2>
          <p className="text-sm text-slate-400">
            Mes cerrado. Comparativa histórica 2024-2025-2026. Haz clic en una celda del mapa de calor para ver el detalle e intradía del día.
          </p>
        </div>
      </div>

      {/* KPI Cards */}
      <motion.div 
        className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4"
        initial="hidden"
        animate="visible"
        variants={{
          hidden: { opacity: 0 },
          visible: {
            opacity: 1,
            transition: {
              staggerChildren: 0.1,
              delayChildren: 0.1,
            },
          },
        }}
      >
        <KPICard
          title="Total Pagos 2026"
          value={kpiData.totalEvents}
          subtitle={kpiData.totalEventsSubtitle}
          icon={BarChart3}
          trend="up"
          trendValue={kpiData.growthVs2025}
          accent
          absoluteDelta={kpiData.absoluteDelta}
          sparklineData={kpiData.sparklineData}
          tooltip="Tendencia de los últimos 7 días del mes"
        />
        <KPICard
          title="Crecimiento Bianual"
          value={kpiData.biannualGrowth}
          subtitle="2024 vs 2026 (mismo período)"
          icon={TrendingUp}
        />
        <KPICard
          title="Promedio Diario 2026"
          value={kpiData.dailyAverage}
          subtitle={`vs ${kpiData.prevDailyAverage} en 2025`}
          icon={Activity}
        />
        <KPICard
          title="Máximo Histórico"
          value={kpiData.maxValue}
          subtitle={kpiData.maxDate}
          icon={Award}
        />
      </motion.div>

      {/* Gráfico Principal - Full width */}
      <div className="w-full">
        <HistoricalChart
          activeYears={activeYears}
          onToggleYear={toggleYear}
        />
      </div>

      {/* Acumulado - Sección completa para mejor legibilidad */}
      <div className="min-w-0">
        <AccumulatedSection />
      </div>

      {/* Stats - L-V vs S-D y Distribución por Semana */}
      <div className="min-w-0">
        <StatsSection />
      </div>

      {/* Hourly + Heatmap */}
      <div className="grid grid-cols-1 xl:grid-cols-2 gap-8 min-w-0">
        <HourlyChart 
          activeYears={activeYears}
          onToggleYear={toggleYear}
        />
        <HeatmapChart year="2026" onDaySelect={setSelectedDay} />
      </div>

      {/* Notes e Insights - 2 columnas: Análisis Estratégico | Resumen Cierre + Rápido */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 min-w-0">
        <NotesSection />
        <InsightsSection />
      </div>

      {/* Modal de detalle por día */}
      <DayDetailModal day={selectedDay} onClose={() => setSelectedDay(null)} />
    </div>
  );
};
