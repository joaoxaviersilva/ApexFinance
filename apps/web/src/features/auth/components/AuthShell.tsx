import type { ReactNode } from 'react';
import { Link } from 'react-router';

import { LogoMark } from '../../../shared/ui/LogoMark';

import { ShieldIcon } from './AuthIcons';

type AuthShellProps = {
  eyebrow: string;
  title: string;
  description: string;
  navActionLabel: string;
  navActionHref: string;
  children: ReactNode;
  variant?: 'default' | 'register';
};

export function AuthShell({
  eyebrow,
  title,
  description,
  navActionLabel,
  navActionHref,
  children,
  variant = 'default',
}: AuthShellProps) {
  const pageClassName = variant === 'register' ? 'login-page login-page--register' : 'login-page';

  return (
    <main className={pageClassName}>
      <div className="login-background" aria-hidden="true">
        <div className="background-grid" />

        <div className="background-orbit background-orbit--one" />
        <div className="background-orbit background-orbit--two" />
        <div className="background-orbit background-orbit--three" />

        <div className="background-glow background-glow--left" />
        <div className="background-glow background-glow--right" />

        <div className="background-beam background-beam--one" />
        <div className="background-beam background-beam--two" />

        <div className="background-noise" />
      </div>

      <nav className="login-nav" aria-label="Navegação principal">
        <div className="nav-brand">
          <LogoMark />

          <div className="nav-brand__text">
            <strong>ApexFinance</strong>
            <span>INTELIGÊNCIA FINANCEIRA</span>
          </div>
        </div>

        <Link className="nav-create-account" to={navActionHref}>
          {navActionLabel}

          <span aria-hidden="true">↗</span>
        </Link>
      </nav>

      <section className="login-stage">
        <div className="auth-card">
          <div className="auth-card__glow" aria-hidden="true" />

          <div className="auth-logo">
            <LogoMark />
          </div>

          <header className="auth-heading">
            <p className="auth-eyebrow">{eyebrow}</p>

            <h1>{title}</h1>

            <p className="auth-description">{description}</p>
          </header>

          {children}

          <footer className="security-note">
            <ShieldIcon />

            <div>
              <strong>Ambiente protegido</strong>

              <span>Seus dados permanecem seguros e criptografados.</span>
            </div>
          </footer>
        </div>
      </section>

      <footer className="login-footer">
        <span>© 2026 ApexFinance</span>

        <span className="login-footer__status">
          <i />
          Sistema protegido
        </span>
      </footer>
    </main>
  );
}
