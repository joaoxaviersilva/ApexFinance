import crypto from 'node:crypto';

import type { FastifyInstance } from 'fastify';
import { afterEach, describe, expect, it } from 'vitest';

import { buildApp } from '../../../app.js';
import { prisma } from '../../../shared/infrastructure/database/prisma.js';

describe('Rotas do Better Auth', () => {
  let app: FastifyInstance | undefined;

  afterEach(async () => {
    await app?.close();
    app = undefined;
  });

  it('expõe o endpoint de consulta de sessão', async () => {
    app = buildApp();

    const response = await app.inject({
      method: 'GET',
      url: '/api/auth/get-session',
    });

    expect(response.statusCode).toBe(200);
    expect(response.json()).toBeNull();
  });

  it('cadastro público cria um usuário comum', async () => {
    app = buildApp();

    const email = `usuario-${crypto.randomUUID()}@apexfinance.local`;

    try {
      const response = await app.inject({
        method: 'POST',
        url: '/api/auth/sign-up/email',
        headers: {
          'content-type': 'application/json',
        },
        payload: {
          name: 'Usuário de Teste',
          email,
          password: 'senha-segura-123',
        },
      });

      expect(response.statusCode).toBe(200);

      const user = await prisma.user.findUnique({
        where: {
          email,
        },
      });

      expect(user).not.toBeNull();
      expect(user?.role).toBe('user');
    } finally {
      await prisma.user.deleteMany({
        where: {
          email,
        },
      });
    }
  });

  it('rejeita tentativa de definir role no cadastro público', async () => {
    app = buildApp();

    const email = `admin-${crypto.randomUUID()}@apexfinance.local`;

    try {
      const response = await app.inject({
        method: 'POST',
        url: '/api/auth/sign-up/email',
        headers: {
          'content-type': 'application/json',
        },
        payload: {
          name: 'Administrador Indevido',
          email,
          password: 'senha-segura-123',
          role: 'admin',
        },
      });

      expect(response.statusCode).toBe(400);

      expect(response.json()).toEqual({
        message: 'role is not allowed to be set',
        code: 'FIELD_NOT_ALLOWED',
      });

      const user = await prisma.user.findUnique({
        where: {
          email,
        },
      });

      expect(user).toBeNull();
    } finally {
      await prisma.user.deleteMany({
        where: {
          email,
        },
      });
    }
  });
});
