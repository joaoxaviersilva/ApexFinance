import { NavLink } from 'react-router';

import { authClient } from '../../../shared/lib/auth-client';
import { AppIcon, type AppIconName } from './AppIcons';

type NavigationItem = {
  label: string;
  to: string;
  icon: AppIconName;
  end?: boolean;
};

const primaryItems: NavigationItem[] = [
  {
    label: 'Dashboard',
    to: '/app',
    icon: 'dashboard',
    end: true,
  },
  {
    label: 'Carteira',
    to: '/app/portfolio',
    icon: 'portfolio',
  },
  {
    label: 'Inteligência',
    to: '/app/intelligence',
    icon: 'intelligence',
  },
  {
    label: 'Metas',
    to: '/app/goals',
    icon: 'goals',
  },
  {
    label: 'FIRE',
    to: '/app/fire',
    icon: 'fire',
  },
  {
    label: 'Factoring',
    to: '/app/factoring',
    icon: 'factoring',
  },
  {
    label: 'Copilot',
    to: '/app/copilot',
    icon: 'copilot',
  },
];

function navigationClassName(isActive: boolean) {
  return isActive ? 'app-navigation__link app-navigation__link--active' : 'app-navigation__link';
}

export function AppNavigation() {
  const { data: session } = authClient.useSession();

  const isAdmin = session?.user.role === 'admin';

  return (
    <nav aria-label="Navegação principal" className="app-navigation">
      <div className="app-navigation__section">
        <span className="app-navigation__label">PRINCIPAL</span>

        <div className="app-navigation__links">
          {primaryItems.map((item) => (
            <NavLink
              key={item.to}
              to={item.to}
              end={item.end}
              className={({ isActive }) => navigationClassName(isActive)}
            >
              <AppIcon name={item.icon} />

              <span>{item.label}</span>
            </NavLink>
          ))}
        </div>
      </div>

      {isAdmin && (
        <div className="app-navigation__section">
          <span className="app-navigation__label">SISTEMA</span>

          <div className="app-navigation__links">
            <NavLink to="/app/admin" className={({ isActive }) => navigationClassName(isActive)}>
              <AppIcon name="admin" />

              <span>Administração</span>
            </NavLink>
          </div>
        </div>
      )}
    </nav>
  );
}
