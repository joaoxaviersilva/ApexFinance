import { cleanup, fireEvent, render, screen, waitFor, within } from '@testing-library/react';
import { afterEach, describe, expect, it, vi } from 'vitest';

import { AdminPage } from '../src/features/admin/pages/AdminPage';

function createResponse(body: unknown, ok = true): Response {
  return {
    ok,
    json: vi.fn().mockResolvedValue(body),
  } as unknown as Response;
}

const usersResponse = {
  users: [
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
      status: 'blocked',
      banReason: 'Teste administrativo',
      createdAt: '2026-09-18T18:00:00.000Z',
    },
  ],
};

describe('Página de Administração', () => {
  afterEach(() => {
    cleanup();
    vi.unstubAllGlobals();
  });

  it('exibe o estado de carregamento enquanto busca os usuários', () => {
    const pendingRequest = new Promise<Response>(() => {});

    vi.stubGlobal('fetch', vi.fn().mockReturnValue(pendingRequest));

    render(<AdminPage />);

    expect(
      screen.getByRole('heading', {
        name: /administração/i,
      }),
    ).toBeInTheDocument();

    expect(screen.getByText(/carregando usuários/i)).toBeInTheDocument();
  });

  it('exibe os usuários retornados pela API', async () => {
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue(createResponse(usersResponse)));

    render(<AdminPage />);

    const adminName = await screen.findByText('João Victor');
    const userName = screen.getByText('Usuário Teste');

    expect(adminName).toBeInTheDocument();
    expect(userName).toBeInTheDocument();

    const adminItem = adminName.closest('li');
    const userItem = userName.closest('li');

    expect(adminItem).not.toBeNull();
    expect(userItem).not.toBeNull();

    expect(within(adminItem!).getByText('joao@apexfinance.local')).toBeInTheDocument();

    expect(within(adminItem!).getByText('Administrador')).toBeInTheDocument();

    expect(within(adminItem!).getByText('Ativo')).toBeInTheDocument();

    expect(within(userItem!).getByText('usuario@apexfinance.local')).toBeInTheDocument();

    expect(within(userItem!).getByText('Usuário')).toBeInTheDocument();

    expect(within(userItem!).getByText('Bloqueado')).toBeInTheDocument();
  });

  it('filtra usuários por nome e e-mail', async () => {
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue(createResponse(usersResponse)));

    render(<AdminPage />);

    await screen.findByText('João Victor');

    const searchInput = screen.getByRole('searchbox', {
      name: /buscar usuários/i,
    });

    fireEvent.change(searchInput, {
      target: {
        value: 'teste',
      },
    });

    expect(screen.getByText('Usuário Teste')).toBeInTheDocument();

    expect(screen.queryByText('João Victor')).not.toBeInTheDocument();

    fireEvent.change(searchInput, {
      target: {
        value: 'joao@apexfinance.local',
      },
    });

    expect(screen.getByText('João Victor')).toBeInTheDocument();

    expect(screen.queryByText('Usuário Teste')).not.toBeInTheDocument();
  });

  it('exibe feedback quando a busca não encontra usuários', async () => {
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue(createResponse(usersResponse)));

    render(<AdminPage />);

    await screen.findByText('João Victor');

    fireEvent.change(
      screen.getByRole('searchbox', {
        name: /buscar usuários/i,
      }),
      {
        target: {
          value: 'ninguém com esse nome',
        },
      },
    );

    expect(screen.getByText(/nenhum usuário corresponde à sua busca/i)).toBeInTheDocument();
  });

  it('exibe estado vazio quando não existem usuários', async () => {
    vi.stubGlobal(
      'fetch',
      vi.fn().mockResolvedValue(
        createResponse({
          users: [],
        }),
      ),
    );

    render(<AdminPage />);

    expect(await screen.findByText(/nenhum usuário encontrado/i)).toBeInTheDocument();
  });

  it('exibe feedback quando a API falha', async () => {
    vi.stubGlobal(
      'fetch',
      vi.fn().mockResolvedValue(
        createResponse(
          {
            error: 'Falha ao listar usuários.',
          },
          false,
        ),
      ),
    );

    render(<AdminPage />);

    await waitFor(() => {
      expect(screen.getByText(/não foi possível carregar os usuários/i)).toBeInTheDocument();
    });
  });

  it('consulta o endpoint administrativo com credenciais', async () => {
    const fetchMock = vi.fn().mockResolvedValue(
      createResponse({
        users: [],
      }),
    );

    vi.stubGlobal('fetch', fetchMock);

    render(<AdminPage />);

    await waitFor(() => {
      expect(fetchMock).toHaveBeenCalledWith(
        'http://localhost:3333/api/admin/users',
        expect.objectContaining({
          credentials: 'include',
        }),
      );
    });
  });
});
