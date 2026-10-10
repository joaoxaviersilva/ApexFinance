import type {
  CashMovement,
  CashMovementType,
  CashSummary,
  CreateCashMovementRequest,
  CreateCashMovementResponse,
} from '@apexfinance/contracts';
import { useEffect, useRef, useState } from 'react';

import '../cash.css';
import '../cash-movement-form.css';

import { CashMovementForm } from '../components/CashMovementForm';
import { CashMovementList } from '../components/CashMovementList';
import { CashSummaryCard } from '../components/CashSummaryCard';

const apiBaseUrl = import.meta.env.VITE_API_URL ?? 'http://localhost:3333';

const mutationErrorMessage = 'Não foi possível registrar a movimentação. Tente novamente.';

type SummaryState = {
  status: 'loading' | 'success' | 'error';
  balanceCents: number | null;
};

type MovementsState = {
  status: 'loading' | 'success' | 'error';
  movements: CashMovement[];
};

type CashMovementsResponse = {
  movements: CashMovement[];
};

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value);
}

function isCashSummary(value: unknown): value is CashSummary {
  return (
    isRecord(value) &&
    typeof value.balanceCents === 'number' &&
    Number.isSafeInteger(value.balanceCents) &&
    value.balanceCents >= 0
  );
}

function isCashMovement(value: unknown): value is CashMovement {
  if (!isRecord(value)) {
    return false;
  }

  return (
    typeof value.id === 'string' &&
    (value.type === 'deposit' || value.type === 'withdrawal') &&
    typeof value.amountCents === 'number' &&
    Number.isSafeInteger(value.amountCents) &&
    value.amountCents > 0 &&
    typeof value.description === 'string' &&
    typeof value.occurredAt === 'string' &&
    typeof value.createdAt === 'string'
  );
}

function isCashMovementsResponse(value: unknown): value is CashMovementsResponse {
  return isRecord(value) && Array.isArray(value.movements) && value.movements.every(isCashMovement);
}

function isCashCreationResponse(value: unknown): value is CreateCashMovementResponse {
  return isRecord(value) && isCashSummary(value) && isCashMovement(value.movement);
}

async function fetchCashSummary(): Promise<CashSummary> {
  const response = await fetch(`${apiBaseUrl}/api/cash/summary`, {
    credentials: 'include',
    headers: {
      Accept: 'application/json',
    },
  });

  if (!response.ok) {
    throw new Error('Falha ao consultar o saldo.');
  }

  const payload: unknown = await response.json();

  if (!isCashSummary(payload)) {
    throw new Error('Resposta de saldo inválida.');
  }

  return payload;
}

async function fetchCashMovements(): Promise<CashMovement[]> {
  const response = await fetch(`${apiBaseUrl}/api/cash/movements`, {
    credentials: 'include',
    headers: {
      Accept: 'application/json',
    },
  });

  if (!response.ok) {
    throw new Error('Falha ao consultar as movimentações.');
  }

  const payload: unknown = await response.json();

  if (!isCashMovementsResponse(payload)) {
    throw new Error('Resposta de movimentações inválida.');
  }

  return payload.movements;
}

