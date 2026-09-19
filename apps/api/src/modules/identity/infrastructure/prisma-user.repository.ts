import type { AdminUser, UserRole } from '@apexfinance/contracts';

import type { UserRepository } from '../application/list-users.use-case.js';
import type { UpdateUserRoleRepository } from '../application/update-user-role.use-case.js';
import { prisma } from '../../../shared/infrastructure/database/prisma.js';

type PrismaAdminUser = {
  id: string;
  name: string;
  email: string;
  role: string | null;
  banned: boolean | null;
  banReason: string | null;
  createdAt: Date;
};

function normalizeUserRole(role: string | null): UserRole {
  return role === 'admin' ? 'admin' : 'user';
}

function toAdminUser(user: PrismaAdminUser): AdminUser {
  return {
    id: user.id,
    name: user.name,
    email: user.email,
    role: normalizeUserRole(user.role),
    status: user.banned === true ? 'blocked' : 'active',
    banReason: user.banReason,
    createdAt: user.createdAt.toISOString(),
  };
}

export class PrismaUserRepository implements UserRepository, UpdateUserRoleRepository {
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

    return users.map(toAdminUser);
  }

  async findById(userId: string): Promise<AdminUser | null> {
    const user = await prisma.user.findUnique({
      where: {
        id: userId,
      },
      select: {
        id: true,
        name: true,
        email: true,
        role: true,
        banned: true,
        banReason: true,
        createdAt: true,
      },
    });

    if (!user) {
      return null;
    }

    return toAdminUser(user);
  }

  async updateRole(userId: string, role: UserRole): Promise<AdminUser> {
    const user = await prisma.user.update({
      where: {
        id: userId,
      },
      data: {
        role,
      },
      select: {
        id: true,
        name: true,
        email: true,
        role: true,
        banned: true,
        banReason: true,
        createdAt: true,
      },
    });

    return toAdminUser(user);
  }
}
