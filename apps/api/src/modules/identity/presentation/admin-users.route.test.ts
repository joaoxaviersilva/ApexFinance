import crypto from 'node:crypto';

import type { FastifyInstance } from 'fastify';
import { afterEach, describe, expect, it } from 'vitest';

import { buildApp } from '../../../app.js';
import { prisma } from '../../../shared/infrastructure/database/prisma.js';

const ADMIN_USER_KEYS = ['banReason', 'createdAt', 'email', 'id', 'name', 'role', 'status'];

describe('GET /api/admin/users', () => {
  let app: FastifyInstance | undefined;

  afterEach(async () => {
    await app?.close();

    app = undefined;
  });

  it('retorna 401 quando não existe sessão autenticada', async () => {
    app = buildApp();

    const response = await app.inject({
      method: 'GET',
      url: '/api/admin/users',
    });

    expect(response.statusCode).toBe(401);

    expect(response.json()).toEqual({
      error: 'Não autenticado.',
    });
  });

  it('retorna 403 para usuário autenticado sem papel de administrador', async () => {
    app = buildApp();

    const email = `usuario-comum-${crypto.randomUUID()}@apexfinance.local`;

    try {
      const signUpResponse = await app.inject({
        method: 'POST',
        url: '/api/auth/sign-up/email',
        headers: {
          'content-type': 'application/json',
        },
        payload: {
          name: 'Usuário Comum',
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

      const response = await app.inject({
        method: 'GET',
        url: '/api/admin/users',
        headers: {
          cookie,
        },
      });

      expect(response.statusCode).toBe(403);

      expect(response.json()).toEqual({
        error: 'Acesso restrito a administradores.',
      });
    } finally {
      await prisma.user.deleteMany({
        where: {
          email,
        },
      });
    }
  });

  it('retorna usuários normalizados para um administrador autenticado', async () => {
    app = buildApp();

    const adminEmail = `admin-${crypto.randomUUID()}@apexfinance.local`;
    const blockedEmail = `bloqueado-${crypto.randomUUID()}@apexfinance.local`;

    try {
      const signUpResponse = await app.inject({
        method: 'POST',
        url: '/api/auth/sign-up/email',
        headers: {
          'content-type': 'application/json',
        },
        payload: {
          name: 'Administrador de Teste',
          email: adminEmail,
          password: 'senha-segura-123',
        },
      });

      expect(signUpResponse.statusCode).toBe(200);

      const setCookie = signUpResponse.headers['set-cookie'];

      expect(setCookie).toBeDefined();

      const cookie = Array.isArray(setCookie)
        ? setCookie.map((value) => value.split(';')[0]).join('; ')
        : setCookie!.split(';')[0];

      const admin = await prisma.user.update({
        where: {
          email: adminEmail,
        },
        data: {
          role: 'admin',
        },
      });

      const blockedUser = await prisma.user.create({
        data: {
          id: crypto.randomUUID(),
          name: 'Usuário Bloqueado',
          email: blockedEmail,
          emailVerified: false,
          role: null,
          banned: true,
          banReason: 'Teste administrativo',
          banExpires: null,
        },
      });

      const response = await app.inject({
        method: 'GET',
        url: '/api/admin/users',
        headers: {
          cookie,
        },
      });

      expect(response.statusCode).toBe(200);

      const payload = response.json<{
        users: Array<Record<string, unknown>>;
      }>();

      const returnedAdmin = payload.users.find((user) => user.id === admin.id);

      const returnedBlockedUser = payload.users.find((user) => user.id === blockedUser.id);

      expect(returnedAdmin).toBeDefined();
      expect(returnedBlockedUser).toBeDefined();

      expect(Object.keys(returnedAdmin!).sort()).toEqual(ADMIN_USER_KEYS);

      expect(Object.keys(returnedBlockedUser!).sort()).toEqual(ADMIN_USER_KEYS);

      expect(returnedAdmin).toEqual({
        id: admin.id,
        name: 'Administrador de Teste',
        email: adminEmail,
        role: 'admin',
        status: 'active',
        banReason: null,
        createdAt: expect.any(String),
      });

      expect(returnedBlockedUser).toEqual({
        id: blockedUser.id,
        name: 'Usuário Bloqueado',
        email: blockedEmail,
        role: 'user',
        status: 'blocked',
        banReason: 'Teste administrativo',
        createdAt: expect.any(String),
      });

      expect(new Date(returnedAdmin!.createdAt as string).toISOString()).toBe(
        returnedAdmin!.createdAt,
      );

      expect(new Date(returnedBlockedUser!.createdAt as string).toISOString()).toBe(
        returnedBlockedUser!.createdAt,
      );
    } finally {
      await prisma.user.deleteMany({
        where: {
          email: {
            in: [adminEmail, blockedEmail],
          },
        },
      });
    }
  });
});