async function createCashMovement(
  input: CreateCashMovementRequest,
): Promise<CreateCashMovementResponse> {
  let response: Response;

  try {
    response = await fetch(`${apiBaseUrl}/api/cash/movements`, {
      method: 'POST',
      credentials: 'include',
      headers: {
        Accept: 'application/json',
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(input),
    });
  } catch {
    throw new Error(mutationErrorMessage);
  }

  if (!response.ok) {
    if (response.status === 409) {
      const payload: unknown = await response.json().catch(() => null);

      if (
        isRecord(payload) &&
        (payload.code === 'INSUFFICIENT_CASH_BALANCE' ||
          payload.code === 'CASH_CONCURRENCY_CONFLICT') &&
        typeof payload.error === 'string'
      ) {
        throw new Error(payload.error);
      }
    }

    throw new Error(mutationErrorMessage);
  }

  const payload: unknown = await response.json().catch(() => null);

  if (!isCashCreationResponse(payload)) {
    throw new Error(mutationErrorMessage);
  }

  return payload;
}

function sortMovements(movements: CashMovement[]): CashMovement[] {
  return [...movements].sort((first, second) => {
    const occurredAtDifference =
      new Date(second.occurredAt).getTime() - new Date(first.occurredAt).getTime();

    if (occurredAtDifference !== 0) {
      return occurredAtDifference;
    }

    return new Date(second.createdAt).getTime() - new Date(first.createdAt).getTime();
  });
}

export function CashPage() {
  const [summary, setSummary] = useState<SummaryState>({
    status: 'loading',
    balanceCents: null,
  });

  const [history, setHistory] = useState<MovementsState>({
    status: 'loading',
    movements: [],
  });

  const [activeMovementType, setActiveMovementType] = useState<CashMovementType | null>(null);

  const isMountedRef = useRef(false);
  const requestGenerationRef = useRef(0);

  useEffect(() => {
    isMountedRef.current = true;

    const generation = ++requestGenerationRef.current;
    let isActive = true;

    void fetchCashSummary()
      .then((payload) => {
        if (isActive && generation === requestGenerationRef.current) {
          setSummary({
            status: 'success',
            balanceCents: payload.balanceCents,
          });
        }
      })
      .catch(() => {
        if (isActive && generation === requestGenerationRef.current) {
          setSummary({
            status: 'error',
            balanceCents: null,
          });
        }
      });

    void fetchCashMovements()
      .then((movements) => {
        if (isActive && generation === requestGenerationRef.current) {
          setHistory({
            status: 'success',
            movements,
          });
        }
      })
      .catch(() => {
        if (isActive && generation === requestGenerationRef.current) {
          setHistory({
            status: 'error',
            movements: [],
          });
        }
      });

    return () => {
      isActive = false;
      isMountedRef.current = false;
    };
  }, []);

  function openMovement(type: CashMovementType) {
    setActiveMovementType(type);
  }

  function closeMovement() {
    setActiveMovementType(null);
  }

  function refreshAfterCreation(generation: number) {
    void fetchCashSummary()
      .then((payload) => {
        if (isMountedRef.current && generation === requestGenerationRef.current) {
          setSummary({
            status: 'success',
            balanceCents: payload.balanceCents,
          });
        }
      })
      .catch(() => {
        // Mantém o saldo confirmado pelo POST.
      });

    void fetchCashMovements()
      .then((movements) => {
        if (isMountedRef.current && generation === requestGenerationRef.current) {
          setHistory({
            status: 'success',
            movements,
          });
        }
      })
      .catch(() => {
        // Mantém o histórico existente.
      });
  }

  async function handleCreateMovement(input: CreateCashMovementRequest): Promise<void> {
    const created = await createCashMovement(input);

    if (!isMountedRef.current) {
      return;
    }

    const generation = ++requestGenerationRef.current;

    setSummary({
      status: 'success',
      balanceCents: created.balanceCents,
    });

    setHistory((currentHistory) => ({
      status: 'success',
      movements: sortMovements([
        created.movement,
        ...currentHistory.movements.filter((movement) => movement.id !== created.movement.id),
      ]),
    }));

    closeMovement();
    refreshAfterCreation(generation);
  }

  return (
    <section className="cash-page" aria-labelledby="cash-page-title">
      <header className="cash-page__header">
        <p>CAIXA GERAL</p>

        <h1 id="cash-page-title">Caixa</h1>

        <p>Seu saldo disponível e movimentações.</p>
      </header>

      <CashSummaryCard
        status={summary.status}
        balanceCents={summary.balanceCents}
        onNewDeposit={() => openMovement('deposit')}
        onNewWithdrawal={() => openMovement('withdrawal')}
      />

      <CashMovementList status={history.status} movements={history.movements} />

      {activeMovementType !== null && (
        <CashMovementForm
          type={activeMovementType}
          onClose={closeMovement}
          onSubmit={handleCreateMovement}
        />
      )}
    </section>
  );
}
