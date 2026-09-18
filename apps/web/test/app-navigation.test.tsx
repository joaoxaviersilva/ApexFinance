import { cleanup, render, screen, waitFor } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

const authMocks = vi.hoisted(() => ({
  useSession: vi.fn(),
}));

vi.mock('../src/shared/lib/auth-client', () => ({
  authClient: {
    useSession: authMocks.useSession,
  },
}));

import { App } from '../src/app/App';

function authenticatedAdminSession() {
  return {
    data: {
      user: {
        id: 'admin-1',
        name: 'Administrador',
        email: 'admin@example.com',
        role: 'admin',
      },

      session: {
        id: 'session-1',
        userId: 'admin-1',
      },
    },

    isPending: false,
    error: null,
    refetch: vi.fn(),
  };
}

function renderPath(path: string) {
  window.history.pushState({}, '', path);

  return render(<App />);
}

describe('Navegação autenticada do ApexFinance', () => {
  beforeEach(() => {
    authMocks.useSession.mockReset();
    authMocks.useSession.mockReturnValue(authenticatedAdminSession());
  });

  afterEach(() => {
    cleanup();

    window.history.pushState({}, '', '/');
  });

  it('renderiza o Dashboard na rota /app', () => {
    renderPath('/app');

    expect(
      screen.getByRole('heading', {
        name: /dashboard/i,
      }),
    ).toBeInTheDocument();
  });

  it.each([
    ['/app/portfolio', 'Carteira'],
    ['/app/intelligence', 'Inteligência'],
    ['/app/goals', 'Metas'],
    ['/app/fire', 'FIRE'],
    ['/app/factoring', 'Factoring'],
    ['/app/copilot', 'Copilot'],
  ])('renderiza %s como módulo %s', (path, title) => {
    renderPath(path);

    expect(
      screen.getByRole('heading', {
        name: title,
      }),
    ).toBeInTheDocument();
  });

  it('renderiza Administração para um usuário admin', () => {
    renderPath('/app/admin');

    expect(
      screen.getByRole('heading', {
        name: /administração/i,
      }),
    ).toBeInTheDocument();
  });

  it('redireciona rota interna inexistente para o Dashboard', async () => {
    renderPath('/app/inexistente');

    await waitFor(() => {
      expect(window.location.pathname).toBe('/app');
    });

    expect(
      screen.getByRole('heading', {
        name: /dashboard/i,
      }),
    ).toBeInTheDocument();
  });
});
