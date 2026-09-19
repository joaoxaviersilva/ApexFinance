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
    name: 'Usuário Teste',
    email: 'usuario@apexfinance.local',
    role: 'user',
    status: 'active',
    banReason: null,
    createdAt: '2026-09-18T18:00:00.000Z',
  },
  {
    id: 'admin-2',
    name: 'Outro Administrador',
    email: 'outro-admin@apexfinance.local',
    role: 'admin',
    status: 'active',
    banReason: null,
    createdAt: '2026-09-17T18:00:00.000Z',
  },
] as const;

describe('Gerenciamento de papéis na Administração', () => {
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

  it('permite promover USER para ADMIN e atualiza a interface', async () => {
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
            role: 'admin',
          },
        }),
      );

    render(<AdminPage />);

    const userName = await screen.findByText('Usuário Teste');
    const userItem = userName.closest('li');

    expect(userItem).not.toBeNull();

    fireEvent.click(
      within(userItem!).getByRole('button', {
        name: /tornar administrador/i,
      }),
    );

    await waitFor(() => {
      expect(fetchMock).toHaveBeenNthCalledWith(
        2,
        'http://localhost:3333/api/admin/users/user-1/role',
        expect.objectContaining({
          method: 'PATCH',
          credentials: 'include',
          headers: expect.objectContaining({
            'Content-Type': 'application/json',
          }),
          body: JSON.stringify({
            role: 'admin',
          }),
        }),
      );
    });

    await waitFor(() => {
      expect(within(userItem!).getByText('Administrador')).toBeInTheDocument();
    });
  });

  it('solicita confirmação antes de rebaixar outro ADMIN', async () => {
    const confirmMock = vi.spyOn(window, 'confirm').mockReturnValue(false);

    render(<AdminPage />);

    const adminName = await screen.findByText('Outro Administrador');

    const adminItem = adminName.closest('li');

    expect(adminItem).not.toBeNull();

    fireEvent.click(
      within(adminItem!).getByRole('button', {
        name: /tornar usuário/i,
      }),
    );

    expect(confirmMock).toHaveBeenCalledWith(
      expect.stringMatching(/remover o acesso administrativo/i),
    );

    expect(fetch).toHaveBeenCalledTimes(1);
  });

  it('rebaixa outro ADMIN quando a confirmação é aceita', async () => {
    vi.spyOn(window, 'confirm').mockReturnValue(true);

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
            role: 'user',
          },
        }),
      );

    render(<AdminPage />);

    const adminName = await screen.findByText('Outro Administrador');

    const adminItem = adminName.closest('li');

    expect(adminItem).not.toBeNull();

    fireEvent.click(
      within(adminItem!).getByRole('button', {
        name: /tornar usuário/i,
      }),
    );

    await waitFor(() => {
      expect(fetchMock).toHaveBeenNthCalledWith(
        2,
        'http://localhost:3333/api/admin/users/admin-2/role',
        expect.objectContaining({
          method: 'PATCH',
          body: JSON.stringify({
            role: 'user',
          }),
        }),
      );
    });

    await waitFor(() => {
      expect(within(adminItem!).getByText('Usuário')).toBeInTheDocument();
    });
  });

  it('não permite rebaixar o próprio ADMIN', async () => {
    render(<AdminPage />);

    const ownName = await screen.findByText('João Victor');

    const ownItem = ownName.closest('li');

    expect(ownItem).not.toBeNull();

    expect(
      within(ownItem!).getByRole('button', {
        name: /tornar usuário/i,
      }),
    ).toBeDisabled();
  });

  it('mantém o estado atual e exibe erro quando a alteração falha', async () => {
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
            error: 'Não foi possível alterar o papel.',
          },
          false,
        ),
      );

    render(<AdminPage />);

    const userName = await screen.findByText('Usuário Teste');

    const userItem = userName.closest('li');

    expect(userItem).not.toBeNull();

    fireEvent.click(
      within(userItem!).getByRole('button', {
        name: /tornar administrador/i,
      }),
    );

    expect(await screen.findByRole('alert')).toHaveTextContent(/não foi possível alterar o papel/i);

    expect(within(userItem!).getByText('Usuário')).toBeInTheDocument();
  });
});
