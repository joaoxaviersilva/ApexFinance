export type UserRole = 'user' | 'admin';

export type AdminUserStatus = 'active' | 'blocked';

export interface AdminUser {
  id: string;
  name: string;
  email: string;
  role: UserRole;
  status: AdminUserStatus;
  banReason: string | null;
  createdAt: string;
}
