import type { FastifyInstance } from 'fastify';
import { fromNodeHeaders } from 'better-auth/node';

import { auth } from '../infrastructure/auth.js';

export function registerAuthRoutes(app: FastifyInstance): void {
  app.route({
    method: ['GET', 'POST'],
    url: '/api/auth/*',

    async handler(request, reply) {
      const url = new URL(request.url, `http://${request.headers.host}`);

      const headers = fromNodeHeaders(request.headers);

      const authRequest = new Request(url.toString(), {
        method: request.method,
        headers,
        ...(request.body
          ? {
              body: JSON.stringify(request.body),
            }
          : {}),
      });

      const response = await auth.handler(authRequest);

      reply.status(response.status);

      response.headers.forEach((value, key) => {
        reply.header(key, value);
      });

      return reply.send(response.body ? await response.text() : null);
    },
  });
}