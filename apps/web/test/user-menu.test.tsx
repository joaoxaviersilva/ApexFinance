import { cleanup, fireEvent, render, screen } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

const authMocks = vi.hoisted(() => ({
  signOut: vi.fn(),
  useSession: vi.fn(),
}));

vi.mock('../src/shared/lib/auth-client', () => ({
  authClient: {
    signOut: authMocks.signOut,
    useSession: authMocks.useSession,
  },
}));

import { App } from '../src/app/App';

function authenticatedSession() {
  return {
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

    isPending: false,
    error: null,
    refetch: vi.fn(),
  };
}

function renderApp() {
  window.history.pushState({}, '', '/app');

  return render(<App />);
}

describe('Menu do usuário do ApexFinance', () => {
  beforeEach(() => {
    authMocks.signOut.mockReset();
    authMocks.useSession.mockReset();

    authMocks.useSession.mockReturnValue(authenticatedSession());
  });

  afterEach(() => {
    cleanup();

    window.history.pushState({}, '', '/');
  });

  it('exibe os dados do usuário e abre o menu', () => {
    renderApp();

    expect(screen.getByText('João Xavier')).toBeInTheDocument();

    fireEvent.click(
      screen.getByRole('button', {
        name: /abrir menu do usuário/i,
      }),
    );

    expect(screen.getByText('joao@example.com')).toBeInTheDocument();

    expect(
      screen.getByRole('button', {
        name: /^sair$/i,
      }),
    ).toBeInTheDocument();
  });

  it('fecha o menu ao pressionar Escape', () => {
    renderApp();

    fireEvent.click(
      screen.getByRole('button', {
        name: /abrir menu do usuário/i,
      }),
    );

    expect(screen.getByText('joao@example.com')).toBeInTheDocument();

    fireEvent.keyDown(document, {
      key: 'Escape',
    });

    expect(screen.queryByText('joao@example.com')).not.toBeInTheDocument();
  });
});
