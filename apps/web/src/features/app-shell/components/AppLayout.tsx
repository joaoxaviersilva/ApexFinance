import { AppShell } from '@apexfinance/ui';
import { useEffect, useState } from 'react';
import { Outlet } from 'react-router';

import '../app-shell.css';

import { AppHeader } from './AppHeader';
import { AppSidebar } from './AppSidebar';

export function AppLayout() {
  const [isNavigationOpen, setIsNavigationOpen] = useState(false);

  useEffect(() => {
    if (!isNavigationOpen) {
      return;
    }

    const previousBodyOverflow = document.body.style.overflow;

    document.body.style.overflow = 'hidden';

    function handleKeyDown(event: KeyboardEvent) {
      if (event.key === 'Escape') {
        setIsNavigationOpen(false);
      }
    }

    document.addEventListener('keydown', handleKeyDown);

    return () => {
      document.removeEventListener('keydown', handleKeyDown);

      document.body.style.overflow = previousBodyOverflow;
    };
  }, [isNavigationOpen]);

  function closeNavigation() {
    setIsNavigationOpen(false);
  }

  return (
    <div className={isNavigationOpen ? 'app-layout app-layout--navigation-open' : 'app-layout'}>
      <AppShell
        sidebar={<AppSidebar onNavigate={closeNavigation} />}
        header={
          <AppHeader
            isNavigationOpen={isNavigationOpen}
            onToggleNavigation={() => {
              setIsNavigationOpen((currentValue) => !currentValue);
            }}
          />
        }
      >
        <Outlet />
      </AppShell>

      {isNavigationOpen && (
        <button
          type="button"
          className="app-navigation-overlay"
          aria-label="Fechar navegação lateral"
          onClick={closeNavigation}
        />
      )}
    </div>
  );
}
