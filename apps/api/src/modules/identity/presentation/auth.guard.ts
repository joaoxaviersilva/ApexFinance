import type { UserRole } from '@apexfinance/contracts';
import { fromNodeHeaders } from 'better-auth/node';
import type { FastifyReply, FastifyRequest } from 'fastify';

import {
  attachAuthenticatedActor,
  type AuthenticatedActor,
} from '../application/authenticated-actor.js';
import { auth } from '../infrastructure/auth.js';

function normalizeRole(role: string | null | undefined): UserRole {
  return role === 'admin' ? 'admin' : 'user';
}

async function authenticateRequest(
  request: FastifyRequest,
  reply: FastifyReply,
): Promise<AuthenticatedActor | null> {
  const session = await auth.api.getSession({
    headers: fromNodeHeaders(request.headers),
  });

  if (!session) {
    await reply.status(401).send({
      error: 'Não autenticado.',
    });

    return null;
  }

  const actor: AuthenticatedActor = {
    userId: session.user.id,
    role: normalizeRole(session.user.role),
  };

  attachAuthenticatedActor(request, actor);

  return actor;
}

export async function requireAuth(request: FastifyRequest, reply: FastifyReply): Promise<void> {
  await authenticateRequest(request, reply);
}

export async function requireAdmin(request: FastifyRequest, reply: FastifyReply): Promise<void> {
  const actor = await authenticateRequest(request, reply);

  if (!actor) {
    return;
  }

  if (actor.role !== 'admin') {
    await reply.status(403).send({
      error: 'Acesso restrito a administradores.',
    });
  }
}
