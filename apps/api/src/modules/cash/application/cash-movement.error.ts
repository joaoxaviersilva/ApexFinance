export type CashMovementErrorCode = 'INSUFFICIENT_CASH_BALANCE' | 'CASH_CONCURRENCY_CONFLICT';

export class CashMovementError extends Error {
  constructor(
    public readonly code: CashMovementErrorCode,
    message: string,
  ) {
    super(message);

    this.name = 'CashMovementError';
  }
}
