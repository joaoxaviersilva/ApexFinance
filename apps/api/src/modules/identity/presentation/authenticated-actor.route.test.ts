import Fastify, { type FastifyInstance, type FastifyRequest } from 'fastify';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

const authMocks = vi.hoisted(() => ({
  getSession: vi.fn(),
}));

vi.mock('../infrastructure/auth.js', () => ({
  auth: {
    api: {
      getSession: authMocks.getSession,
    },
  },
}));

import { ListUsersUseCase } from '../application/list-users.use-case.js';
import { UpdateUserRoleUseCase } from '../application/update-user-role.use-case.js';
import { UpdateUserStatusUseCase } from '../application/update-user-status.use-case.js';
import { registerAdminUsersRoute } from './admin-users.route.js';
import { requireAuth } from './auth.guard.js';

type RequestWithActor = FastifyRequest & {
  authenticatedActor?: {
    userId: string;
    role: 'user' | 'admin';
  };
};

function createAdminUser() {
  return {
    id: 'admin-session',
    name: 'Administrador',
    email: 'admin@apexfinance.local',
    role: 'admin' as const,
    status: 'active' as const,
    banReason: null,
    createdAt: '2026-09-19T18:00:00.000Z',
  };
}

function createRepository() {
  return {
    listUsers: vi.fn().mockResolvedValue([]),
    findById: vi.fn(),
    updateRole: vi.fn(),
    blockUser: vi.fn(),
    unblockUser: vi.fn(),
  };
}

describe('AuthenticatedActor', () => {
  let app: FastifyInstance | undefined;

  beforeEach(() => {
    authMocks.getSession.mockReset();
  });

  afterEach(async () => {
    await app?.close();

    app = undefined;
  });

  it('requireAuth deriva o ator diretamente da sessão autenticada', async () => {
    authMocks.getSession.mockResolvedValue({
      user: {
        id: 'user-session',
        role: 'user',
      },
    });

    app = Fastify();

    app.get(
      '/protected',
      {
        preHandler: requireAuth,
      },
      async (request) => {
        const authenticatedRequest = request as RequestWithActor;

        return {
          actor: authenticatedRequest.authenticatedActor ?? null,
        };
      },
    );

    const response = await app.inject({
      method: 'GET',
      url: '/protected',
      headers: {
        cookie: 'session=valor-qualquer',
      },
    });

    expect(response.statusCode).toBe(200);

    expect(response.json()).toEqual({
      actor: {
        userId: 'user-session',
        role: 'user',
      },
    });

    expect(authMocks.getSession).toHaveBeenCalledTimes(1);
  });

  it('auto-rebaixamento usa o ator real da sessão e consulta a sessão somente uma vez', async () => {
    authMocks.getSession.mockResolvedValue({
      user: {
        id: 'admin-session',
        role: 'admin',
      },
    });

    const repository = createRepository();

    repository.findById.mockResolvedValue(createAdminUser());

    const listUsersUseCase = new ListUsersUseCase(repository);

    const updateUserRoleUseCase = new UpdateUserRoleUseCase(repository);

    const updateUserStatusUseCase = new UpdateUserStatusUseCase(repository);

    app = Fastify();

    registerAdminUsersRoute(app, listUsersUseCase, updateUserRoleUseCase, updateUserStatusUseCase);

    const response = await app.inject({
      method: 'PATCH',
      url: '/api/admin/users/admin-session/role',
      headers: {
        cookie: 'session=valor-qualquer',
        'content-type': 'application/json',
      },
      payload: {
        role: 'user',

        actor: {
          userId: 'usuario-forjado',
          role: 'admin',
        },

        actorUserId: 'usuario-forjado',
      },
    });

    expect(response.statusCode).toBe(409);

    expect(response.json()).toEqual({
      code: 'SELF_ROLE_CHANGE_NOT_ALLOWED',
      error: 'Você não pode remover seu próprio acesso administrativo.',
    });

    expect(repository.updateRole).not.toHaveBeenCalled();

    expect(authMocks.getSession).toHaveBeenCalledTimes(1);
  });

  it('auto-bloqueio usa o ator real da sessão e ignora identidade forjada no payload', async () => {
    authMocks.getSession.mockResolvedValue({
      user: {
        id: 'admin-session',
        role: 'admin',
      },
    });

    const repository = createRepository();

    repository.findById.mockResolvedValue(createAdminUser());

    const listUsersUseCase = new ListUsersUseCase(repository);

    const updateUserRoleUseCase = new UpdateUserRoleUseCase(repository);

    const updateUserStatusUseCase = new UpdateUserStatusUseCase(repository);

    app = Fastify();

    registerAdminUsersRoute(app, listUsersUseCase, updateUserRoleUseCase, updateUserStatusUseCase);

    const response = await app.inject({
      method: 'PATCH',
      url: '/api/admin/users/admin-session/status',
      headers: {
        cookie: 'session=valor-qualquer',
        'content-type': 'application/json',
      },
      payload: {
        status: 'blocked',
        reason: 'Tentativa de contornar proteção',

        actor: {
          userId: 'usuario-forjado',
          role: 'admin',
        },

        userId: 'usuario-forjado',
      },
    });

    expect(response.statusCode).toBe(409);

    expect(response.json()).toEqual({
      code: 'SELF_BLOCK_NOT_ALLOWED',
      error: 'Você não pode bloquear sua própria conta.',
    });

    expect(repository.blockUser).not.toHaveBeenCalled();

    expect(authMocks.getSession).toHaveBeenCalledTimes(1);
  });
});
