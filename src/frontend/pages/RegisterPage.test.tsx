import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import RegisterPage from './RegisterPage';
import { useAuth } from '../hooks/useAuth';
import type { UseAuthReturn } from '../hooks/useAuth';

vi.mock('../hooks/useAuth');

function renderRegisterPage() {
  return render(
    <MemoryRouter>
      <RegisterPage />
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

describe('RegisterPage', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('renders email, password, and confirm password fields', () => {
    vi.mocked(useAuth).mockReturnValue(mockUseAuth());
    renderRegisterPage();

    expect(screen.getByLabelText(/^email/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/^password$/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/confirm password/i)).toBeInTheDocument();
  });

  it('shows error and does NOT call register when email or password is empty', async () => {
    const registerFn = vi.fn();
    vi.mocked(useAuth).mockReturnValue(mockUseAuth({ register: registerFn }));
    renderRegisterPage();

    fireEvent.click(screen.getByRole('button', { name: /create account/i }));

    await waitFor(() => {
      expect(screen.getByRole('alert')).toHaveTextContent(/email and password are required/i);
    });
    expect(registerFn).not.toHaveBeenCalled();
  });

  it('shows error and does NOT call register when passwords do not match', async () => {
    const registerFn = vi.fn();
    vi.mocked(useAuth).mockReturnValue(mockUseAuth({ register: registerFn }));
    renderRegisterPage();

    fireEvent.change(screen.getByLabelText(/^email/i), {
      target: { value: 'user@example.com' },
    });
    fireEvent.change(screen.getByLabelText(/^password$/i), {
      target: { value: 'password123' },
    });
    fireEvent.change(screen.getByLabelText(/confirm password/i), {
      target: { value: 'different456' },
    });
    fireEvent.click(screen.getByRole('button', { name: /create account/i }));

    await waitFor(() => {
      expect(screen.getByRole('alert')).toHaveTextContent(/passwords do not match/i);
    });
    expect(registerFn).not.toHaveBeenCalled();
  });

  it('shows error and does NOT call register when password is under 8 chars', async () => {
    const registerFn = vi.fn();
    vi.mocked(useAuth).mockReturnValue(mockUseAuth({ register: registerFn }));
    renderRegisterPage();

    fireEvent.change(screen.getByLabelText(/^email/i), {
      target: { value: 'user@example.com' },
    });
    fireEvent.change(screen.getByLabelText(/^password$/i), {
      target: { value: 'short' },
    });
    fireEvent.change(screen.getByLabelText(/confirm password/i), {
      target: { value: 'short' },
    });
    fireEvent.click(screen.getByRole('button', { name: /create account/i }));

    await waitFor(() => {
      expect(screen.getByRole('alert')).toHaveTextContent(/at least 8 characters/i);
    });
    expect(registerFn).not.toHaveBeenCalled();
  });

  it('calls register with email and password only (no confirmPassword) on valid submit', async () => {
    const registerFn = vi.fn().mockResolvedValue(undefined);
    vi.mocked(useAuth).mockReturnValue(mockUseAuth({ register: registerFn }));
    renderRegisterPage();

    fireEvent.change(screen.getByLabelText(/^email/i), {
      target: { value: 'user@example.com' },
    });
    fireEvent.change(screen.getByLabelText(/^password$/i), {
      target: { value: 'password123' },
    });
    fireEvent.change(screen.getByLabelText(/confirm password/i), {
      target: { value: 'password123' },
    });
    fireEvent.click(screen.getByRole('button', { name: /create account/i }));

    await waitFor(() => {
      expect(registerFn).toHaveBeenCalledWith('user@example.com', 'password123');
      expect(registerFn).toHaveBeenCalledTimes(1);
    });
    // confirmPassword must NOT be passed as a third arg
    expect(registerFn.mock.calls[0]).toHaveLength(2);
  });

  it('displays API error from hook', () => {
    vi.mocked(useAuth).mockReturnValue(
      mockUseAuth({ error: 'An account with this email already exists' })
    );
    renderRegisterPage();

    expect(screen.getByRole('alert')).toHaveTextContent(
      'An account with this email already exists'
    );
  });

  it('disables button and shows loading text while loading', () => {
    vi.mocked(useAuth).mockReturnValue(mockUseAuth({ isLoading: true }));
    renderRegisterPage();

    const button = screen.getByRole('button');
    expect(button).toBeDisabled();
    expect(button).toHaveTextContent(/creating account/i);
  });

  it('shows a link to the login page', () => {
    vi.mocked(useAuth).mockReturnValue(mockUseAuth());
    renderRegisterPage();

    expect(screen.getByRole('link', { name: /sign in/i })).toHaveAttribute('href', '/login');
  });
});
