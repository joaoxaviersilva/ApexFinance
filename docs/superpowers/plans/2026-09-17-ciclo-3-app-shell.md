# Ciclo 3 App Shell Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Transformar `/app` no shell autenticado definitivo do ApexFinance, com navegação, dashboard estrutural, autorização administrativa, menu de usuário e responsividade.

**Architecture:** O roteador web passará a usar rotas autenticadas aninhadas sob um `AppLayout`. O layout web comporá sessão, navegação e autorização sobre o `AppShell` genérico de `packages/ui`, mantendo Better Auth e regras específicas fora do pacote compartilhado.

**Tech Stack:** React 19, React Router 8, TypeScript 6, Better Auth 1.7.5, Vitest 5, Testing Library, Vite 8 e CSS.

**Spec:** `docs/superpowers/specs/2026-09-17-ciclo-3-app-shell.md`

## Global Constraints

- Preservar o visual preto + verde aprovado no Ciclo 2.
- Não redesenhar login ou cadastro.
- Não criar dados financeiros fictícios.
- Não criar modelos financeiros no Prisma.
- Não criar endpoints fake para o Dashboard.
- Manter `RequireAuth` como proteção de toda a área autenticada.
- Segurança administrativa real permanece no backend.
- Frontend deve ocultar e bloquear visualmente `/app/admin` para não administradores.
- Usar TDD para toda alteração comportamental.
- Nunca misturar responsabilidades específicas do ApexFinance em `packages/ui`.
- Não adicionar biblioteca global de estado.
- Não adicionar dependências sem necessidade comprovada.
- Arquivos novos devem possuir responsabilidade única.
- Commits devem seguir Conventional Commits com descrição em português.

---

### Task 1: Tipar papel administrativo no cliente e criar guarda de frontend

**Files:**

- Modify: `apps/web/src/shared/lib/auth-client.ts`
- Create: `apps/web/src/features/auth/components/RequireAdmin.tsx`
- Create: `apps/web/test/admin-access.test.tsx`

**Interfaces:**

- Consumes:
  - `authClient.useSession()`
  - Better Auth Admin plugin já ativo no backend
- Produces:
  - sessão web com campo `user.role`
  - `<RequireAdmin>{children}</RequireAdmin>`

- [ ] **Step 1: escrever teste RED para usuário comum**

Criar `apps/web/test/admin-access.test.tsx`.

O teste deve representar uma sessão autenticada com:

```ts
user: {
  id: 'user-1',
  name: 'Usuário Comum',
  email: 'user@example.com',
  role: 'user',
}
```

Ao abrir:

```text
/app/admin
```

deve esperar redirecionamento para:

```text
/app
```

- [ ] **Step 2: escrever teste RED para ADMIN**

Representar:

```ts
role: 'admin';
```

e esperar acesso ao conteúdo administrativo.

- [ ] **Step 3: executar o teste isolado e confirmar RED**

```powershell
Set-Location "apps/web"

npx vitest run `
  "test/admin-access.test.tsx"

Set-Location "../.."
```

Falha esperada: `RequireAdmin` ou rota administrativa ainda não implementada.

- [ ] **Step 4: habilitar tipagem do plugin admin no cliente**

Modificar `apps/web/src/shared/lib/auth-client.ts` para usar o plugin cliente administrativo do Better Auth.

A configuração deverá continuar usando:

```ts
baseURL: apiBaseUrl;
```

e passar a incluir:

```ts
plugins: [adminClient()];
```

Não criar um segundo auth client.

- [ ] **Step 5: implementar `RequireAdmin` mínimo**

Comportamento:

```text
isPending
→ não renderiza conteúdo protegido ainda

sem sessão
→ redireciona para /

role !== admin
→ redireciona para /app

role === admin
→ renderiza children
```

- [ ] **Step 6: executar novamente e confirmar GREEN**

```powershell
Set-Location "apps/web"

npx vitest run `
  "test/admin-access.test.tsx"

Set-Location "../.."
```

- [ ] **Step 7: executar testes de autenticação existentes**

```powershell
npm run test `
  --workspace=@apexfinance/web
