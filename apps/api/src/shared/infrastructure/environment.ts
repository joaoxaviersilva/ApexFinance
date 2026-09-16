import { config } from 'dotenv';
import { fileURLToPath } from 'node:url';

config({
  path: fileURLToPath(new URL('../../../../../.env', import.meta.url)),
});

type EnvironmentVariable = 'DATABASE_URL' | 'BETTER_AUTH_SECRET' | 'BETTER_AUTH_URL' | 'WEB_ORIGIN';

export function getRequiredEnv(name: EnvironmentVariable): string {
  const value = process.env[name];

  if (!value) {
    throw new Error(`A variável de ambiente ${name} não foi configurada.`);
  }

  return value;
}
