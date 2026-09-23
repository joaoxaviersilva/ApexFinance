import type { CashMovement } from '@apexfinance/contracts';

type CashRepository = {
  listMovementsForUser(userId: string): Promise<CashMovement[]>;
};

export class ListCashMovementsUseCase {
  constructor(private readonly cashRepository: CashRepository) {}

  async execute(userId: string): Promise<{
    movements: CashMovement[];
  }> {
    const movements = await this.cashRepository.listMovementsForUser(userId);

    return {
      movements,
    };
  }
}
