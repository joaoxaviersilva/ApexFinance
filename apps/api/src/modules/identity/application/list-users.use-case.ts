export interface AdminUserListItem {
  id: string;
  name: string;
  email: string;
  role: string | null;
  createdAt: Date;
}

export interface UserRepository {
  listUsers(): Promise<AdminUserListItem[]>;
}

export class ListUsersUseCase {
  constructor(private readonly userRepository: UserRepository) {}

  async execute(): Promise<AdminUserListItem[]> {
    return this.userRepository.listUsers();
  }
}
