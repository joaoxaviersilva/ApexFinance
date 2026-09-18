import { cleanup, render, screen } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

const authMocks = vi.hoisted(() => ({
  useSession: vi.fn(),
}));

vi.mock('../src/shared/lib/auth-client', () => ({
  authClient: {
    useSession: authMocks.useSession,
  },
}));

import { DashboardPage } from '../src/features/dashboard/pages/DashboardPage';

function authenticatedSession() {
  return {
    data: {
      user: {
        id: 'user-1',
        name: 'João Xavier',
        email: 'joao@example.com',
        role: 'admin',
      },

      session: {
        id: 'session-1',
        userId: 'user-1',
      },
    },

    isPending: false,
    error: null,
    refetch: vi.fn(),
  };
}

describe('Dashboard estrutural', () => {
  beforeEach(() => {
    authMocks.useSession.mockReset();
    authMocks.useSession.mockReturnValue(authenticatedSession());
  });

  afterEach(() => {
    cleanup();
  });

  it('apresenta o usuário e um estado financeiro vazio sem inventar valores', () => {
    render(<DashboardPage />);

    expect(
      screen.getByRole('heading', {
        name: /dashboard/i,
      }),
    ).toBeInTheDocument();

    expect(screen.getByText(/joão xavier/i)).toBeInTheDocument();

    expect(screen.getByText(/sua visão financeira começa aqui/i)).toBeInTheDocument();

    expect(screen.getByText(/ainda não existem dados financeiros/i)).toBeInTheDocument();

    expect(screen.queryByText(/R\$\s*[\d.,]+/i)).not.toBeInTheDocument();
  });
});
