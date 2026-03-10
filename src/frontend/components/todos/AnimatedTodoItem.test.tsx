import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { AnimatedTodoItem } from './AnimatedTodoItem';
import type { Todo } from '../../types';

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

function renderItem(todo: Todo = baseTodo) {
  return render(
    <AnimatedTodoItem todo={todo} index={0} onToggle={vi.fn()} onEdit={vi.fn()} onDelete={vi.fn()} />,
  );
}

describe('AnimatedTodoItem', () => {
  it('renders todo title', () => {
    renderItem();
    expect(screen.getByText('Test Todo')).toBeTruthy();
  });

  it('renders status and priority badges', () => {
    renderItem();
    expect(screen.getByText('pending')).toBeTruthy();
    expect(screen.getByText('medium')).toBeTruthy();
  });

  it('renders due date when set', () => {
    renderItem();
    expect(screen.getByText('Due: 2024-03-15')).toBeTruthy();
  });

  it('does not render due date when null', () => {
    renderItem({ ...baseTodo, due_date: null });
    expect(screen.queryByText(/Due:/)).toBeNull();
  });

  it('toggles description on row click', async () => {
    renderItem();
    expect(screen.queryByText('Some description')).toBeNull();
    fireEvent.click(screen.getByText('Test Todo'));
    expect(screen.getByText('Some description')).toBeTruthy();
    fireEvent.click(screen.getByText('Test Todo'));
    // AnimatePresence exit is async — wait for element to leave DOM
    await waitFor(() => expect(screen.queryByText('Some description')).toBeNull());
  });

  it('shows "No description" when description is null and expanded', () => {
    renderItem({ ...baseTodo, description: null });
    fireEvent.click(screen.getByText('Test Todo'));
    expect(screen.getByText('No description')).toBeTruthy();
  });

  it('checkbox is unchecked for pending todo', () => {
    renderItem();
    const checkbox = screen.getByRole('checkbox');
    expect(checkbox.getAttribute('aria-checked')).toBe('false');
  });

  it('checkbox is checked for completed todo', () => {
    renderItem({ ...baseTodo, status: 'completed' });
    const checkbox = screen.getByRole('checkbox');
    expect(checkbox.getAttribute('aria-checked')).toBe('true');
  });

  it('calls onToggle with todo id when checkbox clicked', () => {
    const onToggle = vi.fn();
    render(
      <AnimatedTodoItem todo={baseTodo} index={0} onToggle={onToggle} onEdit={vi.fn()} onDelete={vi.fn()} />,
    );
    fireEvent.click(screen.getByRole('checkbox'));
    expect(onToggle).toHaveBeenCalledWith('todo-1');
  });

  it('calls onEdit with todo when Edit button clicked', () => {
    const onEdit = vi.fn();
    render(
      <AnimatedTodoItem todo={baseTodo} index={0} onToggle={vi.fn()} onEdit={onEdit} onDelete={vi.fn()} />,
    );
    fireEvent.click(screen.getByText('Edit'));
    expect(onEdit).toHaveBeenCalledWith(baseTodo);
  });

  it('calls onDelete with todo when Delete button clicked', () => {
    const onDelete = vi.fn();
    render(
      <AnimatedTodoItem todo={baseTodo} index={0} onToggle={vi.fn()} onEdit={vi.fn()} onDelete={onDelete} />,
    );
    fireEvent.click(screen.getByText('Delete'));
    expect(onDelete).toHaveBeenCalledWith(baseTodo);
  });

  it('row click does not trigger expand when Edit button clicked', () => {
    renderItem();
    fireEvent.click(screen.getByText('Edit'));
    expect(screen.queryByText('Some description')).toBeNull();
  });

  it('applies line-through styling for completed todo title', () => {
    renderItem({ ...baseTodo, status: 'completed' });
    const title = screen.getByText('Test Todo');
    expect(title.className).toContain('line-through');
  });
});
