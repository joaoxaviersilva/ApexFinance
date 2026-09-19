# Plano de Implementação — Ciclo 4

**Ciclo:** Administração e isolamento multiusuário  
**Spec:** `docs/superpowers/specs/2026-09-19-ciclo-4-admin-isolation.md`  
**Branch:** `feat/ciclo-4-admin-isolation`

---

## Processo obrigatório

Para toda mudança comportamental:

```text
RED
→ confirmar falha correta

GREEN
→ implementar o mínimo

VERIFY
→ teste alvo + regressão

REFACTOR
→ somente com testes verdes
````

Para mudanças visuais:

```text
testes
→ lint/build
→ execução real
→ validação visual
→ commit
```

Nunca commitar interface nova sem validação visual.

---

# Task 1 — Padronizar contratos administrativos

## Objetivo

Criar contratos administrativos estáveis e normalizar a listagem existente.

## Arquivos esperados

Criar:

```text
packages/contracts/src/admin.ts
```

Modificar:

```text
packages/contracts/src/index.ts

apps/api/src/modules/identity/application/list-users.use-case.ts

apps/api/src/modules/identity/infrastructure/prisma-user.repository.ts

apps/api/src/modules/identity/presentation/admin-users.route.test.ts
```

## Contratos

Criar:

```ts
export type UserRole = 'user' | 'admin';

export type AdminUserStatus =
  | 'active'
  | 'blocked';

export interface AdminUser {
  id: string;
  name: string;
  email: string;
  role: UserRole;
  status: AdminUserStatus;
  banReason: string | null;
  createdAt: string;
}
```

## RED

Atualizar primeiro o teste de:

```text
GET /api/admin/users
```

para exigir:

```text
role
status
banReason
createdAt como string ISO
```

Confirmar falha.

## GREEN

Implementar normalização da entidade Prisma para o contrato.

Não vazar campos extras.

## Verificação

```powershell
npm run test `
  --workspace=@apexfinance/api

npm run build `
  --workspace=@apexfinance/contracts

npm run lint `
  --workspace=@apexfinance/api
```

## Commit

```text
refactor: padroniza contratos administrativos
```

---

# Task 2 — Criar página real de Administração

## Objetivo

Substituir o placeholder de `/app/admin`.

## Arquivos esperados

Criar:

```text
apps/web/src/features/admin/pages/AdminPage.tsx

apps/web/src/features/admin/components/AdminUserList.tsx

apps/web/src/features/admin/admin.css

apps/web/test/admin-page.test.tsx
```

Modificar:

```text
apps/web/src/app/router/AppRouter.tsx
```

## Comportamento

A página deve:

* consumir `GET /api/admin/users`;
* renderizar dados reais;
* identificar papel;
* identificar status;
* mostrar data de criação;
* suportar loading;
* suportar erro;
* suportar lista vazia;
* manter design ApexFinance.

Nenhuma mutação ainda.

## RED

Criar testes para:

```text
ADMIN abre /app/admin
→ vê título Administração

loading
→ estado de carregamento

API sucesso
→ usuários aparecem

API erro
→ feedback de falha
```

Confirmar falha antes da implementação.

## GREEN

Implementar somente leitura.

## Verificação técnica

```powershell
npm run test `
  --workspace=@apexfinance/web

npm run lint `
  --workspace=@apexfinance/web

npm run build `
  --workspace=@apexfinance/web
```

## Verificação visual obrigatória

Executar:

```powershell
npm run dev
```

Validar:

```text
desktop
tablet
mobile
```

Não commitar antes da aprovação visual.

## Commit

```text
feat: adiciona gestão visual de usuários
```

---

# Task 3 — Alterar papel de usuários

## Objetivo

Permitir:

```text
USER → ADMIN
ADMIN → USER
```

sobre outros usuários.

## Backend esperado

Criar:

```text
apps/api/src/modules/identity/application/update-user-role.use-case.ts
apps/api/src/modules/identity/application/update-user-role.use-case.test.ts
```

Modificar:

```text
apps/api/src/modules/identity/infrastructure/prisma-user.repository.ts
apps/api/src/modules/identity/presentation/admin-users.route.ts
apps/api/src/modules/identity/presentation/admin-users.route.test.ts
```

## Endpoint

```text
PATCH /api/admin/users/:userId/role
```

Body:

```json
{
  "role": "admin"
}
```

## RED backend

Testar:

```text
sem sessão → 401
USER → 403
ADMIN + alvo válido → 200
role inválida → 422
alvo inexistente → 404
auto-rebaixamento → 409
```

Confirmar RED.

## GREEN backend

Implementar use case + repository.

Use case deve receber o ator autenticado.

Não confiar em `actorUserId` enviado no body.

## Frontend

Modificar componentes administrativos para permitir alteração de papel.

## RED frontend

Testar:

```text
clicar Tornar ADMIN
→ chamada correta
→ UI atualizada

rebaixar ADMIN
→ exige confirmação

próprio ADMIN
→ ação indisponível
```

## GREEN frontend

Implementar mutação.

## Verificação

```powershell
npm run test

npm run lint

npm run build
```

Depois validar visualmente.

## Commit

```text
feat: permite gerenciar papéis de usuários
```

---

# Task 4 — Bloquear e desbloquear usuários

## Objetivo

Implementar status administrativo real.

## Backend esperado

Criar:

```text
apps/api/src/modules/identity/application/update-user-status.use-case.ts
apps/api/src/modules/identity/application/update-user-status.use-case.test.ts
```

Modificar:

```text
apps/api/src/modules/identity/infrastructure/prisma-user.repository.ts
apps/api/src/modules/identity/presentation/admin-users.route.ts
apps/api/src/modules/identity/presentation/admin-users.route.test.ts
```

## Endpoint

```text
PATCH /api/admin/users/:userId/status
```

## RED backend

Cobrir:

```text
sem sessão → 401

