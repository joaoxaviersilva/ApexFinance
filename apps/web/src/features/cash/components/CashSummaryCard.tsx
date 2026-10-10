import { formatCashCents } from '../format-cash';

type CashSummaryCardProps = {
  status: 'loading' | 'success' | 'error';
  balanceCents: number | null;
  onNewDeposit: () => void;
  onNewWithdrawal: () => void;
};

export function CashSummaryCard({
  status,
  balanceCents,
  onNewDeposit,
  onNewWithdrawal,
}: CashSummaryCardProps) {
  return (
    <section className="cash-summary-card" aria-labelledby="cash-summary-title">
      <div className="cash-summary-card__header">
        <div>
          <p className="cash-summary-card__eyebrow">DISPONIBILIDADE FINANCEIRA</p>

          <h2 id="cash-summary-title">Saldo atual</h2>
        </div>

        <div className="cash-summary-card__indicator" aria-hidden="true">
          <span />
          CAIXA GERAL
        </div>
      </div>

      <div className="cash-summary-card__balance" aria-live="polite">
        {status === 'loading' && <p className="cash-summary-card__state">Carregando saldo...</p>}

        {status === 'error' && (
          <p className="cash-summary-card__error" role="alert">
            Não foi possível carregar o saldo.
          </p>
        )}

        {status === 'success' && balanceCents !== null && (
          <strong className="cash-summary-card__value">{formatCashCents(balanceCents)}</strong>
        )}
      </div>

      <p className="cash-summary-card__description">
        Saldo calculado a partir das movimentações registradas no seu caixa.
      </p>

      <div className="cash-summary-card__actions">
        <button
          type="button"
          className="cash-action-button cash-action-button--deposit"
          onClick={onNewDeposit}
        >
          <span aria-hidden="true">+</span>
          Nova entrada
        </button>

        <button
          type="button"
          className="cash-action-button cash-action-button--withdrawal"
          onClick={onNewWithdrawal}
        >
          <span aria-hidden="true">−</span>
          Nova saída
        </button>
      </div>
    </section>
  );
}
