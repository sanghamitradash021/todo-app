import { useState, forwardRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { SPRING_DEFAULT, SPRING_GENTLE, STAGGER_DELAY } from '../../config/animations';
import type { Todo } from '../../types';
import { Badge } from '../Badge';

const PRIORITY_BAR: Record<Todo['priority'], string> = {
  high:   'bg-red-500',
  medium: 'bg-blue-500',
  low:    'bg-gray-400',
};

interface AnimatedTodoItemProps {
  todo: Todo;
  index: number;
  onToggle: (id: string) => void;
  onEdit: (todo: Todo) => void;
  onDelete: (todo: Todo) => void;
}

export const AnimatedTodoItem = forwardRef<HTMLDivElement, AnimatedTodoItemProps>(
  function AnimatedTodoItem({ todo, index, onToggle, onEdit, onDelete }, _ref) {
  const [isExpanded, setIsExpanded] = useState(false);
  const isCompleted = todo.status === 'completed';

  const handleRowClick = (e: React.MouseEvent) => {
    const target = e.target as HTMLElement;
    if (target.closest('[role="checkbox"]') || target.closest('button')) return;
    setIsExpanded((prev) => !prev);
  };

  return (
    <motion.div
      layout
      initial={{ opacity: 0, y: 16, scale: 0.97 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      exit={{ opacity: 0, x: -20, height: 0 }}
      transition={{ ...SPRING_DEFAULT, delay: index * STAGGER_DELAY }}
      whileHover={{ scale: 1.01 }}
      className="bg-white rounded-lg shadow overflow-hidden flex transition-shadow hover:shadow-md"
    >
      {/* 4px priority color bar — AC-D05.1 */}
      <div className={`w-1 shrink-0 ${PRIORITY_BAR[todo.priority]}`} aria-hidden="true" />

      <div className="flex-1 p-4">
        <div className="flex items-start gap-3" onClick={handleRowClick}>
          {/* Animated SVG checkbox — AC-D05.2 */}
          <button
            role="checkbox"
            aria-checked={isCompleted}
            aria-label={`Mark "${todo.title}" as ${isCompleted ? 'pending' : 'completed'}`}
            onClick={(e) => { e.stopPropagation(); onToggle(todo.id); }}
            className="mt-0.5 shrink-0 w-5 h-5 rounded border-2 flex items-center justify-center focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-1"
            style={{
              backgroundColor: isCompleted ? '#2563eb' : 'white',
              borderColor: isCompleted ? '#2563eb' : '#d1d5db',
            }}
          >
            <svg width="10" height="8" viewBox="0 0 10 8" fill="none" aria-hidden="true">
              <motion.path
                d="M1 4L3.5 6.5L9 1"
                stroke="white"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
                initial={false}
                animate={{ pathLength: isCompleted ? 1 : 0 }}
                transition={SPRING_GENTLE}
              />
            </svg>
          </button>

          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 flex-wrap">
              {/* Strikethrough via CSS transition — AC-D05.5 */}
              <span
                className={`text-sm font-medium transition-all duration-300 ${
                  isCompleted ? 'line-through text-gray-400' : 'text-gray-900'
                }`}
              >
                {todo.title}
              </span>
              <Badge type="status" value={todo.status} />
              <Badge type="priority" value={todo.priority} />
              {todo.due_date && (
                <span className="text-xs text-gray-500">Due: {todo.due_date}</span>
              )}
            </div>

            {/* Animated description expand/collapse — AC-D05.3 */}
            <AnimatePresence>
              {isExpanded && (
                <motion.div
                  key="description"
                  initial={{ height: 0, opacity: 0 }}
                  animate={{ height: 'auto', opacity: 1 }}
                  exit={{ height: 0, opacity: 0 }}
                  transition={SPRING_GENTLE}
                  className="overflow-hidden"
                >
                  <div className="mt-2 text-sm text-gray-600">
                    {todo.description ?? (
                      <span className="italic text-gray-400">No description</span>
                    )}
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>

          <div className="flex gap-2 shrink-0">
            <button
              onClick={(e) => { e.stopPropagation(); onEdit(todo); }}
              className="text-xs text-blue-600 hover:text-blue-800 font-medium"
            >
              Edit
            </button>
            <button
              onClick={(e) => { e.stopPropagation(); onDelete(todo); }}
              className="text-xs text-red-600 hover:text-red-800 font-medium"
            >
              Delete
            </button>
          </div>
        </div>
      </div>
    </motion.div>
  );
});

