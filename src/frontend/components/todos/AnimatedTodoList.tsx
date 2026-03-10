import { AnimatePresence } from 'framer-motion';
import type { Todo } from '../../types';
import type { TodoFilters } from '../../store/todoStore';
import { AnimatedTodoItem } from './AnimatedTodoItem';
import { SkeletonCard } from './SkeletonCard';
import { EmptyState } from './EmptyState';

const SKELETON_COUNT = 3;

interface AnimatedTodoListProps {
  todos: Todo[];
  /** True only during the very first fetch — shows skeletons. False for filter-change reloads. */
  isInitialLoad: boolean;
  filters: TodoFilters;
  onToggle: (id: string) => void;
  onEdit: (todo: Todo) => void;
  onDelete: (todo: Todo) => void;
  onAddTodo: () => void;
}

export function AnimatedTodoList({
  todos,
  isInitialLoad,
  filters,
  onToggle,
  onEdit,
  onDelete,
  onAddTodo,
}: AnimatedTodoListProps) {
  // Show skeleton cards only on initial page load — AC-D09.1/3
  if (isInitialLoad) {
    return (
      <div className="flex flex-col gap-3" aria-label="Loading todos">
        {Array.from({ length: SKELETON_COUNT }).map((_, i) => (
          <SkeletonCard key={i} />
        ))}
      </div>
    );
  }

  // Show contextual empty state — AC-D10.1/3
  if (todos.length === 0) {
    return <EmptyState statusFilter={filters.status} onAddTodo={onAddTodo} />;
  }

  return (
    <div className="flex flex-col gap-3">
      {/* AnimatePresence mode="popLayout" for smooth enter/exit — AC-D04.3/4 */}
      <AnimatePresence mode="popLayout">
        {todos.map((todo, index) => (
          <AnimatedTodoItem
            key={todo.id}
            todo={todo}
            index={index}
            onToggle={onToggle}
            onEdit={onEdit}
            onDelete={onDelete}
          />
        ))}
      </AnimatePresence>
    </div>
  );
}
