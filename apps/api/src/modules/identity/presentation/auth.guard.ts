import type { FastifyReply, FastifyRequest } from 'fastify';
import { fromNodeHeaders } from 'better-auth/node';

import { auth } from '../infrastructure/auth.js';

export async function requireAuth(request: FastifyRequest, reply: FastifyReply): Promise<void> {
  const session = await auth.api.getSession({
    headers: fromNodeHeaders(request.headers),
  });

  if (!session) {
    await reply.status(401).send({
      error: 'Não autenticado.',
    });
  }
}

export async function requireAdmin(request: FastifyRequest, reply: FastifyReply): Promise<void> {
  const session = await auth.api.getSession({
    headers: fromNodeHeaders(request.headers),
  });

  if (!session) {
    await reply.status(401).send({
      error: 'Não autenticado.',
    });

    return;
  }

  if (session.user.role !== 'admin') {
    await reply.status(403).send({
      error: 'Acesso restrito a administradores.',
    });
  }
}
