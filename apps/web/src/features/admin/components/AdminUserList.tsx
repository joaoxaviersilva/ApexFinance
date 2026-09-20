import type { AdminUser, UserRole } from '@apexfinance/contracts';

type AdminUserListProps = {
  users: AdminUser[];
  currentUserId?: string;
  updatingUserId: string | null;
  statusUpdatingUserId: string | null;
  onChangeRole: (user: AdminUser, role: UserRole) => void | Promise<void>;
  onBlockUser: (user: AdminUser) => void;
  onUnblockUser: (user: AdminUser) => void | Promise<void>;
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
  statusUpdatingUserId,
  onChangeRole,
  onBlockUser,
  onUnblockUser,
}: AdminUserListProps) {
  return (
    <div className="admin-user-list">
      <div className="admin-user-list__header" aria-hidden="true">
        <span>Usuário</span>
        <span>Papel</span>
        <span>Status</span>
        <span>Cadastro</span>
        <span>Ações</span>
      </div>

      <ul className="admin-user-list__items">
        {users.map((user) => {
          const nextRole: UserRole = user.role === 'admin' ? 'user' : 'admin';

          const roleActionLabel = nextRole === 'admin' ? 'Tornar administrador' : 'Tornar usuário';

          const statusActionLabel =
            user.status === 'blocked' ? 'Desbloquear usuário' : 'Bloquear usuário';

          const isRoleUpdating = updatingUserId === user.id;
          const isStatusUpdating = statusUpdatingUserId === user.id;
          const isBusy = isRoleUpdating || isStatusUpdating;

          const isSelfDemotion =
            user.id === currentUserId && user.role === 'admin' && nextRole === 'user';

          const isSelfBlock = user.id === currentUserId && user.status === 'active';

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

              <div
                className="admin-user-list__field admin-user-list__status-field"
                data-label="Status"
              >
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

                {user.status === 'blocked' && user.banReason && (
                  <span className="admin-user-ban-reason">{user.banReason}</span>
                )}
              </div>

              <div
                className="admin-user-list__field admin-user-list__created-at"
                data-label="Cadastro"
              >
                <time dateTime={user.createdAt}>{formatCreatedAt(user.createdAt)}</time>
              </div>

              <div className="admin-user-list__field admin-user-list__action" data-label="Ações">
                <div className="admin-user-actions">
                  <button
                    type="button"
                    className={
                      nextRole === 'admin'
                        ? 'admin-user-action admin-user-action--promote'
                        : 'admin-user-action'
                    }
                    disabled={isSelfDemotion || isBusy}
                    title={
                      isSelfDemotion
                        ? 'Você não pode remover seu próprio acesso administrativo.'
                        : undefined
                    }
                    aria-label={roleActionLabel}
                    onClick={() => {
                      void onChangeRole(user, nextRole);
                    }}
                  >
                    {isRoleUpdating ? (
                      <>
                        <span className="admin-user-action__spinner" aria-hidden="true" />
                        Atualizando...
                      </>
                    ) : (
                      roleActionLabel
                    )}
                  </button>

                  <button
                    type="button"
                    className={
                      user.status === 'blocked'
                        ? 'admin-user-action admin-user-action--unblock'
                        : 'admin-user-action admin-user-action--block'
                    }
                    disabled={isSelfBlock || isBusy}
                    title={
                      isSelfBlock
                        ? 'Você não pode bloquear sua própria conta.'
                        : user.status === 'blocked' && user.banReason
                          ? `Motivo: ${user.banReason}`
                          : undefined
                    }
                    aria-label={statusActionLabel}
                    onClick={() => {
                      if (user.status === 'blocked') {
                        void onUnblockUser(user);

                        return;
                      }

                      onBlockUser(user);
                    }}
                  >
                    {isStatusUpdating ? (
                      <>
                        <span className="admin-user-action__spinner" aria-hidden="true" />
                        Atualizando...
                      </>
                    ) : (
                      statusActionLabel
                    )}
                  </button>
                </div>
              </div>
            </li>
          );
        })}
      </ul>
    </div>
  );
}
