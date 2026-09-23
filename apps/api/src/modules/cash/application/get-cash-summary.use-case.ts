import type { CashSummary } from '@apexfinance/contracts';

type CashRepository = {
  getBalanceForUser(userId: string): Promise<number>;
};

export class GetCashSummaryUseCase {
  constructor(private readonly cashRepository: CashRepository) {}

  async execute(userId: string): Promise<CashSummary> {
    const balanceCents = await this.cashRepository.getBalanceForUser(userId);

    return {
      balanceCents,
    };
  }
}
