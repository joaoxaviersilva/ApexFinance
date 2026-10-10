import { beforeEach, describe, expect, it, vi } from 'vitest';

const prismaMocks = vi.hoisted(() => ({
  cashAccountUpsert: vi.fn(),
  cashMovementAggregate: vi.fn(),
  cashMovementCreate: vi.fn(),
  transaction: vi.fn(),
}));

vi.mock('../../../shared/infrastructure/database/prisma.js', () => ({
  prisma: {
    $transaction: prismaMocks.transaction,
  },
}));

import { PrismaCashRepository } from './prisma-cash.repository';

const occurredAt = new Date('2026-09-23T12:00:00.000Z');
const createdAt = new Date('2026-09-23T12:00:01.000Z');

type TransactionMock = {
  cashAccount: {
    upsert: typeof prismaMocks.cashAccountUpsert;
  };
  cashMovement: {
    aggregate: typeof prismaMocks.cashMovementAggregate;
    create: typeof prismaMocks.cashMovementCreate;
  };
};

describe('PrismaCashRepository - integridade transacional', () => {
  beforeEach(() => {
    prismaMocks.cashAccountUpsert.mockReset();
    prismaMocks.cashMovementAggregate.mockReset();
    prismaMocks.cashMovementCreate.mockReset();
    prismaMocks.transaction.mockReset();

    prismaMocks.cashAccountUpsert.mockResolvedValue({
      id: 'cash-account-1',
    });

    prismaMocks.cashMovementAggregate.mockResolvedValue({
      _sum: {
        deltaCents: 50_000n,
      },
    });

    prismaMocks.cashMovementCreate.mockResolvedValue({
      id: 'movement-1',
      type: 'DEPOSIT',
      deltaCents: 25_000n,
      description: 'Aporte',
      occurredAt,
      createdAt,
    });

    prismaMocks.transaction.mockImplementation(
      async (callback: (transaction: TransactionMock) => Promise<unknown>) =>
        callback({
          cashAccount: {
            upsert: prismaMocks.cashAccountUpsert,
          },
          cashMovement: {
            aggregate: prismaMocks.cashMovementAggregate,
            create: prismaMocks.cashMovementCreate,
          },
        }),
    );
  });

  it('registra entrada e devolve o saldo atualizado na mesma transação SERIALIZABLE', async () => {
    const repository = new PrismaCashRepository();

    const result = await repository.appendMovementForUser({
      userId: 'user-1',
      type: 'deposit',
      amountCents: 25_000,
      description: 'Aporte',
      occurredAt,
    });

    expect(prismaMocks.transaction).toHaveBeenCalledWith(
      expect.any(Function),
      expect.objectContaining({
        isolationLevel: 'Serializable',
      }),
    );

    expect(prismaMocks.cashMovementAggregate).toHaveBeenCalledWith({
      where: {
        cashAccountId: 'cash-account-1',
      },
      _sum: {
        deltaCents: true,
      },
    });

    expect(prismaMocks.cashMovementCreate).toHaveBeenCalledWith({
      data: {
        cashAccountId: 'cash-account-1',
        type: 'DEPOSIT',
        deltaCents: 25_000n,
        description: 'Aporte',
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
      movement: {
        id: 'movement-1',
        type: 'deposit',
        amountCents: 25_000,
        description: 'Aporte',
        occurredAt: occurredAt.toISOString(),
        createdAt: createdAt.toISOString(),
      },
      balanceCents: 75_000,
    });
  });

  it('permite saída com saldo suficiente e calcula o saldo restante', async () => {
    prismaMocks.cashMovementCreate.mockResolvedValue({
      id: 'movement-2',
      type: 'WITHDRAWAL',
      deltaCents: -40_000n,
      description: 'Pagamento',
      occurredAt,
      createdAt,
    });

    const repository = new PrismaCashRepository();

    const result = await repository.appendMovementForUser({
      userId: 'user-1',
      type: 'withdrawal',
      amountCents: 40_000,
      description: 'Pagamento',
      occurredAt,
    });

    expect(prismaMocks.cashMovementAggregate).toHaveBeenCalledTimes(1);
    expect(prismaMocks.cashMovementCreate).toHaveBeenCalledTimes(1);

    expect(prismaMocks.cashMovementAggregate.mock.invocationCallOrder[0]).toBeLessThan(
      prismaMocks.cashMovementCreate.mock.invocationCallOrder[0],
    );

    expect(result).toEqual({
      movement: {
        id: 'movement-2',
        type: 'withdrawal',
        amountCents: 40_000,
        description: 'Pagamento',
        occurredAt: occurredAt.toISOString(),
        createdAt: createdAt.toISOString(),
      },
      balanceCents: 10_000,
    });
  });

  it('rejeita saída maior que o saldo sem gravar movimento', async () => {
    const repository = new PrismaCashRepository();

    await expect(
      repository.appendMovementForUser({
        userId: 'user-1',
        type: 'withdrawal',
        amountCents: 60_000,
        description: 'Saída acima do saldo',
        occurredAt,
      }),
    ).rejects.toMatchObject({
      code: 'INSUFFICIENT_CASH_BALANCE',
      message: 'Saldo insuficiente para realizar esta saída.',
    });

    expect(prismaMocks.cashMovementAggregate).toHaveBeenCalledTimes(1);
    expect(prismaMocks.cashMovementCreate).not.toHaveBeenCalled();
  });

  it('repete a transação após um conflito de serialização P2034', async () => {
    prismaMocks.transaction.mockRejectedValueOnce({
      code: 'P2034',
    });

    const repository = new PrismaCashRepository();

    const result = await repository.appendMovementForUser({
      userId: 'user-1',
      type: 'deposit',
      amountCents: 25_000,
      description: 'Aporte',
      occurredAt,
    });

    expect(prismaMocks.transaction).toHaveBeenCalledTimes(2);
    expect(prismaMocks.cashMovementCreate).toHaveBeenCalledTimes(1);
    expect(result.balanceCents).toBe(75_000);
  });

  it('repete a transação quando existe disputa pela criação da conta geral', async () => {
    prismaMocks.cashAccountUpsert.mockRejectedValueOnce({
      code: 'P2002',
    });

    const repository = new PrismaCashRepository();

    const result = await repository.appendMovementForUser({
      userId: 'user-1',
      type: 'deposit',
      amountCents: 25_000,
      description: 'Primeiro aporte',
      occurredAt,
    });

    expect(prismaMocks.transaction).toHaveBeenCalledTimes(2);
    expect(prismaMocks.cashAccountUpsert).toHaveBeenCalledTimes(2);
    expect(prismaMocks.cashMovementCreate).toHaveBeenCalledTimes(1);
    expect(result.balanceCents).toBe(75_000);
  });

  it('interrompe as tentativas após conflitos de serialização repetidos', async () => {
    prismaMocks.transaction.mockRejectedValue({
      code: 'P2034',
    });

    const repository = new PrismaCashRepository();

    await expect(
      repository.appendMovementForUser({
        userId: 'user-1',
        type: 'deposit',
        amountCents: 25_000,
        description: 'Aporte',
        occurredAt,
      }),
    ).rejects.toMatchObject({
      code: 'CASH_CONCURRENCY_CONFLICT',
    });

    expect(prismaMocks.transaction).toHaveBeenCalledTimes(3);
    expect(prismaMocks.cashMovementCreate).not.toHaveBeenCalled();
  });
});
