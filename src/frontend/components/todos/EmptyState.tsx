import { motion } from 'framer-motion';
import { SPRING_DEFAULT } from '../../config/animations';
import type { TodoStatus } from '../../types';

interface EmptyStateProps {
  statusFilter: TodoStatus | 'all' | '';
  onAddTodo: () => void;
}

const MESSAGES: Record<string, string> = {
  pending:   'No pending todos. Great work!',
  completed: 'Nothing completed yet.',
  all:       'No todos yet. Add one to get started.',
  '':        'No todos yet. Add one to get started.',
};

export function EmptyState({ statusFilter, onAddTodo }: EmptyStateProps) {
  const message = MESSAGES[statusFilter] ?? 'No todos yet. Add one to get started.';
  const showAddButton = statusFilter === 'all' || statusFilter === '';

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={SPRING_DEFAULT}
      className="flex flex-col items-center py-16 text-center"
    >
      {/* Clipboard SVG icon — AC-D10.4 */}
      <svg
        className="w-12 h-12 text-gray-300 mb-4"
        fill="none"
        viewBox="0 0 24 24"
        stroke="currentColor"
        strokeWidth={1.5}
        aria-hidden="true"
      >
        <path
          strokeLinecap="round"
          strokeLinejoin="round"
          d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2"
        />
      </svg>

      <p className="text-sm text-gray-500 mb-4">{message}</p>

      {/* "Add Todo" button — AC-D10.5 */}
      {showAddButton && (
        <button
          onClick={onAddTodo}
          className="bg-blue-600 text-white py-2 px-4 rounded text-sm font-medium hover:bg-blue-700"
        >
          + Add Todo
        </button>
      )}
    </motion.div>
  );
}
