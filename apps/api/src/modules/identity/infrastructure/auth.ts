import { betterAuth } from 'better-auth';
import { prismaAdapter } from 'better-auth/adapters/prisma';
import { admin } from 'better-auth/plugins';

import { prisma } from '../../../shared/infrastructure/database/prisma.js';
import { getRequiredEnv } from '../../../shared/infrastructure/environment.js';

export const auth = betterAuth({
  baseURL: getRequiredEnv('BETTER_AUTH_URL'),
  secret: getRequiredEnv('BETTER_AUTH_SECRET'),

  trustedOrigins: [getRequiredEnv('WEB_ORIGIN')],

  database: prismaAdapter(prisma, {
    provider: 'postgresql',
  }),

  emailAndPassword: {
    enabled: true,
  },

  advanced: {
    database: {
      joins: true,
    },
  },

  plugins: [
    admin({
      defaultRole: 'user',
      adminRoles: ['admin'],
    }),
  ],
});