import { afterEach, describe, expect, it } from 'vitest';

import { buildApp } from './app.js';

describe('GET /health', () => {
  const apps: ReturnType<typeof buildApp>[] = [];

  afterEach(async () => {
    await Promise.all(apps.map((app) => app.close()));
  });

  it('returns the API health status', async () => {
    const app = buildApp();

    apps.push(app);

    const response = await app.inject({
      method: 'GET',
      url: '/health',
    });

    expect(response.statusCode).toBe(200);

    expect(response.json()).toEqual({
      status: 'ok',
      service: 'apexfinance-api',
    });
  });
});
