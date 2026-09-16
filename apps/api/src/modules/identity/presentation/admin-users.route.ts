import type { FastifyInstance } from 'fastify';

import type { ListUsersUseCase } from '../application/list-users.use-case.js';
import { requireAdmin } from './auth.guard.js';

export function registerAdminUsersRoute(
  app: FastifyInstance,
  listUsersUseCase: ListUsersUseCase,
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
}
