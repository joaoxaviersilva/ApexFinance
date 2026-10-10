import type { CashMovement } from '@apexfinance/contracts';
import { cleanup, fireEvent, render, screen, waitFor, within } from '@testing-library/react';
import { afterEach, describe, expect, it, vi } from 'vitest';

import { CashPage } from '../src/features/cash/pages/CashPage';

const API_BASE_URL = 'http://localhost:3333';

const initialMovement: CashMovement = {
  id: 'movement-initial',
  type: 'deposit',
  amountCents: 10_000,
  description: 'Saldo inicial',
  occurredAt: '2026-09-22T12:00:00.000Z',
  createdAt: '2026-09-22T12:01:00.000Z',
};

const createdDeposit: CashMovement = {
  id: 'movement-deposit',
  type: 'deposit',
  amountCents: 123_456,
  description: 'Aporte mensal',
  occurredAt: '2026-09-23T12:00:00.000Z',
  createdAt: '2026-09-23T12:01:00.000Z',
};

const createdWithdrawal: CashMovement = {
  id: 'movement-withdrawal',
  type: 'withdrawal',
  amountCents: 6_000,
  description: 'Pagamento',
  occurredAt: '2026-09-23T13:00:00.000Z',
  createdAt: '2026-09-23T13:01:00.000Z',
};

function createResponse(body: unknown, status = 200): Response {
  return {
    ok: status >= 200 && status < 300,
    status,
    json: vi.fn().mockResolvedValue(body),
  } as unknown as Response;
}

type CashApiMockOptions = {
  initialBalanceCents?: number;
  updatedBalanceCents?: number;
  initialMovements?: CashMovement[];
  updatedMovements?: CashMovement[];
  postResult?: Response | Promise<Response>;
};

function mockCashApi(options: CashApiMockOptions = {}) {
  const {
    initialBalanceCents = 0,
    updatedBalanceCents = initialBalanceCents,
    initialMovements = [],
    updatedMovements = initialMovements,
    postResult = createResponse(
      {
        movement: createdDeposit,
        balanceCents: updatedBalanceCents,
      },
      201,
    ),
  } = options;

  let hasCreatedMovement = false;

  const fetchMock = vi.fn((input: RequestInfo | URL, init?: RequestInit): Promise<Response> => {
    const url = String(input);

    if (url === `${API_BASE_URL}/api/cash/movements` && init?.method === 'POST') {
      return Promise.resolve(postResult).then((response) => {
        if (response.ok) {
          hasCreatedMovement = true;
        }

        return response;
      });
    }

    if (url === `${API_BASE_URL}/api/cash/summary`) {
      return Promise.resolve(
        createResponse({
          balanceCents: hasCreatedMovement ? updatedBalanceCents : initialBalanceCents,
        }),
      );
    }

    if (url === `${API_BASE_URL}/api/cash/movements`) {
      return Promise.resolve(
        createResponse({
          movements: hasCreatedMovement ? updatedMovements : initialMovements,
        }),
      );
    }

    return Promise.reject(new Error(`Requisição inesperada: ${url}`));
  });

  vi.stubGlobal('fetch', fetchMock);

  return fetchMock;
}

async function waitForDisplayedBalance(expectedAmount: string): Promise<void> {
  await waitFor(() => {
    const summaryCard = screen.getByRole('heading', { name: 'Saldo atual' }).closest('section');

    expect(summaryCard).toHaveTextContent(expectedAmount);
  });
}

function openMovementDialog(type: 'deposit' | 'withdrawal') {
  const title = type === 'deposit' ? 'Nova entrada' : 'Nova saída';

  fireEvent.click(screen.getByRole('button', { name: title }));

  return screen.getByRole('dialog', { name: title });
}

function fillMovementForm(dialog: HTMLElement, value: string, description: string) {
  fireEvent.change(
    within(dialog).getByRole('textbox', {
      name: 'Valor (R$)',
    }),
    {
      target: { value },
    },
  );

  fireEvent.change(
    within(dialog).getByRole('textbox', {
      name: 'Descrição',
    }),
    {
      target: { value: description },
    },
  );
}

function getPostCalls(fetchMock: ReturnType<typeof mockCashApi>) {
  return fetchMock.mock.calls.filter(
    ([input, init]) =>
      String(input) === `${API_BASE_URL}/api/cash/movements` && init?.method === 'POST',
  );
}

