# Plano de Implementação — Ciclo 5

**Ciclo:** Caixa geral e ledger financeiro  
**Spec:** `docs/superpowers/specs/2026-09-19-ciclo-5-cash-ledger.md`  
**Branch:** `feat/ciclo-5-cash-ledger`

---

## Processo obrigatório

Para mudanças comportamentais:

```text
RED
→ confirmar falha correta

GREEN
→ implementar o mínimo

VERIFY
→ teste alvo + regressão

REFACTOR
→ somente com testes verdes
```

Para mudanças visuais:

```text
testes
→ Prettier --write
→ format:check
→ lint
→ build
→ execução real
→ validação visual
→ commit
```

Nunca commitar interface nova sem validação visual.

---

# Task 1 — Criar contratos e regras financeiras do caixa

## Objetivo

Definir a linguagem compartilhada do primeiro domínio financeiro do ApexFinance.

## Arquivos esperados

Criar:

```text
packages/contracts/src/cash.ts
```

Modificar:

```text
packages/contracts/src/index.ts
packages/financial-core/src/money.ts
packages/financial-core/src/money.test.ts
```

Somente alterar `Money` se os testes demonstrarem necessidade real.

## Contratos

Criar contratos equivalentes a:

```ts
CashMovementType;

CashMovement;

CashSummary;

CreateCashMovementRequest;

CreateCashMovementResponse;
```

## RED

Criar testes de contrato/domínio quando houver comportamento executável.

Cobrir no `Money` somente invariantes realmente necessárias.

Não duplicar validação sem necessidade.

## GREEN

Implementar contratos mínimos.

Não criar models Prisma ainda nesta task.

## Verificação

```powershell
npm run test `
  --workspace=@apexfinance/financial-core

npm run build `
  --workspace=@apexfinance/contracts
```

## Commit

```text
feat: define contratos do caixa
```

---

# Task 2 — Persistir conta geral e ledger

## Objetivo

Criar a fundação persistente do caixa.

## Arquivos esperados

Modificar:

```text
prisma/schema.prisma
```

Criar migration Prisma.

Criar módulo equivalente a:

```text
apps/api/src/modules/cash/
```

Com estrutura:

```text
application/
domain/
infrastructure/
presentation/
```

Evitar pastas vazias.

## Prisma

Adicionar conceitos:

```text
CashAccount
CashMovement
```

Conta:

```text
userId
type = GENERAL
```

Movimento:

```text
cashAccountId
type
deltaCents
description
occurredAt
createdAt
```

`deltaCents`:

```text
BIGINT
```

## Índices

Garantir:

```text
uma conta GENERAL por usuário
```

E índice adequado para:

```text
histórico por conta
ordenado por occurredAt
```

## RED

Criar testes de repository primeiro.

Cobrir:

```text
novo usuário sem conta
→ saldo 0

criar primeira entrada
→ cria conta automaticamente

usuário A
→ não lê conta de usuário B

histórico
→ somente do proprietário
```

Confirmar RED antes da implementação.

## GREEN

Criar repository Prisma mínimo.

Não adicionar endpoint ainda.

## Migration

Gerar migration com nome equivalente a:

```text
add_cash_ledger
```

Nunca usar:

```text
prisma migrate reset
```

## Commit

```text
feat: adiciona persistência do caixa
```

---

# Task 3 — Consultar saldo e histórico

## Objetivo

Expor leitura autenticada do caixa.

## Backend esperado

Criar use cases equivalentes a:

```text
GetCashSummaryUseCase
ListCashMovementsUseCase
```

Criar rotas:

```text
GET /api/cash/summary

GET /api/cash/movements
```

## Identidade

A rota recebe:

```text
AuthenticatedActor
```

O use case recebe o `userId` autenticado.

Nunca aceitar `userId` do request como autoridade.

## RED

Cobrir:

```text
sem sessão
→ 401

novo usuário
→ balanceCents = 0

usuário com movimentos
→ saldo correto

usuário A
→ não vê movimentos de B

histórico
→ occurredAt DESC
→ createdAt DESC
```

Adicionar teste explícito tentando fornecer identidade falsa.

Exemplo:

```text
?userId=outro-usuario
```

O resultado deve continuar pertencendo ao usuário da sessão.

## GREEN

Implementar somente leitura.

Sem criação de movimento ainda.

## Verificação

```powershell
npm run test `
  --workspace=@apexfinance/api

npm run lint `
  --workspace=@apexfinance/api
```

## Commit

```text
feat: adiciona consultas do caixa
```

---

# Task 4 — Registrar entradas e saídas com integridade

## Objetivo

Implementar escrita no ledger.

## Endpoint

```text
POST /api/cash/movements
```

## Body

```json
{
  "type": "deposit",
  "amountCents": 100000,
  "description": "Aporte inicial",
  "occurredAt": "2026-09-19T18:00:00.000Z"
}
```

## RED — validação

Testar:

```text
sem sessão → 401

deposit válido → 201

withdrawal válido → 201

type inválido → 422

amountCents = 0 → 422

amountCents negativo → 422

amountCents decimal → 422

descrição vazia → 422

descrição > 160 → 422

occurredAt inválido → 422
```

## RED — isolamento

Testar payload contendo:

```json
{
  "userId": "outro-usuario"
}
```

A identidade precisa continuar vindo da sessão.

## RED — saldo

Testar:

```text
saldo = 10000

withdrawal = 6000
→ sucesso
→ saldo = 4000
```

E:

```text
saldo = 10000

withdrawal = 11000
→ 409
→ nenhum movimento criado
→ saldo permanece 10000
```

## RED — concorrência

