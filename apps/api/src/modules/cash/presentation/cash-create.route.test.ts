import { randomUUID } from 'node:crypto';

import type { CreateCashMovementResponse } from '@apexfinance/contracts';
import type { FastifyInstance } from 'fastify';
import { afterEach, describe, expect, it } from 'vitest';

import { buildApp } from '../../../app.js';
import { prisma } from '../../../shared/infrastructure/database/prisma.js';

type SignedUpUser = {
  userId: string;
  cookie: string;
};

const validPayload = {
  type: 'deposit',
  amountCents: 1_000,
  description: 'Aporte inicial',
  occurredAt: '2026-09-23T12:00:00.000Z',
};

async function signUpUser(app: FastifyInstance, cleanupEmails: Set<string>): Promise<SignedUpUser> {
  const email = `cash-create-${randomUUID()}@apexfinance.local`;

  cleanupEmails.add(email);

  const response = await app.inject({
    method: 'POST',
    url: '/api/auth/sign-up/email',
    headers: {
      'content-type': 'application/json',
    },
    payload: {
      name: 'Usuário de Teste do Caixa',
      email,
      password: 'senha-segura-123',
    },
  });

  expect(response.statusCode).toBe(200);

  const setCookie = response.headers['set-cookie'];

  expect(setCookie).toBeDefined();

  const cookie = Array.isArray(setCookie)
    ? setCookie.map((value) => value.split(';')[0]).join('; ')
    : setCookie!.split(';')[0];

  const user = await prisma.user.findUniqueOrThrow({
    where: { email },
    select: { id: true },
  });

  return {
    userId: user.id,
    cookie,
  };
}

async function seedBalance(userId: string, amountCents: bigint): Promise<void> {
  await prisma.cashAccount.create({
    data: {
      userId,
      type: 'GENERAL',
      movements: {
        create: {
          type: 'DEPOSIT',
          deltaCents: amountCents,
          description: 'Saldo inicial',
          occurredAt: new Date('2026-09-23T12:00:00.000Z'),
        },
      },
    },
  });
}

const invalidCases: Array<{
  name: string;
  payload: Record<string, unknown>;
}> = [
  {
    name: 'tipo desconhecido',
    payload: { ...validPayload, type: 'transfer' },
  },
  {
    name: 'tipo ausente',
    payload: {
      amountCents: 1_000,
      description: 'Aporte',
    },
  },
  {
    name: 'valor zero',
    payload: { ...validPayload, amountCents: 0 },
  },
  {
    name: 'valor negativo',
    payload: { ...validPayload, amountCents: -100 },
  },
  {
    name: 'centavos fracionários',
    payload: { ...validPayload, amountCents: 100.5 },
  },
  {
    name: 'inteiro fora do limite seguro',
    payload: {
      ...validPayload,
      amountCents: Number.MAX_SAFE_INTEGER + 1,
    },
  },
  {
    name: 'valor enviado como texto',
    payload: { ...validPayload, amountCents: '1000' },
  },
  {
    name: 'valor ausente',
    payload: {
      type: 'deposit',
      description: 'Aporte',
    },
  },
  {
    name: 'descrição somente com espaços',
    payload: {
      ...validPayload,
      description: '    ',
    },
  },
  {
    name: 'descrição maior que 160 caracteres',
    payload: {
      ...validPayload,
      description: 'A'.repeat(161),
    },
  },
  {
    name: 'descrição ausente',
    payload: {
      type: 'deposit',
      amountCents: 1_000,
    },
  },
  {
    name: 'data inválida',
    payload: {
      ...validPayload,
      occurredAt: 'data-invalida',
    },
  },
  {
    name: 'data com tipo incorreto',
    payload: {
      ...validPayload,
      occurredAt: 12345,
    },
  },
];

