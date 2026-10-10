const integerFormatter = new Intl.NumberFormat('pt-BR');

export function formatCashCents(amountCents: number): string {
  if (!Number.isSafeInteger(amountCents)) {
    throw new Error('Valor monetário inválido.');
  }

  const amount = BigInt(amountCents);

  const isNegative = amount < 0n;

  const absoluteAmount = isNegative ? -amount : amount;

  const reais = absoluteAmount / 100n;

  const centavos = absoluteAmount % 100n;

  const formattedReais = integerFormatter.format(reais);

  const formattedCentavos = centavos.toString().padStart(2, '0');

  return `${isNegative ? '-' : ''}R$ ${formattedReais},${formattedCentavos}`;
}
