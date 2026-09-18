import { AppIcon } from './AppIcons';

type AppHeaderProps = {
  isSigningOut: boolean;
  onSignOut: () => void;
};

export function AppHeader({ isSigningOut, onSignOut }: AppHeaderProps) {
  return (
    <div className="app-header">
      <div className="app-header__identity">
        <span className="app-header__eyebrow">CENTRAL FINANCEIRA</span>

        <strong>ApexFinance</strong>
      </div>

      <div className="app-header__actions">
        <span className="app-header__security">
          <i />
          Ambiente protegido
        </span>

        <button
          type="button"
          className="app-header__logout"
          disabled={isSigningOut}
          onClick={onSignOut}
        >
          <AppIcon name="logout" />

          <span>{isSigningOut ? 'Saindo...' : 'Sair'}</span>
        </button>
      </div>
    </div>
  );
}
