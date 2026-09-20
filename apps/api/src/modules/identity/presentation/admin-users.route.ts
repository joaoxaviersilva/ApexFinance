import type { AdminUserStatus, UserRole } from '@apexfinance/contracts';
import { fromNodeHeaders } from 'better-auth/node';
import type { FastifyInstance, FastifyReply, FastifyRequest } from 'fastify';
import { z } from 'zod';

import type { ListUsersUseCase } from '../application/list-users.use-case.js';
import {
  UpdateUserRoleError,
  type UpdateUserRoleUseCase,
} from '../application/update-user-role.use-case.js';
import {
  UpdateUserStatusError,
  type UpdateUserStatusUseCase,
} from '../application/update-user-status.use-case.js';
import { auth } from '../infrastructure/auth.js';
import { requireAdmin } from './auth.guard.js';

const userParamsSchema = z.object({
  userId: z.string().min(1),
});

const updateUserRoleBodySchema = z.object({
  role: z.enum(['user', 'admin']),
});

const updateUserStatusBodySchema = z.object({
  status: z.enum(['active', 'blocked']),
  reason: z.string().optional(),
});

type UserParams = {
  userId: string;
};

type UpdateUserRoleBody = {
  role: UserRole;
};

type UpdateUserStatusBody = {
  status: AdminUserStatus;
  reason?: string;
};

async function getAuthenticatedAdmin(request: FastifyRequest, reply: FastifyReply) {
  const session = await auth.api.getSession({
    headers: fromNodeHeaders(request.headers),
  });

  if (!session) {
    await reply.status(401).send({
      error: 'Não autenticado.',
    });

    return null;
  }

  if (session.user.role !== 'admin') {
    await reply.status(403).send({
      error: 'Acesso restrito a administradores.',
    });

    return null;
  }

  return {
    userId: session.user.id,
    role: 'admin' as const,
  };
}

export function registerAdminUsersRoute(
  app: FastifyInstance,
  listUsersUseCase: ListUsersUseCase,
  updateUserRoleUseCase: UpdateUserRoleUseCase,
  updateUserStatusUseCase: UpdateUserStatusUseCase,
): void {
  app.get(
    '/api/admin/users',
    {
      preHandler: requireAdmin,
    },
    async () => {
      const users = await listUsersUseCase.execute();

      return {
        users,
      };
    },
  );

  app.patch<{
    Params: UserParams;
    Body: UpdateUserRoleBody;
  }>(
    '/api/admin/users/:userId/role',
    {
      preHandler: requireAdmin,
    },
    async (request, reply) => {
      const paramsResult = userParamsSchema.safeParse(request.params);

      if (!paramsResult.success) {
        return reply.status(422).send({
          code: 'INVALID_USER_ID',
          error: 'Identificador de usuário inválido.',
        });
      }

      const bodyResult = updateUserRoleBodySchema.safeParse(request.body);

      if (!bodyResult.success) {
        return reply.status(422).send({
          code: 'INVALID_ROLE',
          error: 'Papel de usuário inválido.',
        });
      }

      const actor = await getAuthenticatedAdmin(request, reply);

      if (!actor) {
        return;
      }

      try {
        const user = await updateUserRoleUseCase.execute({
          actor,
          targetUserId: paramsResult.data.userId,
          role: bodyResult.data.role,
        });

        return reply.status(200).send({
          user,
        });
      } catch (error) {
        if (error instanceof UpdateUserRoleError) {
          if (error.code === 'USER_NOT_FOUND') {
            return reply.status(404).send({
              code: error.code,
              error: error.message,
            });
          }

          if (error.code === 'SELF_ROLE_CHANGE_NOT_ALLOWED') {
            return reply.status(409).send({
              code: error.code,
              error: error.message,
            });
          }
        }

        throw error;
      }
    },
  );

  app.patch<{
    Params: UserParams;
    Body: UpdateUserStatusBody;
  }>(
    '/api/admin/users/:userId/status',
    {
      preHandler: requireAdmin,
    },
    async (request, reply) => {
      const paramsResult = userParamsSchema.safeParse(request.params);

      if (!paramsResult.success) {
        return reply.status(422).send({
          code: 'INVALID_USER_ID',
          error: 'Identificador de usuário inválido.',
        });
      }

      const bodyResult = updateUserStatusBodySchema.safeParse(request.body);

      if (!bodyResult.success) {
        return reply.status(422).send({
          code: 'INVALID_STATUS',
          error: 'Status de usuário inválido.',
        });
      }

      const actor = await getAuthenticatedAdmin(request, reply);

      if (!actor) {
        return;
      }

      try {
        const user = await updateUserStatusUseCase.execute({
          actor,
          targetUserId: paramsResult.data.userId,
          status: bodyResult.data.status,
          reason: bodyResult.data.reason,
        });

        return reply.status(200).send({
          user,
        });
      } catch (error) {
        if (error instanceof UpdateUserStatusError) {
          if (error.code === 'USER_NOT_FOUND') {
            return reply.status(404).send({
              code: error.code,
              error: error.message,
            });
          }

          if (error.code === 'BLOCK_REASON_REQUIRED') {
            return reply.status(422).send({
              code: error.code,
              error: error.message,
            });
          }

          if (error.code === 'SELF_BLOCK_NOT_ALLOWED') {
            return reply.status(409).send({
              code: error.code,
              error: error.message,
            });
          }
        }

        throw error;
      }
    },
  );
}
