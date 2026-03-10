import { useState, FormEvent } from 'react';
import { motion } from 'framer-motion';
import { SPRING_DEFAULT, FADE_NORMAL } from '../config/animations';
import type { Todo } from '../types';
import type { CreateTodoData, UpdateTodoData } from '../hooks/useTodos';

interface TodoModalProps {
  todo?: Todo;
  onClose: () => void;
  onSubmit: (data: CreateTodoData | UpdateTodoData) => Promise<boolean>;
}

export function TodoModal({ todo, onClose, onSubmit }: TodoModalProps) {
  const isEdit = todo !== undefined;

  const [title, setTitle] = useState(todo?.title ?? '');
  const [description, setDescription] = useState(todo?.description ?? '');
  const [priority, setPriority] = useState<'low' | 'medium' | 'high'>(todo?.priority ?? 'medium');
  const [dueDate, setDueDate] = useState(todo?.due_date ?? '');
  const [titleError, setTitleError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async (e: FormEvent<HTMLFormElement>): Promise<void> => {
    e.preventDefault();
    setTitleError(null);

    if (!title.trim()) {
      setTitleError('Title is required');
      return;
    }

    const data: CreateTodoData | UpdateTodoData = {
      title: title.trim(),
      description: description.trim() || null,
      priority,
      due_date: dueDate || null,
    };

    setIsSubmitting(true);
    const success = await onSubmit(data);
    setIsSubmitting(false);

    if (success) onClose();
  };

  const handleBackdropClick = (e: React.MouseEvent<HTMLDivElement>) => {
    if (e.target === e.currentTarget && !isSubmitting) onClose();
  };

  const inputClass =
    'w-full border border-gray-300 rounded px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500';

  return (
    <motion.div
      className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50"
      onClick={handleBackdropClick}
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={FADE_NORMAL}
    >
      <motion.div
        className="bg-white rounded-lg shadow-xl w-full max-w-lg p-6"
        initial={{ opacity: 0, scale: 0.95, y: 10 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.95, y: 10 }}
        transition={SPRING_DEFAULT}
      >
        <h2 className="text-lg font-semibold text-gray-900 mb-4">
          {isEdit ? 'Edit Todo' : 'Add Todo'}
        </h2>

        <form onSubmit={handleSubmit} noValidate>
          <div className="mb-4">
            <label htmlFor="todo-title" className="block text-sm font-medium text-gray-700 mb-1">
              Title <span className="text-red-500">*</span>
            </label>
            <input
              id="todo-title"
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              className={inputClass}
              placeholder="What needs to be done?"
            />
            {titleError && <p className="mt-1 text-xs text-red-600">{titleError}</p>}
          </div>

          <div className="mb-4">
            <label htmlFor="todo-description" className="block text-sm font-medium text-gray-700 mb-1">
              Description
            </label>
            <textarea
              id="todo-description"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              rows={3}
              className={inputClass}
              placeholder="Optional details…"
            />
          </div>

          <div className="mb-4 flex gap-4">
            <div className="flex-1">
              <label htmlFor="todo-priority" className="block text-sm font-medium text-gray-700 mb-1">
                Priority
              </label>
              <select
                id="todo-priority"
                value={priority}
                onChange={(e) => setPriority(e.target.value as 'low' | 'medium' | 'high')}
                className={inputClass}
              >
                <option value="low">Low</option>
                <option value="medium">Medium</option>
                <option value="high">High</option>
              </select>
            </div>

            <div className="flex-1">
              <label htmlFor="todo-due-date" className="block text-sm font-medium text-gray-700 mb-1">
                Due Date
              </label>
              <input
                id="todo-due-date"
                type="date"
                value={dueDate}
                onChange={(e) => setDueDate(e.target.value)}
                className={inputClass}
              />
            </div>
          </div>

          <div className="flex justify-end gap-3 mt-6">
            <button
              type="button"
              onClick={onClose}
              disabled={isSubmitting}
              className="bg-white border border-gray-300 text-gray-700 py-2 px-4 rounded text-sm font-medium hover:bg-gray-50 disabled:opacity-50"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isSubmitting}
              className="bg-blue-600 text-white py-2 px-4 rounded text-sm font-medium hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isSubmitting ? 'Saving…' : isEdit ? 'Save Changes' : 'Add Todo'}
            </button>
          </div>
        </form>
      </motion.div>
    </motion.div>
  );
}
