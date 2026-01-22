import { motion } from 'framer-motion';
import { Building2, Activity, Calendar, Clock, Zap, Download, Maximize2 } from 'lucide-react';

interface HeaderProps {
  onExport?: () => void;
  onFullscreen?: () => void;
}

export const Header = ({ onExport, onFullscreen }: HeaderProps) => {
  return (
    <motion.header
      initial={{ opacity: 0, y: -20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.6 }}
      className="mb-10"
    >
      <div className="flex flex-wrap items-center justify-between gap-6">
        {/* Logo and Title */}
        <div className="flex items-center gap-4">
          <div className="relative">
            <div className="absolute inset-0 bg-emerald-500/30 blur-xl rounded-full" />
            <div className="relative bg-linear-to-br from-emerald-400 to-teal-600 p-4 rounded-2xl shadow-lg shadow-emerald-500/20">
              <Building2 size={32} className="text-white" />
            </div>
          </div>
          
          <div>
            <div className="flex items-center gap-3">
              <h1 className="text-3xl font-bold bg-linear-to-r from-white via-slate-200 to-slate-400 bg-clip-text text-transparent font-display">
                Portal de Pagos
              </h1>
              <span className="inline-flex items-center gap-1 px-3 py-1 bg-emerald-500/20 text-emerald-400 text-xs font-bold rounded-full">
                <Zap size={12} />
                LIVE
              </span>
            </div>
            <p className="text-slate-400 mt-1 flex items-center gap-2">
              <Activity size={16} className="text-emerald-500" />
              Estado de Durango · Dashboard de Crecimiento
            </p>
          </div>
        </div>

        {/* Actions and Info */}
        <div className="flex flex-wrap items-center gap-3">
          {/* Period Badge */}
          <div className="flex items-center gap-3 bg-slate-800/60 backdrop-blur-sm px-4 py-3 rounded-xl border border-slate-700/50">
            <Calendar size={18} className="text-emerald-500" />
            <div>
              <p className="text-xs text-slate-400 uppercase tracking-wider">Período</p>
              <p className="font-semibold text-white">Enero 2024 - 2026</p>
            </div>
          </div>
          
          {/* Cutoff Date */}
          <div className="flex items-center gap-3 bg-slate-800/60 backdrop-blur-sm px-4 py-3 rounded-xl border border-slate-700/50">
            <Clock size={18} className="text-amber-500" />
            <div>
              <p className="text-xs text-slate-400 uppercase tracking-wider">Corte</p>
              <p className="font-semibold text-white">21 de Enero, 2026</p>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex gap-2">
            {onExport && (
              <button
                onClick={onExport}
                className="p-3 bg-slate-800/60 hover:bg-slate-700/60 backdrop-blur-sm rounded-xl border border-slate-700/50 transition-all duration-200 hover:scale-105"
                title="Exportar Dashboard"
              >
                <Download size={18} className="text-slate-400" />
              </button>
            )}
            
            {onFullscreen && (
              <button
                onClick={onFullscreen}
                className="p-3 bg-slate-800/60 hover:bg-slate-700/60 backdrop-blur-sm rounded-xl border border-slate-700/50 transition-all duration-200 hover:scale-105"
                title="Pantalla Completa"
              >
                <Maximize2 size={18} className="text-slate-400" />
              </button>
            )}
          </div>
        </div>
      </div>
    </motion.header>
  );
};
