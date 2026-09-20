import type { AdminUser, AdminUserStatus } from '@apexfinance/contracts';

import type { AuthenticatedActor } from './authenticated-actor.js';

export interface UpdateUserStatusRepository {
  findById(userId: string): Promise<AdminUser | null>;

  blockUser(userId: string, reason: string): Promise<AdminUser>;

  unblockUser(userId: string): Promise<AdminUser>;
}

export interface UpdateUserStatusInput {
  actor: AuthenticatedActor;
  targetUserId: string;
  status: AdminUserStatus;
  reason?: string;
}

export type UpdateUserStatusErrorCode =
  'USER_NOT_FOUND' | 'BLOCK_REASON_REQUIRED' | 'SELF_BLOCK_NOT_ALLOWED';

export class UpdateUserStatusError extends Error {
  constructor(
    public readonly code: UpdateUserStatusErrorCode,
    message: string,
  ) {
    super(message);

    this.name = 'UpdateUserStatusError';
  }
}

export class UpdateUserStatusUseCase {
  constructor(private readonly repository: UpdateUserStatusRepository) {}

  async execute(input: UpdateUserStatusInput): Promise<AdminUser> {
    const targetUser = await this.repository.findById(input.targetUserId);

    if (!targetUser) {
      throw new UpdateUserStatusError('USER_NOT_FOUND', 'Usuário não encontrado.');
    }

    if (input.status === targetUser.status) {
      return targetUser;
    }

    if (input.status === 'blocked' && input.actor.userId === input.targetUserId) {
      throw new UpdateUserStatusError(
        'SELF_BLOCK_NOT_ALLOWED',
        'Você não pode bloquear sua própria conta.',
      );
    }

    if (input.status === 'blocked') {
      const reason = input.reason?.trim();

      if (!reason) {
        throw new UpdateUserStatusError('BLOCK_REASON_REQUIRED', 'Informe o motivo do bloqueio.');
      }

      return this.repository.blockUser(input.targetUserId, reason);
    }

    return this.repository.unblockUser(input.targetUserId);
  }
}
