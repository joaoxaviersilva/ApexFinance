import crypto from 'node:crypto';

import type { FastifyInstance } from 'fastify';
import { afterEach, describe, expect, it } from 'vitest';

import { buildApp } from '../../../app.js';
import { prisma } from '../../../shared/infrastructure/database/prisma.js';

describe('GET /api/me', () => {
  let app: FastifyInstance | undefined;

  afterEach(async () => {
    await app?.close();
    app = undefined;
  });

  it('retorna 401 quando não existe sessão autenticada', async () => {
    app = buildApp();

    const response = await app.inject({
      method: 'GET',
      url: '/api/me',
    });

    expect(response.statusCode).toBe(401);

    expect(response.json()).toEqual({
      error: 'Não autenticado.',
    });
  });

  it('retorna a sessão quando o usuário está autenticado', async () => {
    app = buildApp();

    const email = `sessao-${crypto.randomUUID()}@apexfinance.local`;

    try {
      const signUpResponse = await app.inject({
        method: 'POST',
        url: '/api/auth/sign-up/email',
        headers: {
          'content-type': 'application/json',
        },
        payload: {
          name: 'Usuário Autenticado',
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
        url: '/api/me',
        headers: {
          cookie,
        },
      });

      expect(response.statusCode).toBe(200);

      const body = response.json();

      expect(body.user).toMatchObject({
        name: 'Usuário Autenticado',
        email,
        role: 'user',
      });

      expect(body.session).toBeDefined();
    } finally {
      await prisma.user.deleteMany({
        where: {
          email,
        },
      });
    }
  });
});