describe('POST /api/cash/movements', () => {
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

  it('retorna 401 quando não existe sessão autenticada', async () => {
    app = buildApp();

    const response = await app.inject({
      method: 'POST',
      url: '/api/cash/movements',
      headers: {
        'content-type': 'application/json',
      },
      payload: validPayload,
    });

    expect(response.statusCode).toBe(401);

    expect(response.json()).toEqual({
      error: 'Não autenticado.',
    });
  });

  it('registra um depósito e retorna 201 com saldo atualizado', async () => {
    app = buildApp();

    const user = await signUpUser(app, cleanupEmails);

    const response = await app.inject({
      method: 'POST',
      url: '/api/cash/movements',
      headers: {
        cookie: user.cookie,
        'content-type': 'application/json',
      },
      payload: {
        ...validPayload,
        amountCents: 100_000,
        description: '  Aporte inicial  ',
      },
    });

    expect(response.statusCode).toBe(201);

    expect(response.json()).toEqual({
      movement: {
        id: expect.any(String),
        type: 'deposit',
        amountCents: 100_000,
        description: 'Aporte inicial',
        occurredAt: validPayload.occurredAt,
        createdAt: expect.any(String),
      },
      balanceCents: 100_000,
    });

    const account = await prisma.cashAccount.findUnique({
      where: {
        userId_type: {
          userId: user.userId,
          type: 'GENERAL',
        },
      },
      include: {
        movements: true,
      },
    });

    expect(account).not.toBeNull();
    expect(account!.movements).toHaveLength(1);
    expect(account!.movements[0].deltaCents).toBe(100_000n);
  });

  it('registra uma saída válida e atualiza o saldo', async () => {
    app = buildApp();

    const user = await signUpUser(app, cleanupEmails);

    await seedBalance(user.userId, 10_000n);

    const response = await app.inject({
      method: 'POST',
      url: '/api/cash/movements',
      headers: {
        cookie: user.cookie,
      },
      payload: {
        type: 'withdrawal',
        amountCents: 6_000,
        description: 'Pagamento',
      },
    });

    expect(response.statusCode).toBe(201);

    const body = response.json<CreateCashMovementResponse>();

    expect(body).toMatchObject({
      movement: {
        type: 'withdrawal',
        amountCents: 6_000,
        description: 'Pagamento',
      },
      balanceCents: 4_000,
    });

    const summary = await app.inject({
      method: 'GET',
      url: '/api/cash/summary',
      headers: {
        cookie: user.cookie,
      },
    });

    expect(summary.statusCode).toBe(200);
    expect(summary.json()).toEqual({
      balanceCents: 4_000,
    });

    const history = await app.inject({
      method: 'GET',
      url: '/api/cash/movements',
      headers: {
        cookie: user.cookie,
      },
    });

    expect(history.json().movements).toHaveLength(2);
  });

  it('retorna 409 para saldo insuficiente sem alterar o ledger', async () => {
    app = buildApp();

    const user = await signUpUser(app, cleanupEmails);

    await seedBalance(user.userId, 10_000n);

    const response = await app.inject({
      method: 'POST',
      url: '/api/cash/movements',
      headers: {
        cookie: user.cookie,
      },
      payload: {
        type: 'withdrawal',
        amountCents: 11_000,
        description: 'Saída acima do saldo',
      },
    });

    expect(response.statusCode).toBe(409);

    expect(response.json()).toEqual({
      code: 'INSUFFICIENT_CASH_BALANCE',
      error: 'Saldo insuficiente para realizar esta saída.',
    });

    const summary = await app.inject({
      method: 'GET',
      url: '/api/cash/summary',
      headers: {
        cookie: user.cookie,
      },
    });

    expect(summary.json()).toEqual({
      balanceCents: 10_000,
    });

    const history = await app.inject({
      method: 'GET',
      url: '/api/cash/movements',
      headers: {
        cookie: user.cookie,
      },
    });

    expect(history.json().movements).toHaveLength(1);
  });

  it('rejeita saída sem saldo disponível', async () => {
    app = buildApp();

    const user = await signUpUser(app, cleanupEmails);

    const response = await app.inject({
      method: 'POST',
      url: '/api/cash/movements',
      headers: {
        cookie: user.cookie,
      },
      payload: {
        type: 'withdrawal',
        amountCents: 1_000,
        description: 'Saída sem fundos',
      },
    });

    expect(response.statusCode).toBe(409);

    const account = await prisma.cashAccount.findUnique({
      where: {
        userId_type: {
          userId: user.userId,
          type: 'GENERAL',
        },
      },
    });

    expect(account).toBeNull();
  });

  it('ignora userId forjado no corpo, URL e cabeçalho', async () => {
    app = buildApp();

    const authenticatedUser = await signUpUser(app, cleanupEmails);

    const otherUser = await signUpUser(app, cleanupEmails);

    const response = await app.inject({
      method: 'POST',
      url: `/api/cash/movements?userId=${otherUser.userId}`,
      headers: {
        cookie: authenticatedUser.cookie,
        'x-user-id': otherUser.userId,
      },
      payload: {
        type: 'deposit',
        amountCents: 7_500,
        description: 'Aporte privado',
        userId: otherUser.userId,
        actorUserId: otherUser.userId,
      },
    });

    expect(response.statusCode).toBe(201);

    const ownAccount = await prisma.cashAccount.findUnique({
      where: {
        userId_type: {
          userId: authenticatedUser.userId,
          type: 'GENERAL',
        },
      },
    });

    const otherAccount = await prisma.cashAccount.findUnique({
      where: {
        userId_type: {
          userId: otherUser.userId,
          type: 'GENERAL',
        },
      },
    });

    expect(ownAccount).not.toBeNull();
    expect(otherAccount).toBeNull();

    const ownSummary = await app.inject({
      method: 'GET',
      url: '/api/cash/summary',
      headers: {
        cookie: authenticatedUser.cookie,
      },
    });

    expect(ownSummary.json()).toEqual({
      balanceCents: 7_500,
    });
  });

  it('usa a data atual do servidor quando occurredAt é omitido', async () => {
    app = buildApp();

    const user = await signUpUser(app, cleanupEmails);

    const beforeRequest = Date.now();

    const response = await app.inject({
      method: 'POST',
      url: '/api/cash/movements',
      headers: {
        cookie: user.cookie,
      },
      payload: {
        type: 'deposit',
        amountCents: 2_500,
        description: 'Entrada sem data',
      },
    });

    const afterRequest = Date.now();

    expect(response.statusCode).toBe(201);

    const body = response.json<CreateCashMovementResponse>();
    const occurredAt = new Date(body.movement.occurredAt).getTime();

    expect(occurredAt).toBeGreaterThanOrEqual(beforeRequest);
    expect(occurredAt).toBeLessThanOrEqual(afterRequest);
    expect(body.balanceCents).toBe(2_500);
  });

  it.each(invalidCases)('retorna 422 para $name', async ({ payload }) => {
    app = buildApp();

    const user = await signUpUser(app, cleanupEmails);

    const response = await app.inject({
      method: 'POST',
      url: '/api/cash/movements',
      headers: {
        cookie: user.cookie,
        'content-type': 'application/json',
      },
      payload,
    });

    expect(response.statusCode).toBe(422);

    const account = await prisma.cashAccount.findUnique({
      where: {
        userId_type: {
          userId: user.userId,
          type: 'GENERAL',
        },
      },
    });

    expect(account).toBeNull();
  });
});
