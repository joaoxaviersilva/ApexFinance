import { AppShell } from '@apexfinance/ui';
import { useState } from 'react';
import { Outlet, useNavigate } from 'react-router';

import { authClient } from '../../../shared/lib/auth-client';

import '../app-shell.css';

import { AppHeader } from './AppHeader';
import { AppSidebar } from './AppSidebar';

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
      sidebar={<AppSidebar />}
      header={<AppHeader isSigningOut={isSigningOut} onSignOut={handleSignOut} />}
    >
      <Outlet />
    </AppShell>
  );
}
