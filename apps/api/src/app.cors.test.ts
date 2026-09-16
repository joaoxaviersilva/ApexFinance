import type { FastifyInstance } from 'fastify';
import { afterEach, describe, expect, it } from 'vitest';

import { buildApp } from './app.js';

describe('CORS da API', () => {
  let app: FastifyInstance | undefined;

  afterEach(async () => {
    await app?.close();
    app = undefined;
  });

  it('permite requisições do frontend com credenciais', async () => {
    app = buildApp();

    const response = await app.inject({
      method: 'OPTIONS',
      url: '/api/auth/get-session',
      headers: {
        origin: 'http://localhost:5173',
        'access-control-request-method': 'GET',
      },
    });

    expect(response.statusCode).toBe(204);

    expect(response.headers['access-control-allow-origin']).toBe(
      'http://localhost:5173',
    );

    expect(response.headers['access-control-allow-credentials']).toBe('true');
  });
});