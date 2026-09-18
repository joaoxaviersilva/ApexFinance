import { authClient } from '../../../shared/lib/auth-client';

export function DashboardPage() {
  const { data: session } = authClient.useSession();

  const userName = session?.user.name?.trim();

  return (
    <section aria-labelledby="dashboard-title">
      <header>
        <p>VISÃO GERAL</p>

        <h1 id="dashboard-title">Dashboard</h1>

        <p>{userName ? `Olá, ${userName}.` : 'Olá.'}</p>
      </header>

      <section aria-labelledby="dashboard-empty-state-title">
        <h2 id="dashboard-empty-state-title">Sua visão financeira começa aqui.</h2>

        <p>Ainda não existem dados financeiros para mostrar.</p>
      </section>
    </section>
  );
}
