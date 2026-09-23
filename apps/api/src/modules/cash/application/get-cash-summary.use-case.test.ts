import { beforeEach, describe, expect, it, vi } from 'vitest';

const repositoryMocks = {
  getBalanceForUser: vi.fn(),
};

import { GetCashSummaryUseCase } from './get-cash-summary.use-case';

describe('GetCashSummaryUseCase', () => {
  beforeEach(() => {
    repositoryMocks.getBalanceForUser.mockReset();
  });

  it('retorna saldo zero para um usuário sem movimentos', async () => {
    repositoryMocks.getBalanceForUser.mockResolvedValue(0);

    const useCase = new GetCashSummaryUseCase(repositoryMocks);

    const result = await useCase.execute('user-1');

    expect(repositoryMocks.getBalanceForUser).toHaveBeenCalledWith('user-1');

    expect(result).toEqual({
      balanceCents: 0,
    });
  });

  it('retorna somente o saldo pertencente ao usuário informado', async () => {
    repositoryMocks.getBalanceForUser.mockResolvedValue(125050);

    const useCase = new GetCashSummaryUseCase(repositoryMocks);

    const result = await useCase.execute('user-2');

    expect(repositoryMocks.getBalanceForUser).toHaveBeenCalledTimes(1);

    expect(repositoryMocks.getBalanceForUser).toHaveBeenCalledWith('user-2');

    expect(result).toEqual({
      balanceCents: 125050,
    });
  });
});
