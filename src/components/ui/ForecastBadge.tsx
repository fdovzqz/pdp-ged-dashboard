import type { ForecastBadgeProps } from '../../types';

export const ForecastBadge = ({ type, color, active, onClick }: ForecastBadgeProps) => (
  <button
    onClick={onClick}
    className={`
      flex items-center gap-2 px-4 py-2 rounded-xl transition-all duration-300
      ${active 
        ? 'bg-slate-700 shadow-lg' 
        : 'bg-transparent hover:bg-slate-800/50'
      }
      border-none cursor-pointer
    `}
  >
    <div
      className="w-3 h-3 rounded-full"
      style={{ backgroundColor: color }}
    />
    <span className={`font-medium ${active ? 'text-white' : 'text-slate-400'}`}>
      {type.charAt(0).toUpperCase() + type.slice(1)}
    </span>
  </button>
);
