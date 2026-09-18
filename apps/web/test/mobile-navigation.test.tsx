import { cleanup, fireEvent, render, screen, waitFor } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

const authMocks = vi.hoisted(() => ({
  signOut: vi.fn(),
  useSession: vi.fn(),
}));

vi.mock('../src/shared/lib/auth-client', () => ({
  authClient: {
    signOut: authMocks.signOut,
    useSession: authMocks.useSession,
  },
}));

import { App } from '../src/app/App';

function authenticatedSession() {
  return {
    data: {
      user: {
        id: 'user-1',
        name: 'João Xavier',
        email: 'joao@example.com',
        role: 'user',
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

function renderApp() {
  window.history.pushState({}, '', '/app');

  return render(<App />);
}

function getNavigationButton() {
  return screen.getByRole('button', {
    name: /abrir navegação/i,
  });
}

describe('Navegação responsiva do ApexFinance', () => {
  beforeEach(() => {
    authMocks.signOut.mockReset();
    authMocks.useSession.mockReset();

    authMocks.useSession.mockReturnValue(authenticatedSession());
  });

  afterEach(() => {
    cleanup();

    window.history.pushState({}, '', '/');
  });

  it('expõe corretamente o estado aberto da navegação', () => {
    renderApp();

    const navigationButton = getNavigationButton();

    expect(navigationButton).toHaveAttribute('aria-expanded', 'false');

    fireEvent.click(navigationButton);

    expect(navigationButton).toHaveAttribute('aria-expanded', 'true');
  });

  it('fecha a navegação ao pressionar Escape', () => {
    renderApp();

    const navigationButton = getNavigationButton();

    fireEvent.click(navigationButton);

    expect(navigationButton).toHaveAttribute('aria-expanded', 'true');

    fireEvent.keyDown(document, {
      key: 'Escape',
    });

    expect(navigationButton).toHaveAttribute('aria-expanded', 'false');
  });

  it('fecha a navegação ao clicar no overlay', () => {
    renderApp();

    const navigationButton = getNavigationButton();

    fireEvent.click(navigationButton);

    fireEvent.click(
      screen.getByRole('button', {
        name: /fechar navegação lateral/i,
      }),
    );

    expect(navigationButton).toHaveAttribute('aria-expanded', 'false');
  });

  it('fecha a navegação depois de selecionar uma rota', async () => {
    renderApp();

    const navigationButton = getNavigationButton();

    fireEvent.click(navigationButton);

    fireEvent.click(
      screen.getByRole('link', {
        name: /^carteira$/i,
      }),
    );

    await waitFor(() => {
      expect(window.location.pathname).toBe('/app/portfolio');
    });

    expect(navigationButton).toHaveAttribute('aria-expanded', 'false');
  });
});
