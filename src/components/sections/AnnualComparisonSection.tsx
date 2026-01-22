import { useState, useMemo } from 'react';
import { motion } from 'framer-motion';
import { 
  TrendingUp, 
  TrendingDown, 
  Calendar, 
  BarChart3, 
  ArrowUpRight, 
  ArrowDownRight,
  Layers
} from 'lucide-react';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  LineChart,
  Line,
  Legend,
  AreaChart,
  Area,
} from 'recharts';
import {
  monthlyComparisonData,
  monthlyAccumulatedData,
  annualTotals,
  annualGrowth,
  annualDailyAverages,
  annualStats,
  quarterlyData,
  ANNUAL_YEAR_COLORS,
} from '../../data/annualData';

type ViewMode = 'monthly' | 'accumulated';

export const AnnualComparisonSection = () => {
  const [viewMode, setViewMode] = useState<ViewMode>('accumulated');

  // Preparar datos para gráficos
  const chartData = useMemo(() => {
    if (viewMode === 'monthly') {
      return monthlyComparisonData.map((m) => ({
        name: m.monthName.substring(0, 3),
        fullName: m.monthName,
        '2024': m['2024'],
        '2025': m['2025'],
        difference: m.difference,
        growthRate: m.growthRate,
      }));
    }
    return monthlyAccumulatedData.map((m) => ({
      name: m.monthName.substring(0, 3),
      fullName: m.monthName,
      '2024': m.accumulated2024,
      '2025': m.accumulated2025,
      difference: m.accumulated2025 - m.accumulated2024,
    }));
  }, [viewMode]);

  // Tooltip personalizado
  const CustomTooltip = ({ active, payload, label }: {
    active?: boolean;
    payload?: Array<{ value: number; name: string; color: string }>;
    label?: string;
  }) => {
    if (active && payload && payload.length) {
      const fullName = chartData.find(d => d.name === label)?.fullName || label;
      const value2024 = payload.find(p => p.name === '2024')?.value || 0;
      const value2025 = payload.find(p => p.name === '2025')?.value || 0;
      const diff = value2025 - value2024;
      const growthPct = value2024 > 0 ? ((value2025 - value2024) / value2024 * 100).toFixed(1) : '0';
      
      return (
        <div className="bg-slate-800/95 backdrop-blur-sm border border-slate-600/50 rounded-xl p-4 shadow-xl">
          <p className="text-white font-semibold mb-3">{fullName}</p>
          <div className="space-y-2">
            <div className="flex items-center justify-between gap-4">
              <span className="text-pink-400 text-sm">2024:</span>
              <span className="text-white font-medium">{value2024.toLocaleString()}</span>
            </div>
            <div className="flex items-center justify-between gap-4">
              <span className="text-violet-400 text-sm">2025:</span>
              <span className="text-white font-medium">{value2025.toLocaleString()}</span>
            </div>
            <div className="pt-2 border-t border-slate-600/50">
              <div className="flex items-center justify-between gap-4">
                <span className="text-slate-400 text-sm">Diferencia:</span>
                <span className={`font-medium ${diff >= 0 ? 'text-emerald-400' : 'text-red-400'}`}>
                  {diff >= 0 ? '+' : ''}{diff.toLocaleString()}
                </span>
              </div>
              <div className="flex items-center justify-between gap-4 mt-1">
                <span className="text-slate-400 text-sm">Cambio:</span>
                <span className={`font-medium ${Number(growthPct) >= 0 ? 'text-emerald-400' : 'text-red-400'}`}>
                  {Number(growthPct) >= 0 ? '+' : ''}{growthPct}%
                </span>
              </div>
            </div>
          </div>
        </div>
      );
    }
    return null;
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 30 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.6, delay: 0.2 }}
      className="bg-slate-800/40 backdrop-blur-sm rounded-3xl border border-slate-700/50 p-6"
    >
      {/* Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 sm:gap-0 mb-6">
        <div className="flex items-center gap-2">
          <BarChart3 size={20} className="text-violet-400" />
          <h3 className="text-xl font-bold text-white font-display">
            Análisis Anual 2024 vs 2025
          </h3>
        </div>
        
        {/* View Mode Toggle */}
        <div className="flex bg-slate-700/50 rounded-lg p-1">
          <button
            onClick={() => setViewMode('monthly')}
            className={`px-4 py-2 rounded-md text-sm font-medium transition-all ${
              viewMode === 'monthly'
                ? 'bg-violet-600 text-white'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            Mensual
          </button>
          <button
            onClick={() => setViewMode('accumulated')}
            className={`px-4 py-2 rounded-md text-sm font-medium transition-all ${
              viewMode === 'accumulated'
                ? 'bg-violet-600 text-white'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            Acumulado
          </button>
        </div>
      </div>

      {/* Annual Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        {/* 2024 Total */}
        <div
          className="relative overflow-hidden rounded-2xl p-5"
          style={{
            background: `linear-gradient(135deg, ${ANNUAL_YEAR_COLORS['2024']}15, ${ANNUAL_YEAR_COLORS['2024']}05)`,
            border: `1px solid ${ANNUAL_YEAR_COLORS['2024']}40`,
          }}
        >
          <div className="flex items-center justify-between mb-3">
            <span
              className="text-sm font-bold px-3 py-1 rounded-full"
              style={{ backgroundColor: `${ANNUAL_YEAR_COLORS['2024']}30`, color: ANNUAL_YEAR_COLORS['2024'] }}
            >
              2024
            </span>
            <Calendar size={16} style={{ color: ANNUAL_YEAR_COLORS['2024'] }} />
          </div>
          <p className="text-3xl font-bold text-white mb-1">
            {annualTotals['2024'].toLocaleString()}
          </p>
          <p className="text-sm text-slate-400">pagos totales</p>
          <div className="mt-3 pt-3 border-t border-slate-700/50">
            <div className="flex justify-between items-center text-sm">
              <span className="text-slate-400">Prom. diario</span>
              <span className="font-semibold text-white">
                {annualDailyAverages['2024'].toLocaleString()}
              </span>
            </div>
          </div>
        </div>

        {/* 2025 Total */}
        <div
          className="relative overflow-hidden rounded-2xl p-5"
          style={{
            background: `linear-gradient(135deg, ${ANNUAL_YEAR_COLORS['2025']}15, ${ANNUAL_YEAR_COLORS['2025']}05)`,
            border: `1px solid ${ANNUAL_YEAR_COLORS['2025']}40`,
          }}
        >
          <div className="flex items-center justify-between mb-3">
            <span
              className="text-sm font-bold px-3 py-1 rounded-full"
              style={{ backgroundColor: `${ANNUAL_YEAR_COLORS['2025']}30`, color: ANNUAL_YEAR_COLORS['2025'] }}
            >
              2025
            </span>
            <Calendar size={16} style={{ color: ANNUAL_YEAR_COLORS['2025'] }} />
          </div>
          <p className="text-3xl font-bold text-white mb-1">
            {annualTotals['2025'].toLocaleString()}
          </p>
          <p className="text-sm text-slate-400">pagos totales</p>
          <div className="mt-3 pt-3 border-t border-slate-700/50">
            <div className="flex justify-between items-center text-sm">
              <span className="text-slate-400">Prom. diario</span>
              <span className="font-semibold text-white">
                {annualDailyAverages['2025'].toLocaleString()}
              </span>
            </div>
          </div>
        </div>

        {/* Growth */}
        <div className="relative overflow-hidden rounded-2xl p-5 bg-linear-to-br from-emerald-500/10 to-emerald-500/5 border border-emerald-500/30">
          <div className="flex items-center justify-between mb-3">
            <span className="text-sm font-bold px-3 py-1 rounded-full bg-emerald-500/30 text-emerald-400">
              Crecimiento
            </span>
            {Number(annualGrowth.percentage) >= 0 ? (
              <TrendingUp size={16} className="text-emerald-400" />
            ) : (
              <TrendingDown size={16} className="text-red-400" />
            )}
          </div>
          <p className={`text-3xl font-bold mb-1 ${Number(annualGrowth.percentage) >= 0 ? 'text-emerald-400' : 'text-red-400'}`}>
            {Number(annualGrowth.percentage) >= 0 ? '+' : ''}{annualGrowth.percentage}%
          </p>
          <p className="text-sm text-slate-400">año vs año</p>
          <div className="mt-3 pt-3 border-t border-slate-700/50">
            <div className="flex justify-between items-center text-sm">
              <span className="text-slate-400">Diferencia</span>
              <span className={`font-semibold ${annualGrowth.absolute >= 0 ? 'text-emerald-400' : 'text-red-400'}`}>
                {annualGrowth.absolute >= 0 ? '+' : ''}{annualGrowth.absolute.toLocaleString()}
              </span>
            </div>
          </div>
        </div>

        {/* Best Month */}
        <div className="relative overflow-hidden rounded-2xl p-5 bg-linear-to-br from-cyan-500/10 to-cyan-500/5 border border-cyan-500/30">
          <div className="flex items-center justify-between mb-3">
            <span className="text-sm font-bold px-3 py-1 rounded-full bg-cyan-500/30 text-cyan-400">
              Mejor Mes 2025
            </span>
            <Layers size={16} className="text-cyan-400" />
          </div>
          <p className="text-3xl font-bold text-white mb-1">
            {annualStats.maxMonth2025.monthName}
          </p>
          <p className="text-sm text-slate-400">
            {annualStats.maxMonth2025['2025'].toLocaleString()} pagos
          </p>
          <div className="mt-3 pt-3 border-t border-slate-700/50">
            <div className="flex justify-between items-center text-sm">
              <span className="text-slate-400">vs 2024</span>
              <span className={`font-semibold ${annualStats.maxMonth2025.growthRate >= 0 ? 'text-emerald-400' : 'text-red-400'}`}>
                {annualStats.maxMonth2025.growthRate >= 0 ? '+' : ''}{annualStats.maxMonth2025.growthRate.toFixed(1)}%
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Main Chart */}
      <div className="bg-slate-700/30 rounded-xl p-4 mb-6">
        <h4 className="text-sm font-semibold text-white mb-4">
          {viewMode === 'monthly' ? 'Comparación Mensual' : 'Progreso Acumulado'}
        </h4>
        <div className="h-80">
          <ResponsiveContainer width="100%" height="100%">
            {viewMode === 'monthly' ? (
              <BarChart data={chartData} barCategoryGap="20%">
                <CartesianGrid strokeDasharray="3 3" stroke="#334155" />
                <XAxis dataKey="name" stroke="#94a3b8" fontSize={12} />
                <YAxis stroke="#94a3b8" fontSize={12} tickFormatter={(value) => `${(value / 1000).toFixed(0)}k`} />
                <Tooltip content={<CustomTooltip />} />
                <Legend />
                <Bar dataKey="2024" fill={ANNUAL_YEAR_COLORS['2024']} radius={[4, 4, 0, 0]} name="2024" />
                <Bar dataKey="2025" fill={ANNUAL_YEAR_COLORS['2025']} radius={[4, 4, 0, 0]} name="2025" />
              </BarChart>
            ) : (
              <AreaChart data={chartData}>
                <defs>
                  <linearGradient id="gradient2024" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor={ANNUAL_YEAR_COLORS['2024']} stopOpacity={0.3} />
                    <stop offset="95%" stopColor={ANNUAL_YEAR_COLORS['2024']} stopOpacity={0} />
                  </linearGradient>
                  <linearGradient id="gradient2025" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor={ANNUAL_YEAR_COLORS['2025']} stopOpacity={0.3} />
                    <stop offset="95%" stopColor={ANNUAL_YEAR_COLORS['2025']} stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="#334155" />
                <XAxis dataKey="name" stroke="#94a3b8" fontSize={12} />
                <YAxis stroke="#94a3b8" fontSize={12} tickFormatter={(value) => `${(value / 1000).toFixed(0)}k`} />
                <Tooltip content={<CustomTooltip />} />
                <Legend />
                <Area 
                  type="monotone" 
                  dataKey="2024" 
                  stroke={ANNUAL_YEAR_COLORS['2024']} 
                  fill="url(#gradient2024)" 
                  strokeWidth={2}
                  name="2024"
                />
                <Area 
                  type="monotone" 
                  dataKey="2025" 
                  stroke={ANNUAL_YEAR_COLORS['2025']} 
                  fill="url(#gradient2025)" 
                  strokeWidth={2}
                  name="2025"
                />
              </AreaChart>
            )}
          </ResponsiveContainer>
        </div>
      </div>

      {/* Monthly Details Table */}
      <div className="bg-slate-700/30 rounded-xl p-3 sm:p-4 mb-6 -mx-2 sm:mx-0">
        <h4 className="text-sm font-semibold text-white mb-4 px-2 sm:px-0">Detalle Mensual</h4>
        <div className="overflow-x-auto -mx-1 px-1">
          <table className="w-full text-sm">
            <thead>
              <tr className="text-slate-400 border-b border-slate-600/50">
                <th className="text-left py-2 px-3">Mes</th>
                <th className="text-right py-2 px-3">2024</th>
                <th className="text-right py-2 px-3">2025</th>
                <th className="text-right py-2 px-3">Diferencia</th>
                <th className="text-right py-2 px-3">Cambio</th>
              </tr>
            </thead>
            <tbody>
              {monthlyComparisonData.map((month) => (
                <tr key={month.month} className="border-b border-slate-700/30 hover:bg-slate-700/20">
                  <td className="py-2 px-3 text-white font-medium">{month.monthName}</td>
                  <td className="py-2 px-3 text-right text-pink-400">{month['2024'].toLocaleString()}</td>
                  <td className="py-2 px-3 text-right text-violet-400">{month['2025'].toLocaleString()}</td>
                  <td className={`py-2 px-3 text-right ${month.difference >= 0 ? 'text-emerald-400' : 'text-red-400'}`}>
                    {month.difference >= 0 ? '+' : ''}{month.difference.toLocaleString()}
                  </td>
                  <td className="py-2 px-3 text-right">
                    <span className={`inline-flex items-center gap-1 ${month.growthRate >= 0 ? 'text-emerald-400' : 'text-red-400'}`}>
                      {month.growthRate >= 0 ? (
                        <ArrowUpRight size={14} />
                      ) : (
                        <ArrowDownRight size={14} />
                      )}
                      {month.growthRate >= 0 ? '+' : ''}{month.growthRate.toFixed(1)}%
                    </span>
                  </td>
                </tr>
              ))}
              {/* Total row */}
              <tr className="bg-slate-700/40 font-semibold">
                <td className="py-3 px-3 text-white">Total Anual</td>
                <td className="py-3 px-3 text-right text-pink-400">{annualTotals['2024'].toLocaleString()}</td>
                <td className="py-3 px-3 text-right text-violet-400">{annualTotals['2025'].toLocaleString()}</td>
                <td className={`py-3 px-3 text-right ${annualGrowth.absolute >= 0 ? 'text-emerald-400' : 'text-red-400'}`}>
                  {annualGrowth.absolute >= 0 ? '+' : ''}{annualGrowth.absolute.toLocaleString()}
                </td>
                <td className="py-3 px-3 text-right">
                  <span className={`inline-flex items-center gap-1 ${Number(annualGrowth.percentage) >= 0 ? 'text-emerald-400' : 'text-red-400'}`}>
                    {Number(annualGrowth.percentage) >= 0 ? (
                      <ArrowUpRight size={14} />
                    ) : (
                      <ArrowDownRight size={14} />
                    )}
                    {Number(annualGrowth.percentage) >= 0 ? '+' : ''}{annualGrowth.percentage}%
                  </span>
                </td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>

      {/* Quarterly Comparison */}
      <div className="bg-slate-700/30 rounded-xl p-4">
        <h4 className="text-sm font-semibold text-white mb-4">Comparación por Trimestre</h4>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {(['Q1', 'Q2', 'Q3', 'Q4'] as const).map((quarter, idx) => {
            const val2024 = quarterlyData['2024'][quarter];
            const val2025 = quarterlyData['2025'][quarter];
            const diff = val2025 - val2024;
            const growth = val2024 > 0 ? ((val2025 - val2024) / val2024 * 100).toFixed(1) : '0';
            const quarterLabels = ['Ene-Mar', 'Abr-Jun', 'Jul-Sep', 'Oct-Dic'];
            
            return (
              <div
                key={quarter}
                className="bg-slate-800/50 rounded-xl p-4"
              >
                <div className="flex items-center justify-between mb-2">
                  <span className="text-lg font-bold text-white">{quarter}</span>
                  <span className="text-xs text-slate-400">{quarterLabels[idx]}</span>
                </div>
                <div className="space-y-2">
                  <div className="flex justify-between text-sm">
                    <span className="text-pink-400">2024:</span>
                    <span className="text-white">{val2024.toLocaleString()}</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-violet-400">2025:</span>
                    <span className="text-white">{val2025.toLocaleString()}</span>
                  </div>
                  <div className="pt-2 border-t border-slate-600/50">
                    <div className={`text-center font-semibold ${Number(growth) >= 0 ? 'text-emerald-400' : 'text-red-400'}`}>
                      {Number(growth) >= 0 ? '+' : ''}{growth}%
                    </div>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Statistics Summary */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mt-6">
        <div className="bg-slate-700/30 rounded-xl p-4 text-center">
          <p className="text-slate-400 text-xs mb-1">Meses con crecimiento</p>
          <p className="text-2xl font-bold text-emerald-400">{annualStats.monthsWithGrowth}</p>
          <p className="text-slate-500 text-xs">de 12 meses</p>
        </div>
        <div className="bg-slate-700/30 rounded-xl p-4 text-center">
          <p className="text-slate-400 text-xs mb-1">Meses con descenso</p>
          <p className="text-2xl font-bold text-red-400">{annualStats.monthsWithDecline}</p>
          <p className="text-slate-500 text-xs">de 12 meses</p>
        </div>
        <div className="bg-slate-700/30 rounded-xl p-4 text-center">
          <p className="text-slate-400 text-xs mb-1">Mayor crecimiento</p>
          <p className="text-2xl font-bold text-emerald-400">+{annualStats.bestGrowthMonth.growthRate.toFixed(0)}%</p>
          <p className="text-slate-500 text-xs">{annualStats.bestGrowthMonth.monthName}</p>
        </div>
        <div className="bg-slate-700/30 rounded-xl p-4 text-center">
          <p className="text-slate-400 text-xs mb-1">Mayor descenso</p>
          <p className="text-2xl font-bold text-red-400">{annualStats.worstGrowthMonth.growthRate.toFixed(0)}%</p>
          <p className="text-slate-500 text-xs">{annualStats.worstGrowthMonth.monthName}</p>
        </div>
      </div>
    </motion.div>
  );
};
