import { cleanup, render, screen, waitFor } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

const authMocks = vi.hoisted(() => ({
  signInEmail: vi.fn(),
  signUpEmail: vi.fn(),
  signOut: vi.fn(),
  useSession: vi.fn(),
}));

vi.mock('better-auth/react', () => ({
  createAuthClient: () => ({
    signIn: {
      email: authMocks.signInEmail,
    },

    signUp: {
      email: authMocks.signUpEmail,
    },

    signOut: authMocks.signOut,

    useSession: authMocks.useSession,
  }),
}));

import { App } from '../src/app/App';

function renderPath(path: string) {
  window.history.pushState({}, '', path);

  render(<App />);
}

describe('Recuperação de senha desativada na V1', () => {
  beforeEach(() => {
    authMocks.signInEmail.mockReset();
    authMocks.signUpEmail.mockReset();
    authMocks.signOut.mockReset();
    authMocks.useSession.mockReset();

    authMocks.useSession.mockReturnValue({
      data: null,
      isPending: false,
      error: null,
      refetch: vi.fn(),
    });
  });

  afterEach(() => {
    cleanup();

    window.history.pushState({}, '', '/');
  });

  it('não oferece recuperação de senha no login', () => {
    renderPath('/');

    expect(
      screen.queryByRole('button', {
        name: /esqueci minha senha/i,
      }),
    ).not.toBeInTheDocument();

    expect(
      screen.queryByRole('link', {
        name: /esqueci minha senha/i,
      }),
    ).not.toBeInTheDocument();
  });

  it('redireciona a antiga rota de recuperação para o login', async () => {
    renderPath('/recuperar-senha');

    await waitFor(() => {
      expect(window.location.pathname).toBe('/');
    });

    expect(
      screen.getByRole('heading', {
        name: /bem-vindo de volta/i,
      }),
    ).toBeInTheDocument();
  });

  it('redireciona a antiga rota de redefinição para o login', async () => {
    renderPath('/redefinir-senha');

    await waitFor(() => {
      expect(window.location.pathname).toBe('/');
    });

    expect(
      screen.getByRole('heading', {
        name: /bem-vindo de volta/i,
      }),
    ).toBeInTheDocument();
  });
});
