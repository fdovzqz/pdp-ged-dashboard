import type { TooltipPayload } from '../../types';

interface CustomTooltipProps {
  active?: boolean;
  payload?: TooltipPayload[];
  label?: string;
}

export const CustomTooltip = ({ active, payload, label }: CustomTooltipProps) => {
  if (active && payload && payload.length) {
    return (
      <div className="bg-slate-900/95 backdrop-blur-sm px-4 py-3 rounded-xl border border-slate-700 shadow-2xl">
        <p className="text-emerald-400 font-bold text-sm mb-2">
          Día {label}
        </p>
        {payload.map((entry, index) => (
          <div
            key={index}
            className="flex items-center gap-2 text-sm"
          >
            <div
              className="w-2 h-2 rounded-full"
              style={{ backgroundColor: entry.color }}
            />
            <span className="text-slate-400">{entry.name}:</span>
            <span className="text-white font-semibold">
              {entry.value.toLocaleString()}
            </span>
          </div>
        ))}
      </div>
    );
  }
  return null;
};
