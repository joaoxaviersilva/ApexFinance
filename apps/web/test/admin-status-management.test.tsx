import { cleanup, fireEvent, render, screen, waitFor, within } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

const authMocks = vi.hoisted(() => ({
  useSession: vi.fn(),
}));

vi.mock('../src/shared/lib/auth-client', () => ({
  authClient: {
    useSession: authMocks.useSession,
  },
}));

import { AdminPage } from '../src/features/admin/pages/AdminPage';

function createResponse(body: unknown, ok = true): Response {
  return {
    ok,
    json: vi.fn().mockResolvedValue(body),
  } as unknown as Response;
}

function authenticatedAdminSession() {
  return {
    data: {
      user: {
        id: 'admin-1',
        name: 'João Victor',
        email: 'joao@apexfinance.local',
        role: 'admin',
      },
      session: {
        id: 'session-1',
        userId: 'admin-1',
      },
    },
    isPending: false,
    error: null,
    refetch: vi.fn(),
  };
}

const users = [
  {
    id: 'admin-1',
    name: 'João Victor',
    email: 'joao@apexfinance.local',
    role: 'admin',
    status: 'active',
    banReason: null,
    createdAt: '2026-09-19T18:00:00.000Z',
  },
  {
    id: 'user-1',
    name: 'Usuário Ativo',
    email: 'ativo@apexfinance.local',
    role: 'user',
    status: 'active',
    banReason: null,
    createdAt: '2026-09-18T18:00:00.000Z',
  },
  {
    id: 'user-2',
    name: 'Usuário Bloqueado',
    email: 'bloqueado@apexfinance.local',
    role: 'user',
    status: 'blocked',
    banReason: 'Acesso suspenso anteriormente.',
    createdAt: '2026-09-17T18:00:00.000Z',
  },
] as const;

