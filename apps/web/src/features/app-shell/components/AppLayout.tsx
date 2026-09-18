import { AppShell } from '@apexfinance/ui';
import { Outlet } from 'react-router';

import '../app-shell.css';

import { AppHeader } from './AppHeader';
import { AppSidebar } from './AppSidebar';

export function AppLayout() {
  return (
    <AppShell sidebar={<AppSidebar />} header={<AppHeader />}>
      <Outlet />
    </AppShell>
  );
}
