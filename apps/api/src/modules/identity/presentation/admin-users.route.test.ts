import crypto from 'node:crypto';

import type { FastifyInstance } from 'fastify';
import { afterEach, describe, expect, it } from 'vitest';

import { buildApp } from '../../../app.js';
import { prisma } from '../../../shared/infrastructure/database/prisma.js';

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

  it('retorna a lista de usuários para um administrador autenticado', async () => {
    app = buildApp();

    const email = `admin-${crypto.randomUUID()}@apexfinance.local`;

    try {
      const signUpResponse = await app.inject({
        method: 'POST',
        url: '/api/auth/sign-up/email',
        headers: {
          'content-type': 'application/json',
        },
        payload: {
          name: 'Administrador de Teste',
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

      const admin = await prisma.user.update({
        where: {
          email,
        },
        data: {
          role: 'admin',
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

      expect(response.json()).toEqual({
        users: expect.arrayContaining([
          expect.objectContaining({
            id: admin.id,
            name: 'Administrador de Teste',
            email,
            role: 'admin',
          }),
        ]),
      });
    } finally {
      await prisma.user.deleteMany({
        where: {
          email,
        },
      });
    }
  });
});
