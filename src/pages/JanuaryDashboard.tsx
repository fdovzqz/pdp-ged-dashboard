import { useMemo } from 'react';
import { motion } from 'framer-motion';
import { BarChart3, TrendingUp, Activity, Award, Info, Loader2 } from 'lucide-react';
import { useQuery } from 'convex/react';
import { api } from '../../convex/_generated/api';

// Components
import { KPICard } from '../components/ui';
import { 
  HistoricalChart, 
  ForecastChart,
  HourlyChart,
  HeatmapChart 
} from '../components/charts';
import { 
  NotesSection, 
  InsightsSection, 
  AccumulatedSection,
  StatsSection,
  IntradaySection
} from '../components/sections';

// Hooks
import { useToggleState } from '../hooks';

// Types
import type { ForecastType, YearType } from '../types';

// Helper para formatear fecha
const formatDayMonth = (day: number, month: string = 'Enero'): string => {
  return `${day} de ${month}`;
};

export const JanuaryDashboard = () => {
  // State using custom hooks
  const [activeYears, toggleYear] = useToggleState<YearType>(['2024', '2025', '2026']);
  const [activeForecast, toggleForecast] = useToggleState<ForecastType>(['probable']);

  // Convex queries
  const totals = useQuery(api.queries.getTotals);
  const dailyAverages = useQuery(api.queries.getDailyAverages);
  const growthMetrics = useQuery(api.queries.getGrowthMetrics);
  const historicalMax = useQuery(api.queries.getHistoricalMax);
  const intradayData = useQuery(api.queries.getIntradayData);
  const lastAvailableDay = useQuery(api.queries.getLastAvailableDay);

  // Datos calculados
  const intradayTotal = intradayData?.statistics?.currentTotal ?? 0;

  // Memoized KPI data
  const kpiData = useMemo(() => {
    if (!totals || !dailyAverages || !growthMetrics || !historicalMax) {
      return null;
    }

    // Total 2026 = días completos + intradía actual
    const totalWithIntraday = totals['2026'] + intradayTotal;
    // Calcular crecimiento actualizado vs 2025
    const growthVs2025WithIntraday = totals['2025'] > 0
      ? (((totalWithIntraday / totals['2025']) - 1) * 100).toFixed(1)
      : '0.0';
    
    const currentDay = lastAvailableDay ?? 25;
    
    return {
      totalEvents: totalWithIntraday.toLocaleString(),
      totalEventsSubtitle: intradayTotal > 0 
        ? `YTD al ${formatDayMonth(currentDay)} + intradía` 
        : `YTD al ${formatDayMonth(currentDay)}`,
      biannualGrowth: `+${growthMetrics.growth24vs26}%`,
      dailyAverage: dailyAverages['2026'].toLocaleString(),
      prevDailyAverage: dailyAverages['2025'].toLocaleString(),
      growthVs2025: intradayTotal > 0 ? `+${growthVs2025WithIntraday}%` : `+${growthMetrics.growth25vs26}%`,
      maxValue: historicalMax.value.toLocaleString(),
      maxDate: `${historicalMax.day} de Enero ${historicalMax.year}`,
    };
  }, [totals, dailyAverages, growthMetrics, historicalMax, intradayTotal, lastAvailableDay]);

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
    <div className="space-y-8 animate-in fade-in duration-500">
      {/* Context Header */}
      <div className="flex items-center gap-3 mb-6 bg-slate-800/40 p-4 rounded-xl border border-slate-700/50 backdrop-blur-sm">
        <Info className="text-emerald-400" size={24} />
        <div>
          <h2 className="text-lg font-bold text-white">Análisis Táctico: Enero 2026</h2>
          <p className="text-sm text-slate-400">
            Seguimiento diario del mes de mayor recaudación. Comparativa vs. Enero 2024 y 2025.
            {intradayData?.lastExtraction && (
              <span className="ml-2 text-emerald-400">
                · Última actualización: {intradayData.lastExtraction}
              </span>
            )}
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

      {/* Intraday Section - Solo se muestra si hay datos del día actual */}
      <IntradaySection />

      {/* Main Charts Section */}
      <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
        <HistoricalChart
          activeYears={activeYears}
          onToggleYear={toggleYear}
        />
      </div>

      {/* Accumulated Section */}
      <div>
        <AccumulatedSection />
      </div>

      {/* Stats Section */}
      <div>
        <StatsSection />
      </div>

      {/* New Charts Row: Hourly + Heatmap */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <HourlyChart 
          activeYears={activeYears}
          onToggleYear={toggleYear}
        />
        <HeatmapChart year="2026" />
      </div>

      {/* Notes Section */}
      <div>
        <NotesSection />
      </div>

      {/* Forecast Section */}
      <div>
        <ForecastChart
          activeForecast={activeForecast}
          onToggleForecast={toggleForecast}
          activeYears={activeYears}
          onToggleYear={toggleYear}
        />
      </div>

      {/* Insights Section */}
      <div>
        <InsightsSection />
      </div>
    </div>
  );
};
