import type {
  CashMovement,
  CashMovementType,
  CreateCashMovementResponse,
} from '@apexfinance/contracts';

import { CashMovementError } from '../application/cash-movement.error.js';
import { prisma } from '../../../shared/infrastructure/database/prisma.js';

type PrismaCashMovement = {
  id: string;
  type: 'DEPOSIT' | 'WITHDRAWAL';
  deltaCents: bigint;
  description: string;
  occurredAt: Date;
  createdAt: Date;
};

type AppendMovementForUserInput = {
  userId: string;
  type: CashMovementType;
  amountCents: number;
  description: string;
  occurredAt: Date;
};

const MAX_TRANSACTION_ATTEMPTS = 3;

const cashMovementSelect = {
  id: true,
  type: true,
  deltaCents: true,
  description: true,
  occurredAt: true,
  createdAt: true,
} as const;

function toSafeNumber(value: bigint): number {
  const convertedValue = Number(value);

  if (!Number.isSafeInteger(convertedValue)) {
    throw new Error('Cash amount exceeds the JavaScript safe integer range.');
  }

  return convertedValue;
}

function toPublicMovement(movement: PrismaCashMovement): CashMovement {
  return {
    id: movement.id,
    type: movement.type === 'DEPOSIT' ? 'deposit' : 'withdrawal',
    amountCents: Math.abs(toSafeNumber(movement.deltaCents)),
    description: movement.description,
    occurredAt: movement.occurredAt.toISOString(),
    createdAt: movement.createdAt.toISOString(),
  };
}

function isRetryablePrismaConflict(error: unknown): boolean {
  if (typeof error !== 'object' || error === null || !('code' in error)) {
    return false;
  }

  return error.code === 'P2034' || error.code === 'P2002';
}

export class PrismaCashRepository {
  async getBalanceForUser(userId: string): Promise<number> {
    const account = await prisma.cashAccount.findUnique({
      where: {
        userId_type: {
          userId,
          type: 'GENERAL',
        },
      },
      select: {
        id: true,
      },
    });

    if (!account) {
      return 0;
    }

    const aggregate = await prisma.cashMovement.aggregate({
      where: {
        cashAccountId: account.id,
      },
      _sum: {
        deltaCents: true,
      },
    });

    return toSafeNumber(aggregate._sum.deltaCents ?? 0n);
  }

  async listMovementsForUser(userId: string): Promise<CashMovement[]> {
    const account = await prisma.cashAccount.findUnique({
      where: {
        userId_type: {
          userId,
          type: 'GENERAL',
        },
      },
      select: {
        id: true,
      },
    });

    if (!account) {
      return [];
    }

    const movements = await prisma.cashMovement.findMany({
      where: {
        cashAccountId: account.id,
      },
      select: cashMovementSelect,
      orderBy: [
        {
          occurredAt: 'desc',
        },
        {
          createdAt: 'desc',
        },
      ],
    });

    return movements.map(toPublicMovement);
  }

  async appendMovementForUser(
    input: AppendMovementForUserInput,
  ): Promise<CreateCashMovementResponse> {
    for (let attempt = 0; attempt < MAX_TRANSACTION_ATTEMPTS; attempt++) {
      try {
        return await prisma.$transaction(
          async (transaction) => {
            const account = await transaction.cashAccount.upsert({
              where: {
                userId_type: {
                  userId: input.userId,
                  type: 'GENERAL',
                },
              },
              create: {
                userId: input.userId,
                type: 'GENERAL',
              },
              update: {},
              select: {
                id: true,
              },
            });

            const aggregate = await transaction.cashMovement.aggregate({
              where: {
                cashAccountId: account.id,
              },
              _sum: {
                deltaCents: true,
              },
            });

            const currentBalanceCents = aggregate._sum.deltaCents ?? 0n;

            const amountCents = BigInt(input.amountCents);

            const deltaCents = input.type === 'deposit' ? amountCents : -amountCents;

            const nextBalanceCents = currentBalanceCents + deltaCents;

            if (nextBalanceCents < 0n) {
              throw new CashMovementError(
                'INSUFFICIENT_CASH_BALANCE',
                'Saldo insuficiente para realizar esta saída.',
              );
            }

            const safeBalanceCents = toSafeNumber(nextBalanceCents);

            const movement = await transaction.cashMovement.create({
              data: {
                cashAccountId: account.id,
                type: input.type === 'deposit' ? 'DEPOSIT' : 'WITHDRAWAL',
                deltaCents,
                description: input.description,
                occurredAt: input.occurredAt,
              },
              select: cashMovementSelect,
            });

            return {
              movement: toPublicMovement(movement),
              balanceCents: safeBalanceCents,
            };
          },
          {
            isolationLevel: 'Serializable',
          },
        );
      } catch (error) {
        if (!isRetryablePrismaConflict(error)) {
          throw error;
        }

        if (attempt === MAX_TRANSACTION_ATTEMPTS - 1) {
          throw new CashMovementError(
            'CASH_CONCURRENCY_CONFLICT',
            'Não foi possível concluir a movimentação devido a operações simultâneas. Tente novamente.',
          );
        }
      }
    }

    throw new Error('Cash transaction finished without a result.');
  }
}
