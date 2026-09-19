export type { AdminUser, AdminUserStatus, UserRole } from './admin.js';

export interface HealthResponse {
  status: 'ok';
  service: 'apexfinance-api';
}
