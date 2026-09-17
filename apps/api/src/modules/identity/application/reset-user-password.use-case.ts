export interface CredentialAccount {
  accountId: string;
  userId: string;
}

export interface UpdatePasswordInput {
  accountId: string;
  userId: string;
  passwordHash: string;
}

export interface PasswordResetRepository {
  findCredentialAccountByEmail(email: string): Promise<CredentialAccount | null>;

  updatePasswordAndRevokeSessions(input: UpdatePasswordInput): Promise<void>;
}

export interface PasswordHasher {
  hash(password: string): Promise<string>;
}

export interface ResetUserPasswordInput {
  email: string;
  password: string;
}

export class ResetUserPasswordUseCase {
  constructor(
    private readonly repository: PasswordResetRepository,
    private readonly passwordHasher: PasswordHasher,
  ) {}

  async execute(input: ResetUserPasswordInput): Promise<void> {
    const email = input.email.trim().toLowerCase();

    if (!input.password) {
      throw new Error('A nova senha é obrigatória.');
    }

    const credentialAccount = await this.repository.findCredentialAccountByEmail(email);

    if (!credentialAccount) {
      throw new Error('Usuário com credencial de senha não encontrado.');
    }

    const passwordHash = await this.passwordHasher.hash(input.password);

    await this.repository.updatePasswordAndRevokeSessions({
      accountId: credentialAccount.accountId,
      userId: credentialAccount.userId,
      passwordHash,
    });
  }
}
