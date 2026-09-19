import type { AdminUser } from '@apexfinance/contracts';
import { useEffect, useMemo, useState } from 'react';

import '../admin.css';

import { AdminUserList } from '../components/AdminUserList';

const apiBaseUrl = import.meta.env.VITE_API_URL ?? 'http://localhost:3333';

type AdminUsersResponse = {
  users: AdminUser[];
};

type AdminPageState = 'loading' | 'success' | 'error';

function normalizeSearchValue(value: string) {
  return value
    .normalize('NFD')
    .replace(/\p{Diacritic}/gu, '')
    .toLocaleLowerCase('pt-BR')
    .trim();
}

export function AdminPage() {
  const [users, setUsers] = useState<AdminUser[]>([]);
  const [state, setState] = useState<AdminPageState>('loading');
  const [searchQuery, setSearchQuery] = useState('');

  useEffect(() => {
    let isMounted = true;

    async function loadUsers() {
      try {
        const response = await fetch(`${apiBaseUrl}/api/admin/users`, {
          credentials: 'include',
          headers: {
            Accept: 'application/json',
          },
        });

        if (!response.ok) {
          throw new Error('Não foi possível carregar os usuários.');
        }

        const payload = (await response.json()) as AdminUsersResponse;

        if (!isMounted) {
          return;
        }

        setUsers(Array.isArray(payload.users) ? payload.users : []);
        setState('success');
      } catch {
        if (!isMounted) {
          return;
        }

        setState('error');
      }
    }

    void loadUsers();

    return () => {
      isMounted = false;
    };
  }, []);

  const summary = useMemo(() => {
    return {
      total: users.length,

      active: users.filter((user) => user.status === 'active').length,

      blocked: users.filter((user) => user.status === 'blocked').length,

      admins: users.filter((user) => user.role === 'admin').length,
    };
  }, [users]);

  const filteredUsers = useMemo(() => {
    const normalizedQuery = normalizeSearchValue(searchQuery);

    if (!normalizedQuery) {
      return users;
    }

    return users.filter((user) => {
      const searchableContent = normalizeSearchValue(`${user.name} ${user.email}`);

      return searchableContent.includes(normalizedQuery);
    });
  }, [searchQuery, users]);

  const hasSearch = searchQuery.trim().length > 0;

  return (
    <section className="admin-page" aria-labelledby="admin-page-title">
      <header className="admin-page__header">
        <p>CONTROLE DE ACESSO</p>

        <h1 id="admin-page-title">Administração</h1>

        <p>Gerencie usuários e permissões de acesso ao ApexFinance.</p>
      </header>

      {state === 'loading' && (
        <section className="admin-page-state" aria-live="polite">
          <div className="admin-page-state__indicator" aria-hidden="true" />

          <div>
            <h2>Carregando usuários</h2>

            <p>Consultando os acessos cadastrados na plataforma.</p>
          </div>
        </section>
      )}

      {state === 'error' && (
        <section className="admin-page-state admin-page-state--error" role="alert">
          <div>
            <h2>Não foi possível carregar os usuários</h2>

            <p>Verifique a conexão com a API e tente novamente.</p>
          </div>
        </section>
      )}

      {state === 'success' && users.length === 0 && (
        <section className="admin-page-state" aria-live="polite">
          <div>
            <h2>Nenhum usuário encontrado</h2>

            <p>Ainda não existem usuários disponíveis para gerenciamento.</p>
          </div>
        </section>
      )}

      {state === 'success' && users.length > 0 && (
        <>
          <section className="admin-summary" aria-label="Resumo de usuários">
            <article className="admin-summary__item">
              <span>Total de usuários</span>
              <strong>{summary.total}</strong>
            </article>

            <article className="admin-summary__item">
              <span>Ativos</span>
              <strong>{summary.active}</strong>
            </article>

            <article className="admin-summary__item">
              <span>Administradores</span>
              <strong>{summary.admins}</strong>
            </article>

            <article className="admin-summary__item">
              <span>Bloqueados</span>
              <strong>{summary.blocked}</strong>
            </article>
          </section>

          <section className="admin-users" aria-labelledby="admin-users-title">
            <header className="admin-users__header">
              <div className="admin-users__heading">
                <p className="admin-users__eyebrow">ACESSOS</p>

                <h2 id="admin-users-title">Usuários</h2>
              </div>

              <div className="admin-users__tools">
                <label className="admin-users__search">
                  <span className="admin-users__search-icon" aria-hidden="true">
                    <svg viewBox="0 0 24 24">
                      <circle cx="11" cy="11" r="6" />
                      <path d="m16 16 4 4" />
                    </svg>
                  </span>

                  <span className="admin-users__search-label">Buscar usuários</span>

                  <input
                    type="search"
                    aria-label="Buscar usuários"
                    placeholder="Buscar por nome ou e-mail..."
                    value={searchQuery}
                    onChange={(event) => {
                      setSearchQuery(event.target.value);
                    }}
                  />
                </label>

                <span className="admin-users__count">
                  {hasSearch
                    ? `${filteredUsers.length} de ${summary.total}`
                    : `${summary.total} ${summary.total === 1 ? 'cadastro' : 'cadastros'}`}
                </span>
              </div>
            </header>

            {filteredUsers.length > 0 ? (
              <AdminUserList users={filteredUsers} />
            ) : (
              <div className="admin-users__search-empty" role="status">
                <strong>Nenhum usuário corresponde à sua busca.</strong>

                <p>Tente pesquisar por outro nome ou endereço de e-mail.</p>
              </div>
            )}
          </section>
        </>
      )}
    </section>
  );
}
