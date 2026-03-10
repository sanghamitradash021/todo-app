import { CompletionDonut } from './CompletionDonut';
import { PriorityBars } from './PriorityBars';
import type { DashboardStats } from '../../hooks/useDashboardStats';

interface ChartsRowProps {
  stats: DashboardStats;
}

export function ChartsRow({ stats }: ChartsRowProps) {
  if (stats.isStatsLoading) {
    return (
      <div className="flex flex-col md:flex-row gap-6 mb-6" aria-label="Loading charts">
        {/* Donut skeleton */}
        <div className="bg-white rounded-xl shadow-sm ring-1 ring-gray-100 p-5 animate-pulse flex flex-col items-center">
          <div className="h-3 bg-gray-200 rounded w-28 mb-4" />
          <div className="rounded-full bg-gray-200" style={{ width: 120, height: 120 }} aria-hidden="true" />
        </div>
        {/* Bars skeleton */}
        <div className="bg-white rounded-xl shadow-sm ring-1 ring-gray-100 p-5 flex-1 animate-pulse">
          <div className="h-3 bg-gray-200 rounded w-32 mb-4" />
          <div className="flex flex-col gap-4">
            {[1, 2, 3].map((i) => (
              <div key={i}>
                <div className="h-3 bg-gray-200 rounded w-1/2 mb-1" />
                <div className="h-2 bg-gray-200 rounded-full" />
              </div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col md:flex-row gap-6 mb-6">
      {/* Completion donut */}
      <div className="bg-white rounded-xl shadow-sm ring-1 ring-gray-100 p-5">
        <CompletionDonut
          completionPct={stats.completionPct}
          completed={stats.completed}
          pending={stats.pending}
          total={stats.total}
        />
      </div>

      {/* Priority breakdown bars */}
      <div className="bg-white rounded-xl shadow-sm ring-1 ring-gray-100 p-5 flex-1">
        <PriorityBars
          priorityCounts={stats.priorityCounts}
          total={stats.total}
        />
      </div>
    </div>
  );
}
