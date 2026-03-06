import type { Toast as ToastType } from '../store/uiStore';

interface ToastProps {
  toast: ToastType;
  onDismiss: (id: string) => void;
}

export function Toast({ toast, onDismiss }: ToastProps) {
  const colorClass = toast.type === 'success' ? 'bg-green-600' : 'bg-red-600';

  return (
    <div
      role="alert"
      className={`flex items-center justify-between gap-3 px-4 py-3 rounded shadow text-white text-sm ${colorClass}`}
    >
      <span>{toast.message}</span>
      <button
        onClick={() => onDismiss(toast.id)}
        className="text-white opacity-75 hover:opacity-100 font-bold text-base leading-none"
        aria-label="Dismiss"
      >
        ×
      </button>
    </div>
  );
}
