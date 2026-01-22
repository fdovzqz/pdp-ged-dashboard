import { motion } from 'framer-motion';
import { BarChart3, ChevronRight, AlertTriangle, Clock } from 'lucide-react';
import { growth24vs26, historicalData, totals } from '../../data/historicalData';

export const InsightsSection = () => {
  // Cálculo dinámico de primeros 7 días
  const first7Days2026 = historicalData
    .filter(d => d.day <= 7)
    .reduce((acc, curr) => acc + curr['2026'], 0);
    
  const first7Days2025 = historicalData
    .filter(d => d.day <= 7)
    .reduce((acc, curr) => acc + curr['2025'], 0);
    
  const growthFirst7Days = Math.round(((first7Days2026 - first7Days2025) / first7Days2025) * 100);

  // Obtener pico del día 20 (o buscar el máximo real si queremos ser más genéricos, 
  // pero mantendré la referencia específica si tiene sentido histórico)
  const day20Data = historicalData.find(d => d.day === 20);
  const eventsDay20_2026 = day20Data ? day20Data['2026'] : 0;

  // Totales generales
  const totalEventsAllYears = totals['2024'] + totals['2025'] + totals['2026'];
  const growthFormatted = `+${growth24vs26}%`;

  const insights = [
    {
      title: 'Arranque Acelerado',
      description: (
        <>
          Los primeros 7 días de enero 2026 registraron{' '}
          <span className="text-emerald-400 font-semibold">{first7Days2026.toLocaleString()} eventos</span>,
          un crecimiento del {growthFirst7Days}% respecto al mismo período de 2025, indicando mayor adopción del portal.
        </>
      ),
      color: 'emerald',
      bgColor: 'bg-emerald-500/20',
      iconColor: '#34d399',
    },
    {
      title: 'Récord de Capacidad',
      description: (
        <>
          El pico del 20 de enero (
          <span className="text-violet-400 font-semibold">{eventsDay20_2026.toLocaleString()} eventos</span>)
          demostró la capacidad del sistema para manejar cargas críticas sin degradación.
        </>
      ),
      color: 'violet',
      bgColor: 'bg-violet-500/20',
      iconColor: '#a78bfa',
    },
    {
      title: 'Tendencia Sostenible',
      description: (
        <>
          El crecimiento del{' '}
          <span className="text-cyan-400 font-semibold">{growthFormatted}</span>{' '}
          en dos años refleja una adopción orgánica y consistente del portal por los ciudadanos.
        </>
      ),
      color: 'cyan',
      bgColor: 'bg-cyan-500/20',
      iconColor: '#22d3ee',
    },
  ];

  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
      {/* Strategic Analysis */}
      <motion.div
        initial={{ opacity: 0, x: -30 }}
        animate={{ opacity: 1, x: 0 }}
        transition={{ duration: 0.6, delay: 0.5 }}
        className="bg-slate-800/40 backdrop-blur-sm rounded-3xl border border-slate-700/50 p-6"
      >
        <h3 className="text-xl font-bold text-white mb-6 flex items-center gap-2 font-display">
          <BarChart3 size={20} className="text-violet-500" />
          Análisis Estratégico
        </h3>
        
        <div className="flex flex-col gap-4">
          {insights.map((insight, index) => (
            <div
              key={index}
              className="flex gap-4 p-4 bg-slate-700/30 rounded-xl hover:bg-slate-700/50 transition-colors duration-200"
            >
              <div className={`${insight.bgColor} p-3 rounded-xl h-fit`}>
                <ChevronRight size={18} color={insight.iconColor} />
              </div>
              <div>
                <h4 className="font-semibold text-white mb-1">{insight.title}</h4>
                <p className="text-sm text-slate-400 leading-relaxed">
                  {insight.description}
                </p>
              </div>
            </div>
          ))}
        </div>
      </motion.div>

      {/* Alert Card */}
      <motion.div
        initial={{ opacity: 0, x: 30 }}
        animate={{ opacity: 1, x: 0 }}
        transition={{ duration: 0.6, delay: 0.5 }}
        className="flex flex-col gap-6"
      >
        <div className="bg-gradient-to-br from-amber-500/20 to-orange-500/10 border border-amber-500/30 rounded-3xl p-6">
          <div className="flex items-start gap-4">
            <div className="bg-amber-500/30 p-3 rounded-xl">
              <AlertTriangle size={24} className="text-amber-400" />
            </div>
            <div>
              <h4 className="font-bold text-white mb-2">
                Preparación Cierre de Mes
              </h4>
              <p className="text-sm text-slate-200 leading-relaxed mb-4">
                Basado en patrones históricos, se espera un incremento significativo
                de actividad entre los días 27-31. El sistema podría procesar hasta{' '}
                <span className="text-amber-400 font-bold">6,500+ eventos</span>{' '}
                en el pico del día 31 (récord 2024: 6,290).
              </p>
              <div className="flex items-center gap-2 text-xs text-amber-300">
                <Clock size={14} />
                <span>Monitoreo recomendado a partir del día 27</span>
              </div>
            </div>
          </div>
        </div>

        {/* Quick Stats */}
        <div className="bg-slate-800/40 backdrop-blur-sm rounded-3xl border border-slate-700/50 p-6">
          <h4 className="text-sm font-semibold text-slate-400 uppercase tracking-wider mb-4">
            Resumen Rápido
          </h4>
          <div className="grid grid-cols-2 gap-4">
            <div className="text-center p-4 bg-slate-700/30 rounded-xl">
              <p className="text-2xl font-bold text-emerald-400">21</p>
              <p className="text-xs text-slate-400 mt-1">Días analizados</p>
            </div>
            <div className="text-center p-4 bg-slate-700/30 rounded-xl">
              <p className="text-2xl font-bold text-violet-400">3</p>
              <p className="text-xs text-slate-400 mt-1">Años comparados</p>
            </div>
            <div className="text-center p-4 bg-slate-700/30 rounded-xl">
              <p className="text-2xl font-bold text-cyan-400">
                {(totalEventsAllYears / 1000).toFixed(0)}K+
              </p>
              <p className="text-xs text-slate-400 mt-1">Eventos totales</p>
            </div>
            <div className="text-center p-4 bg-slate-700/30 rounded-xl">
              <p className="text-2xl font-bold text-amber-400">{growthFormatted}</p>
              <p className="text-xs text-slate-400 mt-1">Crecimiento</p>
            </div>
          </div>
        </div>
      </motion.div>
    </div>
  );
};
