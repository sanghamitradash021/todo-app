import { StatCard } from './StatCard';
import type { DashboardStats } from '../../hooks/useDashboardStats';

interface StatsRowProps {
  stats: DashboardStats;
}

const CARDS = [
  { label: 'Total',     key: 'total'     as const, accent: 'blue'   as const },
  { label: 'Pending',   key: 'pending'   as const, accent: 'yellow' as const },
  { label: 'Completed', key: 'completed' as const, accent: 'green'  as const },
  { label: 'Overdue',   key: 'overdue'   as const, accent: 'red'    as const },
];

export function StatsRow({ stats }: StatsRowProps) {
  // Show skeleton placeholders during initial stats fetch
  if (stats.isStatsLoading) {
    return (
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6" aria-label="Loading stats">
        {CARDS.map((c) => (
          <div
            key={c.key}
            className="rounded-xl p-5 shadow-sm ring-1 ring-gray-200 bg-white animate-pulse"
            aria-hidden="true"
          >
            <div className="h-3 bg-gray-200 rounded w-2/3 mb-3" />
            <div className="h-8 bg-gray-200 rounded w-1/2" />
          </div>
        ))}
      </div>
    );
  }

  return (
    <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
      {CARDS.map((c, index) => (
        <StatCard
          key={c.label}
          label={c.label}
          value={stats[c.key]}
          accent={c.accent}
          index={index}
        />
      ))}
    </div>
  );
}