```

Todos devem continuar verdes.

- [ ] **Step 8: commit**

```powershell
git add `
  "apps/web/src/shared/lib/auth-client.ts" `
  "apps/web/src/features/auth/components/RequireAdmin.tsx" `
  "apps/web/test/admin-access.test.tsx"

git commit `
  -m "feat: adiciona guarda administrativa no frontend"
```

---

### Task 2: Evoluir o AppShell compartilhado

**Files:**

- Modify: `packages/ui/src/AppShell.tsx`
- Modify: `packages/ui/test/app-shell.test.tsx`
- Modify if necessary: `packages/ui/src/index.ts`

**Interfaces:**

- Consumes:

  - React `ReactNode`

- Produces:

  - `AppShell`
  - slots estruturais para sidebar, header e conteúdo

- Não conhece:

  - Better Auth
  - React Router
  - roles
  - rotas ApexFinance

- [ ] **Step 1: alterar o teste para representar o novo shell**

O teste deverá exigir estrutura para:

```text
sidebar
header
main
```

sem exigir conhecimento de domínio.

Exemplo de consumo esperado:

```tsx
<AppShell sidebar={<nav>Navegação</nav>} header={<div>Cabeçalho</div>}>
  <p>Conteúdo</p>
</AppShell>
```

- [ ] **Step 2: executar teste e confirmar RED**

```powershell
Set-Location "packages/ui"

npx vitest run `
  "test/app-shell.test.tsx"

Set-Location "../.."
```

- [ ] **Step 3: implementar o mínimo no `AppShell`**

A estrutura deverá expor classes semânticas estáveis para estilização pelo consumidor.

Não adicionar navegação do ApexFinance ao pacote.

- [ ] **Step 4: confirmar GREEN**

```powershell
Set-Location "packages/ui"

npx vitest run `
  "test/app-shell.test.tsx"

Set-Location "../.."
```

- [ ] **Step 5: executar build do pacote**

```powershell
npm run build `
  --workspace=@apexfinance/ui
```

- [ ] **Step 6: commit**

```powershell
git add `
  "packages/ui/src/AppShell.tsx" `
  "packages/ui/src/index.ts" `
  "packages/ui/test/app-shell.test.tsx"

git commit `
  -m "refactor: evolui app shell compartilhado"
```

---

### Task 3: Criar Dashboard e páginas estruturais

**Files:**

- Create: `apps/web/src/features/dashboard/pages/DashboardPage.tsx`
- Create: `apps/web/src/features/app-shell/pages/ModulePlaceholderPage.tsx`
- Create: `apps/web/test/dashboard.test.tsx`

**Interfaces:**

- Consumes:

  - sessão Better Auth

- Produces:

  - `DashboardPage`
  - `ModulePlaceholderPage`

- [ ] **Step 1: escrever teste RED do Dashboard**

O teste deve exigir:

- heading `Dashboard`;

- saudação com nome real da sessão;

- indicação de que ainda não existem dados financeiros;

- nenhuma quantia monetária hardcoded.

- [ ] **Step 2: executar e confirmar RED**

```powershell
Set-Location "apps/web"

npx vitest run `
  "test/dashboard.test.tsx"

Set-Location "../.."
```

- [ ] **Step 3: implementar `DashboardPage` mínimo**

Usar a sessão real.

Estado vazio sugerido:

```text
Sua visão financeira começa aqui.
```

Cards podem representar áreas, mas não números falsos.

- [ ] **Step 4: criar `ModulePlaceholderPage` genérico**

Interface esperada:

```ts
type ModulePlaceholderPageProps = {
  title: string;
  description: string;
};
```

Será reutilizado temporariamente por:

- Carteira;

- Inteligência;

- Metas;

- FIRE;

- Factoring;

- Copilot;

- Administração.

- [ ] **Step 5: confirmar GREEN**

```powershell
Set-Location "apps/web"

npx vitest run `
  "test/dashboard.test.tsx"

Set-Location "../.."
```

- [ ] **Step 6: commit**

