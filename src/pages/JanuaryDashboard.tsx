import { useState, useCallback, useMemo } from 'react';
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
  StatsSection
} from '../components/sections';

// Data
import { 
  totals, 
  dailyAverages, 
  growth25vs26, 
  growth24vs26 
} from '../data/historicalData';

// Types
import type { ForecastType, YearType } from '../types';

export const JanuaryDashboard = () => {
  // State
  const [activeYears, setActiveYears] = useState<YearType[]>(['2024', '2025', '2026']);
  const [activeForecast, setActiveForecast] = useState<ForecastType[]>([
    'probable',
  ]);

  // Handlers
  const toggleYear = useCallback((year: YearType) => {
    setActiveYears((prev) =>
      prev.includes(year) ? prev.filter((y) => y !== year) : [...prev, year]
    );
  }, []);

  const toggleForecast = useCallback((type: ForecastType) => {
    setActiveForecast((prev) =>
      prev.includes(type) ? prev.filter((t) => t !== type) : [...prev, type]
    );
  }, []);

  // Memoized KPI data
  const kpiData = useMemo(() => ({
    totalEvents: totals['2026'].toLocaleString(),
    biannualGrowth: `+${growth24vs26}%`,
    dailyAverage: dailyAverages['2026'].toLocaleString(),
    prevDailyAverage: dailyAverages['2025'].toLocaleString(),
    growthVs2025: `+${growth25vs26}%`,
  }), []);

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
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <KPICard
          title="Total Pagos 2026"
          value={kpiData.totalEvents}
          subtitle="YTD al 21 de Enero"
          icon={BarChart3}
          trend="up"
          trendValue={kpiData.growthVs2025}
          accent
          delay={0}
        />
        <KPICard
          title="Crecimiento Bianual"
          value={kpiData.biannualGrowth}
          subtitle="2024 vs 2026 (mismo período)"
          icon={TrendingUp}
          delay={0.1}
        />
        <KPICard
          title="Promedio Diario 2026"
          value={kpiData.dailyAverage}
          subtitle={`vs ${kpiData.prevDailyAverage} en 2025`}
          icon={Activity}
          delay={0.2}
        />
        <KPICard
          title="Máximo Histórico"
          value="6,290"
          subtitle="31 de Enero 2024"
          icon={Award}
          delay={0.3}
        />
      </div>

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
