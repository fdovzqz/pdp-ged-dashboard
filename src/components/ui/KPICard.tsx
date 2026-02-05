import { motion, type Variants } from 'framer-motion';
import { ArrowUpRight } from 'lucide-react';
import type { KPICardProps } from '../../types';

// Animation variants for stagger support
const cardVariants: Variants = {
  hidden: { opacity: 0, y: 30 },
  visible: {
    opacity: 1,
    y: 0,
    transition: { duration: 0.5, ease: [0.25, 0.1, 0.25, 1] },
  },
};

/** Genera path SVG para sparkline a partir de datos */
const sparklinePath = (data: number[], width: number, height: number): string => {
  if (data.length < 2) return '';
  const max = Math.max(...data);
  const min = Math.min(...data);
  const range = max - min || 1;
  const stepX = width / (data.length - 1);
  const points = data.map((v, i) => {
    const x = i * stepX;
    const y = height - ((v - min) / range) * height;
    return `${x},${y}`;
  });
  return `M ${points.join(' L ')}`;
};

export const KPICard = ({
  title,
  value,
  subtitle,
  icon: Icon,
  trend,
  trendValue,
  accent = false,
  absoluteDelta,
  sparklineData,
  tooltip,
}: KPICardProps) => {
  const cardContent = (
    <motion.div
      variants={cardVariants}
      initial="hidden"
      animate="visible"
      whileHover={{ scale: 1.02, transition: { duration: 0.2 } }}
      className={`
        relative overflow-hidden rounded-2xl p-6
        ${accent
          ? 'bg-linear-to-br from-emerald-500 via-emerald-600 to-teal-700'
          : 'bg-slate-800/50 border border-slate-700/50 backdrop-blur-sm'
        }
      `}
    >
      {accent && (
        <div className="absolute top-0 right-0 w-32 h-32 bg-white/10 rounded-full transform translate-x-1/2 -translate-y-1/2" />
      )}

      <div className="relative z-10">
        <div className="flex items-center justify-between mb-4">
          <div className={`p-2 rounded-lg ${accent ? 'bg-white/20' : 'bg-emerald-500/20'}`}>
            <Icon size={20} color={accent ? 'white' : '#34d399'} />
          </div>

          {trend && (
            <div
              className={`
                flex items-center gap-1 text-sm font-bold px-2 py-1 rounded-lg
                ${trend === 'up'
                  ? 'bg-emerald-500/20 text-emerald-400'
                  : 'bg-red-500/20 text-red-400'
                }
              `}
            >
              <ArrowUpRight
                size={14}
                className={trend === 'down' ? 'rotate-90' : ''}
              />
              {trendValue}
              {absoluteDelta !== undefined && (
                <span className="text-slate-400 font-normal ml-0.5">
                  | {absoluteDelta >= 0 ? '+' : ''}{absoluteDelta.toLocaleString()}
                </span>
              )}
            </div>
          )}
        </div>

        <p className={`text-xs uppercase tracking-wider mb-1 ${accent ? 'text-emerald-100/90' : 'text-slate-400'}`}>
          {title}
        </p>

        <h3 className="text-3xl font-bold text-white tabular-nums">
          {value}
        </h3>

        {sparklineData && sparklineData.length > 0 && (
          <div className="mt-2 h-8 w-full opacity-70">
            <svg viewBox="0 0 100 24" preserveAspectRatio="none" className="w-full h-8 block">
              <path
                d={sparklinePath(sparklineData, 100, 24)}
                fill="none"
                stroke={accent ? 'rgba(255,255,255,0.6)' : '#34d399'}
                strokeWidth="1.5"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
            </svg>
          </div>
        )}

        {subtitle && (
          <p className={`text-xs mt-2 ${accent ? 'text-emerald-100/80' : 'text-slate-500'}`}>
            {subtitle}
          </p>
        )}
      </div>
    </motion.div>
  );

  if (tooltip) {
    return (
      <div className="group relative">
        {cardContent}
        <div className="absolute inset-0 flex items-center justify-center bg-slate-900/90 opacity-0 group-hover:opacity-100 transition-opacity duration-200 rounded-2xl z-20 pointer-events-none">
          <p className="text-sm text-slate-200 px-4 py-2 text-center max-w-[90%]">
            {tooltip}
          </p>
        </div>
      </div>
    );
  }

  return cardContent;
};