```powershell
git add `
  "apps/web/src/features/dashboard/pages/DashboardPage.tsx" `
  "apps/web/src/features/app-shell/pages/ModulePlaceholderPage.tsx" `
  "apps/web/test/dashboard.test.tsx"

git commit `
  -m "feat: adiciona dashboard estrutural"
```

---

### Task 4: Criar layout autenticado e rotas aninhadas

**Files:**

- Create: `apps/web/src/features/app-shell/components/AppLayout.tsx`
- Create: `apps/web/src/features/app-shell/components/AppNavigation.tsx`
- Modify: `apps/web/src/app/router/AppRouter.tsx`
- Modify: `apps/web/test/app.test.tsx`
- Create: `apps/web/test/app-navigation.test.tsx`
- Delete after migration: `apps/web/src/features/auth/pages/SessionPage.tsx`

**Interfaces:**

- Consumes:

  - `AppShell`
  - `RequireAuth`
  - `RequireAdmin`
  - `DashboardPage`
  - `ModulePlaceholderPage`

- Produces:

  - rota layout `/app`
  - rotas filhas via `<Outlet />`

- [ ] **Step 1: escrever teste RED das rotas internas**

Cobrir:

```text
/app
/app/portfolio
/app/intelligence
/app/goals
/app/fire
/app/factoring
/app/copilot
```

Cada rota deve renderizar o módulo correspondente dentro do mesmo shell.

- [ ] **Step 2: testar fallback interno**

Uma rota como:

```text
/app/inexistente
```

deve terminar em:

```text
/app
```

- [ ] **Step 3: confirmar RED**

```powershell
Set-Location "apps/web"

npx vitest run `
  "test/app-navigation.test.tsx"

Set-Location "../.."
```

- [ ] **Step 4: implementar rotas aninhadas**

Estrutura-alvo:

```tsx
<Route
  path="/app"
  element={
    <RequireAuth>
      <AppLayout />
    </RequireAuth>
  }
>
  <Route index element={<DashboardPage />} />
  ...
</Route>
```

`AppLayout` deverá renderizar:

```tsx
<AppShell ...>
  <Outlet />
</AppShell>
```

- [ ] **Step 5: adicionar `/app/admin` com `RequireAdmin`**

Não duplicar autenticação.

- [ ] **Step 6: remover dependência da antiga `SessionPage`**

Quando nenhum teste ou rota depender mais dela, excluir:

```text
apps/web/src/features/auth/pages/SessionPage.tsx
```

- [ ] **Step 7: confirmar GREEN**

```powershell
Set-Location "apps/web"

npx vitest run `
  "test/app-navigation.test.tsx" `
  "test/app.test.tsx" `
  "test/admin-access.test.tsx"

Set-Location "../.."
```

- [ ] **Step 8: commit**

```powershell
git add `
  "apps/web/src/app/router/AppRouter.tsx" `
  "apps/web/src/features/app-shell" `
  "apps/web/src/features/auth/pages/SessionPage.tsx" `
  "apps/web/test/app.test.tsx" `
  "apps/web/test/app-navigation.test.tsx"

git commit `
  -m "feat: estrutura navegação autenticada"
```

---

### Task 5: Criar sidebar, header e identidade da área interna

**Files:**

- Create: `apps/web/src/features/app-shell/components/AppSidebar.tsx`
- Create: `apps/web/src/features/app-shell/components/AppHeader.tsx`
- Create: `apps/web/src/features/app-shell/components/AppIcons.tsx`
- Create: `apps/web/src/features/app-shell/app-shell.css`
- Modify: `apps/web/src/features/app-shell/components/AppLayout.tsx`
- Modify: `apps/web/src/features/app-shell/components/AppNavigation.tsx`
- Modify: `apps/web/test/app-navigation.test.tsx`

**Interfaces:**

- Consumes:

  - `NavLink`
  - sessão do usuário

- Produces:

  - sidebar desktop
  - header
  - item de navegação ativo
  - identidade visual interna

- [ ] **Step 1: adicionar teste RED para navegação visível**

Esperar itens:

```text
Dashboard
Carteira
Inteligência
Metas
FIRE
Factoring
Copilot
```

