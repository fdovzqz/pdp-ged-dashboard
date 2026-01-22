import { Info } from 'lucide-react';
import { AnnualComparisonSection } from '../components/sections';

export const AnnualDashboard = () => {
  return (
    <div className="space-y-8 animate-in fade-in duration-500">
      {/* Context Header */}
      <div className="flex items-center gap-3 mb-6 bg-slate-800/40 p-4 rounded-xl border border-slate-700/50 backdrop-blur-sm">
        <Info className="text-violet-400" size={24} />
        <div>
          <h2 className="text-lg font-bold text-white">Análisis Estratégico Anual</h2>
          <p className="text-sm text-slate-400">
            Comparativa de crecimiento mensual y tendencias macro: 2024 vs 2025.
          </p>
        </div>
      </div>

      <AnnualComparisonSection />
    </div>
  );
};