describe('Gerenciamento de status na Administração', () => {
  beforeEach(() => {
    authMocks.useSession.mockReset();
    authMocks.useSession.mockReturnValue(authenticatedAdminSession());

    vi.stubGlobal(
      'fetch',
      vi.fn().mockResolvedValue(
        createResponse({
          users,
        }),
      ),
    );
  });

  afterEach(() => {
    cleanup();

    vi.unstubAllGlobals();
    vi.restoreAllMocks();
  });

  it('abre o diálogo de bloqueio para um usuário ativo', async () => {
    render(<AdminPage />);

    const userName = await screen.findByText('Usuário Ativo');

    const userItem = userName.closest('li');

    expect(userItem).not.toBeNull();

    fireEvent.click(
      within(userItem!).getByRole('button', {
        name: /bloquear usuário/i,
      }),
    );

    expect(
      screen.getByRole('dialog', {
        name: /bloquear usuário/i,
      }),
    ).toBeInTheDocument();

    expect(
      screen.getByRole('textbox', {
        name: /motivo do bloqueio/i,
      }),
    ).toBeInTheDocument();
  });

  it('não permite confirmar bloqueio sem motivo', async () => {
    render(<AdminPage />);

    const userName = await screen.findByText('Usuário Ativo');

    const userItem = userName.closest('li');

    expect(userItem).not.toBeNull();

    fireEvent.click(
      within(userItem!).getByRole('button', {
        name: /bloquear usuário/i,
      }),
    );

    expect(
      screen.getByRole('button', {
        name: /confirmar bloqueio/i,
      }),
    ).toBeDisabled();
  });

  it('bloqueia o usuário com motivo e atualiza a interface', async () => {
    const fetchMock = vi.mocked(fetch);

    fetchMock
      .mockResolvedValueOnce(
        createResponse({
          users,
        }),
      )
      .mockResolvedValueOnce(
        createResponse({
          user: {
            ...users[1],
            status: 'blocked',
            banReason: 'Acesso suspenso pelo administrador.',
          },
        }),
      );

    render(<AdminPage />);

    const userName = await screen.findByText('Usuário Ativo');

    const userItem = userName.closest('li');

    expect(userItem).not.toBeNull();

    fireEvent.click(
      within(userItem!).getByRole('button', {
        name: /bloquear usuário/i,
      }),
    );

    fireEvent.change(
      screen.getByRole('textbox', {
        name: /motivo do bloqueio/i,
      }),
      {
        target: {
          value: 'Acesso suspenso pelo administrador.',
        },
      },
    );

    fireEvent.click(
      screen.getByRole('button', {
        name: /confirmar bloqueio/i,
      }),
    );

    await waitFor(() => {
      expect(fetchMock).toHaveBeenNthCalledWith(
        2,
        'http://localhost:3333/api/admin/users/user-1/status',
        expect.objectContaining({
          method: 'PATCH',
          credentials: 'include',
          headers: expect.objectContaining({
            'Content-Type': 'application/json',
          }),
          body: JSON.stringify({
            status: 'blocked',
            reason: 'Acesso suspenso pelo administrador.',
          }),
        }),
      );
    });

    await waitFor(() => {
      expect(within(userItem!).getByText('Bloqueado')).toBeInTheDocument();
    });

    expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
  });

  it('desbloqueia um usuário bloqueado', async () => {
    const fetchMock = vi.mocked(fetch);

    fetchMock
      .mockResolvedValueOnce(
        createResponse({
          users,
        }),
      )
      .mockResolvedValueOnce(
        createResponse({
          user: {
            ...users[2],
            status: 'active',
            banReason: null,
          },
        }),
      );

    render(<AdminPage />);

    const userName = await screen.findByText('Usuário Bloqueado');

    const userItem = userName.closest('li');

    expect(userItem).not.toBeNull();

    fireEvent.click(
      within(userItem!).getByRole('button', {
        name: /desbloquear usuário/i,
      }),
    );

    await waitFor(() => {
      expect(fetchMock).toHaveBeenNthCalledWith(
        2,
        'http://localhost:3333/api/admin/users/user-2/status',
        expect.objectContaining({
          method: 'PATCH',
          credentials: 'include',
          body: JSON.stringify({
            status: 'active',
          }),
        }),
      );
    });

    await waitFor(() => {
      expect(within(userItem!).getByText('Ativo')).toBeInTheDocument();
    });
  });

  it('não permite bloquear a própria conta', async () => {
    render(<AdminPage />);

    const ownName = await screen.findByText('João Victor');

    const ownItem = ownName.closest('li');

    expect(ownItem).not.toBeNull();

    expect(
      within(ownItem!).getByRole('button', {
        name: /bloquear usuário/i,
      }),
    ).toBeDisabled();
  });

  it('exibe o motivo existente para um usuário bloqueado', async () => {
    render(<AdminPage />);

    const userName = await screen.findByText('Usuário Bloqueado');

    const userItem = userName.closest('li');

    expect(userItem).not.toBeNull();

    expect(within(userItem!).getByText('Acesso suspenso anteriormente.')).toBeInTheDocument();
  });

  it('mantém o estado atual e exibe erro quando o bloqueio falha', async () => {
    const fetchMock = vi.mocked(fetch);

    fetchMock
      .mockResolvedValueOnce(
        createResponse({
          users,
        }),
      )
      .mockResolvedValueOnce(
        createResponse(
          {
            error: 'Não foi possível alterar o acesso.',
          },
          false,
        ),
      );

    render(<AdminPage />);

    const userName = await screen.findByText('Usuário Ativo');

    const userItem = userName.closest('li');

    expect(userItem).not.toBeNull();

    fireEvent.click(
      within(userItem!).getByRole('button', {
        name: /bloquear usuário/i,
      }),
    );

    fireEvent.change(
      screen.getByRole('textbox', {
        name: /motivo do bloqueio/i,
      }),
      {
        target: {
          value: 'Teste administrativo',
        },
      },
    );

    fireEvent.click(
      screen.getByRole('button', {
        name: /confirmar bloqueio/i,
      }),
    );

    expect(await screen.findByRole('alert')).toHaveTextContent(
      /não foi possível alterar o acesso/i,
    );

    expect(within(userItem!).getByText('Ativo')).toBeInTheDocument();
  });
});
