import type { HealthResponse } from '@apexfinance/contracts';
import cors from '@fastify/cors';
import Fastify from 'fastify';

import { ListUsersUseCase } from './modules/identity/application/list-users.use-case.js';
import { PrismaUserRepository } from './modules/identity/infrastructure/prisma-user.repository.js';
import { registerAdminUsersRoute } from './modules/identity/presentation/admin-users.route.js';
import { registerAuthRoutes } from './modules/identity/presentation/auth.route.js';
import { registerMeRoute } from './modules/identity/presentation/me.route.js';
import { getRequiredEnv } from './shared/infrastructure/environment.js';

export function buildApp() {
  const app = Fastify({
    logger: true,
  });

  app.register(cors, {
    origin: getRequiredEnv('WEB_ORIGIN'),
    credentials: true,
  });

  app.get('/health', async (): Promise<HealthResponse> => {
    return {
      status: 'ok',
      service: 'apexfinance-api',
    };
  });

  const userRepository = new PrismaUserRepository();
  const listUsersUseCase = new ListUsersUseCase(userRepository);

  registerAuthRoutes(app);
  registerMeRoute(app);
  registerAdminUsersRoute(app, listUsersUseCase);

  return app;
}
