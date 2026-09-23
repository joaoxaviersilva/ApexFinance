import crypto from 'node:crypto';

import type { FastifyInstance } from 'fastify';
import { afterEach, describe, expect, it } from 'vitest';

import { buildApp } from '../../../app.js';
import { prisma } from '../../../shared/infrastructure/database/prisma.js';

type SignedUpUser = {
  email: string;
  userId: string;
  cookie: string;
};

type SeedMovement = {
  type: 'DEPOSIT' | 'WITHDRAWAL';
  deltaCents: bigint;
  description: string;
  occurredAt: Date;
};

async function signUpUser(
  app: FastifyInstance,
  prefix: string,
  cleanupEmails: Set<string>,
): Promise<SignedUpUser> {
  const email = `${prefix}-${crypto.randomUUID()}@apexfinance.local`;

  cleanupEmails.add(email);

  const signUpResponse = await app.inject({
    method: 'POST',
    url: '/api/auth/sign-up/email',
    headers: {
      'content-type': 'application/json',
    },
    payload: {
      name: `Usuário ${prefix}`,
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

  const user = await prisma.user.findUniqueOrThrow({
    where: {
      email,
    },
    select: {
      id: true,
    },
  });

  return {
    email,
    userId: user.id,
    cookie,
  };
}

async function seedCashLedger(userId: string, movements: SeedMovement[]): Promise<void> {
  const account = await prisma.cashAccount.create({
    data: {
      userId,
      type: 'GENERAL',
    },
    select: {
      id: true,
    },
  });

  await prisma.cashMovement.createMany({
    data: movements.map((movement) => ({
      cashAccountId: account.id,
      type: movement.type,
      deltaCents: movement.deltaCents,
      description: movement.description,
      occurredAt: movement.occurredAt,
    })),
  });
}

describe('Cash read routes', () => {
  let app: FastifyInstance | undefined;

  const cleanupEmails = new Set<string>();

  afterEach(async () => {
    await app?.close();

    app = undefined;

    if (cleanupEmails.size > 0) {
      await prisma.user.deleteMany({
        where: {
          email: {
            in: [...cleanupEmails],
          },
        },
      });

      cleanupEmails.clear();
    }
  });

  it('GET /api/cash/summary retorna 401 sem sessão autenticada', async () => {
    app = buildApp();

    const response = await app.inject({
      method: 'GET',
      url: '/api/cash/summary',
    });

    expect(response.statusCode).toBe(401);

    expect(response.json()).toEqual({
      error: 'Não autenticado.',
    });
  });

  it('GET /api/cash/movements retorna 401 sem sessão autenticada', async () => {
    app = buildApp();

    const response = await app.inject({
      method: 'GET',
      url: '/api/cash/movements',
    });

    expect(response.statusCode).toBe(401);

    expect(response.json()).toEqual({
      error: 'Não autenticado.',
    });
  });

  it('GET /api/cash/summary usa somente o usuário autenticado e ignora userId forjado', async () => {
    app = buildApp();

    const authenticatedUser = await signUpUser(app, 'saldo-autenticado', cleanupEmails);

    const otherUser = await signUpUser(app, 'saldo-outro', cleanupEmails);

    await seedCashLedger(authenticatedUser.userId, [
      {
        type: 'DEPOSIT',
        deltaCents: 150_000n,
        description: 'Aporte inicial',
        occurredAt: new Date('2026-09-20T12:00:00.000Z'),
      },
      {
        type: 'WITHDRAWAL',
        deltaCents: -37_500n,
        description: 'Compra planejada',
        occurredAt: new Date('2026-09-21T12:00:00.000Z'),
      },
    ]);

    await seedCashLedger(otherUser.userId, [
      {
        type: 'DEPOSIT',
        deltaCents: 999_999_999n,
        description: 'Saldo de outro usuário',
        occurredAt: new Date('2026-09-22T12:00:00.000Z'),
      },
    ]);

    const response = await app.inject({
      method: 'GET',
      url: `/api/cash/summary?userId=${otherUser.userId}`,
      headers: {
        cookie: authenticatedUser.cookie,
      },
    });

    expect(response.statusCode).toBe(200);

    expect(response.json()).toEqual({
      balanceCents: 112_500,
    });
  });

  it('GET /api/cash/movements retorna somente o histórico autenticado em ordem decrescente', async () => {
    app = buildApp();

    const authenticatedUser = await signUpUser(app, 'movimentos-autenticado', cleanupEmails);

    const otherUser = await signUpUser(app, 'movimentos-outro', cleanupEmails);

    await seedCashLedger(authenticatedUser.userId, [
      {
        type: 'DEPOSIT',
        deltaCents: 200_000n,
        description: 'Entrada principal',
        occurredAt: new Date('2026-09-20T10:00:00.000Z'),
      },
      {
        type: 'WITHDRAWAL',
        deltaCents: -25_000n,
        description: 'Saída planejada',
        occurredAt: new Date('2026-09-22T10:00:00.000Z'),
      },
    ]);

    await seedCashLedger(otherUser.userId, [
      {
        type: 'DEPOSIT',
        deltaCents: 800_000n,
        description: 'Movimento privado de outro usuário',
        occurredAt: new Date('2026-09-23T10:00:00.000Z'),
      },
    ]);

    const response = await app.inject({
      method: 'GET',
      url: `/api/cash/movements?userId=${otherUser.userId}`,
      headers: {
        cookie: authenticatedUser.cookie,
      },
    });

    expect(response.statusCode).toBe(200);

    expect(response.json()).toEqual({
      movements: [
        {
          id: expect.any(String),
          type: 'withdrawal',
          amountCents: 25_000,
          description: 'Saída planejada',
          occurredAt: '2026-09-22T10:00:00.000Z',
          createdAt: expect.any(String),
        },
        {
          id: expect.any(String),
          type: 'deposit',
          amountCents: 200_000,
          description: 'Entrada principal',
          occurredAt: '2026-09-20T10:00:00.000Z',
          createdAt: expect.any(String),
        },
      ],
    });
  });
});
