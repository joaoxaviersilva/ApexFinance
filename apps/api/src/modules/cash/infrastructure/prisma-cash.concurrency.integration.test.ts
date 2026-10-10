import { randomUUID } from 'node:crypto';

import { afterEach, describe, expect, it } from 'vitest';

import { prisma } from '../../../shared/infrastructure/database/prisma.js';
import { PrismaCashRepository } from './prisma-cash.repository.js';

const createdUserIds: string[] = [];

async function createTestUser(): Promise<string> {
  const userId = randomUUID();

  await prisma.user.create({
    data: {
      id: userId,
      name: 'Teste de concorrência do caixa',
      email: `cash-concurrency-${userId}@apexfinance.local`,
      emailVerified: false,
    },
  });

  createdUserIds.push(userId);

  return userId;
}

describe('PrismaCashRepository - concorrência real PostgreSQL', () => {
  afterEach(async () => {
    if (createdUserIds.length === 0) {
      return;
    }

    await prisma.user.deleteMany({
      where: {
        id: {
          in: createdUserIds,
        },
      },
    });

    createdUserIds.length = 0;
  });

  it('impede que duas saídas simultâneas deixem o saldo negativo', async () => {
    const userId = await createTestUser();
    const repository = new PrismaCashRepository();
    const occurredAt = new Date('2026-09-23T12:00:00.000Z');

    const deposit = await repository.appendMovementForUser({
      userId,
      type: 'deposit',
      amountCents: 10_000,
      description: 'Saldo inicial',
      occurredAt,
    });

    expect(deposit.balanceCents).toBe(10_000);

    const results = await Promise.allSettled([
      repository.appendMovementForUser({
        userId,
        type: 'withdrawal',
        amountCents: 8_000,
        description: 'Primeira saída concorrente',
        occurredAt,
      }),
      repository.appendMovementForUser({
        userId,
        type: 'withdrawal',
        amountCents: 8_000,
        description: 'Segunda saída concorrente',
        occurredAt,
      }),
    ]);

    const completed = results.filter((result) => result.status === 'fulfilled');

    const rejected = results.filter((result) => result.status === 'rejected');

    expect(completed).toHaveLength(1);
    expect(rejected).toHaveLength(1);

    expect(completed[0]?.value.balanceCents).toBe(2_000);

    expect(rejected[0]?.reason).toMatchObject({
      code: expect.stringMatching(/^(INSUFFICIENT_CASH_BALANCE|CASH_CONCURRENCY_CONFLICT)$/),
    });

    const finalBalance = await repository.getBalanceForUser(userId);

    expect(finalBalance).toBe(2_000);

    const movements = await repository.listMovementsForUser(userId);

    expect(movements).toHaveLength(2);

    expect(movements.filter((movement) => movement.type === 'deposit')).toHaveLength(1);

    expect(movements.filter((movement) => movement.type === 'withdrawal')).toHaveLength(1);

    const ledgerBalance = movements.reduce(
      (total, movement) =>
        total + (movement.type === 'deposit' ? movement.amountCents : -movement.amountCents),
      0,
    );

    expect(ledgerBalance).toBe(2_000);
  }, 20_000);

  it('mantém uma única conta geral quando duas entradas são simultâneas', async () => {
    const userId = await createTestUser();
    const repository = new PrismaCashRepository();
    const occurredAt = new Date('2026-09-23T12:00:00.000Z');

    const [firstResult, secondResult] = await Promise.all([
      repository.appendMovementForUser({
        userId,
        type: 'deposit',
        amountCents: 1_200,
        description: 'Primeiro depósito',
        occurredAt,
      }),
      repository.appendMovementForUser({
        userId,
        type: 'deposit',
        amountCents: 2_000,
        description: 'Segundo depósito',
        occurredAt,
      }),
    ]);

    expect(firstResult.movement).toMatchObject({
      type: 'deposit',
      amountCents: 1_200,
      description: 'Primeiro depósito',
    });

    expect(secondResult.movement).toMatchObject({
      type: 'deposit',
      amountCents: 2_000,
      description: 'Segundo depósito',
    });

    // O PostgreSQL pode concluir qualquer um dos dois depósitos primeiro.
    // Ambas as sequências são válidas, desde que o saldo final seja 3.200.
    expect([
      [1_200, 3_200],
      [3_200, 2_000],
    ]).toContainEqual([firstResult.balanceCents, secondResult.balanceCents]);

    const accountCount = await prisma.cashAccount.count({
      where: {
        userId,
        type: 'GENERAL',
      },
    });

    expect(accountCount).toBe(1);

    const finalBalance = await repository.getBalanceForUser(userId);

    expect(finalBalance).toBe(3_200);

    const movements = await repository.listMovementsForUser(userId);

    expect(movements).toHaveLength(2);

    expect(
      movements.map((movement) => movement.amountCents).sort((first, second) => first - second),
    ).toEqual([1_200, 2_000]);

    const ledgerBalance = movements.reduce(
      (total, movement) =>
        total + (movement.type === 'deposit' ? movement.amountCents : -movement.amountCents),
      0,
    );

    expect(ledgerBalance).toBe(3_200);
  }, 20_000);
});
