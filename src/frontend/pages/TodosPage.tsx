import { useEffect, useRef, useState } from 'react';
import { AnimatePresence } from 'framer-motion';
import { useTodos } from '../hooks/useTodos';
import { FilterBar } from '../components/FilterBar';
import { AnimatedTodoList } from '../components/todos/AnimatedTodoList';
import { TodoModal } from '../components/TodoModal';
import { DeleteConfirmModal } from '../components/DeleteConfirmModal';
import { ToastContainer } from '../components/ToastContainer';
import type { Todo } from '../types';
import type { TodoFilters } from '../store/todoStore';

function TodosPage() {
  const { todos, isLoading, filters, fetchTodos, createTodo, updateTodo, toggleTodo, deleteTodo, setFilters } =
    useTodos();

  const [showAddModal, setShowAddModal] = useState(false);
  const [editingTodo, setEditingTodo] = useState<Todo | null>(null);
  const [deletingTodo, setDeletingTodo] = useState<Todo | null>(null);

  // Track initial load: show skeletons only on first fetch, not on filter changes — AC-D09.3
  const prevIsLoadingRef = useRef<boolean | null>(null);
  const [hasLoaded, setHasLoaded] = useState(false);
  useEffect(() => {
    if (prevIsLoadingRef.current === true && !isLoading && !hasLoaded) {
      setHasLoaded(true);
    }
    prevIsLoadingRef.current = isLoading;
  }, [isLoading, hasLoaded]);
  const isInitialLoad = isLoading && !hasLoaded;

  useEffect(() => {
    void fetchTodos();
  }, [filters]); // eslint-disable-line react-hooks/exhaustive-deps

  const handleFilterChange = (partial: Partial<TodoFilters>): void => {
    setFilters(partial);
  };

  const handleCreate = async (data: Parameters<typeof createTodo>[0]): Promise<boolean> => {
    const success = await createTodo(data);
    if (success) setShowAddModal(false);
    return success;
  };

  const handleUpdate = async (data: Parameters<typeof updateTodo>[1]): Promise<boolean> => {
    if (!editingTodo) return false;
    const success = await updateTodo(editingTodo.id, data);
    if (success) setEditingTodo(null);
    return success;
  };

  const handleDelete = async (): Promise<void> => {
    if (!deletingTodo) return;
    const success = await deleteTodo(deletingTodo.id);
    if (success) setDeletingTodo(null);
  };

  return (
    <div className="max-w-3xl mx-auto">
      {/* Heading — hidden on mobile (DashboardLayout top bar shows it instead) */}
      <h1 className="text-2xl font-bold text-gray-900 mb-6 hidden md:block">My Todos</h1>

      {/* Controls */}
      <div className="flex items-center justify-between mb-4 gap-4">
        <FilterBar filters={filters} onChange={handleFilterChange} />
        <button
          onClick={() => setShowAddModal(true)}
          className="bg-blue-600 text-white py-2 px-4 rounded text-sm font-medium hover:bg-blue-700 shrink-0"
        >
          + Add Todo
        </button>
      </div>

      {/* Animated todo list — replaces TodoList + Spinner */}
      <AnimatedTodoList
        todos={todos}
        isInitialLoad={isInitialLoad}
        filters={filters}
        onToggle={toggleTodo}
        onEdit={(todo) => setEditingTodo(todo)}
        onDelete={(todo) => setDeletingTodo(todo)}
        onAddTodo={() => setShowAddModal(true)}
      />

      {/* Modals */}
      <AnimatePresence>
        {showAddModal && (
          <TodoModal
            key="add-modal"
            onClose={() => setShowAddModal(false)}
            onSubmit={handleCreate}
          />
        )}
      </AnimatePresence>

      <AnimatePresence>
        {editingTodo && (
          <TodoModal
            key={`edit-modal-${editingTodo.id}`}
            todo={editingTodo}
            onClose={() => setEditingTodo(null)}
            onSubmit={handleUpdate}
          />
        )}
      </AnimatePresence>

      <AnimatePresence>
        {deletingTodo && (
          <DeleteConfirmModal
            key={`delete-modal-${deletingTodo.id}`}
            todo={deletingTodo}
            onConfirm={handleDelete}
            onCancel={() => setDeletingTodo(null)}
          />
        )}
      </AnimatePresence>

      <ToastContainer />
    </div>
  );
}

export default TodosPage;
