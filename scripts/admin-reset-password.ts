import { ResetUserPasswordUseCase } from '../apps/api/src/modules/identity/application/reset-user-password.use-case.js';
import { BetterAuthPasswordHasher } from '../apps/api/src/modules/identity/infrastructure/better-auth-password.hasher.js';
import { PrismaPasswordResetRepository } from '../apps/api/src/modules/identity/infrastructure/prisma-password-reset.repository.js';
import { prisma } from '../apps/api/src/shared/infrastructure/database/prisma.js';

async function run(): Promise<void> {
  const email = process.env.APEX_RESET_EMAIL?.trim();

  const password = process.env.APEX_RESET_PASSWORD;

  delete process.env.APEX_RESET_EMAIL;
  delete process.env.APEX_RESET_PASSWORD;

  if (!email) {
    throw new Error('O e-mail do usuário não foi informado.');
  }

  if (!password) {
    throw new Error('A nova senha não foi informada.');
  }

  const repository = new PrismaPasswordResetRepository();

  const passwordHasher = new BetterAuthPasswordHasher();

  const resetUserPassword = new ResetUserPasswordUseCase(repository, passwordHasher);

  await resetUserPassword.execute({
    email,
    password,
  });

  console.log('Senha redefinida com sucesso. As sessões existentes do usuário foram encerradas.');
}

void run()
  .catch((error: unknown) => {
    if (error instanceof Error) {
      console.error(`Não foi possível redefinir a senha: ${error.message}`);
    } else {
      console.error('Não foi possível redefinir a senha.');
    }

    process.exitCode = 1;
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
