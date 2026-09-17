import { hashPassword } from 'better-auth/crypto';

import type { PasswordHasher } from '../application/reset-user-password.use-case.js';

export class BetterAuthPasswordHasher implements PasswordHasher {
  async hash(password: string): Promise<string> {
    return hashPassword(password);
  }
}
