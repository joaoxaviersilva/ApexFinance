import type { AdminUser, UserRole } from '@apexfinance/contracts';

import type { AuthenticatedActor } from './authenticated-actor.js';

export interface UpdateUserRoleRepository {
  findById(userId: string): Promise<AdminUser | null>;

  updateRole(userId: string, role: UserRole): Promise<AdminUser>;
}

export interface UpdateUserRoleInput {
  actor: AuthenticatedActor;
  targetUserId: string;
  role: UserRole;
}

export type UpdateUserRoleErrorCode = 'USER_NOT_FOUND' | 'SELF_ROLE_CHANGE_NOT_ALLOWED';

export class UpdateUserRoleError extends Error {
  constructor(
    public readonly code: UpdateUserRoleErrorCode,
    message: string,
  ) {
    super(message);

    this.name = 'UpdateUserRoleError';
  }
}

export class UpdateUserRoleUseCase {
  constructor(private readonly repository: UpdateUserRoleRepository) {}

  async execute(input: UpdateUserRoleInput): Promise<AdminUser> {
    const targetUser = await this.repository.findById(input.targetUserId);

    if (!targetUser) {
      throw new UpdateUserRoleError('USER_NOT_FOUND', 'Usuário não encontrado.');
    }

    const isRemovingOwnAdminRole =
      input.actor.userId === input.targetUserId &&
      targetUser.role === 'admin' &&
      input.role === 'user';

    if (isRemovingOwnAdminRole) {
      throw new UpdateUserRoleError(
        'SELF_ROLE_CHANGE_NOT_ALLOWED',
        'Você não pode remover seu próprio acesso administrativo.',
      );
    }

    if (targetUser.role === input.role) {
      return targetUser;
    }

    return this.repository.updateRole(input.targetUserId, input.role);
  }
}
