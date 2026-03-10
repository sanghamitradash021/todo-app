import { motion } from 'framer-motion';
import { BAR_DURATION } from '../../config/animations';

interface PriorityBarsProps {
  priorityCounts: { high: number; medium: number; low: number };
  total:          number;
}

const BARS = [
  { key: 'high'   as const, label: 'High',   bg: 'bg-red-500'  },
  { key: 'medium' as const, label: 'Medium', bg: 'bg-blue-500' },
  { key: 'low'    as const, label: 'Low',    bg: 'bg-gray-400' },
];

function calcPct(count: number, total: number): number {
  return total === 0 ? 0 : Math.round((count / total) * 100);
}

export function PriorityBars({ priorityCounts, total }: PriorityBarsProps) {
  return (
    <div>
      <p className="text-sm font-semibold text-gray-600 mb-4">Priority Breakdown</p>
      <div className="flex flex-col gap-4">
        {BARS.map(({ key, label, bg }) => {
          const count      = priorityCounts[key];
          const percentage = calcPct(count, total);

          return (
            <div key={key}>
              <div className="flex items-center justify-between text-xs text-gray-600 mb-1">
                <span className="font-medium">{label}</span>
                <span>
                  {count} · {percentage}%
                </span>
              </div>

              {/* Track */}
              <div className="h-2 bg-gray-100 rounded-full overflow-hidden">
                {/* Animated fill bar — AC-D03.4/5 */}
                <motion.div
                  className={`h-full rounded-full ${bg}`}
                  initial={{ width: '0%' }}
                  animate={{ width: `${percentage}%` }}
                  transition={{ duration: BAR_DURATION, ease: 'easeOut' }}
                />
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
