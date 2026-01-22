import { useMemo, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Calendar } from 'lucide-react';
import { historicalData, getMaxHeatmapValue } from '../../data/historicalData';
import type { YearType } from '../../types';

interface HeatmapChartProps {
  year?: YearType;
}

interface HoveredCell {
  day: number;
  value: number;
  x: number;
  y: number;
}

// Día de inicio de cada año (0=Dom, 1=Lun, 2=Mar, 3=Mié, 4=Jue, 5=Vie, 6=Sáb)
const startDayOfWeek: Record<YearType, number> = {
  '2024': 1, // Enero 2024 empieza en Lunes
  '2025': 3, // Enero 2025 empieza en Miércoles
  '2026': 4, // Enero 2026 empieza en Jueves
};

export const HeatmapChart = ({ year = '2026' }: HeatmapChartProps) => {
  const [hoveredCell, setHoveredCell] = useState<HoveredCell | null>(null);
  const maxValue = useMemo(() => getMaxHeatmapValue(year), [year]);
  
  const dayLabels = ['Dom', 'Lun', 'Mar', 'Mié', 'Jue', 'Vie', 'Sáb'];
  
  // Generar la estructura del calendario
  const calendarGrid = useMemo(() => {
    const startDay = startDayOfWeek[year];
    const weeks: (number | null)[][] = [];
    let currentWeek: (number | null)[] = [];
    
    // Rellenar días vacíos al inicio
    for (let i = 0; i < startDay; i++) {
      currentWeek.push(null);
    }
    
    // Agregar los días 1-21
    for (let day = 1; day <= 21; day++) {
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
  }, [year]);
  
  const getIntensityColor = (value: number): string => {
    const intensity = value / maxValue;
    // Escala de colores cálidos: amarillo → naranja → rojo → guinda
    if (intensity < 0.15) return 'bg-yellow-100';          // Muy bajo - amarillo muy claro
    if (intensity < 0.30) return 'bg-yellow-300';          // Bajo - amarillo
    if (intensity < 0.45) return 'bg-amber-400';           // Medio-bajo - amarillo/naranja
    if (intensity < 0.60) return 'bg-orange-500';          // Medio - naranja
    if (intensity < 0.75) return 'bg-red-500';             // Medio-alto - rojo
    if (intensity < 0.90) return 'bg-red-700';             // Alto - rojo oscuro
    return 'bg-rose-900';                                  // Máximo - guinda
  };

  const getTextColor = (value: number): string => {
    const intensity = value / maxValue;
    // Texto oscuro para fondos claros, blanco para fondos oscuros
    if (intensity < 0.45) return 'text-slate-800';
    return 'text-white';
  };

  const getDayValue = (day: number): number => {
    const data = historicalData.find(d => d.day === day);
    return data ? data[year] : 0;
  };

  const handleMouseEnter = (day: number, value: number, event: React.MouseEvent) => {
    const rect = event.currentTarget.getBoundingClientRect();
    const parentRect = event.currentTarget.closest('.heatmap-container')?.getBoundingClientRect();
    if (parentRect) {
      setHoveredCell({
        day,
        value,
        x: rect.left - parentRect.left + rect.width / 2,
        y: rect.top - parentRect.top - 10,
      });
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 30 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.6, delay: 0.4 }}
      className="bg-slate-800/40 backdrop-blur-sm rounded-3xl border border-slate-700/50 p-6"
    >
      <h3 className="text-lg font-bold text-white mb-4 flex items-center gap-2 font-display">
        <Calendar size={18} className="text-orange-400" />
        Mapa de Calor - Enero {year}
      </h3>
      
      <div className="overflow-x-auto heatmap-container relative">
        {/* Tooltip */}
        <AnimatePresence>
          {hoveredCell && (
            <motion.div
              initial={{ opacity: 0, y: 5 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: 5 }}
              className="absolute z-20 bg-slate-900 border border-slate-600 rounded-lg px-3 py-2 shadow-xl pointer-events-none"
              style={{
                left: hoveredCell.x,
                top: hoveredCell.y,
                transform: 'translate(-50%, -100%)',
              }}
            >
              <p className="text-orange-400 font-bold text-sm">Día {hoveredCell.day}</p>
              <p className="text-white font-semibold">{hoveredCell.value.toLocaleString()} eventos</p>
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
                    className={`
                      aspect-square rounded-md flex items-center justify-center
                      text-xs font-medium cursor-pointer
                      transition-all duration-200 hover:scale-110 hover:z-10 hover:ring-2 hover:ring-orange-400
                      ${day ? getIntensityColor(value) : 'bg-slate-700/20'}
                      ${day ? getTextColor(value) : 'text-transparent'}
                    `}
                    onMouseEnter={(e) => day && handleMouseEnter(day, value, e)}
                    onMouseLeave={() => setHoveredCell(null)}
                  >
                    {day || ''}
                  </motion.div>
                );
              })}
            </div>
          ))}
        </div>
      </div>
      
      {/* Legend */}
      <div className="flex items-center justify-center gap-2 mt-4 text-xs">
        <span className="text-slate-400">Menos</span>
        <div className="flex gap-0.5">
          <div className="w-4 h-4 rounded bg-yellow-100" />
          <div className="w-4 h-4 rounded bg-yellow-300" />
          <div className="w-4 h-4 rounded bg-amber-400" />
          <div className="w-4 h-4 rounded bg-orange-500" />
          <div className="w-4 h-4 rounded bg-red-500" />
          <div className="w-4 h-4 rounded bg-red-700" />
          <div className="w-4 h-4 rounded bg-rose-900" />
        </div>
        <span className="text-slate-400">Más</span>
      </div>
    </motion.div>
  );
};
