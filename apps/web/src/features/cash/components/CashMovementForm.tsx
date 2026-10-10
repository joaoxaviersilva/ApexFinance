import type { CashMovementType, CreateCashMovementRequest } from '@apexfinance/contracts';
import { useEffect, useRef, useState } from 'react';
import type { FormEvent, KeyboardEvent } from 'react';
import { createPortal } from 'react-dom';

type CashMovementFormProps = {
  type: CashMovementType;
  onClose: () => void;
  onSubmit: (input: CreateCashMovementRequest) => Promise<void>;
};

const BRL_AMOUNT_PATTERN = /^(?:0|[1-9]\d*|[1-9]\d{0,2}(?:\.\d{3})+)(?:,\d{1,2})?$/;

function parseCashAmount(value: string): number | null {
  const normalized = value.trim();

  if (!BRL_AMOUNT_PATTERN.test(normalized)) {
    return null;
  }

  const [integerPart, decimalPart = ''] = normalized.split(',');

  const reais = BigInt(integerPart.replace(/\./g, ''));
  const centavos = BigInt(decimalPart.padEnd(2, '0') || '00');

  const totalCents = reais * 100n + centavos;

  if (totalCents <= 0n || totalCents > BigInt(Number.MAX_SAFE_INTEGER)) {
    return null;
  }

  return Number(totalCents);
}

export function CashMovementForm({ type, onClose, onSubmit }: CashMovementFormProps) {
  const [amount, setAmount] = useState('');
  const [description, setDescription] = useState('');
  const [localDate, setLocalDate] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const dialogRef = useRef<HTMLElement>(null);
  const amountRef = useRef<HTMLInputElement>(null);

  const isDeposit = type === 'deposit';

  const title = isDeposit ? 'Nova entrada' : 'Nova saída';
  const submitLabel = isDeposit ? 'Registrar entrada' : 'Registrar saída';

  useEffect(() => {
    const previouslyFocused = document.activeElement;
    const previousOverflow = document.body.style.overflow;

    document.body.style.overflow = 'hidden';

    amountRef.current?.focus();

    return () => {
      document.body.style.overflow = previousOverflow;

      if (previouslyFocused instanceof HTMLElement) {
        previouslyFocused.focus();
      }
    };
  }, []);

  function handleDialogKeyDown(event: KeyboardEvent<HTMLElement>) {
    if (event.key === 'Escape') {
      event.preventDefault();

      if (!isSubmitting) {
        onClose();
      }

      return;
    }

    if (event.key !== 'Tab') {
      return;
    }

    const focusableElements = Array.from(
      dialogRef.current?.querySelectorAll<HTMLElement>(
        'input:not(:disabled), textarea:not(:disabled), button:not(:disabled)',
      ) ?? [],
    );

    if (focusableElements.length === 0) {
      event.preventDefault();
      return;
    }

    const first = focusableElements[0];
    const last = focusableElements[focusableElements.length - 1];

    if (event.shiftKey && document.activeElement === first) {
      event.preventDefault();
      last.focus();
    } else if (!event.shiftKey && document.activeElement === last) {
      event.preventDefault();
      first.focus();
    }
  }

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    if (isSubmitting) {
      return;
    }

    const amountCents = parseCashAmount(amount);
    const normalizedDescription = description.trim();

    if (amountCents === null) {
      setError('Informe um valor válido, maior que zero, com até duas casas decimais.');
      return;
    }

    if (normalizedDescription.length === 0 || normalizedDescription.length > 160) {
      setError('A descrição deve conter de 1 a 160 caracteres.');
      return;
    }

    let occurredAt: string | undefined;

    if (localDate) {
      const parsedDate = new Date(localDate);

      if (Number.isNaN(parsedDate.getTime())) {
        setError('Informe uma data e hora válidas.');
        return;
      }

      occurredAt = parsedDate.toISOString();
    }

    setError(null);
    setIsSubmitting(true);

    try {
      await onSubmit({
        type,
        amountCents,
        description: normalizedDescription,
        ...(occurredAt ? { occurredAt } : {}),
      });
    } catch (caughtError) {
      setError(
        caughtError instanceof Error
          ? caughtError.message
          : 'Não foi possível registrar a movimentação. Tente novamente.',
      );
    } finally {
      setIsSubmitting(false);
    }
  }

  return createPortal(
    <div className="cash-dialog-backdrop">
      <section
        ref={dialogRef}
        className="cash-dialog"
        role="dialog"
        aria-modal="true"
        aria-labelledby="cash-dialog-title"
        aria-describedby="cash-dialog-description"
        onKeyDown={handleDialogKeyDown}
      >
        <form
          className="cash-dialog__form"
          noValidate
          onSubmit={(event) => {
            void handleSubmit(event);
          }}
        >
          <header className="cash-dialog__header">
            <span className="cash-dialog__eyebrow">MOVIMENTAÇÃO FINANCEIRA</span>

            <h2 id="cash-dialog-title">{title}</h2>

            <p id="cash-dialog-description">
              {isDeposit
                ? 'Registre um valor recebido no seu caixa.'
                : 'Registre um valor retirado do seu caixa.'}
            </p>
          </header>

          <div className="cash-dialog__fields">
            <div className="cash-dialog__field">
              <label htmlFor="cash-movement-amount">Valor (R$)</label>

              <input
                ref={amountRef}
                id="cash-movement-amount"
                type="text"
                inputMode="decimal"
                autoComplete="off"
                placeholder="0,00"
                value={amount}
                disabled={isSubmitting}
                onChange={(event) => {
                  setAmount(event.target.value);
                  setError(null);
                }}
              />

              <small>Exemplo: 1.234,56</small>
            </div>

            <div className="cash-dialog__field">
              <label htmlFor="cash-movement-description">Descrição</label>

              <input
                id="cash-movement-description"
                type="text"
                maxLength={160}
                placeholder="Ex.: Aporte mensal"
                value={description}
                disabled={isSubmitting}
                onChange={(event) => {
                  setDescription(event.target.value);
                  setError(null);
                }}
              />
            </div>

            <div className="cash-dialog__field">
              <label htmlFor="cash-movement-date">Data e hora (opcional)</label>

              <input
                id="cash-movement-date"
                type="datetime-local"
                value={localDate}
                disabled={isSubmitting}
                onChange={(event) => {
                  setLocalDate(event.target.value);
                  setError(null);
                }}
              />

              <small>Se não informar, será utilizada a data atual.</small>
            </div>
          </div>

          {error && (
            <p className="cash-dialog__error" role="alert">
              {error}
            </p>
          )}

          <div className="cash-dialog__actions">
            <button
              type="button"
              className="cash-dialog__cancel"
              disabled={isSubmitting}
              onClick={onClose}
            >
              Cancelar
            </button>

            <button
              type="submit"
              className={
                isDeposit
                  ? 'cash-dialog__submit cash-dialog__submit--deposit'
                  : 'cash-dialog__submit cash-dialog__submit--withdrawal'
              }
              disabled={isSubmitting}
            >
              {isSubmitting ? 'Registrando...' : submitLabel}
            </button>
          </div>
        </form>
      </section>
    </div>,
    document.body,
  );
}
