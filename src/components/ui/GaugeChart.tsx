import { motion } from 'framer-motion';

interface GaugeChartProps {
  value: number;
  max: number;
  label: string;
  color?: string;
  size?: number;
}

export const GaugeChart = ({ 
  value, 
  max, 
  label, 
  color = '#10b981',
  size = 120 
}: GaugeChartProps) => {
  const percentage = Math.min((value / max) * 100, 100);
  const strokeWidth = size * 0.1;
  const radius = (size - strokeWidth) / 2;
  const circumference = radius * Math.PI; // Semicircle
  const strokeDashoffset = circumference - (percentage / 100) * circumference;
  
  return (
    <div className="flex flex-col items-center">
      <div className="relative" style={{ width: size, height: size / 2 + 20 }}>
        <svg
          width={size}
          height={size / 2 + 10}
          className="transform rotate-0"
        >
          {/* Background arc */}
          <path
            d={`M ${strokeWidth / 2} ${size / 2} A ${radius} ${radius} 0 0 1 ${size - strokeWidth / 2} ${size / 2}`}
            fill="none"
            stroke="#334155"
            strokeWidth={strokeWidth}
            strokeLinecap="round"
          />
          
          {/* Progress arc */}
          <motion.path
            d={`M ${strokeWidth / 2} ${size / 2} A ${radius} ${radius} 0 0 1 ${size - strokeWidth / 2} ${size / 2}`}
            fill="none"
            stroke={color}
            strokeWidth={strokeWidth}
            strokeLinecap="round"
            strokeDasharray={circumference}
            initial={{ strokeDashoffset: circumference }}
            animate={{ strokeDashoffset }}
            transition={{ duration: 1.5, ease: 'easeOut' }}
          />
        </svg>
        
        {/* Value display */}
        <div 
          className="absolute inset-0 flex flex-col items-center justify-end pb-0"
          style={{ paddingBottom: '5px' }}
        >
          <motion.span 
            className="text-2xl font-bold text-white"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.5 }}
          >
            {percentage.toFixed(1)}%
          </motion.span>
        </div>
      </div>
      
      <p className="text-xs text-slate-400 mt-1 text-center">{label}</p>
    </div>
  );
};
