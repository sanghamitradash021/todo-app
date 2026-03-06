import type { TodoFilters } from '../store/todoStore';

interface FilterBarProps {
  filters: TodoFilters;
  onChange: (filters: Partial<TodoFilters>) => void;
}

export function FilterBar({ filters, onChange }: FilterBarProps) {
  const selectClass =
    'border border-gray-300 rounded px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white';

  return (
    <div className="flex gap-3 items-center">
      <select
        aria-label="Filter by status"
        value={filters.status}
        onChange={(e) => onChange({ status: e.target.value as TodoFilters['status'] })}
        className={selectClass}
      >
        <option value="all">All statuses</option>
        <option value="pending">Pending</option>
        <option value="completed">Completed</option>
      </select>

      <select
        aria-label="Filter by priority"
        value={filters.priority}
        onChange={(e) => onChange({ priority: e.target.value as TodoFilters['priority'] })}
        className={selectClass}
      >
        <option value="">All priorities</option>
        <option value="low">Low</option>
        <option value="medium">Medium</option>
        <option value="high">High</option>
      </select>
    </div>
  );
}
