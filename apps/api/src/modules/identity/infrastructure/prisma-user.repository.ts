import type { AdminUserListItem, UserRepository } from '../application/list-users.use-case.js';
import { prisma } from '../../../shared/infrastructure/database/prisma.js';

export class PrismaUserRepository implements UserRepository {
  async listUsers(): Promise<AdminUserListItem[]> {
    return prisma.user.findMany({
      select: {
        id: true,
        name: true,
        email: true,
        role: true,
        createdAt: true,
      },
      orderBy: {
        createdAt: 'asc',
      },
    });
  }
}
