import { beforeEach, describe, expect, it, vi } from 'vitest';

import type { CashMovement } from '@apexfinance/contracts';

const repositoryMocks = {
  listMovementsForUser: vi.fn(),
};

import { ListCashMovementsUseCase } from './list-cash-movements.use-case';

const movements: CashMovement[] = [
  {
    id: 'movement-2',
    type: 'withdrawal',
    amountCents: 25000,
    description: 'Pagamento',
    occurredAt: '2026-09-19T20:00:00.000Z',
    createdAt: '2026-09-19T20:00:01.000Z',
  },
  {
    id: 'movement-1',
    type: 'deposit',
    amountCents: 100000,
    description: 'Aporte inicial',
    occurredAt: '2026-09-19T18:00:00.000Z',
    createdAt: '2026-09-19T18:00:01.000Z',
  },
];

describe('ListCashMovementsUseCase', () => {
  beforeEach(() => {
    repositoryMocks.listMovementsForUser.mockReset();
  });

  it('retorna histórico vazio quando o usuário ainda não possui movimentos', async () => {
    repositoryMocks.listMovementsForUser.mockResolvedValue([]);

    const useCase = new ListCashMovementsUseCase(repositoryMocks);

    const result = await useCase.execute('user-1');

    expect(repositoryMocks.listMovementsForUser).toHaveBeenCalledWith('user-1');

    expect(result).toEqual({
      movements: [],
    });
  });

  it('retorna somente os movimentos pertencentes ao usuário informado', async () => {
    repositoryMocks.listMovementsForUser.mockResolvedValue(movements);

    const useCase = new ListCashMovementsUseCase(repositoryMocks);

    const result = await useCase.execute('user-2');

    expect(repositoryMocks.listMovementsForUser).toHaveBeenCalledTimes(1);

    expect(repositoryMocks.listMovementsForUser).toHaveBeenCalledWith('user-2');

    expect(result).toEqual({
      movements,
    });
  });
});
