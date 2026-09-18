export type AppIconName =
  | 'dashboard'
  | 'portfolio'
  | 'intelligence'
  | 'goals'
  | 'fire'
  | 'factoring'
  | 'copilot'
  | 'admin'
  | 'logout';

type AppIconProps = {
  name: AppIconName;
};

export function AppIcon({ name }: AppIconProps) {
  return (
    <svg aria-hidden="true" className="app-icon" viewBox="0 0 24 24" fill="none">
      {name === 'dashboard' && (
        <>
          <rect x="3" y="3" width="7" height="7" rx="2" />
          <rect x="14" y="3" width="7" height="7" rx="2" />
          <rect x="3" y="14" width="7" height="7" rx="2" />
          <rect x="14" y="14" width="7" height="7" rx="2" />
        </>
      )}

      {name === 'portfolio' && (
        <>
          <path d="M4 7.5h16v11H4z" />
          <path d="M8 7.5V5.8A1.8 1.8 0 0 1 9.8 4h4.4A1.8 1.8 0 0 1 16 5.8v1.7" />
          <path d="M4 11.5h16" />
          <path d="M10 11.5v2h4v-2" />
        </>
      )}

      {name === 'intelligence' && (
        <>
          <path d="M4 19V9" />
          <path d="M10 19V5" />
          <path d="M16 19v-7" />
          <path d="M22 19V3" />
        </>
      )}

      {name === 'goals' && (
        <>
          <circle cx="12" cy="12" r="8" />
          <circle cx="12" cy="12" r="4" />
          <path d="m12 12 6-6" />
        </>
      )}

      {name === 'fire' && (
        <path d="M13.7 3.4c.6 3.1-.8 4.7-2.2 6.2-1.2 1.3-2.3 2.5-2.3 4.5 0 1.8 1.2 3.2 2.8 3.2 2.2 0 3.6-2 3.1-4.4 2 1.4 3.2 3.3 3.2 5.1A6.3 6.3 0 0 1 12 22a6.3 6.3 0 0 1-6.3-6.3c0-3.2 1.9-5.1 3.7-7 1.5-1.5 3-3 4.3-5.3Z" />
      )}

      {name === 'factoring' && (
        <>
          <path d="M4 7h16" />
          <path d="M6 4h12a2 2 0 0 1 2 2v12a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2V6a2 2 0 0 1 2-2Z" />
          <path d="M8 12h3" />
          <path d="M8 16h5" />
          <path d="M16 11v6" />
        </>
      )}

      {name === 'copilot' && (
        <>
          <path d="M12 3v3" />
          <path d="M5.6 5.6 7.7 7.7" />
          <path d="M18.4 5.6 16.3 7.7" />
          <path d="M4 13a8 8 0 0 1 16 0v4a3 3 0 0 1-3 3H7a3 3 0 0 1-3-3v-4Z" />
          <circle cx="9" cy="14" r="1" />
          <circle cx="15" cy="14" r="1" />
          <path d="M9 17h6" />
        </>
      )}

      {name === 'admin' && (
        <>
          <circle cx="12" cy="8" r="3" />
          <path d="M5.5 20a6.5 6.5 0 0 1 13 0" />
          <path d="M18.5 5.5 20 4" />
          <path d="m18.5 10.5 1.5 1.5" />
        </>
      )}

      {name === 'logout' && (
        <>
          <path d="M10 5H6a2 2 0 0 0-2 2v10a2 2 0 0 0 2 2h4" />
          <path d="M14 8l4 4-4 4" />
          <path d="M18 12H9" />
        </>
      )}
    </svg>
  );
}
