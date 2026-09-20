export type CashMovementType = 'deposit' | 'withdrawal';

export interface CashMovement {
  id: string;
  type: CashMovementType;
  amountCents: number;
  description: string;
  occurredAt: string;
  createdAt: string;
}

export interface CashSummary {
  balanceCents: number;
}

export interface CreateCashMovementRequest {
  type: CashMovementType;
  amountCents: number;
  description: string;
  occurredAt?: string;
}

export interface CreateCashMovementResponse {
  movement: CashMovement;
  balanceCents: number;
}
