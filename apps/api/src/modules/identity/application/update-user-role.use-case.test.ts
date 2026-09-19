import type { AdminUser, UserRole } from '@apexfinance/contracts';
import { describe, expect, it, vi } from 'vitest';

import { UpdateUserRoleUseCase, type UpdateUserRoleRepository } from './update-user-role.use-case';

function createUser(overrides: Partial<AdminUser> = {}): AdminUser {
  return {
    id: 'user-2',
    name: 'Usuário Teste',
    email: 'usuario@apexfinance.local',
    role: 'user',
    status: 'active',
    banReason: null,
    createdAt: '2026-09-19T18:00:00.000Z',
    ...overrides,
  };
}

function createRepository(): UpdateUserRoleRepository {
  return {
    findById: vi.fn(),
    updateRole: vi.fn(),
  };
}

describe('UpdateUserRoleUseCase', () => {
  it('promove USER para ADMIN', async () => {
    const repository = createRepository();

    vi.mocked(repository.findById).mockResolvedValue(
      createUser({
        id: 'user-2',
        role: 'user',
      }),
    );

    vi.mocked(repository.updateRole).mockResolvedValue(
      createUser({
        id: 'user-2',
        role: 'admin',
      }),
    );

    const useCase = new UpdateUserRoleUseCase(repository);

    const result = await useCase.execute({
      actor: {
        userId: 'admin-1',
        role: 'admin',
      },
      targetUserId: 'user-2',
      role: 'admin',
    });

    expect(repository.findById).toHaveBeenCalledWith('user-2');

    expect(repository.updateRole).toHaveBeenCalledWith('user-2', 'admin');

    expect(result.role).toBe('admin');
  });

  it('rebaixa outro ADMIN para USER', async () => {
    const repository = createRepository();

    vi.mocked(repository.findById).mockResolvedValue(
      createUser({
        id: 'admin-2',
        role: 'admin',
      }),
    );

    vi.mocked(repository.updateRole).mockResolvedValue(
      createUser({
        id: 'admin-2',
        role: 'user',
      }),
    );

    const useCase = new UpdateUserRoleUseCase(repository);

    const result = await useCase.execute({
      actor: {
        userId: 'admin-1',
        role: 'admin',
      },
      targetUserId: 'admin-2',
      role: 'user',
    });

    expect(repository.updateRole).toHaveBeenCalledWith('admin-2', 'user');

    expect(result.role).toBe('user');
  });

  it('rejeita alteração quando o usuário alvo não existe', async () => {
    const repository = createRepository();

    vi.mocked(repository.findById).mockResolvedValue(null);

    const useCase = new UpdateUserRoleUseCase(repository);

    await expect(
      useCase.execute({
        actor: {
          userId: 'admin-1',
          role: 'admin',
        },
        targetUserId: 'user-inexistente',
        role: 'admin',
      }),
    ).rejects.toMatchObject({
      code: 'USER_NOT_FOUND',
      message: 'Usuário não encontrado.',
    });

    expect(repository.updateRole).not.toHaveBeenCalled();
  });

  it('impede que o administrador remova o próprio papel', async () => {
    const repository = createRepository();

    vi.mocked(repository.findById).mockResolvedValue(
      createUser({
        id: 'admin-1',
        role: 'admin',
      }),
    );

    const useCase = new UpdateUserRoleUseCase(repository);

    await expect(
      useCase.execute({
        actor: {
          userId: 'admin-1',
          role: 'admin',
        },
        targetUserId: 'admin-1',
        role: 'user',
      }),
    ).rejects.toMatchObject({
      code: 'SELF_ROLE_CHANGE_NOT_ALLOWED',
      message: 'Você não pode remover seu próprio acesso administrativo.',
    });

    expect(repository.updateRole).not.toHaveBeenCalled();
  });

  it('não grava quando o usuário já possui o papel solicitado', async () => {
    const repository = createRepository();

    const existingUser = createUser({
      id: 'user-2',
      role: 'user',
    });

    vi.mocked(repository.findById).mockResolvedValue(existingUser);

    const useCase = new UpdateUserRoleUseCase(repository);

    const result = await useCase.execute({
      actor: {
        userId: 'admin-1',
        role: 'admin',
      },
      targetUserId: 'user-2',
      role: 'user',
    });

    expect(repository.updateRole).not.toHaveBeenCalled();

    expect(result).toEqual(existingUser);
  });

  it.each<UserRole>(['user', 'admin'])('aceita o papel válido %s', async (role) => {
    const repository = createRepository();

    const currentRole: UserRole = role === 'admin' ? 'user' : 'admin';

    vi.mocked(repository.findById).mockResolvedValue(
      createUser({
        id: 'user-2',
        role: currentRole,
      }),
    );

    vi.mocked(repository.updateRole).mockResolvedValue(
      createUser({
        id: 'user-2',
        role,
      }),
    );

    const useCase = new UpdateUserRoleUseCase(repository);

    const result = await useCase.execute({
      actor: {
        userId: 'admin-1',
        role: 'admin',
      },
      targetUserId: 'user-2',
      role,
    });

    expect(result.role).toBe(role);
  });
});
