import { AppShell } from '@apexfinance/ui';
import { useState } from 'react';
import { Outlet, useNavigate } from 'react-router';

import { authClient } from '../../../shared/lib/auth-client';
import { AppNavigation } from './AppNavigation';

export function AppLayout() {
  const navigate = useNavigate();

  const [isSigningOut, setIsSigningOut] = useState(false);

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

      navigate('/', {
        replace: true,
      });
    } finally {
      setIsSigningOut(false);
    }
  }

  return (
    <AppShell
      sidebar={<AppNavigation />}
      header={
        <div>
          <span>ApexFinance</span>

          <button type="button" disabled={isSigningOut} onClick={handleSignOut}>
            {isSigningOut ? 'Saindo...' : 'Sair'}
          </button>
        </div>
      }
    >
      <Outlet />
    </AppShell>
  );
}
