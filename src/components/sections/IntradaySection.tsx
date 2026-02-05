import { useEffect, useMemo, useRef, useState } from 'react';
import { motion } from 'framer-motion';
import {
  BarChart,
  Bar,
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Legend,
} from 'recharts';
import { Clock, TrendingUp, Target, Zap, AlertCircle, Loader2 } from 'lucide-react';
import { useQuery } from 'convex/react';
import { api } from '../../../convex/_generated/api';
import { CustomTooltip } from '../ui';
import { YEAR_COLORS } from '../../types';

// Calcular horas restantes formateadas
const getHoursRemainingFormatted = (hoursRemaining: number): string => {
  if (hoursRemaining <= 0) {
    return 'Día completo';
  }
  return `${hoursRemaining} ${hoursRemaining === 1 ? 'hora' : 'horas'}`;
};

interface IntradaySectionProps {
  monthName?: string;
}

export const IntradaySection = ({ monthName = 'Enero' }: IntradaySectionProps) => {
  // Obtener datos intradía desde Convex (usa fecha actual en México)
  const intradayData = useQuery(api.queries.getIntradayData);

  // Extraer datos con valores por defecto para hooks
  const todayData = intradayData?.todayData ?? [];
  const currentHour = intradayData?.currentHour ?? 0;
  const historicalComparison = intradayData?.historicalComparison ?? { '2024': 0, '2025': 0, '2026': 0 };
  const forecast = intradayData?.forecast ?? { conservador: 0, probable: 0, optimista: 0 };

  // Estado para resaltar suavemente cuando hay una actualización nueva
  const [justUpdated, setJustUpdated] = useState(false);
  const lastExtractionIsoRef = useRef<string | null>(null);

  // Encontrar la última hora con datos reales
  const lastHourWithData = todayData.length > 0 ? Math.max(...todayData.map(h => h.hour)) : 0;

  // Preparar datos para gráfico de barras por hora - solo hasta la última hora con datos
  const hourlyChartData = useMemo(() => {
    if (todayData.length === 0) return [];
    return Array.from({ length: lastHourWithData + 1 }, (_, i) => {
      const hourData = todayData.find(h => h.hour === i);
      return {
        hour: i,
        label: i === 0 ? '12am' : i < 12 ? `${i}am` : i === 12 ? '12pm' : `${i - 12}pm`,
        today: hourData?.events || 0,
        cumulative: hourData?.cumulative || 0,
      };
    });
  }, [todayData, lastHourWithData]);

  // Preparar datos para gráfico acumulado comparativo
  const cumulativeChartData = useMemo(() => {
    if (todayData.length === 0) return [];
    return Array.from({ length: 24 }, (_, i) => {
      let todayCumulative: number | null = null;
      
      if (i <= currentHour) {
        // Buscar el último acumulado hasta esta hora
        const dataUpToHour = todayData.filter(h => h.hour <= i);
        if (dataUpToHour.length > 0) {
          // Usar el último acumulado disponible hasta esta hora
          todayCumulative = dataUpToHour[dataUpToHour.length - 1].cumulative;
        } else {
          // Si no hay datos todavía, usar 0
          todayCumulative = 0;
        }
      }

      return {
        hour: i,
        label: i === 0 ? '12am' : i < 12 ? `${i}am` : i === 12 ? '12pm' : `${i - 12}pm`,
        '2026': todayCumulative,
        '2024': historicalComparison['2024'],
        '2025': historicalComparison['2025'],
        'Proyección Probable': forecast.probable,
      };
    });
  }, [currentHour, todayData, historicalComparison, forecast]);

  // Detectar cambios en lastExtractionIso para disparar un efecto visual sutil
  useEffect(() => {
    if (!intradayData?.lastExtractionIso) {
      return;
    }

    if (lastExtractionIsoRef.current === intradayData.lastExtractionIso) {
      return;
    }

    // Actualizar referencia y disparar highlight temporal
    lastExtractionIsoRef.current = intradayData.lastExtractionIso;
    setJustUpdated(true);

    const timeoutId = window.setTimeout(() => {
      setJustUpdated(false);
    }, 1200);

    return () => {
      window.clearTimeout(timeoutId);
    };
  }, [intradayData?.lastExtractionIso]);

  // Si los datos aún están cargando
  if (intradayData === undefined) {
    return (
      <motion.div
        initial={{ opacity: 0, y: 30 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6, delay: 0.2 }}
        className="bg-linear-to-br from-slate-800/60 to-slate-900/60 backdrop-blur-sm rounded-3xl border border-slate-700/50 p-6"
      >
        <div className="flex items-center justify-center min-h-[200px]">
          <div className="flex flex-col items-center gap-4">
            <Loader2 className="w-6 h-6 animate-spin text-amber-400" />
            <p className="text-slate-400 text-sm">Cargando datos intradía...</p>
          </div>
        </div>
      </motion.div>
    );
  }

  // Si no hay datos intradía disponibles, no mostrar la sección
  if (!intradayData) {
    return null;
  }

  const { currentDay, hoursRemaining, statistics, lastExtraction } = intradayData;

  return (
    <motion.div
      initial={{ opacity: 0, y: 30 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.6, delay: 0.2 }}
      className={`bg-linear-to-br from-slate-800/60 to-slate-900/60 backdrop-blur-sm rounded-3xl border p-6 transition-all duration-500 ${
        justUpdated
          ? 'border-emerald-400/70 shadow-[0_0_30px_rgba(16,185,129,0.45)]'
          : 'border-slate-700/50'
      }`}
    >
      <div className="flex items-center gap-3 mb-6">
        <div className="p-2 rounded-lg bg-amber-500/20">
          <Clock size={20} className="text-amber-400" />
        </div>
        <div>
          <h3 className="text-xl font-bold text-white flex items-center gap-2 font-display">
            Seguimiento Intradía - Día {currentDay} de {monthName}
          </h3>
          <p className="text-sm text-slate-400 mt-1">
            Progreso del día actual vs histórico · {getHoursRemainingFormatted(hoursRemaining)} restantes
            {lastExtraction && (
              <span className="text-emerald-400"> (extracción: {lastExtraction})</span>
            )}
          </p>
        </div>
      </div>

      {/* KPIs Intradía */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-6">
        <div className="bg-emerald-500/10 border border-emerald-500/30 rounded-xl p-4">
          <div className="text-emerald-400 text-xs font-medium mb-1">Total Actual</div>
          <p className="text-2xl font-bold text-white">
            {statistics.currentTotal.toLocaleString()}
          </p>
          <p className="text-xs text-slate-400 mt-1">
            {Math.round((statistics.currentTotal / forecast.probable) * 100)}% de proyección
          </p>
        </div>

        <div className="bg-cyan-500/10 border border-cyan-500/30 rounded-xl p-4">
          <div className="text-cyan-400 text-xs font-medium mb-1 flex items-center gap-1">
            <Target size={12} />
            Proyección
          </div>
          <p className="text-2xl font-bold text-white">
            {forecast.probable.toLocaleString()}
          </p>
          <p className="text-xs text-slate-400 mt-1">Faltan {(forecast.probable - statistics.currentTotal).toLocaleString()}</p>
        </div>

        <div className="bg-pink-500/10 border border-pink-500/30 rounded-xl p-4">
          <div className="text-pink-400 text-xs font-medium mb-1">vs 2024</div>
          <p className={`text-xl font-bold ${statistics.vs2024 >= 0 ? 'text-emerald-400' : 'text-red-400'}`}>
            {statistics.vs2024 >= 0 ? '+' : ''}{statistics.vs2024.toFixed(1)}%
          </p>
          <p className="text-xs text-slate-400 mt-1">
            {historicalComparison['2024'].toLocaleString()} en 2024
          </p>
        </div>

        <div className="bg-violet-500/10 border border-violet-500/30 rounded-xl p-4">
          <div className="text-violet-400 text-xs font-medium mb-1">vs 2025</div>
          <p className={`text-xl font-bold ${statistics.vs2025 >= 0 ? 'text-emerald-400' : 'text-red-400'}`}>
            {statistics.vs2025 >= 0 ? '+' : ''}{statistics.vs2025.toFixed(1)}%
          </p>
          <p className="text-xs text-slate-400 mt-1">
            {historicalComparison['2025'].toLocaleString()} en 2025
          </p>
        </div>
      </div>

      {/* Gráfico de barras por hora */}
      <div className="mb-6">
        <h4 className="text-sm font-semibold text-slate-400 uppercase tracking-wider mb-3">
          Pagos por Hora (Día Actual)
        </h4>
        <div className="h-[250px] w-full">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={hourlyChartData} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#334155" vertical={false} />
              <XAxis
                dataKey="label"
                tick={{ fontSize: 11, fill: '#94a3b8' }}
                axisLine={false}
                tickLine={false}
              />
              <YAxis
                tick={{ fontSize: 11, fill: '#94a3b8' }}
                axisLine={false}
                tickLine={false}
              />
              <Tooltip content={<CustomTooltip />} />
              <Bar dataKey="today" fill="#10b981" radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Gráfico acumulado comparativo */}
      <div className="mb-6">
        <h4 className="text-sm font-semibold text-slate-400 uppercase tracking-wider mb-3">
          Progreso Acumulado vs Histórico
        </h4>
        <div className="h-[300px] w-full">
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={cumulativeChartData} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#334155" vertical={false} />
              <XAxis
                dataKey="label"
                tick={{ fontSize: 11, fill: '#94a3b8' }}
                axisLine={false}
                tickLine={false}
              />
              <YAxis
                tick={{ fontSize: 11, fill: '#94a3b8' }}
                axisLine={false}
                tickLine={false}
              />
              <Tooltip content={<CustomTooltip />} />
              <Legend />
              <Line
                type="monotone"
                dataKey="2026"
                stroke={YEAR_COLORS['2026']}
                strokeWidth={3}
                dot={{ r: 2 }}
                name="2026 Actual"
                connectNulls={false}
              />
              <Line
                type="monotone"
                dataKey="2024"
                stroke={YEAR_COLORS['2024']}
                strokeWidth={2}
                dot={false}
                name="2024 Histórico"
              />
              <Line
                type="monotone"
                dataKey="2025"
                stroke={YEAR_COLORS['2025']}
                strokeWidth={2}
                dot={false}
                name="2025 Histórico"
              />
              <Line
                type="monotone"
                dataKey="Proyección Probable"
                stroke="#22d3ee"
                strokeWidth={3}
                strokeDasharray="8 4"
                dot={false}
                name="Proyección Probable"
              />
            </LineChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Proyecciones del día */}
      <div className="bg-slate-700/30 rounded-xl p-4">
        <h4 className="text-sm font-semibold text-slate-400 uppercase tracking-wider mb-3 flex items-center gap-2">
          <TrendingUp size={14} />
          Proyecciones de Cierre del Día
        </h4>
        <div className="grid grid-cols-3 gap-3">
          <div className="bg-amber-500/10 border border-amber-500/30 rounded-lg p-3">
            <div className="text-amber-400 text-xs font-medium mb-1 flex items-center gap-1">
              <Target size={12} />
              Conservador
            </div>
            <p className="text-xl font-bold text-white">
              {forecast.conservador.toLocaleString()}
            </p>
          </div>
          <div className="bg-emerald-500/10 border border-emerald-500/30 rounded-lg p-3">
            <div className="text-emerald-400 text-xs font-medium mb-1 flex items-center gap-1">
              <Zap size={12} />
              Probable
            </div>
            <p className="text-xl font-bold text-white">
              {forecast.probable.toLocaleString()}
            </p>
          </div>
          <div className="bg-cyan-500/10 border border-cyan-500/30 rounded-lg p-3">
            <div className="text-cyan-400 text-xs font-medium mb-1 flex items-center gap-1">
              <TrendingUp size={12} />
              Optimista
            </div>
            <p className="text-xl font-bold text-white">
              {forecast.optimista.toLocaleString()}
            </p>
          </div>
        </div>
      </div>

      {/* Nota informativa */}
      <div className="mt-4 flex items-start gap-2 bg-blue-500/10 border border-blue-500/30 rounded-lg p-3">
        <AlertCircle size={16} className="text-blue-400 mt-0.5 shrink-0" />
        <p className="text-xs text-blue-300">
          Los datos se actualizan automáticamente desde CloudWatch cada minuto de 9:00 a 21:00 y cada 5 minutos
          fuera de ese horario. El día actual se excluye de los datos históricos hasta que esté completo
          (23:59 hora de México).
        </p>
      </div>
    </motion.div>
  );
};
