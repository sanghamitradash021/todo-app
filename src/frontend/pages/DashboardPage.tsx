import { useDashboardStats } from '../hooks/useDashboardStats';
import { StatsRow } from '../components/dashboard/StatsRow';
import { ChartsRow } from '../components/dashboard/ChartsRow';

function DashboardPage() {
  const stats = useDashboardStats();
  return (
    <div className="max-w-5xl mx-auto">
      {/* Title hidden on mobile — DashboardLayout top bar shows it instead */}
      <h1 className="text-2xl font-bold text-gray-900 mb-6 hidden md:block">Dashboard</h1>
      <StatsRow stats={stats} />
      <ChartsRow stats={stats} />
    </div>
  );
}

export default DashboardPage;
