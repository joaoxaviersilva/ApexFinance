import crypto from 'node:crypto';

import type { FastifyInstance } from 'fastify';
import { afterEach, describe, expect, it } from 'vitest';

import { buildApp } from '../../../app.js';
import { prisma } from '../../../shared/infrastructure/database/prisma.js';

async function createAuthenticatedUser(app: FastifyInstance, role: 'user' | 'admin') {
  const email = `${role}-${crypto.randomUUID()}@apexfinance.local`;

  const signUpResponse = await app.inject({
    method: 'POST',
    url: '/api/auth/sign-up/email',
    headers: {
      'content-type': 'application/json',
    },
    payload: {
      name: role === 'admin' ? 'Administrador de Teste' : 'Usuário de Teste',
      email,
      password: 'senha-segura-123',
    },
  });

  expect(signUpResponse.statusCode).toBe(200);

  const setCookie = signUpResponse.headers['set-cookie'];

  expect(setCookie).toBeDefined();

  const cookie = Array.isArray(setCookie)
    ? setCookie.map((value) => value.split(';')[0]).join('; ')
    : setCookie!.split(';')[0];

  const user = await prisma.user.update({
    where: {
      email,
    },
    data: {
      role,
    },
  });

  return {
    cookie,
    email,
    user,
  };
}

async function createTargetUser(status: 'active' | 'blocked' = 'active') {
  const email = `target-${crypto.randomUUID()}@apexfinance.local`;

  const user = await prisma.user.create({
    data: {
      id: crypto.randomUUID(),
      name: 'Usuário Alvo',
      email,
      emailVerified: false,
      role: 'user',
      banned: status === 'blocked',
      banReason: status === 'blocked' ? 'Bloqueio anterior' : null,
      banExpires: null,
    },
  });

  return {
    email,
    user,
  };
}

