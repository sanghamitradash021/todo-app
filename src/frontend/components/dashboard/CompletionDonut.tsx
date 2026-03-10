import { PieChart, Pie, Cell } from 'recharts';

interface CompletionDonutProps {
  completionPct: number;
  completed:     number;
  pending:       number;
  total:         number;
}

const EMPTY_SEGMENT = [{ name: 'Empty', value: 1, fill: '#e5e7eb' }];

export function CompletionDonut({ completionPct, completed, pending, total }: CompletionDonutProps) {
  const isEmpty = total === 0;

  // Drop zero-value segments so the donut doesn't render invisible arcs
  const data = isEmpty
    ? EMPTY_SEGMENT
    : [
        { name: 'Completed', value: completed, fill: '#16a34a' },
        { name: 'Pending',   value: pending,   fill: '#ca8a04' },
      ].filter((d) => d.value > 0);

  // Safety fallback: shouldn't occur but prevents a blank chart
  const segments = data.length > 0 ? data : EMPTY_SEGMENT;

  return (
    <div className="flex flex-col items-center">
      <p className="text-sm font-semibold text-gray-600 mb-3">Completion Rate</p>

      {/* Position relative so the absolute center label sits inside the ring */}
      <div className="relative" style={{ width: 180, height: 180 }}>
        <PieChart width={180} height={180}>
          <Pie
            data={segments}
            cx={90}
            cy={90}
            innerRadius={55}
            outerRadius={80}
            dataKey="value"
            startAngle={90}
            endAngle={-270}
            stroke="none"
            animationBegin={0}
            animationDuration={600}
          >
            {segments.map((entry, index) => (
              <Cell key={`cell-${index}`} fill={entry.fill} />
            ))}
          </Pie>
        </PieChart>

        {/* Center percentage label — AC-D02.2 */}
        <div
          className="absolute inset-0 flex items-center justify-center pointer-events-none"
          aria-label={`${completionPct} percent completion`}
        >
          <span className="text-2xl font-bold text-gray-800">{completionPct}%</span>
        </div>
      </div>
    </div>
  );
}
