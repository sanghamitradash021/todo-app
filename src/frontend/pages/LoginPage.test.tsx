import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import LoginPage from './LoginPage';
import { useAuth } from '../hooks/useAuth';
import type { UseAuthReturn } from '../hooks/useAuth';

vi.mock('../hooks/useAuth');

function renderLoginPage() {
  return render(
    <MemoryRouter>
      <LoginPage />
    </MemoryRouter>
  );
}

function mockUseAuth(overrides: Partial<UseAuthReturn> = {}): UseAuthReturn {
  return {
    login: vi.fn(),
    register: vi.fn(),
    logout: vi.fn(),
    isLoading: false,
    error: null,
    ...overrides,
  };
}

describe('LoginPage', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('renders email and password fields', () => {
    vi.mocked(useAuth).mockReturnValue(mockUseAuth());
    renderLoginPage();

    expect(screen.getByLabelText(/email/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/password/i)).toBeInTheDocument();
  });

  it('renders a submit button', () => {
    vi.mocked(useAuth).mockReturnValue(mockUseAuth());
    renderLoginPage();

    expect(screen.getByRole('button', { name: /sign in/i })).toBeInTheDocument();
  });

  it('shows error and does NOT call login when email or password is empty', async () => {
    const loginFn = vi.fn();
    vi.mocked(useAuth).mockReturnValue(mockUseAuth({ login: loginFn }));
    renderLoginPage();

    fireEvent.click(screen.getByRole('button', { name: /sign in/i }));

    await waitFor(() => {
      expect(screen.getByRole('alert')).toHaveTextContent(/email and password are required/i);
    });
    expect(loginFn).not.toHaveBeenCalled();
  });

  it('calls login with email and password on submit', async () => {
    const loginFn = vi.fn().mockResolvedValue(undefined);
    vi.mocked(useAuth).mockReturnValue(mockUseAuth({ login: loginFn }));
    renderLoginPage();

    fireEvent.change(screen.getByLabelText(/email/i), {
      target: { value: 'user@example.com' },
    });
    fireEvent.change(screen.getByLabelText(/password/i), {
      target: { value: 'password123' },
    });
    fireEvent.click(screen.getByRole('button', { name: /sign in/i }));

    await waitFor(() => {
      expect(loginFn).toHaveBeenCalledWith('user@example.com', 'password123');
    });
  });

  it('displays error message from hook', () => {
    vi.mocked(useAuth).mockReturnValue(mockUseAuth({ error: 'Invalid email or password' }));
    renderLoginPage();

    expect(screen.getByRole('alert')).toHaveTextContent('Invalid email or password');
  });

  it('disables submit button and shows loading text while loading', () => {
    vi.mocked(useAuth).mockReturnValue(mockUseAuth({ isLoading: true }));
    renderLoginPage();

    const button = screen.getByRole('button');
    expect(button).toBeDisabled();
    expect(button).toHaveTextContent(/signing in/i);
  });

  it('shows a link to the register page', () => {
    vi.mocked(useAuth).mockReturnValue(mockUseAuth());
    renderLoginPage();

    expect(screen.getByRole('link', { name: /create one/i })).toHaveAttribute('href', '/register');
  });
});