Criar teste de integração que demonstre:

```text
saldo = 10000

saída A = 8000
saída B = 8000
executadas concorrentemente
```

Resultado obrigatório:

```text
saldo final >= 0
somente operações compatíveis com o saldo podem concluir
```

## GREEN

Implementar transação PostgreSQL.

Preferir:

```text
Serializable
```

O fluxo crítico deve ocorrer dentro da mesma transação:

```text
obter/criar conta
→ calcular saldo
→ validar saída
→ inserir movimento
→ retornar novo saldo
```

Conflito de serialização pode utilizar retry limitado.

Não capturar erro indefinidamente.

## Imutabilidade

Não criar endpoints de edição ou exclusão.

## Commit

```text
feat: adiciona movimentações do caixa
```

---

# Task 5 — Criar interface real de Caixa

## Objetivo

Transformar:

```text
/app/cash
```

em módulo financeiro real.

## Navegação

Adicionar item:

```text
Caixa
```

à navegação autenticada.

Não remover Carteira.

## Arquivos esperados

Criar estrutura equivalente a:

```text
apps/web/src/features/cash/pages/CashPage.tsx

apps/web/src/features/cash/components/CashSummaryCard.tsx

apps/web/src/features/cash/components/CashMovementList.tsx

apps/web/src/features/cash/components/CashMovementForm.tsx

apps/web/src/features/cash/cash.css
```

Criar testes equivalentes a:

```text
apps/web/test/cash-page.test.tsx
apps/web/test/cash-movement.test.tsx
```

Modificar:

```text
apps/web/src/app/router/AppRouter.tsx

apps/web/src/features/app-shell/components/AppNavigation.tsx

apps/web/test/app-navigation.test.tsx
```

Os nomes exatos podem ser ajustados se a estrutura existente justificar.

## RED

Cobrir primeiro:

```text
Caixa aparece na navegação

/app/cash
→ página real

loading
→ feedback

saldo 0
→ R$ 0,00

saldo real
→ formatado pt-BR

histórico vazio
→ empty state

histórico real
→ movimentos ordenados
```

Depois:

```text
abrir Nova entrada

preencher valor
descrição
data

salvar
→ POST correto
→ saldo atualizado
→ histórico atualizado
```

E:

```text
Nova saída
→ saldo insuficiente
→ feedback compreensível
→ estado anterior preservado
```

## Conversão monetária

Nunca enviar:

```text
"10,50"
```

para a API.

Converter:

```text
R$ 10,50
→ 1050
```

antes da requisição.

Não usar floating point financeiro.

## GREEN

Implementar a UI mínima para passar os testes.

## Visual

Manter:

```text
preto
verde
glassmorphism
tipografia existente
```

Sem alterações no Login/Cadastro.

## Validação visual obrigatória

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

Checar:

- saldo legível;
- botões acessíveis;
- formulário confortável;
- histórico legível;
- sem scroll horizontal indevido;
- console sem erros relevantes.

Não commitar antes da aprovação visual.

## Commit

```text
feat: adiciona interface do caixa
```

---

# Task 6 — Revisão final do Ciclo 5

## Objetivo

Validar o primeiro domínio financeiro de ponta a ponta.

Não adicionar feature nova.

## Passo 1 — Prettier

```powershell
npm run format
npm run format:check
```

## Passo 2 — testes

```powershell
npm test
```

Esperado:

```text
0 failed
```

## Passo 3 — lint

```powershell
npm run lint
```

## Passo 4 — build

```powershell
npm run build
```

## Passo 5 — whitespace

```powershell
git diff --check
```

## Passo 6 — execução

```powershell
npm run dev
```

## Passo 7 — usuário novo

Confirmar:

```text
Caixa
→ R$ 0,00

Histórico
→ vazio
```

## Passo 8 — entrada

Criar:

```text
R$ 1.000,00
Aporte inicial
```

Confirmar:

```text
saldo = R$ 1.000,00
histórico contém entrada
```

## Passo 9 — saída válida

Criar:

```text
R$ 250,00
Teste de saída
```

Confirmar:

```text
saldo = R$ 750,00
histórico contém saída
```

## Passo 10 — saldo insuficiente

Tentar:

```text
R$ 1.000,00
```

Confirmar:

```text
operação rejeitada
saldo permanece R$ 750,00
nenhum movimento inválido aparece
```

## Passo 11 — isolamento

Com dois usuários:

```text
USER A
→ possui movimentos

USER B
→ não vê saldo de A
→ não vê histórico de A
```

## Passo 12 — reload

Atualizar navegador.

Confirmar:

```text
saldo persiste
histórico persiste
```

## Passo 13 — responsividade

Validar:

```text
desktop
tablet
mobile
```

## Passo 14 — console

Console sem erros relevantes.

## Passo 15 — worktree

```powershell
git status --short
git --no-pager diff --stat
```

## Passo 16 — commit corretivo

Somente se necessário:

```text
fix: corrige regressões do caixa
```

Não criar commit vazio.

---

# Critério final do Ciclo 5

O ciclo termina com o fluxo:

```text
Better Auth
     ↓
AuthenticatedActor
     ↓
Cash Use Case
     ↓
userId autenticado
     ↓
Cash Repository
     ↓
CashAccount GENERAL
     ↓
CashMovement ledger
     ↓
SUM(deltaCents)
     ↓
saldo
```

E com a regra financeira:

```text
saldo nunca negativo
ledger imutável
ownership sempre derivado da sessão
```

O Ciclo 6 poderá então construir:

```text
Carteiras
→ caixa por carteira
→ transferências internas
```

sobre esta fundação.
