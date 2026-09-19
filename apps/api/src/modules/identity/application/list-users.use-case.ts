import type { AdminUser } from '@apexfinance/contracts';

export interface UserRepository {
  listUsers(): Promise<AdminUser[]>;
}

export class ListUsersUseCase {
  constructor(private readonly userRepository: UserRepository) {}

  async execute(): Promise<AdminUser[]> {
    return this.userRepository.listUsers();
  }
}
