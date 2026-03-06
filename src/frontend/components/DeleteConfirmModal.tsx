import { useState } from 'react';
import type { Todo } from '../types';

interface DeleteConfirmModalProps {
  todo: Todo;
  onConfirm: () => Promise<void>;
  onCancel: () => void;
}

export function DeleteConfirmModal({ todo, onConfirm, onCancel }: DeleteConfirmModalProps) {
  const [isDeleting, setIsDeleting] = useState(false);

  const handleConfirm = async (): Promise<void> => {
    setIsDeleting(true);
    await onConfirm();
    setIsDeleting(false);
  };

  const handleBackdropClick = (e: React.MouseEvent<HTMLDivElement>) => {
    if (e.target === e.currentTarget && !isDeleting) onCancel();
  };

  return (
    <div
      className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50"
      onClick={handleBackdropClick}
    >
      <div className="bg-white rounded-lg shadow-xl w-full max-w-sm p-6">
        <h2 className="text-lg font-semibold text-gray-900 mb-2">Delete Todo</h2>
        <p className="text-sm text-gray-600 mb-6">
          Are you sure you want to delete{' '}
          <span className="font-medium text-gray-900">&ldquo;{todo.title}&rdquo;</span>? This action
          cannot be undone.
        </p>

        <div className="flex justify-end gap-3">
          <button
            onClick={onCancel}
            disabled={isDeleting}
            className="bg-white border border-gray-300 text-gray-700 py-2 px-4 rounded text-sm font-medium hover:bg-gray-50 disabled:opacity-50"
          >
            Cancel
          </button>
          <button
            onClick={handleConfirm}
            disabled={isDeleting}
            className="bg-red-600 text-white py-2 px-4 rounded text-sm font-medium hover:bg-red-700 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {isDeleting ? 'Deleting…' : 'Delete'}
          </button>
        </div>
      </div>
    </div>
  );
}
