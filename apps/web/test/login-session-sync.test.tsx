import { cleanup, fireEvent, render, screen, waitFor } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

const authMocks = vi.hoisted(() => ({
  signInEmail: vi.fn(),
  useSession: vi.fn(),
  refetch: vi.fn(),
}));

vi.mock('better-auth/react', () => ({
  createAuthClient: () => ({
    signIn: {
      email: authMocks.signInEmail,
    },

    signUp: {
      email: vi.fn(),
    },

    useSession: authMocks.useSession,
  }),
}));

import { App } from '../src/app/App';

describe('Sincronização da sessão após login', () => {
  beforeEach(() => {
    window.history.pushState({}, '', '/');

    authMocks.signInEmail.mockReset();
    authMocks.useSession.mockReset();
    authMocks.refetch.mockReset();

    authMocks.signInEmail.mockResolvedValue({
      data: {
        user: {
          id: 'user-1',
          name: 'João Xavier',
          email: 'joao@example.com',
        },
      },

      error: null,
    });

    authMocks.useSession.mockReturnValue({
      data: null,
      isPending: false,
      error: null,
      refetch: authMocks.refetch,
    });

    authMocks.refetch.mockResolvedValue({
      data: {
        user: {
          id: 'user-1',
          name: 'João Xavier',
          email: 'joao@example.com',
          role: 'user',
        },

        session: {
          id: 'session-1',
          userId: 'user-1',
        },
      },

      error: null,
    });
  });

  afterEach(() => {
    cleanup();

    window.history.pushState({}, '', '/');
  });

  it('sincroniza a sessão antes de navegar para o Dashboard', async () => {
    render(<App />);

    fireEvent.change(screen.getByLabelText('E-mail'), {
      target: {
        value: 'joao@example.com',
      },
    });

    fireEvent.change(screen.getByLabelText('Senha'), {
      target: {
        value: 'senha123',
      },
    });

    fireEvent.click(
      screen.getByRole('button', {
        name: /^entrar$/i,
      }),
    );

    await waitFor(() => {
      expect(authMocks.signInEmail).toHaveBeenCalledTimes(1);
    });

    expect(authMocks.refetch).toHaveBeenCalledTimes(1);
  });
});