describe('PATCH /api/admin/users/:userId/status', () => {
  let app: FastifyInstance | undefined;

  const emailsToDelete: string[] = [];

  afterEach(async () => {
    await app?.close();

    app = undefined;

    if (emailsToDelete.length > 0) {
      await prisma.user.deleteMany({
        where: {
          email: {
            in: emailsToDelete,
          },
        },
      });

      emailsToDelete.length = 0;
    }
  });

  it('retorna 401 quando não existe sessão autenticada', async () => {
    app = buildApp();

    const response = await app.inject({
      method: 'PATCH',
      url: `/api/admin/users/${crypto.randomUUID()}/status`,
      headers: {
        'content-type': 'application/json',
      },
      payload: {
        status: 'blocked',
        reason: 'Teste administrativo',
      },
    });

    expect(response.statusCode).toBe(401);

    expect(response.json()).toEqual({
      error: 'Não autenticado.',
    });
  });

  it('retorna 403 para usuário comum', async () => {
    app = buildApp();

    const authenticatedUser = await createAuthenticatedUser(app, 'user');

    emailsToDelete.push(authenticatedUser.email);

    const response = await app.inject({
      method: 'PATCH',
      url: `/api/admin/users/${crypto.randomUUID()}/status`,
      headers: {
        cookie: authenticatedUser.cookie,
        'content-type': 'application/json',
      },
      payload: {
        status: 'blocked',
        reason: 'Teste administrativo',
      },
    });

    expect(response.statusCode).toBe(403);

    expect(response.json()).toEqual({
      error: 'Acesso restrito a administradores.',
    });
  });

  it('bloqueia o usuário e revoga sua sessão existente', async () => {
    app = buildApp();

    const authenticatedAdmin = await createAuthenticatedUser(app, 'admin');

    const targetUser = await createAuthenticatedUser(app, 'user');

    emailsToDelete.push(authenticatedAdmin.email, targetUser.email);

    const response = await app.inject({
      method: 'PATCH',
      url: `/api/admin/users/${targetUser.user.id}/status`,
      headers: {
        cookie: authenticatedAdmin.cookie,
        'content-type': 'application/json',
      },
      payload: {
        status: 'blocked',
        reason: 'Acesso suspenso pelo administrador.',
      },
    });

    expect(response.statusCode).toBe(200);

    expect(response.json()).toEqual({
      user: {
        id: targetUser.user.id,
        name: 'Usuário de Teste',
        email: targetUser.email,
        role: 'user',
        status: 'blocked',
        banReason: 'Acesso suspenso pelo administrador.',
        createdAt: expect.any(String),
      },
    });

    const persistedUser = await prisma.user.findUnique({
      where: {
        id: targetUser.user.id,
      },
    });

    expect(persistedUser?.banned).toBe(true);

    expect(persistedUser?.banReason).toBe('Acesso suspenso pelo administrador.');

    const revokedSessionResponse = await app.inject({
      method: 'GET',
      url: '/api/me',
      headers: {
        cookie: targetUser.cookie,
      },
    });

    expect(revokedSessionResponse.statusCode).toBe(401);
  });

  it('exige motivo para bloquear o usuário', async () => {
    app = buildApp();

    const authenticatedAdmin = await createAuthenticatedUser(app, 'admin');

    const target = await createTargetUser();

    emailsToDelete.push(authenticatedAdmin.email, target.email);

    const response = await app.inject({
      method: 'PATCH',
      url: `/api/admin/users/${target.user.id}/status`,
      headers: {
        cookie: authenticatedAdmin.cookie,
        'content-type': 'application/json',
      },
      payload: {
        status: 'blocked',
        reason: '   ',
      },
    });

    expect(response.statusCode).toBe(422);

    expect(response.json()).toEqual({
      code: 'BLOCK_REASON_REQUIRED',
      error: 'Informe o motivo do bloqueio.',
    });

    const persistedUser = await prisma.user.findUnique({
      where: {
        id: target.user.id,
      },
    });

    expect(persistedUser?.banned).toBe(false);
  });

  it('retorna 422 para status inválido', async () => {
    app = buildApp();

    const authenticatedAdmin = await createAuthenticatedUser(app, 'admin');

    const target = await createTargetUser();

    emailsToDelete.push(authenticatedAdmin.email, target.email);

    const response = await app.inject({
      method: 'PATCH',
      url: `/api/admin/users/${target.user.id}/status`,
      headers: {
        cookie: authenticatedAdmin.cookie,
        'content-type': 'application/json',
      },
      payload: {
        status: 'suspended',
        reason: 'Teste',
      },
    });

    expect(response.statusCode).toBe(422);

    expect(response.json()).toEqual({
      code: 'INVALID_STATUS',
      error: 'Status de usuário inválido.',
    });
  });

  it('retorna 404 quando o usuário alvo não existe', async () => {
    app = buildApp();

    const authenticatedAdmin = await createAuthenticatedUser(app, 'admin');

    emailsToDelete.push(authenticatedAdmin.email);

    const response = await app.inject({
      method: 'PATCH',
      url: `/api/admin/users/${crypto.randomUUID()}/status`,
      headers: {
        cookie: authenticatedAdmin.cookie,
        'content-type': 'application/json',
      },
      payload: {
        status: 'blocked',
        reason: 'Teste administrativo',
      },
    });

    expect(response.statusCode).toBe(404);

    expect(response.json()).toEqual({
      code: 'USER_NOT_FOUND',
      error: 'Usuário não encontrado.',
    });
  });

  it('retorna 409 quando ADMIN tenta bloquear a própria conta', async () => {
    app = buildApp();

    const authenticatedAdmin = await createAuthenticatedUser(app, 'admin');

    emailsToDelete.push(authenticatedAdmin.email);

    const response = await app.inject({
      method: 'PATCH',
      url: `/api/admin/users/${authenticatedAdmin.user.id}/status`,
      headers: {
        cookie: authenticatedAdmin.cookie,
        'content-type': 'application/json',
      },
      payload: {
        status: 'blocked',
        reason: 'Teste administrativo',
      },
    });

    expect(response.statusCode).toBe(409);

    expect(response.json()).toEqual({
      code: 'SELF_BLOCK_NOT_ALLOWED',
      error: 'Você não pode bloquear sua própria conta.',
    });

    const persistedAdmin = await prisma.user.findUnique({
      where: {
        id: authenticatedAdmin.user.id,
      },
    });

    expect(persistedAdmin?.banned).toBe(false);
  });

  it('desbloqueia o usuário e limpa o motivo anterior', async () => {
    app = buildApp();

    const authenticatedAdmin = await createAuthenticatedUser(app, 'admin');

    const target = await createTargetUser('blocked');

    emailsToDelete.push(authenticatedAdmin.email, target.email);

    const response = await app.inject({
      method: 'PATCH',
      url: `/api/admin/users/${target.user.id}/status`,
      headers: {
        cookie: authenticatedAdmin.cookie,
        'content-type': 'application/json',
      },
      payload: {
        status: 'active',
      },
    });

    expect(response.statusCode).toBe(200);

    expect(response.json()).toEqual({
      user: {
        id: target.user.id,
        name: 'Usuário Alvo',
        email: target.email,
        role: 'user',
        status: 'active',
        banReason: null,
        createdAt: expect.any(String),
      },
    });

    const persistedUser = await prisma.user.findUnique({
      where: {
        id: target.user.id,
      },
    });

    expect(persistedUser?.banned).toBe(false);
    expect(persistedUser?.banReason).toBeNull();
    expect(persistedUser?.banExpires).toBeNull();
  });
});
