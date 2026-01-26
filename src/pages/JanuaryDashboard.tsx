import { useMemo } from 'react';
import { motion } from 'framer-motion';
import { BarChart3, TrendingUp, Activity, Award, Info } from 'lucide-react';

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

// Data
import { 
  totals, 
  dailyAverages, 
  growth25vs26, 
  growth24vs26,
  lastAvailableDay,
  formatDayMonth,
  getHistoricalMax
} from '../data/historicalData';
import { getIntradayData } from '../data/intradayData';
import { todayIntradayData } from '../data/today-intraday';

// Types
import type { ForecastType, YearType } from '../types';

export const JanuaryDashboard = () => {
  // State using custom hooks
  const [activeYears, toggleYear] = useToggleState<YearType>(['2024', '2025', '2026']);
  const [activeForecast, toggleForecast] = useToggleState<ForecastType>(['probable']);

  // Obtener datos intradía para el total actualizado
  const intradayData = useMemo(() => getIntradayData(todayIntradayData), []);
  const intradayTotal = intradayData?.statistics.currentTotal || 0;

  // Memoized KPI data
  const kpiData = useMemo(() => {
    const historicalMax = getHistoricalMax();
    // Total 2026 = días completos + intradía actual
    const totalWithIntraday = totals['2026'] + intradayTotal;
    // Calcular crecimiento actualizado vs 2025
    const growthVs2025WithIntraday = (((totalWithIntraday / totals['2025']) - 1) * 100).toFixed(1);
    
    return {
      totalEvents: totalWithIntraday.toLocaleString(),
      totalEventsSubtitle: intradayTotal > 0 
        ? `YTD al ${formatDayMonth(lastAvailableDay)} + intradía` 
        : `YTD al ${formatDayMonth(lastAvailableDay)}`,
      biannualGrowth: `+${growth24vs26}%`,
      dailyAverage: dailyAverages['2026'].toLocaleString(),
      prevDailyAverage: dailyAverages['2025'].toLocaleString(),
      growthVs2025: intradayTotal > 0 ? `+${growthVs2025WithIntraday}%` : `+${growth25vs26}%`,
      maxValue: historicalMax.value.toLocaleString(),
      maxDate: `${historicalMax.day} de Enero ${historicalMax.year}`,
    };
  }, [intradayTotal]);

  return (
    <div className="space-y-8 animate-in fade-in duration-500">
      {/* Context Header */}
      <div className="flex items-center gap-3 mb-6 bg-slate-800/40 p-4 rounded-xl border border-slate-700/50 backdrop-blur-sm">
        <Info className="text-emerald-400" size={24} />
        <div>
          <h2 className="text-lg font-bold text-white">Análisis Táctico: Enero 2026</h2>
          <p className="text-sm text-slate-400">
            Seguimiento diario del mes de mayor recaudación. Comparativa vs. Enero 2024 y 2025.
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
