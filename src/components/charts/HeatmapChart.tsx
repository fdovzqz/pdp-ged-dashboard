import { useMemo, useState, memo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Calendar, Loader2 } from 'lucide-react';
import { useQuery } from 'convex/react';
import { api } from '../../../convex/_generated/api';
import type { YearType } from '../../types';

interface HeatmapChartProps {
  year?: YearType;
  month?: number;
  monthName?: string;
  onDaySelect?: (day: number) => void;
}

interface HoveredCell {
  day: number;
  value: number;
  x: number;
  y: number;
  placement: 'top' | 'bottom' | 'left' | 'right';
}

/** Día de la semana del 1º del mes (0=Dom, 1=Lun, ..., 6=Sáb) */
const getStartDayOfMonth = (year: number, month: number): number =>
  new Date(year, month - 1, 1).getDay();

export const HeatmapChart = memo(function HeatmapChart({ year = '2026', month = 1, monthName = 'Enero', onDaySelect }: HeatmapChartProps) {
  const [hoveredCell, setHoveredCell] = useState<HoveredCell | null>(null);
  
  // Obtener datos del heatmap desde Convex
  const heatmapData = useQuery(api.queries.getHeatmapData, {
    year: parseInt(year),
    month,
  });
  const lastAvailableDay = useQuery(api.queries.getLastAvailableDay, { month });

  // Calcular max value del heatmap
  const maxValue = useMemo(() => {
    if (!heatmapData || heatmapData.length === 0) return 1;
    return Math.max(...heatmapData.map(d => d.value));
  }, [heatmapData]);
  
  const dayLabels = ['Dom', 'Lun', 'Mar', 'Mié', 'Jue', 'Vie', 'Sáb'];
  
  // Generar la estructura del calendario
  const calendarGrid = useMemo(() => {
    if (lastAvailableDay === undefined) return [];
    
    const startDay = getStartDayOfMonth(parseInt(year), month);
    const weeks: (number | null)[][] = [];
    let currentWeek: (number | null)[] = [];
    
    // Rellenar días vacíos al inicio
    for (let i = 0; i < startDay; i++) {
      currentWeek.push(null);
    }
    
    // Agregar los días disponibles
    for (let day = 1; day <= lastAvailableDay; day++) {
      currentWeek.push(day);
      
      // Si es sábado (posición 6), empezar nueva semana
      if (currentWeek.length === 7) {
        weeks.push(currentWeek);
        currentWeek = [];
      }
    }
    
    // Si quedaron días en la última semana, completar con nulls
    if (currentWeek.length > 0) {
      while (currentWeek.length < 7) {
        currentWeek.push(null);
      }
      weeks.push(currentWeek);
    }
    
    return weeks;
  }, [year, month, lastAvailableDay]);
  
  // Escala single-hue emerald (más sutil y ejecutiva)
  const getIntensityColor = (value: number): string => {
    const intensity = value / maxValue;
    if (intensity < 0.15) return 'bg-emerald-950/80';
    if (intensity < 0.30) return 'bg-emerald-900/90';
    if (intensity < 0.45) return 'bg-emerald-800';
    if (intensity < 0.60) return 'bg-emerald-600';
    if (intensity < 0.75) return 'bg-emerald-500';
    if (intensity < 0.90) return 'bg-emerald-400';
    return 'bg-emerald-300';
  };

  const getTextColor = (value: number): string => {
    const intensity = value / maxValue;
    if (intensity < 0.60) return 'text-white';
    return 'text-slate-900';
  };

  // Mini-stats del mes
  const stats = useMemo(() => {
    if (!heatmapData || heatmapData.length === 0) return { min: 0, max: 0, avg: 0 };
    const values = heatmapData.map((d) => d.value);
    const sum = values.reduce((a, b) => a + b, 0);
    return {
      min: Math.min(...values),
      max: Math.max(...values),
      avg: Math.round(sum / values.length),
    };
  }, [heatmapData]);

  // Día actual (para indicador pulsante)
  const now = new Date();
  const isCurrentMonth = now.getMonth() + 1 === month && now.getFullYear() === parseInt(year);
  const currentDay = isCurrentMonth ? now.getDate() : null;

  const getDayValue = (day: number): number => {
    if (!heatmapData) return 0;
    const data = heatmapData.find(d => d.day === day);
    return data ? data.value : 0;
  };

  const handleMouseEnter = (day: number, value: number, event: React.MouseEvent) => {
    const rect = event.currentTarget.getBoundingClientRect();
    const container = event.currentTarget.closest('.heatmap-container');
    const parentRect = container?.getBoundingClientRect();
    
    if (parentRect) {
      const tooltipWidth = 140;
      const tooltipHeight = 60;
      const padding = 8;
      
      const cellCenterX = rect.left - parentRect.left + rect.width / 2;
      const cellTop = rect.top - parentRect.top;
      const cellBottom = cellTop + rect.height;
      
      let x = cellCenterX;
      let placement: 'top' | 'bottom' | 'left' | 'right' = 'top';
      
      const containerLeft = padding;
      const containerRight = parentRect.width - padding;
      const tooltipHalfWidth = tooltipWidth / 2;
      
      if (cellCenterX + tooltipHalfWidth > containerRight) {
        x = containerRight - tooltipHalfWidth;
      }
      else if (cellCenterX - tooltipHalfWidth < containerLeft) {
        x = containerLeft + tooltipHalfWidth;
      }
      
      let y = cellTop - padding;
      
      if (cellTop < tooltipHeight + padding) {
        y = cellBottom + padding;
        placement = 'bottom';
      }
      
      setHoveredCell({
        day,
        value,
        x,
        y,
        placement,
      });
    }
  };

  // Loading state
  if (heatmapData === undefined || lastAvailableDay === undefined) {
    return (
      <motion.div
        initial={{ opacity: 0, y: 30 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6, delay: 0.4 }}
        className="bg-slate-800/40 backdrop-blur-sm rounded-3xl border border-slate-700/50 p-6"
      >
        <div className="flex items-center justify-center min-h-[200px]">
          <div className="flex flex-col items-center gap-4">
            <Loader2 className="w-6 h-6 animate-spin text-emerald-400" />
            <p className="text-slate-400 text-sm">Cargando mapa de calor...</p>
          </div>
        </div>
      </motion.div>
    );
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 30 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.6, delay: 0.4 }}
      className="bg-slate-800/40 backdrop-blur-sm rounded-2xl border border-slate-700/50 p-6 min-w-0"
    >
      <div className="mb-4">
        <h3 className="text-lg font-bold text-white flex items-center gap-2 font-display">
          <Calendar size={18} className="text-emerald-400" />
          Mapa de Calor - {monthName} {year}
        </h3>
        {onDaySelect && (
          <p className="text-xs text-slate-400 mt-1">Clic en una celda para ver detalle e intradía</p>
        )}
      </div>
      
      <div className="heatmap-container relative overflow-visible">
        {/* Tooltip */}
        <AnimatePresence>
          {hoveredCell && (
            <motion.div
              initial={{ opacity: 0, y: hoveredCell.placement === 'top' ? 5 : -5 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: hoveredCell.placement === 'top' ? 5 : -5 }}
              className="absolute z-20 bg-slate-900 border border-slate-600 rounded-lg px-3 py-2 shadow-xl pointer-events-none whitespace-nowrap"
              style={{
                left: `${hoveredCell.x}px`,
                top: `${hoveredCell.y}px`,
                transform: hoveredCell.placement === 'top' 
                  ? 'translate(-50%, -100%)' 
                  : 'translate(-50%, 0%)',
              }}
            >
              <p className="text-emerald-400 font-bold text-sm">Día {hoveredCell.day}</p>
              <p className="text-white font-semibold">{hoveredCell.value.toLocaleString()} pagos</p>
            </motion.div>
          )}
        </AnimatePresence>

        <div className="min-w-[320px]">
          {/* Day labels */}
          <div className="grid grid-cols-8 gap-1 mb-1">
            <div className="text-xs text-slate-500 text-center">Sem</div>
            {dayLabels.map(day => (
              <div key={day} className="text-xs text-slate-400 text-center">
                {day}
              </div>
            ))}
          </div>
          
          {/* Heatmap grid */}
          {calendarGrid.map((week, weekIndex) => (
            <div key={weekIndex} className="grid grid-cols-8 gap-1 mb-1">
              <div className="text-xs text-slate-500 text-center flex items-center justify-center">
                {weekIndex + 1}
              </div>
              {week.map((day, dayIndex) => {
                const value = day ? getDayValue(day) : 0;
                return (
                  <motion.div
                    key={`${weekIndex}-${dayIndex}`}
                    initial={{ opacity: 0, scale: 0.8 }}
                    animate={{ opacity: 1, scale: 1 }}
                    transition={{ delay: (weekIndex * 7 + dayIndex) * 0.02 }}
                    role={day && onDaySelect ? 'button' : undefined}
                    tabIndex={day && onDaySelect ? 0 : undefined}
                    onKeyDown={(e) => day && onDaySelect && e.key === 'Enter' && onDaySelect(day)}
                    className={`
                      aspect-square rounded-md flex items-center justify-center
                      text-xs font-medium tabular-nums
                      transition-all duration-200
                      ${day && onDaySelect ? 'cursor-pointer hover:scale-110 hover:z-10 hover:ring-2 hover:ring-emerald-400' : ''}
                      ${day ? getIntensityColor(value) : 'bg-slate-700/20'}
                      ${day ? getTextColor(value) : 'text-transparent'}
                      ${day === currentDay ? 'ring-2 ring-emerald-400 animate-pulse-soft' : ''}
                    `}
                    onMouseEnter={(e) => day && handleMouseEnter(day, value, e)}
                    onMouseLeave={() => setHoveredCell(null)}
                    onClick={() => day && onDaySelect?.(day)}
                  >
                    {day || ''}
                  </motion.div>
                );
              })}
            </div>
          ))}
        </div>
      </div>
      
      {/* Legend con mini-stats */}
      <div className="flex flex-col sm:flex-row items-center justify-between gap-3 mt-4 pt-4 border-t border-slate-700/50">
        <div className="flex items-center gap-2 text-xs">
          <span className="text-slate-400">Menos</span>
          <div className="flex gap-0.5">
            <div className="w-4 h-4 rounded bg-emerald-950/80" />
            <div className="w-4 h-4 rounded bg-emerald-800" />
            <div className="w-4 h-4 rounded bg-emerald-600" />
            <div className="w-4 h-4 rounded bg-emerald-500" />
            <div className="w-4 h-4 rounded bg-emerald-400" />
            <div className="w-4 h-4 rounded bg-emerald-300" />
          </div>
          <span className="text-slate-400">Más</span>
        </div>
        <div className="flex gap-4 text-xs text-slate-400">
          <span>Mín: <strong className="text-white tabular-nums">{stats.min.toLocaleString()}</strong></span>
          <span>Prom: <strong className="text-white tabular-nums">{stats.avg.toLocaleString()}</strong></span>
          <span>Máx: <strong className="text-emerald-400 tabular-nums">{stats.max.toLocaleString()}</strong></span>
        </div>
      </div>
    </motion.div>
  );
});
