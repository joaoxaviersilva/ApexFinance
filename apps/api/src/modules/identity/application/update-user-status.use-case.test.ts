import type { AdminUser } from '@apexfinance/contracts';
import { describe, expect, it, vi } from 'vitest';

import {
  UpdateUserStatusUseCase,
  type UpdateUserStatusRepository,
} from './update-user-status.use-case';

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

function createRepository(): UpdateUserStatusRepository {
  return {
    findById: vi.fn(),
    blockUser: vi.fn(),
    unblockUser: vi.fn(),
  };
}

describe('UpdateUserStatusUseCase', () => {
  it('bloqueia um usuário ativo com motivo', async () => {
    const repository = createRepository();

    vi.mocked(repository.findById).mockResolvedValue(
      createUser({
        id: 'user-2',
        status: 'active',
      }),
    );

    vi.mocked(repository.blockUser).mockResolvedValue(
      createUser({
        id: 'user-2',
        status: 'blocked',
        banReason: 'Acesso suspenso pelo administrador.',
      }),
    );

    const useCase = new UpdateUserStatusUseCase(repository);

    const result = await useCase.execute({
      actor: {
        userId: 'admin-1',
        role: 'admin',
      },
      targetUserId: 'user-2',
      status: 'blocked',
      reason: 'Acesso suspenso pelo administrador.',
    });

    expect(repository.findById).toHaveBeenCalledWith('user-2');

    expect(repository.blockUser).toHaveBeenCalledWith(
      'user-2',
      'Acesso suspenso pelo administrador.',
    );

    expect(repository.unblockUser).not.toHaveBeenCalled();

    expect(result).toEqual(
      expect.objectContaining({
        id: 'user-2',
        status: 'blocked',
        banReason: 'Acesso suspenso pelo administrador.',
      }),
    );
  });

  it('normaliza espaços do motivo antes de bloquear', async () => {
    const repository = createRepository();

    vi.mocked(repository.findById).mockResolvedValue(createUser());

    vi.mocked(repository.blockUser).mockResolvedValue(
      createUser({
        status: 'blocked',
        banReason: 'Motivo administrativo',
      }),
    );

    const useCase = new UpdateUserStatusUseCase(repository);

    await useCase.execute({
      actor: {
        userId: 'admin-1',
        role: 'admin',
      },
      targetUserId: 'user-2',
      status: 'blocked',
      reason: '   Motivo administrativo   ',
    });

    expect(repository.blockUser).toHaveBeenCalledWith('user-2', 'Motivo administrativo');
  });

  it('exige motivo para bloquear um usuário', async () => {
    const repository = createRepository();

    vi.mocked(repository.findById).mockResolvedValue(createUser());

    const useCase = new UpdateUserStatusUseCase(repository);

    await expect(
      useCase.execute({
        actor: {
          userId: 'admin-1',
          role: 'admin',
        },
        targetUserId: 'user-2',
        status: 'blocked',
        reason: '   ',
      }),
    ).rejects.toMatchObject({
      code: 'BLOCK_REASON_REQUIRED',
      message: 'Informe o motivo do bloqueio.',
    });

    expect(repository.blockUser).not.toHaveBeenCalled();
    expect(repository.unblockUser).not.toHaveBeenCalled();
  });

  it('desbloqueia um usuário bloqueado', async () => {
    const repository = createRepository();

    vi.mocked(repository.findById).mockResolvedValue(
      createUser({
        status: 'blocked',
        banReason: 'Motivo anterior',
      }),
    );

    vi.mocked(repository.unblockUser).mockResolvedValue(
      createUser({
        status: 'active',
        banReason: null,
      }),
    );

    const useCase = new UpdateUserStatusUseCase(repository);

    const result = await useCase.execute({
      actor: {
        userId: 'admin-1',
        role: 'admin',
      },
      targetUserId: 'user-2',
      status: 'active',
    });

    expect(repository.unblockUser).toHaveBeenCalledWith('user-2');

    expect(repository.blockUser).not.toHaveBeenCalled();

    expect(result).toEqual(
      expect.objectContaining({
        status: 'active',
        banReason: null,
      }),
    );
  });

  it('impede que o administrador bloqueie a própria conta', async () => {
    const repository = createRepository();

    vi.mocked(repository.findById).mockResolvedValue(
      createUser({
        id: 'admin-1',
        role: 'admin',
      }),
    );

    const useCase = new UpdateUserStatusUseCase(repository);

    await expect(
      useCase.execute({
        actor: {
          userId: 'admin-1',
          role: 'admin',
        },
        targetUserId: 'admin-1',
        status: 'blocked',
        reason: 'Teste',
      }),
    ).rejects.toMatchObject({
      code: 'SELF_BLOCK_NOT_ALLOWED',
      message: 'Você não pode bloquear sua própria conta.',
    });

    expect(repository.blockUser).not.toHaveBeenCalled();
    expect(repository.unblockUser).not.toHaveBeenCalled();
  });

  it('rejeita alteração quando o usuário alvo não existe', async () => {
    const repository = createRepository();

    vi.mocked(repository.findById).mockResolvedValue(null);

    const useCase = new UpdateUserStatusUseCase(repository);

    await expect(
      useCase.execute({
        actor: {
          userId: 'admin-1',
          role: 'admin',
        },
        targetUserId: 'user-inexistente',
        status: 'blocked',
        reason: 'Teste',
      }),
    ).rejects.toMatchObject({
      code: 'USER_NOT_FOUND',
      message: 'Usuário não encontrado.',
    });

    expect(repository.blockUser).not.toHaveBeenCalled();
    expect(repository.unblockUser).not.toHaveBeenCalled();
  });

  it('não grava novamente quando o usuário já está bloqueado', async () => {
    const repository = createRepository();

    const blockedUser = createUser({
      status: 'blocked',
      banReason: 'Motivo existente',
    });

    vi.mocked(repository.findById).mockResolvedValue(blockedUser);

    const useCase = new UpdateUserStatusUseCase(repository);

    const result = await useCase.execute({
      actor: {
        userId: 'admin-1',
        role: 'admin',
      },
      targetUserId: 'user-2',
      status: 'blocked',
      reason: 'Outro motivo',
    });

    expect(repository.blockUser).not.toHaveBeenCalled();
    expect(repository.unblockUser).not.toHaveBeenCalled();

    expect(result).toEqual(blockedUser);
  });

  it('não grava novamente quando o usuário já está ativo', async () => {
    const repository = createRepository();

    const activeUser = createUser({
      status: 'active',
    });

    vi.mocked(repository.findById).mockResolvedValue(activeUser);

    const useCase = new UpdateUserStatusUseCase(repository);

    const result = await useCase.execute({
      actor: {
        userId: 'admin-1',
        role: 'admin',
      },
      targetUserId: 'user-2',
      status: 'active',
    });

    expect(repository.blockUser).not.toHaveBeenCalled();
    expect(repository.unblockUser).not.toHaveBeenCalled();

    expect(result).toEqual(activeUser);
  });
});
