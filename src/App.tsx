import { useState, useCallback, useMemo } from 'react';
import '@fontsource/dm-sans/400.css';
import '@fontsource/dm-sans/500.css';
import '@fontsource/dm-sans/700.css';
import '@fontsource/space-grotesk/500.css';
import '@fontsource/space-grotesk/700.css';
import { BarChart3, TrendingUp, Activity, Award } from 'lucide-react';

// Components
import { KPICard } from './components/ui';
import { 
  HistoricalChart, 
  ForecastChart,
  HourlyChart,
  HeatmapChart 
} from './components/charts';
import { 
  Header, 
  NotesSection, 
  InsightsSection, 
  StatsSection,
  AccumulatedSection,
  Footer 
} from './components/sections';

// Data
import { 
  totals, 
  dailyAverages, 
  growth25vs26, 
  growth24vs26 
} from './data/historicalData';

// Types
import type { ForecastType, YearType } from './types';

import './index.css';

const App = () => {
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

  const handleExport = useCallback(() => {
    // Future: Implement PDF/CSV export
    console.log('Export functionality coming soon');
  }, []);

  const handleFullscreen = useCallback(() => {
    if (document.fullscreenElement) {
      document.exitFullscreen();
    } else {
      document.documentElement.requestFullscreen();
    }
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
    <div className="min-h-screen bg-linear-to-br from-slate-950 via-slate-900 to-slate-950 text-white">
      {/* Background Pattern */}
      <div className="fixed inset-0 opacity-30 dot-pattern pointer-events-none" />

      {/* Main Content */}
      <div className="relative z-10 max-w-7xl mx-auto px-4 py-8 md:px-8">
        {/* Header */}
        <Header onExport={handleExport} onFullscreen={handleFullscreen} />

        {/* KPI Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
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
        <div className="grid grid-cols-1 xl:grid-cols-2 gap-6 mb-8">
          <HistoricalChart
            activeYears={activeYears}
            onToggleYear={toggleYear}
          />
        </div>

        {/* Accumulated Section */}
        <div className="mb-8">
          <AccumulatedSection />
        </div>

        {/* Stats Section */}
        <div className="mb-8">
          <StatsSection />
        </div>

        {/* New Charts Row: Hourly + Heatmap */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
          <HourlyChart 
            activeYears={activeYears}
            onToggleYear={toggleYear}
          />
          <HeatmapChart year="2026" />
        </div>

        {/* Notes Section */}
        <div className="mb-8">
          <NotesSection />
        </div>

        {/* Forecast Section */}
        <div className="mb-8">
          <ForecastChart
            activeForecast={activeForecast}
            onToggleForecast={toggleForecast}
            activeYears={activeYears}
            onToggleYear={toggleYear}
          />
        </div>

        {/* Insights Section */}
        <div className="mb-8">
          <InsightsSection />
        </div>

        {/* Footer */}
        <Footer />
      </div>
    </div>
  );
};

export default App;