- [ ] **Step 2: testar estado ativo**

Na rota:

```text
/app/goals
```

`Metas` deve possuir:

```html
aria-current="page"
```

- [ ] **Step 3: testar Administração por role**

ADMIN vê Administração.

USER não vê Administração.

- [ ] **Step 4: confirmar RED**

```powershell
Set-Location "apps/web"

npx vitest run `
  "test/app-navigation.test.tsx"

Set-Location "../.."
```

- [ ] **Step 5: implementar sidebar e header**

Continuar identidade:

```text
#020403
#22e58d
```

reutilizando as variáveis CSS globais já existentes sempre que possível.

Não duplicar tokens de cor sem necessidade.

- [ ] **Step 6: usar `NavLink` para estado ativo**

Não controlar rota ativa manualmente com estado React.

- [ ] **Step 7: confirmar GREEN**

```powershell
Set-Location "apps/web"

npx vitest run `
  "test/app-navigation.test.tsx"

Set-Location "../.."
```

- [ ] **Step 8: commit**

```powershell
git add `
  "apps/web/src/features/app-shell"

git commit `
  -m "feat: adiciona identidade e navegação do app shell"
```

---

### Task 6: Integrar menu do usuário e logout

**Files:**

- Create: `apps/web/src/features/app-shell/components/UserMenu.tsx`
- Modify: `apps/web/src/features/app-shell/components/AppHeader.tsx`
- Modify: `apps/web/test/logout.test.tsx`
- Create: `apps/web/test/user-menu.test.tsx`

**Interfaces:**

- Consumes:

  - `authClient.useSession()`
  - `authClient.signOut()`
  - `useNavigate()`

- Produces:

  - menu do usuário
  - logout único da aplicação

- [ ] **Step 1: escrever teste RED do menu**

Esperar:

- nome;

- e-mail;

- botão que abre menu;

- ação `Sair`.

- [ ] **Step 2: adaptar teste existente de logout**

O logout agora deverá ser acionado pelo menu do usuário no shell.

O comportamento continua:

```text
signOut()
→ navigate("/")
```

- [ ] **Step 3: confirmar RED**

```powershell
Set-Location "apps/web"

npx vitest run `
  "test/user-menu.test.tsx" `
  "test/logout.test.tsx"

Set-Location "../.."
```

- [ ] **Step 4: implementar `UserMenu`**

Não criar outro cliente Better Auth.

Não criar logout duplicado fora deste componente.

- [ ] **Step 5: suportar Escape**

Ao pressionar:

```text
Escape
```

o menu deve fechar.

- [ ] **Step 6: confirmar GREEN**

```powershell
Set-Location "apps/web"

npx vitest run `
  "test/user-menu.test.tsx" `
  "test/logout.test.tsx"

Set-Location "../.."
```

- [ ] **Step 7: commit**

```powershell
git add `
  "apps/web/src/features/app-shell/components/UserMenu.tsx" `
  "apps/web/src/features/app-shell/components/AppHeader.tsx" `
  "apps/web/test/user-menu.test.tsx" `
  "apps/web/test/logout.test.tsx"

git commit `
  -m "feat: integra menu de usuário ao app shell"
```

---

### Task 7: Tornar o shell responsivo e acessível

**Files:**

- Modify: `apps/web/src/features/app-shell/components/AppLayout.tsx`
- Modify: `apps/web/src/features/app-shell/components/AppSidebar.tsx`
- Modify: `apps/web/src/features/app-shell/components/AppHeader.tsx`
- Modify: `apps/web/src/features/app-shell/app-shell.css`
- Create: `apps/web/test/mobile-navigation.test.tsx`

**Interfaces:**

- Consumes:

  - estado local React

- Produces:

  - menu mobile
  - overlay
  - controles acessíveis

- [ ] **Step 1: escrever teste RED para botão mobile**

O botão deve possuir:

```html
aria-expanded="false"
```

antes de abrir.

Após clique:

```html
aria-expanded="true"
```

- [ ] **Step 2: testar fechamento**

Menu deve fechar por:

- Escape;

- clique em overlay;

- seleção de uma rota.

- [ ] **Step 3: confirmar RED**

```powershell
Set-Location "apps/web"

