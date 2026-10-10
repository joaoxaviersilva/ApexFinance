import type { CashMovement } from '@apexfinance/contracts';

import { formatCashCents } from '../format-cash';

type CashMovementListProps = {
  status: 'loading' | 'success' | 'error';
  movements: CashMovement[];
};

function formatMovementDate(value: string): string {
  const date = new Date(value);

  if (Number.isNaN(date.getTime())) {
    return 'Data indisponível';
  }

  return new Intl.DateTimeFormat('pt-BR', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
  }).format(date);
}

export function CashMovementList({ status, movements }: CashMovementListProps) {
  return (
    <section className="cash-movements" aria-labelledby="cash-movements-title">
      <header className="cash-movements__header">
        <div>
          <p className="cash-movements__eyebrow">REGISTROS FINANCEIROS</p>

          <h2 id="cash-movements-title">Movimentações</h2>
        </div>

        {status === 'success' && (
          <span className="cash-movements__count">
            {movements.length} {movements.length === 1 ? 'registro' : 'registros'}
          </span>
        )}
      </header>

      {status === 'loading' && (
        <div className="cash-movements__state" role="status">
          <span className="cash-movements__spinner" aria-hidden="true" />

          <p>Carregando movimentações...</p>
        </div>
      )}

      {status === 'error' && (
        <div className="cash-movements__state cash-movements__state--error" role="alert">
          <p>Não foi possível carregar as movimentações.</p>
        </div>
      )}

      {status === 'success' && movements.length === 0 && (
        <div className="cash-movements__state cash-movements__state--empty">
          <div className="cash-movements__empty-icon" aria-hidden="true">
            <span />
            <span />
            <span />
          </div>

          <strong>Seu histórico está vazio</strong>

          <p>Nenhuma movimentação registrada.</p>
        </div>
      )}

      {status === 'success' && movements.length > 0 && (
        <ul className="cash-movements__list" aria-label="Histórico de movimentações">
          {movements.map((movement) => {
            const isDeposit = movement.type === 'deposit';

            return (
              <li className="cash-movement" key={movement.id}>
                <span
                  className={
                    isDeposit
                      ? 'cash-movement__icon cash-movement__icon--deposit'
                      : 'cash-movement__icon cash-movement__icon--withdrawal'
                  }
                  aria-hidden="true"
                >
                  {isDeposit ? '↙' : '↗'}
                </span>

                <div className="cash-movement__details">
                  <strong>{movement.description}</strong>

                  <div className="cash-movement__metadata">
                    <span>{isDeposit ? 'Entrada' : 'Saída'}</span>

                    <span aria-hidden="true">·</span>

                    <time dateTime={movement.occurredAt}>
                      {formatMovementDate(movement.occurredAt)}
                    </time>
                  </div>
                </div>

                <strong
                  className={
                    isDeposit
                      ? 'cash-movement__amount cash-movement__amount--deposit'
                      : 'cash-movement__amount cash-movement__amount--withdrawal'
                  }
                >
                  {isDeposit ? '+' : '-'} {formatCashCents(movement.amountCents)}
                </strong>
              </li>
            );
          })}
        </ul>
      )}
    </section>
  );
}
