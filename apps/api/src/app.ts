import type { HealthResponse } from '@apexfinance/contracts';
import cors from '@fastify/cors';
import Fastify from 'fastify';

import { GetCashSummaryUseCase } from './modules/cash/application/get-cash-summary.use-case.js';
import { ListCashMovementsUseCase } from './modules/cash/application/list-cash-movements.use-case.js';
import { PrismaCashRepository } from './modules/cash/infrastructure/prisma-cash.repository.js';
import { registerCashRoutes } from './modules/cash/presentation/cash.route.js';
import { ListUsersUseCase } from './modules/identity/application/list-users.use-case.js';
import { UpdateUserRoleUseCase } from './modules/identity/application/update-user-role.use-case.js';
import { UpdateUserStatusUseCase } from './modules/identity/application/update-user-status.use-case.js';
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
    methods: ['GET', 'HEAD', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
  });

  app.get('/health', async (): Promise<HealthResponse> => {
    return {
      status: 'ok',
      service: 'apexfinance-api',
    };
  });

  const userRepository = new PrismaUserRepository();

  const listUsersUseCase = new ListUsersUseCase(userRepository);

  const updateUserRoleUseCase = new UpdateUserRoleUseCase(userRepository);

  const updateUserStatusUseCase = new UpdateUserStatusUseCase(userRepository);

  const cashRepository = new PrismaCashRepository();

  const getCashSummaryUseCase = new GetCashSummaryUseCase(cashRepository);

  const listCashMovementsUseCase = new ListCashMovementsUseCase(cashRepository);

  registerAuthRoutes(app);
  registerMeRoute(app);

  registerAdminUsersRoute(app, listUsersUseCase, updateUserRoleUseCase, updateUserStatusUseCase);

  registerCashRoutes(app, getCashSummaryUseCase, listCashMovementsUseCase);

  return app;
}
