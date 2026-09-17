import type { ReactNode } from 'react';
import { Navigate } from 'react-router';

import { authClient } from '../../../shared/lib/auth-client';

type RequireAuthProps = {
  children: ReactNode;
};

export function RequireAuth({ children }: RequireAuthProps) {
  const { data: session, isPending } = authClient.useSession();

  if (isPending) {
    return null;
  }

  if (!session) {
    return <Navigate to="/" replace />;
  }

  return children;
}
