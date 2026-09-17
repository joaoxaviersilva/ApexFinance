import { beforeEach, describe, expect, it, vi } from 'vitest';

const prismaMocks = vi.hoisted(() => ({
  accountFindFirst: vi.fn(),
  accountUpdate: vi.fn(),
  sessionDeleteMany: vi.fn(),
  transaction: vi.fn(),
}));

vi.mock('../../../shared/infrastructure/database/prisma.js', () => ({
  prisma: {
    account: {
      findFirst: prismaMocks.accountFindFirst,
    },

    $transaction: prismaMocks.transaction,
  },
}));

import { PrismaPasswordResetRepository } from './prisma-password-reset.repository';

describe('PrismaPasswordResetRepository', () => {
  beforeEach(() => {
    prismaMocks.accountFindFirst.mockReset();
    prismaMocks.accountUpdate.mockReset();
    prismaMocks.sessionDeleteMany.mockReset();
    prismaMocks.transaction.mockReset();

    prismaMocks.transaction.mockImplementation(
      async (
        callback: (transaction: {
          account: {
            update: typeof prismaMocks.accountUpdate;
          };
          session: {
            deleteMany: typeof prismaMocks.sessionDeleteMany;
          };
        }) => Promise<unknown>,
      ) =>
        callback({
          account: {
            update: prismaMocks.accountUpdate,
          },

          session: {
            deleteMany: prismaMocks.sessionDeleteMany,
          },
        }),
    );
  });

  it('localiza somente a conta de credencial pelo e-mail', async () => {
    prismaMocks.accountFindFirst.mockResolvedValue({
      id: 'account-1',
      userId: 'user-1',
    });

    const repository = new PrismaPasswordResetRepository();

    const account = await repository.findCredentialAccountByEmail('joao@example.com');

    expect(account).toEqual({
      accountId: 'account-1',
      userId: 'user-1',
    });

    expect(prismaMocks.accountFindFirst).toHaveBeenCalledWith({
      where: {
        providerId: 'credential',

        user: {
          email: 'joao@example.com',
        },
      },

      select: {
        id: true,
        userId: true,
      },
    });
  });

  it('atualiza a senha e revoga as sessões na mesma transação', async () => {
    const repository = new PrismaPasswordResetRepository();

    await repository.updatePasswordAndRevokeSessions({
      accountId: 'account-1',
      userId: 'user-1',
      passwordHash: 'hashed-password',
    });

    expect(prismaMocks.transaction).toHaveBeenCalledTimes(1);

    expect(prismaMocks.accountUpdate).toHaveBeenCalledWith({
      where: {
        id: 'account-1',
      },

      data: {
        password: 'hashed-password',
      },
    });

    expect(prismaMocks.sessionDeleteMany).toHaveBeenCalledWith({
      where: {
        userId: 'user-1',
      },
    });
  });
});
