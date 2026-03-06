interface BadgeProps {
  type: 'status' | 'priority';
  value: string;
}

const STATUS_CLASSES: Record<string, string> = {
  pending: 'bg-yellow-100 text-yellow-800',
  completed: 'bg-green-100 text-green-800',
};

const PRIORITY_CLASSES: Record<string, string> = {
  low: 'bg-gray-100 text-gray-700',
  medium: 'bg-blue-100 text-blue-700',
  high: 'bg-red-100 text-red-700',
};

export function Badge({ type, value }: BadgeProps) {
  const colorClass =
    type === 'status'
      ? (STATUS_CLASSES[value] ?? 'bg-gray-100 text-gray-700')
      : (PRIORITY_CLASSES[value] ?? 'bg-gray-100 text-gray-700');

  return (
    <span className={`inline-flex items-center px-2 py-0.5 rounded text-xs font-medium ${colorClass}`}>
      {value}
    </span>
  );
}
