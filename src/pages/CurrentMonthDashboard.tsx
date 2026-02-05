import { useMemo, useState } from 'react';
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
  HeatmapChart,
} from '../components/charts';
import {
  NotesSection,
  InsightsSection,
  AccumulatedSection,
  StatsSection,
  IntradaySection,
  DayDetailModal,
} from '../components/sections';

// Hooks
import { useToggleState } from '../hooks';

// Types
import type { ForecastType, YearType } from '../types';

const MONTH_NAMES: Record<number, string> = {
  1: 'Enero',
  2: 'Febrero',
  3: 'Marzo',
  4: 'Abril',
  5: 'Mayo',
  6: 'Junio',
  7: 'Julio',
  8: 'Agosto',
  9: 'Septiembre',
  10: 'Octubre',
  11: 'Noviembre',
  12: 'Diciembre',
};

const formatDayMonth = (day: number, month: string = 'Enero'): string => {
  return `${day} de ${month}`;
};

export const CurrentMonthDashboard = () => {
  const now = new Date();
  const currentMonth = now.getMonth() + 1; // 1-12
  const currentYear = now.getFullYear();
  const monthName = MONTH_NAMES[currentMonth] ?? '';

  const [activeYears, toggleYear] = useToggleState<YearType>(['2024', '2025', '2026']);
  const [activeForecast, toggleForecast] = useToggleState<ForecastType>(['probable']);
  const [selectedDay, setSelectedDay] = useState<number | null>(null);

  // Queries con el mes actual
  const totals = useQuery(api.queries.getTotals, { month: currentMonth });
  const historicalData = useQuery(api.queries.getHistoricalData, { month: currentMonth });
  const dailyAverages = useQuery(api.queries.getDailyAverages, { month: currentMonth });
  const growthMetrics = useQuery(api.queries.getGrowthMetrics, { month: currentMonth });
  const historicalMax = useQuery(api.queries.getHistoricalMax, { month: currentMonth });
  const intradayData = useQuery(api.queries.getIntradayData);
  const lastAvailableDay = useQuery(api.queries.getLastAvailableDay, { month: currentMonth });

  const intradayTotal = intradayData?.statistics?.currentTotal ?? 0;

  const kpiData = useMemo(() => {
    if (!totals || !dailyAverages || !growthMetrics || !historicalMax) {
      return null;
    }

    const totalWithIntraday = totals['2026'] + intradayTotal;
    const growthVs2025WithIntraday =
      totals['2025'] > 0
        ? (((totalWithIntraday / totals['2025']) - 1) * 100).toFixed(1)
        : '0.0';

    const currentDay = lastAvailableDay ?? 1;
    const absoluteDelta = Math.round(totalWithIntraday - totals['2025']);
    const sparklineData = historicalData
      ? historicalData.slice(-7).map((d) => d['2026'])
      : undefined;

    return {
      totalEvents: totalWithIntraday.toLocaleString(),
      totalEventsSubtitle:
        intradayTotal > 0
          ? `YTD al ${formatDayMonth(currentDay, monthName)} + intradía`
          : `YTD al ${formatDayMonth(currentDay, monthName)}`,
      biannualGrowth: `+${growthMetrics.growth24vs26}%`,
      dailyAverage: dailyAverages['2026'].toLocaleString(),
      prevDailyAverage: dailyAverages['2025'].toLocaleString(),
      growthVs2025:
        intradayTotal > 0 ? `+${growthVs2025WithIntraday}%` : `+${growthMetrics.growth25vs26}%`,
      maxValue: historicalMax.value.toLocaleString(),
      maxDate: `${historicalMax.day} de ${monthName} ${historicalMax.year}`,
      absoluteDelta,
      sparklineData,
    };
  }, [
    totals,
    dailyAverages,
    growthMetrics,
    historicalMax,
    intradayTotal,
    lastAvailableDay,
    monthName,
    historicalData,
  ]);

  if (!kpiData) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="flex flex-col items-center gap-4">
          <Loader2 className="w-8 h-8 animate-spin text-emerald-500" />
          <p className="text-slate-400">Cargando datos del mes actual...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-10 animate-in fade-in duration-500 min-w-0 max-w-full">
      {/* Context Header */}
      <div className="flex items-center gap-3 mb-6 bg-slate-800/40 p-4 rounded-xl border border-slate-700/50 backdrop-blur-sm">
        <Info className="text-cyan-400" size={24} />
        <div>
          <h2 className="text-lg font-bold text-white">
            Mes Actual: {monthName} {currentYear}
          </h2>
          <p className="text-sm text-slate-400">
            Desempeño del mes en curso. Comparativa vs. {monthName} 2024 y 2025.
            {intradayData?.lastExtraction && (
              <span className="ml-2 text-emerald-400">
                · Última actualización: {intradayData.lastExtraction}
              </span>
            )}
          </p>
        </div>
      </div>

      {/* Intradía - Prioridad (datos en tiempo real) */}
      <IntradaySection monthName={monthName} />

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

      <div className="min-w-0">
        <HistoricalChart
          activeYears={activeYears}
          onToggleYear={toggleYear}
          month={currentMonth}
          monthName={monthName}
        />
      </div>

      <div className="min-w-0">
        <AccumulatedSection month={currentMonth} monthName={monthName} />
      </div>

      <div className="min-w-0">
        <StatsSection month={currentMonth} />
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-2 gap-8 min-w-0">
        <HourlyChart
          activeYears={activeYears}
          onToggleYear={toggleYear}
          month={currentMonth}
          monthName={monthName}
        />
        <HeatmapChart
          year="2026"
          month={currentMonth}
          monthName={monthName}
          onDaySelect={setSelectedDay}
        />
      </div>

      <NotesSection month={currentMonth} monthName={monthName} />

      <ForecastChart
        activeForecast={activeForecast}
        onToggleForecast={toggleForecast}
        activeYears={activeYears}
        onToggleYear={toggleYear}
        month={currentMonth}
        monthName={monthName}
      />

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 min-w-0">
        <InsightsSection month={currentMonth} monthName={monthName} />
      </div>

      <DayDetailModal
        day={selectedDay}
        onClose={() => setSelectedDay(null)}
        month={currentMonth}
        monthName={monthName}
      />
    </div>
  );
};
