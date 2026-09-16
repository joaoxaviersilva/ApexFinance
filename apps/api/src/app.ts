import type { HealthResponse } from '@apexfinance/contracts';
import Fastify from 'fastify';

export function buildApp() {
  const app = Fastify({
    logger: true,
  });

  app.get('/health', async (): Promise<HealthResponse> => {
    return {
      status: 'ok',
      service: 'apexfinance-api',
    };
  });

  return app;
}
