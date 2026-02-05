import type { TooltipPayload } from '../../types';

interface CustomTooltipProps {
  active?: boolean;
  payload?: TooltipPayload[];
  label?: string;
}

// Orden deseado para el tooltip: históricos primero, luego forecasts
const TOOLTIP_ORDER = ['2024', '2025', 'Actual 2026', '2026', 'Conservador', 'Probable', 'Optimista'];

/** Formato compacto: 15000 → "15K", 1500000 → "1.5M" */
const formatCompact = (value: number): string => {
  if (value >= 1_000_000) return `${(value / 1_000_000).toFixed(1)}M`;
  if (value >= 1_000) return `${(value / 1_000).toFixed(0)}K`;
  return value.toLocaleString();
};

export const CustomTooltip = ({ active, payload, label }: CustomTooltipProps) => {
  if (active && payload && payload.length) {
    // Ordenar payload según el orden definido
    const sortedPayload = [...payload].sort((a, b) => {
      const indexA = TOOLTIP_ORDER.indexOf(a.name || '');
      const indexB = TOOLTIP_ORDER.indexOf(b.name || '');
      // Si no está en la lista, ponerlo al final
      const posA = indexA === -1 ? 999 : indexA;
      const posB = indexB === -1 ? 999 : indexB;
      return posA - posB;
    });

    const val2025 = payload.find((p) => p.name === '2025')?.value ?? 0;
    const val2026 = payload.find((p) => p.name === '2026' || p.name === 'Actual 2026')?.value ?? 0;
    const diffVs2025 = val2025 > 0 && val2026 > 0 ? val2026 - val2025 : null;
    const pctVs2025 = val2025 > 0 && diffVs2025 !== null
      ? ((diffVs2025 / val2025) * 100).toFixed(1)
      : null;

    return (
      <div className="relative bg-slate-900/95 backdrop-blur-sm px-4 py-3 rounded-xl border border-slate-700 shadow-2xl">
        <p className="text-emerald-400 font-bold text-sm mb-2 tabular-nums">
          Día {label}
        </p>
        {sortedPayload.map((entry, index) => (
          <div
            key={index}
            className="flex items-center justify-between gap-4 text-sm min-w-[140px]"
          >
            <div className="flex items-center gap-2">
              <div
                className="w-2 h-2 rounded-full shrink-0"
                style={{ backgroundColor: entry.color }}
              />
              <span className="text-slate-400">{entry.name}</span>
            </div>
            <span className="text-white font-semibold tabular-nums">
              {formatCompact(entry.value)}
            </span>
          </div>
        ))}
        {diffVs2025 !== null && pctVs2025 !== null && (
          <div className="mt-2 pt-2 border-t border-slate-600/50 text-xs">
            <span className="text-slate-400">vs 2025: </span>
            <span className={Number(pctVs2025) >= 0 ? 'text-emerald-400' : 'text-red-400'}>
              {Number(pctVs2025) >= 0 ? '+' : ''}{pctVs2025}%
              <span className="text-slate-500 ml-1">
                ({diffVs2025 >= 0 ? '+' : ''}{formatCompact(diffVs2025)})
              </span>
            </span>
          </div>
        )}
      </div>
    );
  }
  return null;
};
