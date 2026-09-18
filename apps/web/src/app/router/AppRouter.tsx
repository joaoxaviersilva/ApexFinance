import { BrowserRouter, Navigate, Route, Routes } from 'react-router';

import '../../features/auth/auth.css';

import { AppLayout } from '../../features/app-shell/components/AppLayout';
import { ModulePlaceholderPage } from '../../features/app-shell/pages/ModulePlaceholderPage';
import { RequireAdmin } from '../../features/auth/components/RequireAdmin';
import { RequireAuth } from '../../features/auth/components/RequireAuth';
import { LoginPage } from '../../features/auth/pages/LoginPage';
import { RegisterPage } from '../../features/auth/pages/RegisterPage';
import { DashboardPage } from '../../features/dashboard/pages/DashboardPage';

export function AppRouter() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<LoginPage />} />

        <Route path="/cadastro" element={<RegisterPage />} />

        <Route
          path="/app"
          element={
            <RequireAuth>
              <AppLayout />
            </RequireAuth>
          }
        >
          <Route index element={<DashboardPage />} />

          <Route
            path="portfolio"
            element={
              <ModulePlaceholderPage
                title="Carteira"
                description="Gerencie seus ativos e movimentações financeiras."
              />
            }
          />

          <Route
            path="intelligence"
            element={
              <ModulePlaceholderPage
                title="Inteligência"
                description="Acompanhe análises e informações de mercado."
              />
            }
          />

          <Route
            path="goals"
            element={
              <ModulePlaceholderPage
                title="Metas"
                description="Organize e acompanhe seus objetivos financeiros."
              />
            }
          />

          <Route
            path="fire"
            element={
              <ModulePlaceholderPage
                title="FIRE"
                description="Planeje sua independência financeira."
              />
            }
          />

          <Route
            path="factoring"
            element={
              <ModulePlaceholderPage
                title="Factoring"
                description="Acompanhe operações e análises de factoring."
              />
            }
          />

          <Route
            path="copilot"
            element={
              <ModulePlaceholderPage
                title="Copilot"
                description="Use inteligência artificial para apoiar sua organização financeira."
              />
            }
          />

          <Route
            path="admin"
            element={
              <RequireAdmin>
                <ModulePlaceholderPage
                  title="Administração"
                  description="Gerencie usuários e configurações administrativas."
                />
              </RequireAdmin>
            }
          />

          <Route path="*" element={<Navigate to="/app" replace />} />
        </Route>

        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </BrowserRouter>
  );
}
