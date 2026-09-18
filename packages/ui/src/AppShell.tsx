import type { PropsWithChildren, ReactNode } from 'react';

type AppShellProps = PropsWithChildren<{
  sidebar: ReactNode;
  header: ReactNode;
}>;

export function AppShell({ sidebar, header, children }: AppShellProps) {
  return (
    <div className="app-shell">
      <aside className="app-shell__sidebar">{sidebar}</aside>

      <div className="app-shell__content">
        <header className="app-shell__header">{header}</header>

        <main className="app-shell__main">{children}</main>
      </div>
    </div>
  );
}
