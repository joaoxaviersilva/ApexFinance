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

import { App } from '../src/app/App';

function authenticatedSession() {
  return {
    data: {
      user: {
        id: 'cash-user-1',
        name: 'Usuário de Teste',
        email: 'cash@apexfinance.local',
        role: 'user',
      },
      session: {
        id: 'cash-session-1',
        userId: 'cash-user-1',
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

function createResponse(body: unknown): Response {
  return {
    ok: true,
    status: 200,
    json: async () => body,
  } as Response;
}

describe('Navegação e rota do Caixa', () => {
  beforeEach(() => {
    authMocks.useSession.mockReset();
    authMocks.useSession.mockReturnValue(authenticatedSession());

    vi.stubGlobal(
      'fetch',
      vi.fn(async (input: unknown) => {
        const url = String(input);

        if (url.endsWith('/api/cash/summary')) {
          return createResponse({
            balanceCents: 0,
          });
        }

        if (url.endsWith('/api/cash/movements')) {
          return createResponse({
            movements: [],
          });
        }

        throw new Error(`Requisição inesperada: ${url}`);
      }),
    );
  });

  afterEach(() => {
    cleanup();
    vi.unstubAllGlobals();
    window.history.pushState({}, '', '/');
  });

  it('exibe Caixa na navegação sem remover Carteira', () => {
    renderPath('/app');

    expect(
      screen.getByRole('link', {
        name: 'Caixa',
      }),
    ).toHaveAttribute('href', '/app/cash');

    expect(
      screen.getByRole('link', {
        name: 'Carteira',
      }),
    ).toHaveAttribute('href', '/app/portfolio');
  });

  it('renderiza a página real de Caixa em /app/cash', async () => {
    renderPath('/app/cash');

    expect(
      await screen.findByRole('heading', {
        name: 'Caixa',
      }),
    ).toBeInTheDocument();

    expect(screen.getByText('Seu saldo disponível e movimentações.')).toBeInTheDocument();

    expect(
      screen.queryByText(/este módulo será desenvolvido em um próximo ciclo/i),
    ).not.toBeInTheDocument();
  });

  it('marca Caixa como item ativo da navegação', async () => {
    renderPath('/app/cash');

    expect(
      await screen.findByRole('link', {
        name: 'Caixa',
      }),
    ).toHaveAttribute('aria-current', 'page');
  });
});
