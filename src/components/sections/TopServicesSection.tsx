import { motion } from 'framer-motion';
import { TrendingUp, DollarSign } from 'lucide-react';
import { topServices, additionalMetrics } from '../../data/historicalData';
import { GaugeChart } from '../ui';

export const TopServicesSection = () => {
  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
      {/* Top Services */}
      <motion.div
        initial={{ opacity: 0, y: 30 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6, delay: 0.5 }}
        className="lg:col-span-2 bg-slate-800/40 backdrop-blur-sm rounded-3xl border border-slate-700/50 p-6"
      >
        <h3 className="text-lg font-bold text-white mb-4 flex items-center gap-2 font-display">
          <TrendingUp size={18} className="text-emerald-400" />
          Top 5 Servicios más Utilizados
        </h3>
        
        <div className="space-y-3">
          {topServices.map((service, index) => (
            <motion.div
              key={service.name}
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.1 * index }}
              className="flex items-center gap-4 p-3 bg-slate-700/30 rounded-xl hover:bg-slate-700/50 transition-colors"
            >
              <div className="text-2xl w-10 text-center">{service.icon}</div>
              
              <div className="flex-1 min-w-0">
                <div className="flex items-center justify-between mb-1">
                  <span className="font-medium text-white truncate">{service.name}</span>
                  <span className="text-emerald-400 text-sm font-semibold">
                    +{service.growth}%
                  </span>
                </div>
                
                <div className="flex items-center gap-4 text-xs text-slate-400">
                  <span>{service.transactions.toLocaleString()} transacciones</span>
                  <span className="text-slate-500">|</span>
                  <span>${(service.amount / 1000000).toFixed(1)}M</span>
                </div>
                
                {/* Progress bar */}
                <div className="mt-2 h-1.5 bg-slate-700 rounded-full overflow-hidden">
                  <motion.div
                    initial={{ width: 0 }}
                    animate={{ width: `${(service.transactions / topServices[0].transactions) * 100}%` }}
                    transition={{ duration: 1, delay: 0.2 * index }}
                    className="h-full bg-gradient-to-r from-emerald-500 to-teal-400 rounded-full"
                  />
                </div>
              </div>
            </motion.div>
          ))}
        </div>
      </motion.div>

      {/* Performance Metrics */}
      <motion.div
        initial={{ opacity: 0, y: 30 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6, delay: 0.55 }}
        className="bg-slate-800/40 backdrop-blur-sm rounded-3xl border border-slate-700/50 p-6"
      >
        <h3 className="text-lg font-bold text-white mb-4 flex items-center gap-2 font-display">
          <DollarSign size={18} className="text-amber-400" />
          Métricas de Rendimiento
        </h3>
        
        <div className="space-y-6">
          {/* Success Rate Gauge */}
          <div className="flex justify-center">
            <GaugeChart
              value={additionalMetrics.successRate}
              max={100}
              label="Tasa de Éxito"
              color="#10b981"
              size={140}
            />
          </div>
          
          {/* Other Metrics */}
          <div className="grid grid-cols-2 gap-3">
            <div className="text-center p-3 bg-slate-700/30 rounded-xl">
              <p className="text-xl font-bold text-cyan-400">
                {additionalMetrics.avgProcessingTime}s
              </p>
              <p className="text-xs text-slate-400 mt-1">Tiempo Promedio</p>
            </div>
            
            <div className="text-center p-3 bg-slate-700/30 rounded-xl">
              <p className="text-xl font-bold text-violet-400">
                {(additionalMetrics.totalAmount / 1000000).toFixed(1)}M
              </p>
              <p className="text-xs text-slate-400 mt-1">Monto Total</p>
            </div>
            
            <div className="text-center p-3 bg-slate-700/30 rounded-xl">
              <p className="text-xl font-bold text-emerald-400">
                {(additionalMetrics.uniqueUsers / 1000).toFixed(1)}K
              </p>
              <p className="text-xs text-slate-400 mt-1">Usuarios Únicos</p>
            </div>
            
            <div className="text-center p-3 bg-slate-700/30 rounded-xl">
              <p className="text-xl font-bold text-amber-400">
                {additionalMetrics.returningUsers}%
              </p>
              <p className="text-xs text-slate-400 mt-1">Recurrentes</p>
            </div>
          </div>
        </div>
      </motion.div>
    </div>
  );
};
