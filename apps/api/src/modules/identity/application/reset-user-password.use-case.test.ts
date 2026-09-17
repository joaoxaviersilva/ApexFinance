import { describe, expect, it, vi } from 'vitest';

import {
  ResetUserPasswordUseCase,
  type PasswordHasher,
  type PasswordResetRepository,
} from './reset-user-password.use-case';

function createRepository(): PasswordResetRepository {
  return {
    findCredentialAccountByEmail: vi.fn(),
    updatePasswordAndRevokeSessions: vi.fn(),
  };
}

function createPasswordHasher(): PasswordHasher {
  return {
    hash: vi.fn(),
  };
}

describe('ResetUserPasswordUseCase', () => {
  it('gera hash e redefine a senha da conta de credencial', async () => {
    const repository = createRepository();
    const passwordHasher = createPasswordHasher();

    vi.mocked(repository.findCredentialAccountByEmail).mockResolvedValue({
      accountId: 'account-1',
      userId: 'user-1',
    });

    vi.mocked(passwordHasher.hash).mockResolvedValue('hashed-password');

    const useCase = new ResetUserPasswordUseCase(repository, passwordHasher);

    await useCase.execute({
      email: '  JOAO@EXAMPLE.COM ',
      password: 'nova-senha-segura',
    });

    expect(repository.findCredentialAccountByEmail).toHaveBeenCalledWith('joao@example.com');

    expect(passwordHasher.hash).toHaveBeenCalledWith('nova-senha-segura');

    expect(repository.updatePasswordAndRevokeSessions).toHaveBeenCalledWith({
      accountId: 'account-1',
      userId: 'user-1',
      passwordHash: 'hashed-password',
    });
  });

  it('não grava nada quando não existe conta de credencial', async () => {
    const repository = createRepository();
    const passwordHasher = createPasswordHasher();

    vi.mocked(repository.findCredentialAccountByEmail).mockResolvedValue(null);

    const useCase = new ResetUserPasswordUseCase(repository, passwordHasher);

    await expect(
      useCase.execute({
        email: 'joao@example.com',
        password: 'nova-senha-segura',
      }),
    ).rejects.toThrow('Usuário com credencial de senha não encontrado.');

    expect(passwordHasher.hash).not.toHaveBeenCalled();

    expect(repository.updatePasswordAndRevokeSessions).not.toHaveBeenCalled();
  });

  it('rejeita senha vazia antes de acessar o repositório', async () => {
    const repository = createRepository();
    const passwordHasher = createPasswordHasher();

    const useCase = new ResetUserPasswordUseCase(repository, passwordHasher);

    await expect(
      useCase.execute({
        email: 'joao@example.com',
        password: '',
      }),
    ).rejects.toThrow('A nova senha é obrigatória.');

    expect(repository.findCredentialAccountByEmail).not.toHaveBeenCalled();
  });
});
