import type { CashMovement } from '@apexfinance/contracts';
import { cleanup, render, screen, waitFor, within } from '@testing-library/react';
import { afterEach, describe, expect, it, vi } from 'vitest';

import { CashPage } from '../src/features/cash/pages/CashPage';

const API_BASE_URL = 'http://localhost:3333';

const movements: CashMovement[] = [
  {
    id: 'movement-2',
    type: 'withdrawal',
    amountCents: 24_950,
    description: 'Pagamento',
    occurredAt: '2026-09-23T15:00:00.000Z',
    createdAt: '2026-09-23T15:01:00.000Z',
  },
  {
    id: 'movement-1',
    type: 'deposit',
    amountCents: 150_000,
    description: 'Aporte inicial',
    occurredAt: '2026-09-22T12:00:00.000Z',
    createdAt: '2026-09-22T12:01:00.000Z',
  },
];

function createResponse(body: unknown, ok = true): Response {
  return {
    ok,
    status: ok ? 200 : 500,
    json: vi.fn().mockResolvedValue(body),
  } as unknown as Response;
}

function mockCashApi(summaryResponse: Response, movementsResponse: Response) {
  const fetchMock = vi.fn((input: RequestInfo | URL) => {
    const url = String(input);

    if (url.endsWith('/api/cash/summary')) {
      return Promise.resolve(summaryResponse);
    }

    if (url.endsWith('/api/cash/movements')) {
      return Promise.resolve(movementsResponse);
    }

    return Promise.reject(new Error(`Requisição inesperada: ${url}`));
  });

  vi.stubGlobal('fetch', fetchMock);

  return fetchMock;
}

describe('Página de Caixa - consultas financeiras', () => {
  afterEach(() => {
    cleanup();
    vi.unstubAllGlobals();
  });

  it('exibe carregamento enquanto consulta saldo e histórico', () => {
    const pendingRequest = new Promise<Response>(() => {});

    vi.stubGlobal('fetch', vi.fn().mockReturnValue(pendingRequest));

    render(<CashPage />);

    expect(screen.getByRole('heading', { name: 'Caixa' })).toBeInTheDocument();

    expect(screen.getByText('Carregando saldo...')).toBeInTheDocument();

    expect(screen.getByText('Carregando movimentações...')).toBeInTheDocument();

    expect(screen.queryByText(/R\$\s*0,00/)).not.toBeInTheDocument();
  });

  it('exibe saldo zero e histórico vazio sem inventar dados', async () => {
    const fetchMock = mockCashApi(
      createResponse({ balanceCents: 0 }),
      createResponse({ movements: [] }),
    );

    render(<CashPage />);

    expect(await screen.findByText(/R\$\s*0,00/)).toBeInTheDocument();

    expect(await screen.findByText('Nenhuma movimentação registrada.')).toBeInTheDocument();

    await waitFor(() => {
      expect(fetchMock).toHaveBeenCalledWith(
        `${API_BASE_URL}/api/cash/summary`,
        expect.objectContaining({
          credentials: 'include',
        }),
      );

      expect(fetchMock).toHaveBeenCalledWith(
        `${API_BASE_URL}/api/cash/movements`,
        expect.objectContaining({
          credentials: 'include',
        }),
      );
    });
  });

  it('exibe saldo em reais e movimentações na ordem recebida da API', async () => {
    mockCashApi(createResponse({ balanceCents: 125_050 }), createResponse({ movements }));

    render(<CashPage />);

    expect(await screen.findByText(/R\$\s*1\.250,50/)).toBeInTheDocument();

    const history = await screen.findByRole('list', {
      name: 'Histórico de movimentações',
    });

    const items = within(history).getAllByRole('listitem');

    expect(items).toHaveLength(2);

    expect(within(items[0]).getByText('Pagamento')).toBeInTheDocument();

    expect(within(items[0]).getByText(/-\s*R\$\s*249,50/)).toBeInTheDocument();

    expect(within(items[1]).getByText('Aporte inicial')).toBeInTheDocument();

    expect(within(items[1]).getByText(/\+\s*R\$\s*1\.500,00/)).toBeInTheDocument();

    expect(screen.queryByText('Nenhuma movimentação registrada.')).not.toBeInTheDocument();
  });

  it('mostra erro de saldo sem esconder o histórico disponível', async () => {
    mockCashApi(
      createResponse({ error: 'Falha ao consultar saldo.' }, false),
      createResponse({ movements }),
    );

    render(<CashPage />);

    expect(await screen.findByText('Não foi possível carregar o saldo.')).toBeInTheDocument();

    expect(await screen.findByText('Aporte inicial')).toBeInTheDocument();

    expect(screen.getByText('Pagamento')).toBeInTheDocument();

    expect(screen.queryByText(/R\$\s*1\.250,50/)).not.toBeInTheDocument();
  });

  it('mostra erro no histórico sem esconder o saldo disponível', async () => {
    mockCashApi(
      createResponse({ balanceCents: 125_050 }),
      createResponse({ error: 'Falha ao consultar histórico.' }, false),
    );

    render(<CashPage />);

    expect(
      await screen.findByText('Não foi possível carregar as movimentações.'),
    ).toBeInTheDocument();

    expect(await screen.findByText(/R\$\s*1\.250,50/)).toBeInTheDocument();

    expect(screen.queryByText('Nenhuma movimentação registrada.')).not.toBeInTheDocument();
  });
});
