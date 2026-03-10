import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { EmptyState } from './EmptyState';

describe('EmptyState', () => {
  it('shows default message when statusFilter is "all"', () => {
    render(<EmptyState statusFilter="all" onAddTodo={vi.fn()} />);
    expect(screen.getByText('No todos yet. Add one to get started.')).toBeTruthy();
  });

  it('shows default message when statusFilter is empty string', () => {
    render(<EmptyState statusFilter="" onAddTodo={vi.fn()} />);
    expect(screen.getByText('No todos yet. Add one to get started.')).toBeTruthy();
  });

  it('shows pending message when statusFilter is "pending"', () => {
    render(<EmptyState statusFilter="pending" onAddTodo={vi.fn()} />);
    expect(screen.getByText('No pending todos. Great work!')).toBeTruthy();
  });

  it('shows completed message when statusFilter is "completed"', () => {
    render(<EmptyState statusFilter="completed" onAddTodo={vi.fn()} />);
    expect(screen.getByText('Nothing completed yet.')).toBeTruthy();
  });

  it('shows "Add Todo" button when statusFilter is "all"', () => {
    render(<EmptyState statusFilter="all" onAddTodo={vi.fn()} />);
    expect(screen.getByText('+ Add Todo')).toBeTruthy();
  });

  it('does NOT show "Add Todo" button when statusFilter is "pending"', () => {
    render(<EmptyState statusFilter="pending" onAddTodo={vi.fn()} />);
    expect(screen.queryByText('+ Add Todo')).toBeNull();
  });

  it('does NOT show "Add Todo" button when statusFilter is "completed"', () => {
    render(<EmptyState statusFilter="completed" onAddTodo={vi.fn()} />);
    expect(screen.queryByText('+ Add Todo')).toBeNull();
  });

  it('calls onAddTodo when "Add Todo" button is clicked', () => {
    const onAddTodo = vi.fn();
    render(<EmptyState statusFilter="all" onAddTodo={onAddTodo} />);
    fireEvent.click(screen.getByText('+ Add Todo'));
    expect(onAddTodo).toHaveBeenCalledOnce();
  });
});
