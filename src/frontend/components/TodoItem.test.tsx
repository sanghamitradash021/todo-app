import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { TodoItem } from './TodoItem';
import type { Todo } from '../types';

const baseTodo: Todo = {
  id: 'todo-1',
  user_id: 'user-1',
  title: 'Test Todo',
  description: 'Some description',
  status: 'pending',
  priority: 'medium',
  due_date: '2024-03-15',
  created_at: '2024-01-01T00:00:00.000Z',
  updated_at: '2024-01-01T00:00:00.000Z',
};

describe('TodoItem', () => {
  it('renders todo title', () => {
    render(<TodoItem todo={baseTodo} onToggle={vi.fn()} onEdit={vi.fn()} onDelete={vi.fn()} />);
    expect(screen.getByText('Test Todo')).toBeTruthy();
  });

  it('renders status and priority badges', () => {
    render(<TodoItem todo={baseTodo} onToggle={vi.fn()} onEdit={vi.fn()} onDelete={vi.fn()} />);
    expect(screen.getByText('pending')).toBeTruthy();
    expect(screen.getByText('medium')).toBeTruthy();
  });

  it('renders due date when set', () => {
    render(<TodoItem todo={baseTodo} onToggle={vi.fn()} onEdit={vi.fn()} onDelete={vi.fn()} />);
    expect(screen.getByText('Due: 2024-03-15')).toBeTruthy();
  });

  it('toggles description visibility on row click', () => {
    render(<TodoItem todo={baseTodo} onToggle={vi.fn()} onEdit={vi.fn()} onDelete={vi.fn()} />);
    expect(screen.queryByText('Some description')).toBeNull();
    fireEvent.click(screen.getByText('Test Todo'));
    expect(screen.getByText('Some description')).toBeTruthy();
    fireEvent.click(screen.getByText('Test Todo'));
    expect(screen.queryByText('Some description')).toBeNull();
  });

  it('shows "No description" when description is null and expanded', () => {
    const todo = { ...baseTodo, description: null };
    render(<TodoItem todo={todo} onToggle={vi.fn()} onEdit={vi.fn()} onDelete={vi.fn()} />);
    fireEvent.click(screen.getByText('Test Todo'));
    expect(screen.getByText('No description')).toBeTruthy();
  });

  it('calls onToggle with todo id when checkbox clicked', () => {
    const onToggle = vi.fn();
    render(<TodoItem todo={baseTodo} onToggle={onToggle} onEdit={vi.fn()} onDelete={vi.fn()} />);
    fireEvent.click(screen.getByRole('checkbox'));
    expect(onToggle).toHaveBeenCalledWith('todo-1');
  });

  it('calls onEdit with todo when edit button clicked', () => {
    const onEdit = vi.fn();
    render(<TodoItem todo={baseTodo} onToggle={vi.fn()} onEdit={onEdit} onDelete={vi.fn()} />);
    fireEvent.click(screen.getByText('Edit'));
    expect(onEdit).toHaveBeenCalledWith(baseTodo);
  });

  it('calls onDelete with todo when delete button clicked', () => {
    const onDelete = vi.fn();
    render(<TodoItem todo={baseTodo} onToggle={vi.fn()} onEdit={vi.fn()} onDelete={onDelete} />);
    fireEvent.click(screen.getByText('Delete'));
    expect(onDelete).toHaveBeenCalledWith(baseTodo);
  });
});
