import { useState } from 'react';
import type { Todo } from '../types';
import { Badge } from './Badge';

interface TodoItemProps {
  todo: Todo;
  onToggle: (id: string) => void;
  onEdit: (todo: Todo) => void;
  onDelete: (todo: Todo) => void;
}

export function TodoItem({ todo, onToggle, onEdit, onDelete }: TodoItemProps) {
  const [isExpanded, setIsExpanded] = useState(false);

  const handleRowClick = (e: React.MouseEvent) => {
    // Don't expand if clicking on interactive elements
    const target = e.target as HTMLElement;
    if (target.closest('button') || target.closest('input[type="checkbox"]')) return;
    setIsExpanded((prev) => !prev);
  };

  return (
    <div className="bg-white rounded-lg shadow p-4 cursor-pointer hover:shadow-md transition-shadow">
      <div className="flex items-start gap-3" onClick={handleRowClick}>
        <input
          type="checkbox"
          checked={todo.status === 'completed'}
          onChange={() => onToggle(todo.id)}
          className="mt-1 h-4 w-4 rounded border-gray-300 text-blue-600 cursor-pointer"
          aria-label={`Mark "${todo.title}" as ${todo.status === 'pending' ? 'completed' : 'pending'}`}
        />

        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 flex-wrap">
            <span
              className={`text-sm font-medium ${todo.status === 'completed' ? 'line-through text-gray-400' : 'text-gray-900'}`}
            >
              {todo.title}
            </span>
            <Badge type="status" value={todo.status} />
            <Badge type="priority" value={todo.priority} />
            {todo.due_date && (
              <span className="text-xs text-gray-500">Due: {todo.due_date}</span>
            )}
          </div>

          {isExpanded && (
            <div className="mt-2 text-sm text-gray-600">
              {todo.description ?? <span className="italic text-gray-400">No description</span>}
            </div>
          )}
        </div>

        <div className="flex gap-2 shrink-0">
          <button
            onClick={() => onEdit(todo)}
            className="text-xs text-blue-600 hover:text-blue-800 font-medium"
          >
            Edit
          </button>
          <button
            onClick={() => onDelete(todo)}
            className="text-xs text-red-600 hover:text-red-800 font-medium"
          >
            Delete
          </button>
        </div>
      </div>
    </div>
  );
}
