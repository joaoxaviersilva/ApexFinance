import { UserMenu } from './UserMenu';

type AppHeaderProps = {
  isNavigationOpen: boolean;
  onToggleNavigation: () => void;
};

export function AppHeader({ isNavigationOpen, onToggleNavigation }: AppHeaderProps) {
  return (
    <div className="app-header">
      <button
        type="button"
        className="app-header__navigation-toggle"
        aria-label={isNavigationOpen ? 'Fechar navegação' : 'Abrir navegação'}
        aria-controls="app-sidebar-navigation"
        aria-expanded={isNavigationOpen}
        onClick={onToggleNavigation}
      >
        <span aria-hidden="true" className="app-header__navigation-icon">
          <i />
          <i />
          <i />
        </span>
      </button>

      <div className="app-header__identity">
        <span className="app-header__eyebrow">CENTRAL FINANCEIRA</span>

        <strong>ApexFinance</strong>
      </div>

      <div className="app-header__actions">
        <span className="app-header__security">
          <i />
          Ambiente protegido
        </span>

        <UserMenu />
      </div>
    </div>
  );
}
