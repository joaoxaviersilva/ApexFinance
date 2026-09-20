export type { AdminUser, AdminUserStatus, UserRole } from './admin.js';

export type {
  CashMovement,
  CashMovementType,
  CashSummary,
  CreateCashMovementRequest,
  CreateCashMovementResponse,
} from './cash.js';

export interface HealthResponse {
  status: 'ok';
  service: 'apexfinance-api';
}
