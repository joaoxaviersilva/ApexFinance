import { PrismaPg } from '@prisma/adapter-pg';

import { PrismaClient } from '../../../generated/prisma/client.js';
import { getRequiredEnv } from '../environment.js';

const adapter = new PrismaPg({
  connectionString: getRequiredEnv('DATABASE_URL'),
});

export const prisma = new PrismaClient({
  adapter,
});