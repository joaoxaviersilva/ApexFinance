import type { AdminUser, UserRole } from '@apexfinance/contracts';

type AdminUserListProps = {
  users: AdminUser[];
  currentUserId?: string;
  updatingUserId: string | null;
  onChangeRole: (user: AdminUser, role: UserRole) => void | Promise<void>;
};

function getRoleLabel(role: AdminUser['role']) {
  return role === 'admin' ? 'Administrador' : 'Usuário';
}

function getStatusLabel(status: AdminUser['status']) {
  return status === 'blocked' ? 'Bloqueado' : 'Ativo';
}

function formatCreatedAt(createdAt: string) {
  return new Intl.DateTimeFormat('pt-BR', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
  }).format(new Date(createdAt));
}

export function AdminUserList({
  users,
  currentUserId,
  updatingUserId,
  onChangeRole,
}: AdminUserListProps) {
  return (
    <div className="admin-user-list">
      <div className="admin-user-list__header" aria-hidden="true">
        <span>Usuário</span>
        <span>Papel</span>
        <span>Status</span>
        <span>Cadastro</span>
        <span>Ação</span>
      </div>

      <ul className="admin-user-list__items">
        {users.map((user) => {
          const nextRole: UserRole = user.role === 'admin' ? 'user' : 'admin';

          const actionLabel = nextRole === 'admin' ? 'Tornar administrador' : 'Tornar usuário';

          const isUpdating = updatingUserId === user.id;

          const isSelfDemotion =
            user.id === currentUserId && user.role === 'admin' && nextRole === 'user';

          return (
            <li className="admin-user-list__item" key={user.id}>
              <div className="admin-user-list__identity">
                <strong>{user.name}</strong>
                <span>{user.email}</span>
              </div>

              <div className="admin-user-list__field" data-label="Papel">
                <span
                  className={
                    user.role === 'admin'
                      ? 'admin-user-badge admin-user-badge--admin'
                      : 'admin-user-badge'
                  }
                >
                  {getRoleLabel(user.role)}
                </span>
              </div>

              <div className="admin-user-list__field" data-label="Status">
                <span
                  className={
                    user.status === 'blocked'
                      ? 'admin-user-status admin-user-status--blocked'
                      : 'admin-user-status admin-user-status--active'
                  }
                >
                  <i aria-hidden="true" />

                  {getStatusLabel(user.status)}
                </span>
              </div>

              <div
                className="admin-user-list__field admin-user-list__created-at"
                data-label="Cadastro"
              >
                <time dateTime={user.createdAt}>{formatCreatedAt(user.createdAt)}</time>
              </div>

              <div className="admin-user-list__field admin-user-list__action" data-label="Ação">
                <button
                  type="button"
                  className={
                    nextRole === 'admin'
                      ? 'admin-user-role-action admin-user-role-action--promote'
                      : 'admin-user-role-action'
                  }
                  disabled={isSelfDemotion || isUpdating}
                  title={
                    isSelfDemotion
                      ? 'Você não pode remover seu próprio acesso administrativo.'
                      : undefined
                  }
                  aria-label={actionLabel}
                  onClick={() => {
                    void onChangeRole(user, nextRole);
                  }}
                >
                  {isUpdating ? (
                    <>
                      <span className="admin-user-role-action__spinner" aria-hidden="true" />
                      Atualizando...
                    </>
                  ) : (
                    actionLabel
                  )}
                </button>
              </div>
            </li>
          );
        })}
      </ul>
    </div>
  );
}
