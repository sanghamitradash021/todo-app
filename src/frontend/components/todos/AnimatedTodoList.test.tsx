import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import { AnimatedTodoList } from './AnimatedTodoList';
import type { Todo } from '../../types';
import type { TodoFilters } from '../../store/todoStore';

const defaultFilters: TodoFilters = { status: 'all', priority: '' };

const makeTodo = (overrides: Partial<Todo> = {}): Todo => ({
  id: 'todo-1',
  user_id: 'user-1',
  title: 'Test Todo',
  description: null,
  status: 'pending',
  priority: 'medium',
  due_date: null,
  created_at: '2024-01-01T00:00:00.000Z',
  updated_at: '2024-01-01T00:00:00.000Z',
  ...overrides,
});

const defaultProps = {
  todos: [],
  isInitialLoad: false,
  filters: defaultFilters,
  onToggle: vi.fn(),
  onEdit: vi.fn(),
  onDelete: vi.fn(),
  onAddTodo: vi.fn(),
};

describe('AnimatedTodoList', () => {
  it('shows 3 skeleton cards when isInitialLoad is true', () => {
    render(<AnimatedTodoList {...defaultProps} isInitialLoad={true} />);
    const region = screen.getByLabelText('Loading todos');
    expect(region.children.length).toBe(3);
  });

  it('does NOT show skeletons when isInitialLoad is false', () => {
    render(<AnimatedTodoList {...defaultProps} isInitialLoad={false} />);
    expect(screen.queryByLabelText('Loading todos')).toBeNull();
  });

  it('shows EmptyState when todos is empty and not loading', () => {
    render(<AnimatedTodoList {...defaultProps} todos={[]} />);
    expect(screen.getByText('No todos yet. Add one to get started.')).toBeTruthy();
  });

  it('shows pending empty message when status filter is pending', () => {
    render(
      <AnimatedTodoList
        {...defaultProps}
        todos={[]}
        filters={{ status: 'pending', priority: '' }}
      />,
    );
    expect(screen.getByText('No pending todos. Great work!')).toBeTruthy();
  });

  it('renders todo items when todos are present', () => {
    const todos = [makeTodo(), makeTodo({ id: 'todo-2', title: 'Another Todo' })];
    render(<AnimatedTodoList {...defaultProps} todos={todos} />);
    expect(screen.getByText('Test Todo')).toBeTruthy();
    expect(screen.getByText('Another Todo')).toBeTruthy();
  });

  it('does not show empty state when todos are present', () => {
    const todos = [makeTodo()];
    render(<AnimatedTodoList {...defaultProps} todos={todos} />);
    expect(screen.queryByText('No todos yet. Add one to get started.')).toBeNull();
  });

  it('shows stale todos (not skeletons) when isInitialLoad is false and isLoading (filter change)', () => {
    // Simulate a filter-change reload: isInitialLoad=false, but todos still present
    const todos = [makeTodo()];
    render(<AnimatedTodoList {...defaultProps} todos={todos} isInitialLoad={false} />);
    expect(screen.getByText('Test Todo')).toBeTruthy();
    expect(screen.queryByLabelText('Loading todos')).toBeNull();
  });
});
