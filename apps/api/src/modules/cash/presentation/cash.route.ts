import type { FastifyInstance } from 'fastify';

import { getAuthenticatedActor } from '../../identity/application/authenticated-actor.js';
import { requireAuth } from '../../identity/presentation/auth.guard.js';
import type { GetCashSummaryUseCase } from '../application/get-cash-summary.use-case.js';
import type { ListCashMovementsUseCase } from '../application/list-cash-movements.use-case.js';

export function registerCashRoutes(
  app: FastifyInstance,
  getCashSummaryUseCase: GetCashSummaryUseCase,
  listCashMovementsUseCase: ListCashMovementsUseCase,
): void {
  app.get(
    '/api/cash/summary',
    {
      preHandler: requireAuth,
    },
    async (request, reply) => {
      const actor = getAuthenticatedActor(request);

      const summary = await getCashSummaryUseCase.execute(actor.userId);

      return reply.status(200).send(summary);
    },
  );

  app.get(
    '/api/cash/movements',
    {
      preHandler: requireAuth,
    },
    async (request, reply) => {
      const actor = getAuthenticatedActor(request);

      const result = await listCashMovementsUseCase.execute(actor.userId);

      return reply.status(200).send(result);
    },
  );
}
