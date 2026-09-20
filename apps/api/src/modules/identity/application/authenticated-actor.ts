import type { UserRole } from '@apexfinance/contracts';
import type { FastifyRequest } from 'fastify';

export interface AuthenticatedActor {
  userId: string;
  role: UserRole;
}

export type RequestWithAuthenticatedActor = FastifyRequest & {
  authenticatedActor?: AuthenticatedActor;
};

export function attachAuthenticatedActor(request: FastifyRequest, actor: AuthenticatedActor): void {
  const authenticatedRequest = request as RequestWithAuthenticatedActor;

  authenticatedRequest.authenticatedActor = actor;
}

export function getAuthenticatedActor(request: FastifyRequest): AuthenticatedActor {
  const authenticatedRequest = request as RequestWithAuthenticatedActor;

  if (!authenticatedRequest.authenticatedActor) {
    throw new Error('Authenticated actor is not available on request.');
  }

  return authenticatedRequest.authenticatedActor;
}
