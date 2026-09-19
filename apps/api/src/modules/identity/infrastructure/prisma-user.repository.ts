import type { AdminUser, UserRole } from '@apexfinance/contracts';

import type { UserRepository } from '../application/list-users.use-case.js';
import { prisma } from '../../../shared/infrastructure/database/prisma.js';

function normalizeUserRole(role: string | null): UserRole {
  return role === 'admin' ? 'admin' : 'user';
}

export class PrismaUserRepository implements UserRepository {
  async listUsers(): Promise<AdminUser[]> {
    const users = await prisma.user.findMany({
      select: {
        id: true,
        name: true,
        email: true,
        role: true,
        banned: true,
        banReason: true,
        createdAt: true,
      },
      orderBy: {
        createdAt: 'asc',
      },
    });

    return users.map((user) => ({
      id: user.id,
      name: user.name,
      email: user.email,
      role: normalizeUserRole(user.role),
      status: user.banned === true ? 'blocked' : 'active',
      banReason: user.banReason,
      createdAt: user.createdAt.toISOString(),
    }));
  }
}
