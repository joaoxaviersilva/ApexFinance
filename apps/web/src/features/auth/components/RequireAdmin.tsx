import type { ReactNode } from 'react';
import { Navigate } from 'react-router';

import { authClient } from '../../../shared/lib/auth-client';

type RequireAdminProps = {
  children: ReactNode;
};

export function RequireAdmin({ children }: RequireAdminProps) {
  const { data: session, isPending } = authClient.useSession();

  if (isPending) {
    return null;
  }

  if (!session) {
    return <Navigate to="/" replace />;
  }

  if (session.user.role !== 'admin') {
    return <Navigate to="/app" replace />;
  }

  return children;
}
