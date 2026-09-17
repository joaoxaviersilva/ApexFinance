import { cleanup, fireEvent, render, screen, waitFor } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

const authMocks = vi.hoisted(() => ({
  signOut: vi.fn(),
  useSession: vi.fn(),
}));

vi.mock('better-auth/react', () => ({
  createAuthClient: () => ({
    signOut: authMocks.signOut,

    useSession: authMocks.useSession,
  }),
}));

import { App } from '../src/app/App';

function renderPath(path: string) {
  window.history.pushState({}, '', path);

  render(<App />);
}

function authenticatedSession() {
  return {
    data: {
      user: {
        id: 'user-1',
        name: 'João Xavier',
        email: 'joao@example.com',
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

describe('Logout do ApexFinance', () => {
  beforeEach(() => {
    authMocks.signOut.mockReset();
    authMocks.useSession.mockReset();

    authMocks.useSession.mockReturnValue(authenticatedSession());

    authMocks.signOut.mockResolvedValue({
      data: null,
      error: null,
    });
  });

  afterEach(() => {
    cleanup();

    window.history.pushState({}, '', '/');
  });

  it('encerra a sessão e volta para o login', async () => {
    renderPath('/app');

    expect(
      screen.getByRole('heading', {
        name: /área autenticada/i,
      }),
    ).toBeInTheDocument();

    fireEvent.click(
      screen.getByRole('button', {
        name: /^sair$/i,
      }),
    );

    await waitFor(() => {
      expect(authMocks.signOut).toHaveBeenCalledTimes(1);
    });

    await waitFor(() => {
      expect(window.location.pathname).toBe('/');
    });
  });
});
