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
      name: role === 'admin' ? 'Administrador de Teste' : 'Usuário Comum',
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

async function createTargetUser(role: 'user' | 'admin' = 'user') {
  const email = `target-${crypto.randomUUID()}@apexfinance.local`;

  const user = await prisma.user.create({
    data: {
      id: crypto.randomUUID(),
      name: 'Usuário Alvo',
      email,
      emailVerified: false,
      role,
      banned: false,
      banReason: null,
      banExpires: null,
    },
  });

  return {
    email,
    user,
  };
}

describe('PATCH /api/admin/users/:userId/role', () => {
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
      url: `/api/admin/users/${crypto.randomUUID()}/role`,
      headers: {
        'content-type': 'application/json',
      },
      payload: {
        role: 'admin',
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
      url: `/api/admin/users/${crypto.randomUUID()}/role`,
      headers: {
        cookie: authenticatedUser.cookie,
        'content-type': 'application/json',
      },
      payload: {
        role: 'admin',
      },
    });

    expect(response.statusCode).toBe(403);

    expect(response.json()).toEqual({
      error: 'Acesso restrito a administradores.',
    });
  });

  it('permite que ADMIN promova USER para ADMIN', async () => {
    app = buildApp();

    const authenticatedAdmin = await createAuthenticatedUser(app, 'admin');

    const target = await createTargetUser('user');

    emailsToDelete.push(authenticatedAdmin.email, target.email);

    const response = await app.inject({
      method: 'PATCH',
      url: `/api/admin/users/${target.user.id}/role`,
      headers: {
        cookie: authenticatedAdmin.cookie,
        'content-type': 'application/json',
      },
      payload: {
        role: 'admin',
      },
    });

    expect(response.statusCode).toBe(200);

    expect(response.json()).toEqual({
      user: {
        id: target.user.id,
        name: 'Usuário Alvo',
        email: target.email,
        role: 'admin',
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

    expect(persistedUser?.role).toBe('admin');
  });

  it('retorna 422 para papel inválido', async () => {
    app = buildApp();

    const authenticatedAdmin = await createAuthenticatedUser(app, 'admin');

    const target = await createTargetUser();

    emailsToDelete.push(authenticatedAdmin.email, target.email);

    const response = await app.inject({
      method: 'PATCH',
      url: `/api/admin/users/${target.user.id}/role`,
      headers: {
        cookie: authenticatedAdmin.cookie,
        'content-type': 'application/json',
      },
      payload: {
        role: 'super-admin',
      },
    });

    expect(response.statusCode).toBe(422);

    expect(response.json()).toEqual({
      code: 'INVALID_ROLE',
      error: 'Papel de usuário inválido.',
    });

    const persistedUser = await prisma.user.findUnique({
      where: {
        id: target.user.id,
      },
    });

    expect(persistedUser?.role).toBe('user');
  });

  it('retorna 404 quando o usuário alvo não existe', async () => {
    app = buildApp();

    const authenticatedAdmin = await createAuthenticatedUser(app, 'admin');

    emailsToDelete.push(authenticatedAdmin.email);

    const response = await app.inject({
      method: 'PATCH',
      url: `/api/admin/users/${crypto.randomUUID()}/role`,
      headers: {
        cookie: authenticatedAdmin.cookie,
        'content-type': 'application/json',
      },
      payload: {
        role: 'admin',
      },
    });

    expect(response.statusCode).toBe(404);

    expect(response.json()).toEqual({
      code: 'USER_NOT_FOUND',
      error: 'Usuário não encontrado.',
    });
  });

  it('retorna 409 quando ADMIN tenta remover o próprio papel', async () => {
    app = buildApp();

    const authenticatedAdmin = await createAuthenticatedUser(app, 'admin');

    emailsToDelete.push(authenticatedAdmin.email);

    const response = await app.inject({
      method: 'PATCH',
      url: `/api/admin/users/${authenticatedAdmin.user.id}/role`,
      headers: {
        cookie: authenticatedAdmin.cookie,
        'content-type': 'application/json',
      },
      payload: {
        role: 'user',
      },
    });

    expect(response.statusCode).toBe(409);

    expect(response.json()).toEqual({
      code: 'SELF_ROLE_CHANGE_NOT_ALLOWED',
      error: 'Você não pode remover seu próprio acesso administrativo.',
    });

    const persistedAdmin = await prisma.user.findUnique({
      where: {
        id: authenticatedAdmin.user.id,
      },
    });

    expect(persistedAdmin?.role).toBe('admin');
  });
});
