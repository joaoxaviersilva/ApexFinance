import type {
  CredentialAccount,
  PasswordResetRepository,
  UpdatePasswordInput,
} from '../application/reset-user-password.use-case.js';

import { prisma } from '../../../shared/infrastructure/database/prisma.js';

export class PrismaPasswordResetRepository implements PasswordResetRepository {
  async findCredentialAccountByEmail(email: string): Promise<CredentialAccount | null> {
    const account = await prisma.account.findFirst({
      where: {
        providerId: 'credential',

        user: {
          email,
        },
      },

      select: {
        id: true,
        userId: true,
      },
    });

    if (!account) {
      return null;
    }

    return {
      accountId: account.id,
      userId: account.userId,
    };
  }

  async updatePasswordAndRevokeSessions(input: UpdatePasswordInput): Promise<void> {
    await prisma.$transaction(async (transaction) => {
      await transaction.account.update({
        where: {
          id: input.accountId,
        },

        data: {
          password: input.passwordHash,
        },
      });

      await transaction.session.deleteMany({
        where: {
          userId: input.userId,
        },
      });
    });
  }
}
