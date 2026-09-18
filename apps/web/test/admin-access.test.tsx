import { cleanup, render, screen, waitFor } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { BrowserRouter, Route, Routes } from 'react-router';

const authMocks = vi.hoisted(() => ({
  useSession: vi.fn(),
}));

vi.mock('better-auth/react', () => ({
  createAuthClient: () => ({
    useSession: authMocks.useSession,
  }),
}));

import { RequireAdmin } from '../src/features/auth/components/RequireAdmin';

type Role = 'user' | 'admin';

function authenticatedSession(role: Role) {
  return {
    data: {
      user: {
        id: 'user-1',
        name: role === 'admin' ? 'Administrador' : 'Usuário Comum',
        email: role === 'admin' ? 'admin@example.com' : 'user@example.com',
        role,
      },

      session: {
        id: 'session-1',
        userId: 'user-1',
      },
    },

    isPending: false,
    error: null,
    refetch: vi.fn(),
  };
}

function renderAdminRoute() {
  window.history.pushState({}, '', '/app/admin');

  return render(
    <BrowserRouter>
      <Routes>
        <Route
          path="/app/admin"
          element={
            <RequireAdmin>
              <h1>Administração</h1>
            </RequireAdmin>
          }
        />

        <Route path="/app" element={<h1>Dashboard</h1>} />

        <Route path="/" element={<h1>Login</h1>} />
      </Routes>
    </BrowserRouter>,
  );
}

describe('Acesso administrativo no frontend', () => {
  beforeEach(() => {
    authMocks.useSession.mockReset();
  });

  afterEach(() => {
    cleanup();

    window.history.pushState({}, '', '/');
  });

  it('redireciona usuário comum para o Dashboard', async () => {
    authMocks.useSession.mockReturnValue(authenticatedSession('user'));

    renderAdminRoute();

    await waitFor(() => {
      expect(window.location.pathname).toBe('/app');
    });

    expect(
      screen.getByRole('heading', {
        name: /dashboard/i,
      }),
    ).toBeInTheDocument();

    expect(
      screen.queryByRole('heading', {
        name: /administração/i,
      }),
    ).not.toBeInTheDocument();
  });

  it('permite acesso para usuário administrador', () => {
    authMocks.useSession.mockReturnValue(authenticatedSession('admin'));

    renderAdminRoute();

    expect(window.location.pathname).toBe('/app/admin');

    expect(
      screen.getByRole('heading', {
        name: /administração/i,
      }),
    ).toBeInTheDocument();
  });
});
