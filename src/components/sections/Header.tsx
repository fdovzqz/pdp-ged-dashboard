import { motion } from 'framer-motion';
import { Building2, Activity, Calendar, Clock, Zap, Download, Maximize2 } from 'lucide-react';
import { useQuery } from 'convex/react';
import { api } from '../../../convex/_generated/api';

const MONTH_NAMES: Record<number, string> = {
  1: 'Enero', 2: 'Febrero', 3: 'Marzo', 4: 'Abril', 5: 'Mayo', 6: 'Junio',
  7: 'Julio', 8: 'Agosto', 9: 'Septiembre', 10: 'Octubre', 11: 'Noviembre', 12: 'Diciembre',
};

const formatDayMonth = (day: number, month: string = 'Enero'): string =>
  `${day} de ${month}`;

interface HeaderProps {
  onExport?: () => void;
  onFullscreen?: () => void;
  isExporting?: boolean;
}

export const Header = ({ onExport, onFullscreen, isExporting = false }: HeaderProps) => {
  const processingContext = useQuery(api.queries.getProcessingContext);
  const year = processingContext?.year ?? new Date().getFullYear();
  const month = processingContext?.month ?? 1;
  const lastAvailableDay = processingContext?.lastCompleteDay ?? 31;
  const monthName = MONTH_NAMES[month] ?? 'Enero';
  return (
    <motion.header
      initial={{ opacity: 0, y: -20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.6 }}
      className="mb-10"
    >
      <div className="flex flex-wrap items-center justify-between gap-4 sm:gap-6">
        {/* Logo and Title */}
        <div className="flex items-center gap-3 sm:gap-4">
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
        <div className="flex flex-wrap items-center gap-2 sm:gap-3">
          {/* Period Badge */}
          <div className="flex items-center gap-2 sm:gap-3 bg-slate-800/60 backdrop-blur-sm px-3 sm:px-4 py-2 sm:py-3 rounded-xl border border-slate-700/50">
            <Calendar size={18} className="text-emerald-500" />
            <div>
              <p className="text-xs text-slate-400 uppercase tracking-wider">Período</p>
              <p className="font-semibold text-white">{monthName} 2024 - {year}</p>
            </div>
          </div>
          
          {/* Cutoff Date */}
          <div className="flex items-center gap-2 sm:gap-3 bg-slate-800/60 backdrop-blur-sm px-3 sm:px-4 py-2 sm:py-3 rounded-xl border border-slate-700/50">
            <Clock size={18} className="text-amber-500" />
            <div>
              <p className="text-xs text-slate-400 uppercase tracking-wider">Corte</p>
              <p className="font-semibold text-white">
                {formatDayMonth(lastAvailableDay, monthName)}, {year}
              </p>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex gap-2">
            {onExport && (
              <button
                onClick={onExport}
                disabled={isExporting}
                aria-label={isExporting ? 'Exportando dashboard a PDF' : 'Exportar dashboard a PDF'}
                aria-busy={isExporting}
                className={`p-3 bg-slate-800/60 hover:bg-slate-700/60 backdrop-blur-sm rounded-xl border border-slate-700/50 transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-emerald-500/50 ${
                  isExporting ? 'opacity-50 cursor-wait' : 'hover:scale-105'
                }`}
                title={isExporting ? 'Exportando...' : 'Exportar Dashboard'}
              >
                {isExporting ? (
                  <div className="w-[18px] h-[18px] border-2 border-slate-400/30 border-t-slate-400 rounded-full animate-spin" aria-hidden="true" />
                ) : (
                  <Download size={18} className="text-slate-400" aria-hidden="true" />
                )}
              </button>
            )}
            
            {onFullscreen && (
              <button
                onClick={onFullscreen}
                aria-label="Activar pantalla completa"
                className="p-3 bg-slate-800/60 hover:bg-slate-700/60 backdrop-blur-sm rounded-xl border border-slate-700/50 transition-all duration-200 hover:scale-105 focus:outline-none focus:ring-2 focus:ring-emerald-500/50"
                title="Pantalla Completa"
              >
                <Maximize2 size={18} className="text-slate-400" aria-hidden="true" />
              </button>
            )}
          </div>
        </div>
      </div>
    </motion.header>
  );
};
