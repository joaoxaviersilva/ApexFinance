import { type FormEvent, useState } from 'react';
import { useNavigate } from 'react-router';

import { authClient } from '../../../shared/lib/auth-client';

import { MailIcon, UserIcon } from '../components/AuthIcons';
import { AuthShell } from '../components/AuthShell';
import { FormError } from '../components/FormError';
import { PasswordInput } from '../components/PasswordInput';

type RegisterErrors = {
  name?: string;
  email?: string;
  password?: string;
  confirmPassword?: string;
};

export function RegisterPage() {
  const navigate = useNavigate();

  const [errors, setErrors] = useState<RegisterErrors>({});

  const [formError, setFormError] = useState<string | undefined>();

  const [isSubmitting, setIsSubmitting] = useState(false);

  function clearError(field: keyof RegisterErrors) {
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

    const name = String(formData.get('name') ?? '').trim();

    const email = String(formData.get('email') ?? '').trim();

    const password = String(formData.get('password') ?? '');

    const confirmPassword = String(formData.get('confirmPassword') ?? '');

    const nextErrors: RegisterErrors = {};

    if (!name) {
      nextErrors.name = 'Informe seu nome.';
    }

    if (!email) {
      nextErrors.email = 'Informe seu e-mail.';
    }

    if (!password) {
      nextErrors.password = 'Informe uma senha.';
    } else if (password.length < 8) {
      nextErrors.password = 'A senha deve ter pelo menos 8 caracteres.';
    }

    if (!confirmPassword) {
      nextErrors.confirmPassword = 'Confirme sua senha.';
    } else if (password && confirmPassword !== password) {
      nextErrors.confirmPassword = 'As senhas não coincidem.';
    }

    setErrors(nextErrors);
    setFormError(undefined);

    if (Object.keys(nextErrors).length > 0) {
      return;
    }

    setIsSubmitting(true);

    try {
      const result = await authClient.signUp.email({
        name,
        email,
        password,
      });

      if (result.error) {
        setFormError('Não foi possível criar sua conta. Verifique os dados informados.');

        return;
      }

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
      eyebrow="NOVO ACESSO"
      title="Crie sua conta"
      description="Comece a organizar sua vida financeira em um ambiente seguro e privado."
      navActionLabel="Entrar"
      navActionHref="/"
      variant="register"
    >
      <form className="auth-form" noValidate onSubmit={handleSubmit}>
        <div className="field">
          <label htmlFor="name">Nome</label>

          <div className="field-control">
            <UserIcon />

            <input
              id="name"
              name="name"
              type="text"
              autoComplete="name"
              placeholder="Seu nome"
              aria-invalid={Boolean(errors.name)}
              aria-describedby={errors.name ? 'register-name-error' : undefined}
              disabled={isSubmitting}
              onChange={() => clearError('name')}
            />
          </div>

          <div id="register-name-error">
            <FormError message={errors.name} />
          </div>
        </div>

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
              aria-describedby={errors.email ? 'register-email-error' : undefined}
              disabled={isSubmitting}
              onChange={() => clearError('email')}
            />
          </div>

          <div id="register-email-error">
            <FormError message={errors.email} />
          </div>
        </div>

        <div className="field">
          <label htmlFor="password">Senha</label>

          <PasswordInput
            id="password"
            name="password"
            autoComplete="new-password"
            placeholder="Crie uma senha"
            invalid={Boolean(errors.password)}
            describedBy={errors.password ? 'register-password-error' : undefined}
            disabled={isSubmitting}
            showLabel="Mostrar senha"
            hideLabel="Ocultar senha"
            onChange={() => {
              clearError('password');
              clearError('confirmPassword');
            }}
          />

          <div id="register-password-error">
            <FormError message={errors.password} />
          </div>
        </div>

        <div className="field">
          <label htmlFor="confirm-password">Confirmar senha</label>

          <PasswordInput
            id="confirm-password"
            name="confirmPassword"
            autoComplete="new-password"
            placeholder="Repita sua senha"
            invalid={Boolean(errors.confirmPassword)}
            describedBy={errors.confirmPassword ? 'register-confirm-password-error' : undefined}
            disabled={isSubmitting}
            showLabel="Mostrar confirmação de senha"
            hideLabel="Ocultar confirmação de senha"
            onChange={() => clearError('confirmPassword')}
          />

          <div id="register-confirm-password-error">
            <FormError message={errors.confirmPassword} />
          </div>
        </div>

        <FormError message={formError} />

        <button type="submit" className="primary-button" disabled={isSubmitting}>
          <span>{isSubmitting ? 'Criando conta...' : 'Criar conta'}</span>

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
            navigate('/');
          }}
        >
          Já tenho uma conta
        </button>
      </form>
    </AuthShell>
  );
}
