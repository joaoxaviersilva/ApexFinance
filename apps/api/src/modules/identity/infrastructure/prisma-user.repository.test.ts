import { beforeEach, describe, expect, it, vi } from 'vitest';

const prismaMocks = vi.hoisted(() => ({
  userUpdate: vi.fn(),
  sessionDeleteMany: vi.fn(),
  transaction: vi.fn(),
}));

vi.mock('../../../shared/infrastructure/database/prisma.js', () => ({
  prisma: {
    user: {
      update: prismaMocks.userUpdate,
    },

    $transaction: prismaMocks.transaction,
  },
}));

import { PrismaUserRepository } from './prisma-user.repository';

const adminUserSelect = {
  id: true,
  name: true,
  email: true,
  role: true,
  banned: true,
  banReason: true,
  createdAt: true,
};

function createPrismaUser(overrides: Record<string, unknown> = {}) {
  return {
    id: 'user-1',
    name: 'Usuário Teste',
    email: 'usuario@apexfinance.local',
    role: 'user',
    banned: false,
    banReason: null,
    createdAt: new Date('2026-09-19T18:00:00.000Z'),
    ...overrides,
  };
}

describe('PrismaUserRepository', () => {
  beforeEach(() => {
    prismaMocks.userUpdate.mockReset();
    prismaMocks.sessionDeleteMany.mockReset();
    prismaMocks.transaction.mockReset();

    prismaMocks.transaction.mockImplementation(
      async (
        callback: (transaction: {
          user: {
            update: typeof prismaMocks.userUpdate;
          };
          session: {
            deleteMany: typeof prismaMocks.sessionDeleteMany;
          };
        }) => Promise<unknown>,
      ) =>
        callback({
          user: {
            update: prismaMocks.userUpdate,
          },

          session: {
            deleteMany: prismaMocks.sessionDeleteMany,
          },
        }),
    );
  });

  it('bloqueia o usuário e revoga suas sessões na mesma transação', async () => {
    prismaMocks.userUpdate.mockResolvedValue(
      createPrismaUser({
        banned: true,
        banReason: 'Acesso suspenso pelo administrador.',
      }),
    );

    const repository = new PrismaUserRepository();

    const result = await repository.blockUser('user-1', 'Acesso suspenso pelo administrador.');

    expect(prismaMocks.transaction).toHaveBeenCalledTimes(1);

    expect(prismaMocks.userUpdate).toHaveBeenCalledWith({
      where: {
        id: 'user-1',
      },
      data: {
        banned: true,
        banReason: 'Acesso suspenso pelo administrador.',
        banExpires: null,
      },
      select: adminUserSelect,
    });

    expect(prismaMocks.sessionDeleteMany).toHaveBeenCalledWith({
      where: {
        userId: 'user-1',
      },
    });

    expect(result).toEqual({
      id: 'user-1',
      name: 'Usuário Teste',
      email: 'usuario@apexfinance.local',
      role: 'user',
      status: 'blocked',
      banReason: 'Acesso suspenso pelo administrador.',
      createdAt: '2026-09-19T18:00:00.000Z',
    });
  });

  it('desbloqueia o usuário e limpa os dados de bloqueio', async () => {
    prismaMocks.userUpdate.mockResolvedValue(
      createPrismaUser({
        banned: false,
        banReason: null,
      }),
    );

    const repository = new PrismaUserRepository();

    const result = await repository.unblockUser('user-1');

    expect(prismaMocks.userUpdate).toHaveBeenCalledWith({
      where: {
        id: 'user-1',
      },
      data: {
        banned: false,
        banReason: null,
        banExpires: null,
      },
      select: adminUserSelect,
    });

    expect(prismaMocks.transaction).not.toHaveBeenCalled();

    expect(prismaMocks.sessionDeleteMany).not.toHaveBeenCalled();

    expect(result).toEqual({
      id: 'user-1',
      name: 'Usuário Teste',
      email: 'usuario@apexfinance.local',
      role: 'user',
      status: 'active',
      banReason: null,
      createdAt: '2026-09-19T18:00:00.000Z',
    });
  });
});
