import type { AdminUser } from '@apexfinance/contracts';

type AdminUserListProps = {
  users: AdminUser[];
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

export function AdminUserList({ users }: AdminUserListProps) {
  return (
    <div className="admin-user-list">
      <div className="admin-user-list__header" aria-hidden="true">
        <span>Usuário</span>
        <span>Papel</span>
        <span>Status</span>
        <span>Cadastro</span>
      </div>

      <ul className="admin-user-list__items">
        {users.map((user) => (
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
          </li>
        ))}
      </ul>
    </div>
  );
}
