import type { HealthResponse } from '@apexfinance/contracts';
import cors from '@fastify/cors';
import Fastify from 'fastify';

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

  registerAuthRoutes(app);
  registerMeRoute(app);

  return app;
}