import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { TodoModal } from './TodoModal';
import type { Todo } from '../types';

const baseTodo: Todo = {
  id: 'todo-1',
  user_id: 'user-1',
  title: 'Existing Title',
  description: 'Existing description',
  status: 'pending',
  priority: 'high',
  due_date: '2024-03-15',
  created_at: '2024-01-01T00:00:00.000Z',
  updated_at: '2024-01-01T00:00:00.000Z',
};

describe('TodoModal — add mode', () => {
  it('renders empty form when no todo prop', () => {
    render(<TodoModal onClose={vi.fn()} onSubmit={vi.fn()} />);
    expect(screen.getByRole('heading', { name: 'Add Todo' })).toBeTruthy();
    expect((screen.getByLabelText(/title/i) as HTMLInputElement).value).toBe('');
  });

  it('shows title error when submitting empty title', async () => {
    render(<TodoModal onClose={vi.fn()} onSubmit={vi.fn()} />);
    fireEvent.click(screen.getByRole('button', { name: /add todo/i }));
    await waitFor(() => expect(screen.getByText('Title is required')).toBeTruthy());
  });

  it('calls onSubmit with form data on valid submission', async () => {
    const onSubmit = vi.fn().mockResolvedValue(true);
    render(<TodoModal onClose={vi.fn()} onSubmit={onSubmit} />);
    fireEvent.change(screen.getByLabelText(/title/i), { target: { value: 'New Todo' } });
    fireEvent.click(screen.getByRole('button', { name: /add todo/i }));
    await waitFor(() => expect(onSubmit).toHaveBeenCalledWith(expect.objectContaining({ title: 'New Todo' })));
  });

  it('closes when onSubmit returns true', async () => {
    const onClose = vi.fn();
    const onSubmit = vi.fn().mockResolvedValue(true);
    render(<TodoModal onClose={onClose} onSubmit={onSubmit} />);
    fireEvent.change(screen.getByLabelText(/title/i), { target: { value: 'New Todo' } });
    fireEvent.click(screen.getByRole('button', { name: /add todo/i }));
    await waitFor(() => expect(onClose).toHaveBeenCalled());
  });

  it('stays open when onSubmit returns false', async () => {
    const onClose = vi.fn();
    const onSubmit = vi.fn().mockResolvedValue(false);
    render(<TodoModal onClose={onClose} onSubmit={onSubmit} />);
    fireEvent.change(screen.getByLabelText(/title/i), { target: { value: 'New Todo' } });
    fireEvent.click(screen.getByRole('button', { name: /add todo/i }));
    await waitFor(() => expect(onSubmit).toHaveBeenCalled());
    expect(onClose).not.toHaveBeenCalled();
  });
});

describe('TodoModal — edit mode', () => {
  it('renders "Edit Todo" heading in edit mode', () => {
    render(<TodoModal todo={baseTodo} onClose={vi.fn()} onSubmit={vi.fn()} />);
    expect(screen.getByText('Edit Todo')).toBeTruthy();
  });

  it('pre-fills form fields with existing todo data', () => {
    render(<TodoModal todo={baseTodo} onClose={vi.fn()} onSubmit={vi.fn()} />);
    expect((screen.getByLabelText(/title/i) as HTMLInputElement).value).toBe('Existing Title');
    expect((screen.getByLabelText(/priority/i) as HTMLSelectElement).value).toBe('high');
  });
});
