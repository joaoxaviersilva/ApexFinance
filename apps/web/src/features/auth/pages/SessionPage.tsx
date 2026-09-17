import { useState } from 'react';
import { useNavigate } from 'react-router';

import { authClient } from '../../../shared/lib/auth-client';

export function SessionPage() {
  const navigate = useNavigate();

  const { data: session } = authClient.useSession();

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
    <main>
      <h1>Área autenticada</h1>

      <p>
        Bem-vindo
        {session?.user.name ? `, ${session.user.name}` : ''}.
      </p>

      <button type="button" disabled={isSigningOut} onClick={handleSignOut}>
        {isSigningOut ? 'Saindo...' : 'Sair'}
      </button>
    </main>
  );
}
