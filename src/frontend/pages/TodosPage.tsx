import { useEffect, useState } from 'react';
import { useTodos } from '../hooks/useTodos';
import { useAuth } from '../hooks/useAuth';
import { useAuthStore } from '../store/authStore';
import { FilterBar } from '../components/FilterBar';
import { TodoList } from '../components/TodoList';
import { TodoModal } from '../components/TodoModal';
import { DeleteConfirmModal } from '../components/DeleteConfirmModal';
import { ToastContainer } from '../components/ToastContainer';
import { Spinner } from '../components/Spinner';
import type { Todo } from '../types';
import type { TodoFilters } from '../store/todoStore';

function TodosPage() {
  const { todos, isLoading, filters, fetchTodos, createTodo, updateTodo, toggleTodo, deleteTodo, setFilters } =
    useTodos();
  const { logout } = useAuth();
  const user = useAuthStore((state) => state.user);

  const [showAddModal, setShowAddModal] = useState(false);
  const [editingTodo, setEditingTodo] = useState<Todo | null>(null);
  const [deletingTodo, setDeletingTodo] = useState<Todo | null>(null);

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
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-3xl mx-auto px-4 py-8">
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">My Todos</h1>
            {user && <p className="text-sm text-gray-500 mt-0.5">{user.email}</p>}
          </div>
          <button
            onClick={logout}
            className="text-sm text-gray-600 hover:text-gray-900 font-medium"
          >
            Logout
          </button>
        </div>

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

        {/* List */}
        {isLoading ? (
          <Spinner />
        ) : (
          <TodoList
            todos={todos}
            onToggle={toggleTodo}
            onEdit={(todo) => setEditingTodo(todo)}
            onDelete={(todo) => setDeletingTodo(todo)}
          />
        )}
      </div>

      {/* Modals */}
      {showAddModal && (
        <TodoModal
          onClose={() => setShowAddModal(false)}
          onSubmit={handleCreate}
        />
      )}

      {editingTodo && (
        <TodoModal
          todo={editingTodo}
          onClose={() => setEditingTodo(null)}
          onSubmit={handleUpdate}
        />
      )}

      {deletingTodo && (
        <DeleteConfirmModal
          todo={deletingTodo}
          onConfirm={handleDelete}
          onCancel={() => setDeletingTodo(null)}
        />
      )}

      <ToastContainer />
    </div>
  );
}

export default TodosPage;