USER → 403

bloquear usuário válido
→ 200

bloquear sem motivo
→ 422

bloquear inexistente
→ 404

auto-bloqueio
→ 409

desbloquear
→ 200
```

Adicionar teste de sessão:

```text
usuário autenticado
→ ADMIN bloqueia
→ sessão anterior deixa de funcionar
```

## GREEN backend

Ao bloquear:

```text
banned = true
banReason = motivo
banExpires = null
```

Revogar sessões existentes do alvo.

Ao desbloquear:

```text
banned = false
banReason = null
banExpires = null
```

## Frontend

Adicionar:

```text
Bloquear
Desbloquear
Motivo
Confirmação
```

## RED frontend

Cobrir:

```text
bloquear chama endpoint correto
desbloquear chama endpoint correto
motivo obrigatório
próprio admin não pode bloquear
erro mantém estado coerente
```

## GREEN frontend

Implementar UI.

## Validação visual obrigatória

Testar desktop/mobile antes do commit.

## Commit

```text
feat: permite bloquear usuários
```

---

# Task 5 — Fortalecer guardrails e isolamento

## Objetivo

Transformar identidade autenticada em uma fronteira explícita para futuros domínios privados.

## Arquivos esperados

Criar ou evoluir estrutura equivalente a:

```text
apps/api/src/modules/identity/application/authenticated-actor.ts
```

Modificar:

```text
apps/api/src/modules/identity/presentation/auth.guard.ts
```

E rotas administrativas necessárias.

## AuthenticatedActor

Contrato:

```ts
export interface AuthenticatedActor {
  userId: string;
  role: 'user' | 'admin';
}
```

## Regra

O ator deve ser derivado de:

```text
Better Auth session
```

e nunca do body/query.

## RED

Criar testes comprovando:

```text
ator usa id da sessão

payload não consegue trocar identidade

auto-rebaixamento usa ator real

auto-bloqueio usa ator real
```

Não criar entidades financeiras falsas só para testar isolamento.

## GREEN

Introduzir o contexto mínimo necessário.

Evitar abstração genérica excessiva.

## Documentação arquitetural

Registrar claramente:

```text
future private resource
→ use case recebe authenticated userId
→ repository filtra ownership
```

## Verificação

```powershell
npm run test

npm run lint

npm run format:check

npm run build
```

## Commit

```text
refactor: fortalece isolamento multiusuário
```

---

# Task 6 — Revisão final do Ciclo 4

## Objetivo

Validar todo o subsistema antes de integrar na `main`.

Não adicionar feature nova.

## Passo 1 — testes completos

```powershell
npm run test
```

Esperado:

```text
0 failed
```

## Passo 2 — lint

```powershell
npm run lint
```

## Passo 3 — Prettier

```powershell
npm run format:check
```

## Passo 4 — whitespace

```powershell
git diff --check
```

## Passo 5 — build

```powershell
npm run build
```

## Passo 6 — execução real

```powershell
npm run dev
```

## Passo 7 — validar USER

Com USER:

```text
Administração não aparece
/app/admin → /app
```

## Passo 8 — validar ADMIN

Com ADMIN:

```text
Administração aparece
lista usuários reais
```

Validar manualmente:

```text
USER → ADMIN
ADMIN → USER
bloquear
desbloquear
```

## Passo 9 — guardrails

Confirmar:

```text
admin não consegue se rebaixar
admin não consegue se bloquear
```

Backend deve rejeitar mesmo que a UI seja contornada.

## Passo 10 — usuário bloqueado

Confirmar:

```text
sessão existente deixa de operar
novo login não é aceito normalmente
```

Após desbloqueio:

```text
login volta a ser permitido
```

## Passo 11 — responsividade

Validar:

```text
desktop
tablet
mobile
```

Confirmar:

* sem scroll horizontal indevido;
* ações acessíveis;
* lista legível;
* drawer existente intacto.

## Passo 12 — console

Console deve estar livre de erros relevantes.

## Passo 13 — worktree

```powershell
git status --short

git --no-pager diff --stat
```

## Passo 14 — commit corretivo

Somente se a revisão realmente exigir alteração:

```text
fix: corrige regressões administrativas
```

Não criar commit vazio.

---

# Critério final do Ciclo 4

O ciclo termina quando o seguinte fluxo estiver validado:

```text
                 ┌──────────────┐
                 │ Better Auth  │
                 └──────┬───────┘
                        │
                        ▼
               AuthenticatedActor
                        │
             ┌──────────┴──────────┐
             │                     │
             ▼                     ▼
           USER                  ADMIN
             │                     │
             │              /app/admin
             │                     │
             │            ┌────────┼────────┐
             │            │        │        │
             │            ▼        ▼        ▼
             │          listar    role    status
             │
             └── sem acesso administrativo
```

E os futuros módulos financeiros partirão da regra:

sessão
→ authenticated userId
→ use case
→ repository filtrado pelo proprietário

Agora registre formalmente o começo do ciclo:

```powershell
git add `
  "docs/superpowers/specs/2026-09-19-ciclo-4-admin-isolation.md" `
  "docs/superpowers/plans/2026-09-19-ciclo-4-admin-isolation.md"

git commit `
  -m "docs: define arquitetura e plano do ciclo 4"

git push -u origin feat/ciclo-4-admin-isolation

git status --short
git log -1 --oneline
```
