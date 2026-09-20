import { type FormEvent, useState } from 'react';
import { useNavigate } from 'react-router';

import { authClient } from '../../../shared/lib/auth-client';

import { MailIcon } from '../components/AuthIcons';
import { AuthShell } from '../components/AuthShell';
import { FormError } from '../components/FormError';
import { PasswordInput } from '../components/PasswordInput';

type LoginErrors = {
  email?: string;
  password?: string;
};

export function LoginPage() {
  const navigate = useNavigate();

  const { refetch: refetchSession } = authClient.useSession();

  const [errors, setErrors] = useState<LoginErrors>({});

  const [formError, setFormError] = useState<string | undefined>();

  const [isSubmitting, setIsSubmitting] = useState(false);

  function clearError(field: keyof LoginErrors) {
    setErrors((currentErrors) => {
      if (!currentErrors[field]) {
        return currentErrors;
      }

      return {
        ...currentErrors,
        [field]: undefined,
      };
    });

    setFormError(undefined);
  }

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    if (isSubmitting) {
      return;
    }

    const formData = new FormData(event.currentTarget);

    const email = String(formData.get('email') ?? '').trim();

    const password = String(formData.get('password') ?? '');

    const rememberMe = formData.get('remember') === 'on';

    const nextErrors: LoginErrors = {};

    if (!email) {
      nextErrors.email = 'Informe seu e-mail.';
    }

    if (!password) {
      nextErrors.password = 'Informe sua senha.';
    }

    setErrors(nextErrors);
    setFormError(undefined);

    if (Object.keys(nextErrors).length > 0) {
      return;
    }

    setIsSubmitting(true);

    try {
      const result = await authClient.signIn.email({
        email,
        password,
        rememberMe,
      });

      if (result.error) {
        setFormError('Não foi possível entrar. Verifique seu e-mail e senha.');

        return;
      }

      await refetchSession();

      navigate('/app', {
        replace: true,
      });
    } catch {
      setFormError('Não foi possível conectar ao servidor. Tente novamente.');
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <AuthShell
      eyebrow="ACESSO SEGURO"
      title="Bem-vindo de volta"
      description="Entre na sua conta para acessar sua central financeira."
      navActionLabel="Criar conta"
      navActionHref="/cadastro"
    >
      <form className="auth-form" noValidate onSubmit={handleSubmit}>
        <div className="field">
          <label htmlFor="email">E-mail</label>

          <div className="field-control">
            <MailIcon />

            <input
              id="email"
              name="email"
              type="email"
              autoComplete="email"
              placeholder="seu@email.com"
              aria-invalid={Boolean(errors.email)}
              aria-describedby={errors.email ? 'login-email-error' : undefined}
              disabled={isSubmitting}
              onChange={() => clearError('email')}
            />
          </div>

          <div id="login-email-error">
            <FormError message={errors.email} />
          </div>
        </div>

        <div className="field">
          <label htmlFor="password">Senha</label>

          <PasswordInput
            id="password"
            name="password"
            autoComplete="current-password"
            placeholder="Digite sua senha"
            invalid={Boolean(errors.password)}
            describedBy={errors.password ? 'login-password-error' : undefined}
            disabled={isSubmitting}
            showLabel="Mostrar senha"
            hideLabel="Ocultar senha"
            onChange={() => clearError('password')}
          />

          <div id="login-password-error">
            <FormError message={errors.password} />
          </div>
        </div>

        <div className="auth-options">
          <label className="remember">
            <input type="checkbox" name="remember" disabled={isSubmitting} />

            <span className="remember__box" aria-hidden="true" />

            <span>Lembrar de mim</span>
          </label>
        </div>

        <FormError message={formError} />

        <button type="submit" className="primary-button" disabled={isSubmitting}>
          <span>{isSubmitting ? 'Entrando...' : 'Entrar'}</span>

          {!isSubmitting && (
            <span className="primary-button__arrow" aria-hidden="true">
              →
            </span>
          )}
        </button>

        <div className="separator" aria-hidden="true">
          <span />
          <p>ou</p>
          <span />
        </div>

        <button
          type="button"
          className="secondary-button"
          disabled={isSubmitting}
          onClick={() => {
            navigate('/cadastro');
          }}
        >
          Criar conta
        </button>
      </form>
    </AuthShell>
  );
}
