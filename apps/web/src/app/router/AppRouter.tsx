import { BrowserRouter, Navigate, Route, Routes } from 'react-router';

import '../../features/auth/auth.css';

import { RequireAuth } from '../../features/auth/components/RequireAuth';
import { LoginPage } from '../../features/auth/pages/LoginPage';
import { RegisterPage } from '../../features/auth/pages/RegisterPage';
import { SessionPage } from '../../features/auth/pages/SessionPage';

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
              <SessionPage />
            </RequireAuth>
          }
        />

        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </BrowserRouter>
  );
}
