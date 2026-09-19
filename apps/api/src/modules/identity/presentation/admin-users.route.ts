import type { UserRole } from '@apexfinance/contracts';
import { fromNodeHeaders } from 'better-auth/node';
import type { FastifyInstance, FastifyReply, FastifyRequest } from 'fastify';
import { z } from 'zod';

import type { ListUsersUseCase } from '../application/list-users.use-case.js';
import {
  UpdateUserRoleError,
  type UpdateUserRoleUseCase,
} from '../application/update-user-role.use-case.js';
import { auth } from '../infrastructure/auth.js';
import { requireAdmin } from './auth.guard.js';

const updateUserRoleParamsSchema = z.object({
  userId: z.string().min(1),
});

const updateUserRoleBodySchema = z.object({
  role: z.enum(['user', 'admin']),
});

type UpdateUserRoleParams = {
  userId: string;
};

type UpdateUserRoleBody = {
  role: UserRole;
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
    Params: UpdateUserRoleParams;
    Body: UpdateUserRoleBody;
  }>(
    '/api/admin/users/:userId/role',
    {
      preHandler: requireAdmin,
    },
    async (request, reply) => {
      const paramsResult = updateUserRoleParamsSchema.safeParse(request.params);

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
}
