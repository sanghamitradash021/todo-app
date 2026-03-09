import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { Sidebar } from './Sidebar';
import { useTodoStore } from '../../store/todoStore';

const mockNavigate = vi.fn();

vi.mock('react-router-dom', async (importOriginal) => {
  const actual = await importOriginal<typeof import('react-router-dom')>();
  return { ...actual, useNavigate: () => mockNavigate };
});

const defaultProps = {
  isOpen: false,
  onClose: vi.fn(),
  onLogout: vi.fn(),
  email: 'test@example.com',
};

beforeEach(() => {
  vi.clearAllMocks();
  useTodoStore.setState({ todos: [], filters: { status: 'all', priority: '' }, isLoading: false });
});

function renderSidebar(props: Partial<typeof defaultProps> = {}) {
  return render(
    <MemoryRouter initialEntries={['/dashboard']}>
      <Sidebar {...defaultProps} {...props} />
    </MemoryRouter>
  );
}

describe('Sidebar', () => {
  it('renders all four nav links', () => {
    renderSidebar();
    expect(screen.getByText('Dashboard')).toBeTruthy();
    expect(screen.getByText('All Todos')).toBeTruthy();
    expect(screen.getByText('Pending')).toBeTruthy();
    expect(screen.getByText('Completed')).toBeTruthy();
  });

  it('displays user email', () => {
    renderSidebar();
    expect(screen.getByText('test@example.com')).toBeTruthy();
  });

  it('logout button calls onLogout', () => {
    const onLogout = vi.fn();
    renderSidebar({ onLogout });
    fireEvent.click(screen.getByText('Logout'));
    expect(onLogout).toHaveBeenCalled();
  });

  it('clicking Dashboard navigates to /dashboard and does not mutate filters', () => {
    render(
      <MemoryRouter initialEntries={['/todos']}>
        <Sidebar {...defaultProps} />
      </MemoryRouter>
    );
    const initialStatus = useTodoStore.getState().filters.status;
    fireEvent.click(screen.getByText('Dashboard'));
    expect(mockNavigate).toHaveBeenCalledWith('/dashboard');
    // Filters must not change (no statusFilter mutation for Dashboard link)
    expect(useTodoStore.getState().filters.status).toBe(initialStatus);
  });

  it('clicking Pending sets filters.status to pending and navigates to /todos', () => {
    renderSidebar();
    fireEvent.click(screen.getByText('Pending'));
    expect(mockNavigate).toHaveBeenCalledWith('/todos');
    expect(useTodoStore.getState().filters.status).toBe('pending');
  });

  it('clicking All Todos sets filters.status to all and navigates to /todos', () => {
    renderSidebar();
    fireEvent.click(screen.getByText('All Todos'));
    expect(mockNavigate).toHaveBeenCalledWith('/todos');
    expect(useTodoStore.getState().filters.status).toBe('all');
  });

  it('clicking Completed sets filters.status to completed and navigates to /todos', () => {
    renderSidebar();
    fireEvent.click(screen.getByText('Completed'));
    expect(mockNavigate).toHaveBeenCalledWith('/todos');
    expect(useTodoStore.getState().filters.status).toBe('completed');
  });

  it('nav link click calls onClose', () => {
    const onClose = vi.fn();
    renderSidebar({ onClose });
    fireEvent.click(screen.getByText('All Todos'));
    expect(onClose).toHaveBeenCalled();
  });

  it('mobile overlay: drawer renders when isOpen is true', () => {
    renderSidebar({ isOpen: true });
    // Desktop + mobile both render — multiple instances of nav labels
    expect(screen.getAllByText('Dashboard').length).toBeGreaterThanOrEqual(2);
  });

  it('mobile overlay: backdrop click calls onClose', () => {
    const onClose = vi.fn();
    const { container } = render(
      <MemoryRouter initialEntries={['/dashboard']}>
        <Sidebar {...defaultProps} isOpen={true} onClose={onClose} />
      </MemoryRouter>
    );
    const backdrop = container.querySelector('.bg-black');
    expect(backdrop).toBeTruthy();
    if (backdrop) fireEvent.click(backdrop);
    expect(onClose).toHaveBeenCalled();
  });

  it('mobile overlay: nav link click calls onClose', () => {
    const onClose = vi.fn();
    render(
      <MemoryRouter initialEntries={['/dashboard']}>
        <Sidebar {...defaultProps} isOpen={true} onClose={onClose} />
      </MemoryRouter>
    );
    // Click from desktop sidebar (first instance)
    fireEvent.click(screen.getAllByText('Pending')[0]);
    expect(onClose).toHaveBeenCalled();
  });
});