describe('Página de Caixa - entradas e saídas', () => {
  afterEach(() => {
    cleanup();
    vi.unstubAllGlobals();
  });

  it('abre e cancela o formulário de uma nova entrada', async () => {
    mockCashApi();

    render(<CashPage />);

    await waitForDisplayedBalance('R$ 0,00');

    expect(screen.getByRole('button', { name: 'Nova entrada' })).toBeInTheDocument();

    expect(screen.getByRole('button', { name: 'Nova saída' })).toBeInTheDocument();

    const dialog = openMovementDialog('deposit');

    expect(
      within(dialog).getByRole('textbox', {
        name: 'Valor (R$)',
      }),
    ).toBeInTheDocument();

    expect(
      within(dialog).getByRole('textbox', {
        name: 'Descrição',
      }),
    ).toBeInTheDocument();

    expect(within(dialog).getByLabelText('Data e hora (opcional)')).toBeInTheDocument();

    fireEvent.click(
      within(dialog).getByRole('button', {
        name: 'Cancelar',
      }),
    );

    expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
  });

  it('abre o formulário de saída com a operação correta', async () => {
    mockCashApi();

    render(<CashPage />);

    await waitForDisplayedBalance('R$ 0,00');

    const dialog = openMovementDialog('withdrawal');

    expect(
      within(dialog).getByRole('button', {
        name: 'Registrar saída',
      }),
    ).toBeInTheDocument();
  });

  it('registra uma entrada convertendo R$ 1.234,56 para 123456 centavos', async () => {
    const fetchMock = mockCashApi({
      initialBalanceCents: 0,
      updatedBalanceCents: 123_456,
      updatedMovements: [createdDeposit],
    });

    render(<CashPage />);

    await waitForDisplayedBalance('R$ 0,00');

    const dialog = openMovementDialog('deposit');

    fillMovementForm(dialog, '1.234,56', '  Aporte mensal  ');

    fireEvent.click(
      within(dialog).getByRole('button', {
        name: 'Registrar entrada',
      }),
    );

    await waitFor(() => {
      expect(getPostCalls(fetchMock)).toHaveLength(1);
    });

    const postCall = getPostCalls(fetchMock)[0];

    expect(postCall[1]).toMatchObject({
      method: 'POST',
      credentials: 'include',
    });

    expect(JSON.parse(String(postCall[1]?.body))).toEqual({
      type: 'deposit',
      amountCents: 123_456,
      description: 'Aporte mensal',
    });

    await waitForDisplayedBalance('R$ 1.234,56');

    expect(await screen.findByText('Aporte mensal')).toBeInTheDocument();

    expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
  });

  it('registra uma saída e atualiza saldo e histórico', async () => {
    const fetchMock = mockCashApi({
      initialBalanceCents: 10_000,
      updatedBalanceCents: 4_000,
      initialMovements: [initialMovement],
      updatedMovements: [createdWithdrawal, initialMovement],
      postResult: createResponse(
        {
          movement: createdWithdrawal,
          balanceCents: 4_000,
        },
        201,
      ),
    });

    render(<CashPage />);

    await waitForDisplayedBalance('R$ 100,00');

    const dialog = openMovementDialog('withdrawal');

    fillMovementForm(dialog, '60,00', 'Pagamento');

    fireEvent.click(
      within(dialog).getByRole('button', {
        name: 'Registrar saída',
      }),
    );

    await waitFor(() => {
      expect(getPostCalls(fetchMock)).toHaveLength(1);
    });

    const body = JSON.parse(String(getPostCalls(fetchMock)[0][1]?.body));

    expect(body).toEqual({
      type: 'withdrawal',
      amountCents: 6_000,
      description: 'Pagamento',
    });

    await waitForDisplayedBalance('R$ 40,00');

    const history = await screen.findByRole('list', {
      name: 'Histórico de movimentações',
    });

    await waitFor(() => {
      expect(within(history).getAllByRole('listitem')).toHaveLength(2);
    });

    const items = within(history).getAllByRole('listitem');

    expect(within(items[0]).getByText('Pagamento')).toBeInTheDocument();

    expect(within(items[0]).getByText(/-\s*R\$\s*60,00/)).toBeInTheDocument();
  });

  it('converte data e hora local para ISO quando informada', async () => {
    const fetchMock = mockCashApi({
      updatedBalanceCents: 100,
    });

    render(<CashPage />);

    await waitForDisplayedBalance('R$ 0,00');

    const dialog = openMovementDialog('deposit');

    fillMovementForm(dialog, '1,00', 'Registro com data');

    fireEvent.change(within(dialog).getByLabelText('Data e hora (opcional)'), {
      target: {
        value: '2026-09-23T09:45',
      },
    });

    fireEvent.click(
      within(dialog).getByRole('button', {
        name: 'Registrar entrada',
      }),
    );

    await waitFor(() => {
      expect(getPostCalls(fetchMock)).toHaveLength(1);
    });

    const body = JSON.parse(String(getPostCalls(fetchMock)[0][1]?.body));

    expect(body).toEqual({
      type: 'deposit',
      amountCents: 100,
      description: 'Registro com data',
      occurredAt: new Date('2026-09-23T09:45').toISOString(),
    });
  });

  it.each([
    ['0,00', 'Aporte'],
    ['1,234', 'Aporte'],
    ['25,00', '   '],
  ])('não envia valores ou descrições inválidos: %s', async (value, description) => {
    const fetchMock = mockCashApi();

    render(<CashPage />);

    await waitForDisplayedBalance('R$ 0,00');

    const dialog = openMovementDialog('deposit');

    fillMovementForm(dialog, value, description);

    fireEvent.click(
      within(dialog).getByRole('button', {
        name: 'Registrar entrada',
      }),
    );

    expect(await within(dialog).findByRole('alert')).toBeInTheDocument();

    expect(getPostCalls(fetchMock)).toHaveLength(0);

    await waitForDisplayedBalance('R$ 0,00');
  });

  it('mostra saldo insuficiente e preserva o formulário e o saldo anterior', async () => {
    const fetchMock = mockCashApi({
      initialBalanceCents: 10_000,
      initialMovements: [initialMovement],
      postResult: createResponse(
        {
          code: 'INSUFFICIENT_CASH_BALANCE',
          error: 'Saldo insuficiente para realizar esta saída.',
        },
        409,
      ),
    });

    render(<CashPage />);

    await waitForDisplayedBalance('R$ 100,00');

    const dialog = openMovementDialog('withdrawal');

    fillMovementForm(dialog, '120,00', 'Pagamento acima do saldo');

    fireEvent.click(
      within(dialog).getByRole('button', {
        name: 'Registrar saída',
      }),
    );

    expect(
      await within(dialog).findByText('Saldo insuficiente para realizar esta saída.'),
    ).toBeInTheDocument();

    expect(
      within(dialog).getByRole('textbox', {
        name: 'Valor (R$)',
      }),
    ).toHaveValue('120,00');

    expect(getPostCalls(fetchMock)).toHaveLength(1);

    await waitForDisplayedBalance('R$ 100,00');

    expect(screen.getByText('Saldo inicial')).toBeInTheDocument();
  });

  it('preserva os dados quando a API retorna um erro inesperado', async () => {
    const fetchMock = mockCashApi({
      initialBalanceCents: 10_000,
      initialMovements: [initialMovement],
      postResult: createResponse({ error: 'Falha interna.' }, 500),
    });

    render(<CashPage />);

    await waitForDisplayedBalance('R$ 100,00');

    const dialog = openMovementDialog('deposit');

    fillMovementForm(dialog, '20,00', 'Nova entrada');

    fireEvent.click(
      within(dialog).getByRole('button', {
        name: 'Registrar entrada',
      }),
    );

    expect(
      await within(dialog).findByText(
        'Não foi possível registrar a movimentação. Tente novamente.',
      ),
    ).toBeInTheDocument();

    expect(getPostCalls(fetchMock)).toHaveLength(1);

    await waitForDisplayedBalance('R$ 100,00');

    expect(screen.getByText('Saldo inicial')).toBeInTheDocument();
  });

  it('bloqueia ações duplicadas enquanto registra a movimentação', async () => {
    const pendingRequest = new Promise<Response>(() => {});

    const fetchMock = mockCashApi({
      postResult: pendingRequest,
    });

    render(<CashPage />);

    await waitForDisplayedBalance('R$ 0,00');

    const dialog = openMovementDialog('deposit');

    fillMovementForm(dialog, '50,00', 'Aporte');

    fireEvent.click(
      within(dialog).getByRole('button', {
        name: 'Registrar entrada',
      }),
    );

    await waitFor(() => {
      expect(
        within(dialog).getByRole('button', {
          name: 'Registrando...',
        }),
      ).toBeDisabled();
    });

    expect(
      within(dialog).getByRole('button', {
        name: 'Cancelar',
      }),
    ).toBeDisabled();

    expect(getPostCalls(fetchMock)).toHaveLength(1);
  });
});
