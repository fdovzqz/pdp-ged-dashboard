import { motion } from 'framer-motion';
import type { LucideIcon } from 'lucide-react';

interface StatCardProps {
  title: string;
  value: string | number;
  subtitle?: string;
  icon?: LucideIcon;
  iconColor?: string;
  trend?: {
    value: number;
    isPositive: boolean;
  };
  delay?: number;
}

export const StatCard = ({
  title,
  value,
  subtitle,
  icon: Icon,
  iconColor = '#10b981',
  trend,
  delay = 0,
}: StatCardProps) => (
  <motion.div
    initial={{ opacity: 0, scale: 0.95 }}
    animate={{ opacity: 1, scale: 1 }}
    transition={{ duration: 0.4, delay }}
    className="bg-slate-800/40 backdrop-blur-sm rounded-xl p-4 border border-slate-700/50"
  >
    <div className="flex items-start justify-between mb-2">
      {Icon && (
        <div className="p-2 rounded-lg bg-slate-700/50">
          <Icon size={16} color={iconColor} />
        </div>
      )}
      {trend && (
        <span
          className={`text-xs font-semibold px-2 py-0.5 rounded ${
            trend.isPositive
              ? 'bg-emerald-500/20 text-emerald-400'
              : 'bg-red-500/20 text-red-400'
          }`}
        >
          {trend.isPositive ? '+' : ''}{trend.value}%
        </span>
      )}
    </div>
    
    <p className="text-xs text-slate-400 uppercase tracking-wide">{title}</p>
    <p className="text-xl font-bold text-white mt-1">
      {typeof value === 'number' ? value.toLocaleString() : value}
    </p>
    {subtitle && (
      <p className="text-xs text-slate-500 mt-1">{subtitle}</p>
    )}
  </motion.div>
);
