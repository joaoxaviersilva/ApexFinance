import { AppNavigation } from './AppNavigation';

type AppSidebarProps = {
  onNavigate?: () => void;
};

export function AppSidebar({ onNavigate }: AppSidebarProps) {
  return (
    <div id="app-sidebar-navigation" className="app-sidebar">
      <div className="app-sidebar__brand">
        <span aria-hidden="true" className="app-brand-mark">
          <span className="app-brand-mark__left" />
          <span className="app-brand-mark__right" />
        </span>

        <div className="app-sidebar__brand-text">
          <strong>ApexFinance</strong>

          <span>INTELIGÊNCIA FINANCEIRA</span>
        </div>
      </div>

      <AppNavigation onNavigate={onNavigate} />

      <div className="app-sidebar__footer">
        <span className="app-sidebar__status-dot" />

        <span>Sistema protegido</span>
      </div>
    </div>
  );
}
