import { UserMenu } from './UserMenu';

export function AppHeader() {
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

        <UserMenu />
      </div>
    </div>
  );
}
