import { motion } from 'framer-motion';
import { AlertTriangle, Clock } from 'lucide-react';

export const NotesSection = () => {
  return (
    <motion.div
      initial={{ opacity: 0, y: 30 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.6, delay: 0.45 }}
      className="bg-linear-to-br from-slate-800/50 to-slate-700/30 backdrop-blur-sm rounded-3xl border border-slate-600/30 p-6"
    >
      <h3 className="text-lg font-bold text-white mb-4 flex items-center gap-2 font-display">
        <AlertTriangle size={18} className="text-amber-400" />
        Notas Importantes para el Análisis
      </h3>
      
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {/* Note 1 - 2025 MIT */}
        <div className="bg-violet-500/15 border border-violet-500/30 rounded-xl p-4">
          <div className="flex items-start gap-3">
            <div className="bg-violet-500/30 p-2 rounded-lg shrink-0">
              <span className="text-sm font-bold text-violet-400">2025</span>
            </div>
            <div>
              <p className="text-sm text-slate-200 leading-relaxed">
                El año 2025 fue afectado por{' '}
                <span className="text-red-400 font-semibold">problemas de rechazos</span>{' '}
                en el proceso de pagos MIT. Se migró a EVO{' '}
                <span className="text-amber-400 font-semibold">4 días antes del fin de mes</span>.
              </p>
            </div>
          </div>
        </div>

        {/* Note 2 - 2026 Defect */}
        <div className="bg-emerald-500/15 border border-emerald-500/30 rounded-xl p-4">
          <div className="flex items-start gap-3">
            <div className="bg-emerald-500/30 p-2 rounded-lg shrink-0">
              <span className="text-sm font-bold text-emerald-400">2026</span>
            </div>
            <div>
              <p className="text-sm text-slate-200 leading-relaxed">
                Un defecto causó que aproximadamente{' '}
                <span className="text-amber-400 font-semibold">30% de los pagos</span>{' '}
                del Sábado 17, Domingo 18 y Lunes 19 se procesaron el{' '}
                <span className="text-cyan-400 font-semibold">Martes 20</span>, inflando ese día.
              </p>
            </div>
          </div>
        </div>

        {/* Note 3 - Data Cutoff */}
        <div className="bg-amber-500/15 border border-amber-500/30 rounded-xl p-4">
          <div className="flex items-start gap-3">
            <div className="bg-amber-500/30 p-2 rounded-lg shrink-0">
              <Clock size={16} className="text-amber-400" />
            </div>
            <div>
              <p className="text-sm text-slate-200 leading-relaxed">
                Los datos del 2026 son al corte de las{' '}
                <span className="text-amber-400 font-semibold">12:00 PM del 21 de Enero</span>.
                Día 21 completo con datos actualizados.
              </p>
            </div>
          </div>
        </div>
      </div>
    </motion.div>
  );
};
