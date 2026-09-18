import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router';

import { authClient } from '../../../shared/lib/auth-client';

import '../user-menu.css';

import { AppIcon } from './AppIcons';

function getInitials(name: string) {
  const parts = name.trim().split(/\s+/).filter(Boolean);

  if (parts.length === 0) {
    return 'U';
  }

  if (parts.length === 1) {
    return parts[0].slice(0, 2).toUpperCase();
  }

  return `${parts[0][0]}${parts[parts.length - 1][0]}`.toUpperCase();
}

export function UserMenu() {
  const navigate = useNavigate();

  const { data: session } = authClient.useSession();

  const [isOpen, setIsOpen] = useState(false);
  const [isSigningOut, setIsSigningOut] = useState(false);

  const userName = session?.user.name?.trim() || 'Usuário';
  const userEmail = session?.user.email ?? '';

  useEffect(() => {
    if (!isOpen) {
      return;
    }

    function handleKeyDown(event: KeyboardEvent) {
      if (event.key === 'Escape') {
        setIsOpen(false);
      }
    }

    document.addEventListener('keydown', handleKeyDown);

    return () => {
      document.removeEventListener('keydown', handleKeyDown);
    };
  }, [isOpen]);

  async function handleSignOut() {
    if (isSigningOut) {
      return;
    }

    setIsSigningOut(true);

    try {
      const result = await authClient.signOut();

      if (result.error) {
        return;
      }

      setIsOpen(false);

      navigate('/', {
        replace: true,
      });
    } finally {
      setIsSigningOut(false);
    }
  }

  return (
    <div className="user-menu">
      <button
        type="button"
        className="user-menu__trigger"
        aria-label="Abrir menu do usuário"
        aria-haspopup="dialog"
        aria-expanded={isOpen}
        onClick={() => {
          setIsOpen((currentValue) => !currentValue);
        }}
      >
        <span aria-hidden="true" className="user-menu__avatar">
          {getInitials(userName)}
        </span>

        <span className="user-menu__trigger-identity">
          <strong>{userName}</strong>

          <span>Minha conta</span>
        </span>

        <span
          aria-hidden="true"
          className={isOpen ? 'user-menu__chevron user-menu__chevron--open' : 'user-menu__chevron'}
        >
          ▾
        </span>
      </button>

      {isOpen && (
        <div role="dialog" aria-label="Menu do usuário" className="user-menu__popover">
          <div className="user-menu__profile">
            <span aria-hidden="true" className="user-menu__avatar user-menu__avatar--large">
              {getInitials(userName)}
            </span>

            <div className="user-menu__profile-text">
              <strong>{userName}</strong>

              <span>{userEmail}</span>
            </div>
          </div>

          <div className="user-menu__divider" />

          <button
            type="button"
            className="user-menu__logout"
            disabled={isSigningOut}
            onClick={handleSignOut}
          >
            <AppIcon name="logout" />

            <span>{isSigningOut ? 'Saindo...' : 'Sair'}</span>
          </button>
        </div>
      )}
    </div>
  );
}