npx vitest run `
  "test/mobile-navigation.test.tsx"

Set-Location "../.."
```

- [ ] **Step 4: implementar estado local**

Estado deverá permanecer dentro do shell.

Não criar store global.

- [ ] **Step 5: implementar CSS responsivo**

Validar pelo menos:

```text
>= desktop
sidebar persistente

< desktop
sidebar sob demanda
```

Garantir:

```css
overflow-x: hidden;
```

somente onde semanticamente adequado.

Não esconder overflow para mascarar layout quebrado.

- [ ] **Step 6: respeitar reduced motion**

Reaproveitar regra global existente.

- [ ] **Step 7: confirmar GREEN**

```powershell
Set-Location "apps/web"

npx vitest run `
  "test/mobile-navigation.test.tsx"

Set-Location "../.."
```

- [ ] **Step 8: commit**

```powershell
git add `
  "apps/web/src/features/app-shell" `
  "apps/web/test/mobile-navigation.test.tsx"

git commit `
  -m "feat: aprimora responsividade do app shell"
```

---

### Task 8: Revisar regressões e qualidade completa

**Files:**

- Modify only if a failing verification proves a defect.

- [ ] **Step 1: executar todos os testes**

```powershell
npm run test
```

Esperado:

```text
0 failed
```

- [ ] **Step 2: executar lint**

```powershell
npm run lint
```

Esperado:

```text
0 errors
```

- [ ] **Step 3: executar Prettier**

```powershell
npm run format:check
```

Esperado:

```text
All matched files use Prettier code style!
```

- [ ] **Step 4: verificar whitespace Git**

```powershell
git diff --check
```

Esperado: nenhuma saída.

- [ ] **Step 5: executar build completo**

```powershell
npm run build
```

Esperado: todos os packages e apps compilados.

- [ ] **Step 6: iniciar aplicação real**

```powershell
npm run dev
```

Validar manualmente:

```text
/
→ login

/app
→ Dashboard autenticado

/app/portfolio
→ Carteira

/app/intelligence
→ Inteligência

/app/goals
→ Metas

/app/fire
→ FIRE

/app/factoring
→ Factoring

/app/copilot
→ Copilot
```

- [ ] **Step 7: validar ADMIN**

Com usuário ADMIN:

```text
Administração aparece
/app/admin abre
```

- [ ] **Step 8: validar USER**

Com usuário USER:

```text
Administração não aparece
/app/admin redireciona para /app
```

- [ ] **Step 9: validar logout**

Após logout:

```text
/app
→ /
```

- [ ] **Step 10: validar responsividade**

Inspecionar:

```text
desktop
tablet
mobile
```

Confirmar ausência de scroll horizontal e sobreposições.

- [ ] **Step 11: inspecionar worktree**

```powershell
git status --short

git --no-pager diff --stat
```

- [ ] **Step 12: commit corretivo somente se necessário**

Não criar commit vazio.

Caso ajustes finais sejam necessários:

```powershell
git add .

git commit `
  -m "fix: corrige regressões do app shell"
```

---

## Resultado esperado do Ciclo 3

Ao final do plano:

```text
Login/Cadastro
       │
       ▼
     /app
       │
       ▼
┌───────────────────────────────────────┐
│ AppShell                              │
│                                       │
│ Sidebar       Header                  │
│ ┌──────────┐  ┌────────────────────┐ │
│ │Dashboard │  │ Página / Usuário   │ │
│ │Carteira  │  └────────────────────┘ │
│ │Intel.    │                          │
│ │Metas     │  Conteúdo via Outlet     │
│ │FIRE      │                          │
│ │Factoring │                          │
│ │Copilot   │                          │
│ │Admin*    │                          │
│ └──────────┘                          │
└───────────────────────────────────────┘

* somente ADMIN
```

Nenhum domínio financeiro real será implementado neste ciclo.

O próximo ciclo poderá então começar sobre uma fundação visual, de navegação e autorização já consolidada.
