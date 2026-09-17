import { beforeEach, describe, expect, it, vi } from 'vitest';

const cryptoMocks = vi.hoisted(() => ({
  hashPassword: vi.fn(),
}));

vi.mock('better-auth/crypto', () => ({
  hashPassword: cryptoMocks.hashPassword,
}));

import { BetterAuthPasswordHasher } from './better-auth-password.hasher';

describe('BetterAuthPasswordHasher', () => {
  beforeEach(() => {
    cryptoMocks.hashPassword.mockReset();
  });

  it('gera o hash usando o algoritmo do Better Auth', async () => {
    cryptoMocks.hashPassword.mockResolvedValue('hashed-password');

    const hasher = new BetterAuthPasswordHasher();

    const result = await hasher.hash('nova-senha-segura');

    expect(cryptoMocks.hashPassword).toHaveBeenCalledWith('nova-senha-segura');

    expect(result).toBe('hashed-password');
  });
});
