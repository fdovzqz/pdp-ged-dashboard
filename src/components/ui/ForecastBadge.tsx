import type { ForecastBadgeProps } from '../../types';

export const ForecastBadge = ({ type, color, active, onClick }: ForecastBadgeProps) => (
  <button
    onClick={onClick}
    aria-label={`${active ? 'Ocultar' : 'Mostrar'} proyección ${type}`}
    aria-pressed={active}
    className={`
      flex items-center gap-1.5 sm:gap-2 px-2.5 sm:px-4 py-1.5 sm:py-2 rounded-xl transition-all duration-300
      ${active 
        ? 'bg-slate-700 shadow-lg' 
        : 'bg-transparent hover:bg-slate-800/50'
      }
      border-none cursor-pointer focus:outline-none focus:ring-2 focus:ring-emerald-500/50
    `}
  >
    <div
      className="w-3 h-3 rounded-full"
      style={{ backgroundColor: color }}
      aria-hidden="true"
    />
    <span className={`text-xs sm:text-sm font-medium ${active ? 'text-white' : 'text-slate-400'}`}>
      {type.charAt(0).toUpperCase() + type.slice(1)}
    </span>
  </button>
);
