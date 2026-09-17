import { cleanup, fireEvent, render, screen, waitFor } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

const authMocks = vi.hoisted(() => ({
  signInEmail: vi.fn(),
  signUpEmail: vi.fn(),
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

    useSession: authMocks.useSession,
  }),
}));

import { App } from '../src/app/App';

function renderPath(path: string) {
  window.history.pushState({}, '', path);

  return render(<App />);
}

function unauthenticatedSession() {
  return {
    data: null,
    isPending: false,
    error: null,
    refetch: vi.fn(),
  };
}

function authenticatedSession() {
  return {
    data: {
      user: {
        id: 'user-1',
        name: 'João Xavier',
        email: 'joao@example.com',
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

describe('Autenticação do ApexFinance', () => {
  beforeEach(() => {
    authMocks.signInEmail.mockReset();
    authMocks.signUpEmail.mockReset();
    authMocks.useSession.mockReset();

    authMocks.signInEmail.mockResolvedValue({
      data: {
        user: {
          id: 'user-1',
          name: 'João Xavier',
          email: 'joao@example.com',
        },
      },

      error: null,
    });

    authMocks.signUpEmail.mockResolvedValue({
      data: {
        user: {
          id: 'user-1',
          name: 'João Xavier',
          email: 'joao@example.com',
        },
      },

      error: null,
    });

    authMocks.useSession.mockReturnValue(unauthenticatedSession());
  });

  afterEach(() => {
    cleanup();

    window.history.pushState({}, '', '/');
  });

  it('renderiza a tela de login na rota principal', () => {
    renderPath('/');

    expect(screen.getByText('ApexFinance')).toBeInTheDocument();

    expect(
      screen.getByRole('heading', {
        name: /bem-vindo de volta/i,
      }),
    ).toBeInTheDocument();

    expect(screen.getByLabelText('E-mail')).toBeInTheDocument();

    expect(screen.getByLabelText('Senha')).toBeInTheDocument();

    expect(
      screen.getByRole('button', {
        name: /^entrar$/i,
      }),
    ).toBeInTheDocument();
  });

  it('navega para o cadastro sem recarregar a aplicação', () => {
    renderPath('/');

    fireEvent.click(
      screen.getByRole('link', {
        name: /criar conta/i,
      }),
    );

    expect(window.location.pathname).toBe('/cadastro');

    expect(
      screen.getByRole('heading', {
        name: /crie sua conta/i,
      }),
    ).toBeInTheDocument();
  });

  it('renderiza a tela de cadastro com variante própria de layout', () => {
    renderPath('/cadastro');

    expect(
      screen.getByRole('heading', {
        name: /crie sua conta/i,
      }),
    ).toBeInTheDocument();

    expect(screen.getByLabelText('Nome')).toBeInTheDocument();

    expect(screen.getByLabelText('E-mail')).toBeInTheDocument();

    expect(screen.getByLabelText('Senha')).toBeInTheDocument();

    expect(screen.getByLabelText('Confirmar senha')).toBeInTheDocument();

    expect(
      screen.getByRole('button', {
        name: /^criar conta$/i,
      }),
    ).toBeInTheDocument();

    expect(screen.getByRole('main')).toHaveClass('login-page--register');
  });

  it('valida os campos obrigatórios antes de tentar entrar', () => {
    renderPath('/');

    fireEvent.click(
      screen.getByRole('button', {
        name: /^entrar$/i,
      }),
    );

    expect(screen.getByText('Informe seu e-mail.')).toBeInTheDocument();

    expect(screen.getByText('Informe sua senha.')).toBeInTheDocument();

    expect(authMocks.signInEmail).not.toHaveBeenCalled();
  });

  it('impede o cadastro quando as senhas não coincidem', () => {
    renderPath('/cadastro');

    fireEvent.change(screen.getByLabelText('Nome'), {
      target: {
        value: 'João Xavier',
      },
    });

    fireEvent.change(screen.getByLabelText('E-mail'), {
      target: {
        value: 'joao@example.com',
      },
    });

    fireEvent.change(screen.getByLabelText('Senha'), {
      target: {
        value: 'senha123',
      },
    });

    fireEvent.change(screen.getByLabelText('Confirmar senha'), {
      target: {
        value: 'senha456',
      },
    });

    fireEvent.click(
      screen.getByRole('button', {
        name: /^criar conta$/i,
      }),
    );

    expect(screen.getByText('As senhas não coincidem.')).toBeInTheDocument();

    expect(authMocks.signUpEmail).not.toHaveBeenCalled();
  });

  it('envia as credenciais válidas para o Better Auth ao entrar', async () => {
    renderPath('/');

    fireEvent.change(screen.getByLabelText('E-mail'), {
      target: {
        value: 'joao@example.com',
      },
    });

    fireEvent.change(screen.getByLabelText('Senha'), {
      target: {
        value: 'senha123',
      },
    });

    fireEvent.click(
      screen.getByRole('checkbox', {
        name: /lembrar de mim/i,
      }),
    );

    fireEvent.click(
      screen.getByRole('button', {
        name: /^entrar$/i,
      }),
    );

    await waitFor(() => {
      expect(authMocks.signInEmail).toHaveBeenCalledWith({
        email: 'joao@example.com',
        password: 'senha123',
        rememberMe: true,
      });
    });
  });

  it('envia os dados válidos para o Better Auth ao criar conta', async () => {
    renderPath('/cadastro');

    fireEvent.change(screen.getByLabelText('Nome'), {
      target: {
        value: 'João Xavier',
      },
    });

    fireEvent.change(screen.getByLabelText('E-mail'), {
      target: {
        value: 'joao@example.com',
      },
    });

    fireEvent.change(screen.getByLabelText('Senha'), {
      target: {
        value: 'senha123',
      },
    });

    fireEvent.change(screen.getByLabelText('Confirmar senha'), {
      target: {
        value: 'senha123',
      },
    });

    fireEvent.click(
      screen.getByRole('button', {
        name: /^criar conta$/i,
      }),
    );

    await waitFor(() => {
      expect(authMocks.signUpEmail).toHaveBeenCalledWith({
        name: 'João Xavier',
        email: 'joao@example.com',
        password: 'senha123',
      });
    });
  });

  it('redireciona para a área autenticada depois do login', async () => {
    authMocks.useSession.mockReturnValue(authenticatedSession());

    renderPath('/');

    fireEvent.change(screen.getByLabelText('E-mail'), {
      target: {
        value: 'joao@example.com',
      },
    });

    fireEvent.change(screen.getByLabelText('Senha'), {
      target: {
        value: 'senha123',
      },
    });

    fireEvent.click(
      screen.getByRole('button', {
        name: /^entrar$/i,
      }),
    );

    await waitFor(() => {
      expect(window.location.pathname).toBe('/app');
    });

    expect(
      screen.getByRole('heading', {
        name: /área autenticada/i,
      }),
    ).toBeInTheDocument();
  });

  it('redireciona para a área autenticada depois do cadastro', async () => {
    authMocks.useSession.mockReturnValue(authenticatedSession());

    renderPath('/cadastro');

    fireEvent.change(screen.getByLabelText('Nome'), {
      target: {
        value: 'João Xavier',
      },
    });

    fireEvent.change(screen.getByLabelText('E-mail'), {
      target: {
        value: 'joao@example.com',
      },
    });

    fireEvent.change(screen.getByLabelText('Senha'), {
      target: {
        value: 'senha123',
      },
    });

    fireEvent.change(screen.getByLabelText('Confirmar senha'), {
      target: {
        value: 'senha123',
      },
    });

    fireEvent.click(
      screen.getByRole('button', {
        name: /^criar conta$/i,
      }),
    );

    await waitFor(() => {
      expect(window.location.pathname).toBe('/app');
    });

    expect(
      screen.getByRole('heading', {
        name: /área autenticada/i,
      }),
    ).toBeInTheDocument();
  });

  it('permite que uma sessão autenticada acesse a rota protegida', () => {
    authMocks.useSession.mockReturnValue(authenticatedSession());

    renderPath('/app');

    expect(
      screen.getByRole('heading', {
        name: /área autenticada/i,
      }),
    ).toBeInTheDocument();

    expect(screen.getByText(/bem-vindo, joão xavier/i)).toBeInTheDocument();
  });

  it('impede acesso à rota protegida sem sessão', async () => {
    renderPath('/app');

    await waitFor(() => {
      expect(window.location.pathname).toBe('/');
    });

    expect(
      screen.getByRole('heading', {
        name: /bem-vindo de volta/i,
      }),
    ).toBeInTheDocument();
  });

  it('mostra e oculta a senha no login', () => {
    const { container } = renderPath('/');

    const passwordInput = screen.getByLabelText('Senha');

    const toggleButton = container.querySelector('.password-toggle');

    expect(toggleButton).not.toBeNull();

    expect(passwordInput).toHaveAttribute('type', 'password');

    fireEvent.click(toggleButton!);

    expect(passwordInput).toHaveAttribute('type', 'text');

    fireEvent.click(toggleButton!);

    expect(passwordInput).toHaveAttribute('type', 'password');
  });

  it('controla separadamente a senha e a confirmação no cadastro', () => {
    const { container } = renderPath('/cadastro');

    const passwordInput = screen.getByLabelText('Senha');

    const confirmPasswordInput = screen.getByLabelText('Confirmar senha');

    const toggleButtons = container.querySelectorAll('.password-toggle');

    expect(toggleButtons).toHaveLength(2);

    expect(passwordInput).toHaveAttribute('type', 'password');

    expect(confirmPasswordInput).toHaveAttribute('type', 'password');

    fireEvent.click(toggleButtons[0]);

    expect(passwordInput).toHaveAttribute('type', 'text');

    expect(confirmPasswordInput).toHaveAttribute('type', 'password');

    fireEvent.click(toggleButtons[1]);

    expect(passwordInput).toHaveAttribute('type', 'text');

    expect(confirmPasswordInput).toHaveAttribute('type', 'text');
  });
});
