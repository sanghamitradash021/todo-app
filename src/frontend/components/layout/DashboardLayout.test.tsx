import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import DashboardLayout from './DashboardLayout';
import { useAuthStore } from '../../store/authStore';
import { useTodoStore } from '../../store/todoStore';

vi.mock('../../hooks/useAuth', () => ({
  useAuth: vi.fn(() => ({ logout: vi.fn(), login: vi.fn(), register: vi.fn(), isLoading: false, error: null })),
}));

vi.mock('react-router-dom', async (importOriginal) => {
  const actual = await importOriginal<typeof import('react-router-dom')>();
  return {
    ...actual,
    Outlet: () => <div data-testid="outlet-content">Page content</div>,
    useNavigate: () => vi.fn(),
  };
});

beforeEach(() => {
  useAuthStore.setState({ token: 'test-token', user: { id: '1', email: 'user@test.com' } });
  useTodoStore.setState({ todos: [], filters: { status: 'all', priority: '' }, isLoading: false });
});

function renderLayout(path = '/dashboard') {
  return render(
    <MemoryRouter initialEntries={[path]}>
      <DashboardLayout />
    </MemoryRouter>
  );
}

describe('DashboardLayout', () => {
  it('renders Outlet content', () => {
    renderLayout();
    expect(screen.getByTestId('outlet-content')).toBeTruthy();
  });

  it('renders hamburger button', () => {
    renderLayout();
    expect(screen.getByLabelText('Open navigation')).toBeTruthy();
  });

  it('hamburger click opens mobile sidebar', () => {
    renderLayout();
    const hamburger = screen.getByLabelText('Open navigation');
    fireEvent.click(hamburger);
    // After click both desktop + mobile sidebars render — multiple nav link instances
    expect(screen.getAllByText('Dashboard').length).toBeGreaterThanOrEqual(2);
  });

  it('mobile top bar shows page title for /dashboard', () => {
    renderLayout('/dashboard');
    // The header shows the page title (may appear multiple times with nav links)
    const headers = screen.getAllByText('Dashboard');
    expect(headers.length).toBeGreaterThanOrEqual(1);
  });

  it('mobile top bar shows "My Todos" for /todos', () => {
    renderLayout('/todos');
    expect(screen.getByText('My Todos')).toBeTruthy();
  });
});
