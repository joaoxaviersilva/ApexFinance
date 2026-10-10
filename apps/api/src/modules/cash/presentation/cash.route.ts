import type { FastifyInstance } from 'fastify';
import { z } from 'zod';

import { getAuthenticatedActor } from '../../identity/application/authenticated-actor.js';
import { requireAuth } from '../../identity/presentation/auth.guard.js';
import { CashMovementError } from '../application/cash-movement.error.js';
import type { CreateCashMovementUseCase } from '../application/create-cash-movement.use-case.js';
import type { GetCashSummaryUseCase } from '../application/get-cash-summary.use-case.js';
import type { ListCashMovementsUseCase } from '../application/list-cash-movements.use-case.js';

const createCashMovementBodySchema = z.object({
  type: z.enum(['deposit', 'withdrawal']),

  amountCents: z.number().int().positive().max(Number.MAX_SAFE_INTEGER),

  description: z.string().trim().min(1).max(160),

  occurredAt: z.iso.datetime({ offset: true }).optional(),
});

export function registerCashRoutes(
  app: FastifyInstance,
  getCashSummaryUseCase: GetCashSummaryUseCase,
  listCashMovementsUseCase: ListCashMovementsUseCase,
  createCashMovementUseCase: CreateCashMovementUseCase,
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

  app.post(
    '/api/cash/movements',
    {
      preHandler: requireAuth,
    },
    async (request, reply) => {
      const bodyResult = createCashMovementBodySchema.safeParse(request.body);

      if (!bodyResult.success) {
        return reply.status(422).send({
          code: 'INVALID_CASH_MOVEMENT',
          error: 'Dados da movimentação inválidos.',
        });
      }

      const actor = getAuthenticatedActor(request);

      try {
        const result = await createCashMovementUseCase.execute({
          userId: actor.userId,
          type: bodyResult.data.type,
          amountCents: bodyResult.data.amountCents,
          description: bodyResult.data.description,
          occurredAt: bodyResult.data.occurredAt,
        });

        return reply.status(201).send(result);
      } catch (error) {
        if (error instanceof CashMovementError) {
          return reply.status(409).send({
            code: error.code,
            error: error.message,
          });
        }

        throw error;
      }
    },
  );
}
