import { beforeEach, describe, expect, it, vi } from 'vitest';

import type { CreateCashMovementResponse } from '@apexfinance/contracts';

const repositoryMocks = {
  appendMovementForUser: vi.fn(),
};

import { CreateCashMovementUseCase } from './create-cash-movement.use-case';

describe('CreateCashMovementUseCase', () => {
  beforeEach(() => {
    repositoryMocks.appendMovementForUser.mockReset();
  });

  it('registra uma entrada para o usuário informado, normaliza a descrição e respeita occurredAt', async () => {
    const response: CreateCashMovementResponse = {
      movement: {
        id: 'movement-1',
        type: 'deposit',
        amountCents: 125050,
        description: 'Aporte mensal',
        occurredAt: '2026-09-23T12:30:00.000Z',
        createdAt: '2026-09-23T12:31:00.000Z',
      },
      balanceCents: 125050,
    };

    repositoryMocks.appendMovementForUser.mockResolvedValue(response);

    const useCase = new CreateCashMovementUseCase(repositoryMocks);

    const result = await useCase.execute({
      userId: 'user-1',
      type: 'deposit',
      amountCents: 125050,
      description: '  Aporte mensal  ',
      occurredAt: '2026-09-23T12:30:00.000Z',
    });

    expect(repositoryMocks.appendMovementForUser).toHaveBeenCalledTimes(1);

    expect(repositoryMocks.appendMovementForUser).toHaveBeenCalledWith({
      userId: 'user-1',
      type: 'deposit',
      amountCents: 125050,
      description: 'Aporte mensal',
      occurredAt: new Date('2026-09-23T12:30:00.000Z'),
    });

    expect(result).toEqual(response);
  });

  it('usa o instante atual do servidor quando occurredAt não é informado', async () => {
    vi.useFakeTimers();

    vi.setSystemTime(new Date('2026-09-23T13:00:00.000Z'));

    const response: CreateCashMovementResponse = {
      movement: {
        id: 'movement-2',
        type: 'withdrawal',
        amountCents: 25000,
        description: 'Pagamento',
        occurredAt: '2026-09-23T13:00:00.000Z',
        createdAt: '2026-09-23T13:00:01.000Z',
      },
      balanceCents: 100050,
    };

    repositoryMocks.appendMovementForUser.mockResolvedValue(response);

    try {
      const useCase = new CreateCashMovementUseCase(repositoryMocks);

      const result = await useCase.execute({
        userId: 'user-1',
        type: 'withdrawal',
        amountCents: 25000,
        description: 'Pagamento',
      });

      expect(repositoryMocks.appendMovementForUser).toHaveBeenCalledTimes(1);

      expect(repositoryMocks.appendMovementForUser).toHaveBeenCalledWith({
        userId: 'user-1',
        type: 'withdrawal',
        amountCents: 25000,
        description: 'Pagamento',
        occurredAt: new Date('2026-09-23T13:00:00.000Z'),
      });

      expect(result).toEqual(response);
    } finally {
      vi.useRealTimers();
    }
  });
});
