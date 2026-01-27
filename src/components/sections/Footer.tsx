import { motion } from 'framer-motion';
import { Building2 } from 'lucide-react';

export const Footer = () => {
  return (
    <motion.footer
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.6, delay: 0.7 }}
      className="text-center py-8 border-t border-slate-800 mt-8"
    >
      <div className="flex items-center justify-center gap-3 mb-3">
        <div className="bg-emerald-500/20 p-2 rounded-lg">
          <Building2 size={16} className="text-emerald-400" />
        </div>
        <p className="text-slate-400 text-sm font-medium">
          Portal de Pagos del Estado de Durango
        </p>
      </div>
      <p className="text-slate-600 text-xs">
        © 2026 PaGob · Dashboard Ejecutivo de Análisis de Crecimiento
      </p>
      <p className="text-slate-600 text-[11px] mt-2 max-w-3xl mx-auto">
        La información presentada en este dashboard es exclusivamente para fines demostrativos y
        no constituye información oficial ni de registro.
      </p>
    </motion.footer>
  );
};
