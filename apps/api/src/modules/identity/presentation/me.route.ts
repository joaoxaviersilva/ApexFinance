import type { FastifyInstance } from 'fastify';
import { fromNodeHeaders } from 'better-auth/node';

import { auth } from '../infrastructure/auth.js';

export function registerMeRoute(app: FastifyInstance): void {
  app.get('/api/me', async (request, reply) => {
    const session = await auth.api.getSession({
      headers: fromNodeHeaders(request.headers),
    });

    if (!session) {
      return reply.status(401).send({
        error: 'Não autenticado.',
      });
    }

    return reply.send(session);
  });
}