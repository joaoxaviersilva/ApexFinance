import type {
  CashMovementType,
  CreateCashMovementRequest,
  CreateCashMovementResponse,
} from '@apexfinance/contracts';

type CreateCashMovementInput = CreateCashMovementRequest & {
  userId: string;
};

type AppendMovementForUserInput = {
  userId: string;
  type: CashMovementType;
  amountCents: number;
  description: string;
  occurredAt: Date;
};

type CashRepository = {
  appendMovementForUser(input: AppendMovementForUserInput): Promise<CreateCashMovementResponse>;
};

export class CreateCashMovementUseCase {
  constructor(private readonly cashRepository: CashRepository) {}

  async execute(input: CreateCashMovementInput): Promise<CreateCashMovementResponse> {
    const occurredAt = input.occurredAt ? new Date(input.occurredAt) : new Date();

    return this.cashRepository.appendMovementForUser({
      userId: input.userId,
      type: input.type,
      amountCents: input.amountCents,
      description: input.description.trim(),
      occurredAt,
    });
  }
}
