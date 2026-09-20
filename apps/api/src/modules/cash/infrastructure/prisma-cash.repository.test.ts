import { beforeEach, describe, expect, it, vi } from 'vitest';

const prismaMocks = vi.hoisted(() => ({
  cashAccountFindUnique: vi.fn(),
  cashAccountUpsert: vi.fn(),
  cashMovementAggregate: vi.fn(),
  cashMovementCreate: vi.fn(),
  cashMovementFindMany: vi.fn(),
  transaction: vi.fn(),
}));

vi.mock('../../../shared/infrastructure/database/prisma.js', () => ({
  prisma: {
    cashAccount: {
      findUnique: prismaMocks.cashAccountFindUnique,

      upsert: prismaMocks.cashAccountUpsert,
    },

    cashMovement: {
      aggregate: prismaMocks.cashMovementAggregate,

      create: prismaMocks.cashMovementCreate,

      findMany: prismaMocks.cashMovementFindMany,
    },

    $transaction: prismaMocks.transaction,
  },
}));

import { PrismaCashRepository } from './prisma-cash.repository';

const occurredAt = new Date('2026-09-19T18:00:00.000Z');

const createdAt = new Date('2026-09-19T18:00:01.000Z');

describe('PrismaCashRepository', () => {
  beforeEach(() => {
    prismaMocks.cashAccountFindUnique.mockReset();
    prismaMocks.cashAccountUpsert.mockReset();
    prismaMocks.cashMovementAggregate.mockReset();
    prismaMocks.cashMovementCreate.mockReset();
    prismaMocks.cashMovementFindMany.mockReset();
    prismaMocks.transaction.mockReset();

    prismaMocks.transaction.mockImplementation(
      async (
        callback: (transaction: {
          cashAccount: {
            upsert: typeof prismaMocks.cashAccountUpsert;
          };

          cashMovement: {
            create: typeof prismaMocks.cashMovementCreate;
          };
        }) => Promise<unknown>,
      ) =>
        callback({
          cashAccount: {
            upsert: prismaMocks.cashAccountUpsert,
          },

          cashMovement: {
            create: prismaMocks.cashMovementCreate,
          },
        }),
    );
  });

  it('retorna saldo zero quando o usuário ainda não possui caixa geral', async () => {
    prismaMocks.cashAccountFindUnique.mockResolvedValue(null);

    const repository = new PrismaCashRepository();

    const balance = await repository.getBalanceForUser('user-1');

    expect(balance).toBe(0);

    expect(prismaMocks.cashAccountFindUnique).toHaveBeenCalledWith({
      where: {
        userId_type: {
          userId: 'user-1',
          type: 'GENERAL',
        },
      },

      select: {
        id: true,
      },
    });

    expect(prismaMocks.cashMovementAggregate).not.toHaveBeenCalled();
  });

  it('cria automaticamente o caixa geral ao registrar o primeiro movimento', async () => {
    prismaMocks.cashAccountUpsert.mockResolvedValue({
      id: 'cash-account-1',
    });

    prismaMocks.cashMovementCreate.mockResolvedValue({
      id: 'movement-1',
      type: 'DEPOSIT',
      deltaCents: 100000n,
      description: 'Aporte inicial',
      occurredAt,
      createdAt,
    });

    const repository = new PrismaCashRepository();

    const result = await repository.appendMovementForUser({
      userId: 'user-1',
      type: 'deposit',
      amountCents: 100000,
      description: 'Aporte inicial',
      occurredAt,
    });

    expect(prismaMocks.transaction).toHaveBeenCalledTimes(1);

    expect(prismaMocks.cashAccountUpsert).toHaveBeenCalledWith({
      where: {
        userId_type: {
          userId: 'user-1',
          type: 'GENERAL',
        },
      },

      create: {
        userId: 'user-1',
        type: 'GENERAL',
      },

      update: {},

      select: {
        id: true,
      },
    });

    expect(prismaMocks.cashMovementCreate).toHaveBeenCalledWith({
      data: {
        cashAccountId: 'cash-account-1',
        type: 'DEPOSIT',
        deltaCents: 100000n,
        description: 'Aporte inicial',
        occurredAt,
      },

      select: {
        id: true,
        type: true,
        deltaCents: true,
        description: true,
        occurredAt: true,
        createdAt: true,
      },
    });

    expect(result).toEqual({
      id: 'movement-1',
      type: 'deposit',
      amountCents: 100000,
      description: 'Aporte inicial',
      occurredAt: '2026-09-19T18:00:00.000Z',
      createdAt: '2026-09-19T18:00:01.000Z',
    });
  });

  it('calcula o saldo somente a partir do caixa geral pertencente ao usuário informado', async () => {
    prismaMocks.cashAccountFindUnique.mockResolvedValue({
      id: 'cash-account-user-1',
    });

    prismaMocks.cashMovementAggregate.mockResolvedValue({
      _sum: {
        deltaCents: 125050n,
      },
    });

    const repository = new PrismaCashRepository();

    const balance = await repository.getBalanceForUser('user-1');

    expect(balance).toBe(125050);

    expect(prismaMocks.cashAccountFindUnique).toHaveBeenCalledWith({
      where: {
        userId_type: {
          userId: 'user-1',
          type: 'GENERAL',
        },
      },

      select: {
        id: true,
      },
    });

    expect(prismaMocks.cashMovementAggregate).toHaveBeenCalledWith({
      where: {
        cashAccountId: 'cash-account-user-1',
      },

      _sum: {
        deltaCents: true,
      },
    });
  });

  it('lista somente os movimentos do caixa geral pertencente ao usuário informado', async () => {
    prismaMocks.cashAccountFindUnique.mockResolvedValue({
      id: 'cash-account-user-1',
    });

    prismaMocks.cashMovementFindMany.mockResolvedValue([
      {
        id: 'movement-2',
        type: 'WITHDRAWAL',
        deltaCents: -25000n,
        description: 'Pagamento',
        occurredAt: new Date('2026-09-19T20:00:00.000Z'),
        createdAt: new Date('2026-09-19T20:00:01.000Z'),
      },

      {
        id: 'movement-1',
        type: 'DEPOSIT',
        deltaCents: 100000n,
        description: 'Aporte inicial',
        occurredAt,
        createdAt,
      },
    ]);

    const repository = new PrismaCashRepository();

    const movements = await repository.listMovementsForUser('user-1');

    expect(prismaMocks.cashAccountFindUnique).toHaveBeenCalledWith({
      where: {
        userId_type: {
          userId: 'user-1',
          type: 'GENERAL',
        },
      },

      select: {
        id: true,
      },
    });

    expect(prismaMocks.cashMovementFindMany).toHaveBeenCalledWith({
      where: {
        cashAccountId: 'cash-account-user-1',
      },

      select: {
        id: true,
        type: true,
        deltaCents: true,
        description: true,
        occurredAt: true,
        createdAt: true,
      },

      orderBy: [
        {
          occurredAt: 'desc',
        },
        {
          createdAt: 'desc',
        },
      ],
    });

    expect(movements).toEqual([
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
    ]);
  });
});
