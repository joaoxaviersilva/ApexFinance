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

type Role = 'user' | 'admin';

function authenticatedSession(role: Role = 'admin') {
  return {
    data: {
      user: {
        id: 'user-1',
        name: role === 'admin' ? 'Administrador' : 'Usuário Comum',
        email: role === 'admin' ? 'admin@example.com' : 'user@example.com',
        role,
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

function renderPath(path: string) {
  window.history.pushState({}, '', path);

  return render(<App />);
}

describe('Navegação autenticada do ApexFinance', () => {
  beforeEach(() => {
    authMocks.useSession.mockReset();
    authMocks.useSession.mockReturnValue(authenticatedSession());
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

  it('exibe os módulos principais na navegação lateral', () => {
    renderPath('/app');

    const navigation = screen.getByRole('navigation', {
      name: /navegação principal/i,
    });

    expect(navigation).toBeInTheDocument();

    expect(
      screen.getByRole('link', {
        name: /dashboard/i,
      }),
    ).toBeInTheDocument();

    expect(
      screen.getByRole('link', {
        name: /carteira/i,
      }),
    ).toBeInTheDocument();

    expect(
      screen.getByRole('link', {
        name: /inteligência/i,
      }),
    ).toBeInTheDocument();

    expect(
      screen.getByRole('link', {
        name: /metas/i,
      }),
    ).toBeInTheDocument();

    expect(
      screen.getByRole('link', {
        name: /^fire$/i,
      }),
    ).toBeInTheDocument();

    expect(
      screen.getByRole('link', {
        name: /factoring/i,
      }),
    ).toBeInTheDocument();

    expect(
      screen.getByRole('link', {
        name: /copilot/i,
      }),
    ).toBeInTheDocument();
  });

  it('marca o módulo atual como página ativa', () => {
    renderPath('/app/goals');

    expect(
      screen.getByRole('link', {
        name: /metas/i,
      }),
    ).toHaveAttribute('aria-current', 'page');
  });

  it('exibe Administração na navegação para ADMIN', () => {
    authMocks.useSession.mockReturnValue(authenticatedSession('admin'));

    renderPath('/app');

    expect(
      screen.getByRole('link', {
        name: /administração/i,
      }),
    ).toBeInTheDocument();
  });

  it('não exibe Administração na navegação para usuário comum', () => {
    authMocks.useSession.mockReturnValue(authenticatedSession('user'));

    renderPath('/app');

    expect(
      screen.queryByRole('link', {
        name: /administração/i,
      }),
    ).not.toBeInTheDocument();
  });
});
