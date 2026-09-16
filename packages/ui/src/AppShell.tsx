import type { PropsWithChildren } from 'react';

type AppShellProps = PropsWithChildren<{
  productName: string;
}>;

export function AppShell({ productName, children }: AppShellProps) {
  return (
    <div>
      <header role="banner">
        <strong>{productName}</strong>
      </header>

      <main>{children}</main>
    </div>
  );
}
