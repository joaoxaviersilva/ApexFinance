# Ciclo 5 — Caixa geral e ledger financeiro

**Status:** aprovado  
**Data:** 2026-09-19  
**Produto:** ApexFinance  
**Branch:** `feat/ciclo-5-cash-ledger`

---

## 1. Contexto

Os Ciclos 1 a 4 estabeleceram:

- monorepo TypeScript;
- Fastify;
- PostgreSQL + Prisma;
- React + Vite;
- Better Auth;
- autenticação e autorização;
- papéis `user` e `admin`;
- AppShell autenticado;
- módulo administrativo real;
- bloqueio e desbloqueio de usuários;
- `AuthenticatedActor`;
- isolamento multiusuário como regra arquitetural;
- `Money` baseado em centavos inteiros.

Ainda não existem entidades financeiras persistidas no banco.

O Ciclo 5 inaugura o primeiro domínio financeiro real do ApexFinance.

---

## 2. Objetivo

Ao final do ciclo, cada usuário autenticado deve possuir um caixa geral privado capaz de:

- exibir saldo atual;
- registrar entradas;
- registrar saídas;
- impedir saldo negativo;
- manter histórico financeiro imutável;
- respeitar isolamento absoluto entre usuários.

O saldo deve ser derivado dos lançamentos do ledger.

Não será mantido um campo de saldo editável como fonte da verdade.

---

## 3. Princípio central

O caixa será implementado como ledger.

Fluxo:

```text
movimentos
→ soma dos deltas
→ saldo atual
```

Nunca:

```text
saldo atual
→ edição arbitrária
```

O histórico é a fonte da verdade financeira.

---

## 4. Escopo

Incluído:

- contratos compartilhados de caixa;
- conta de caixa geral;
- ledger de movimentos;
- entradas;
- saídas;
- saldo calculado;
- histórico;
- validação de saldo suficiente;
- proteção contra concorrência;
- isolamento por usuário;
- API autenticada;
- página real de Caixa;
- estados loading, empty e error;
- responsividade;
- testes de domínio, API, persistence e UI.

---

## 5. Fora de escopo

Não implementar neste ciclo:

- carteiras de investimento;
- caixa por carteira;
- ativos;
- compra e venda de ativos;
- dividendos;
- renda fixa;
- FIIs;
- ações;
- criptomoedas;
- transferências entre carteiras;
- transferências entre usuários;
- Open Finance;
- integração bancária;
- importação automática;
- categorização de despesas;
- orçamento;
- recorrência;
- anexos;
- edição de movimentos;
- exclusão de movimentos;
- market data;
- metas;
- FIRE;
- factoring;
- Copilot;
- integração do saldo no Dashboard.

Carteiras e transferências internas pertencem ao próximo ciclo.

---

## 6. Representação monetária

Todo valor monetário permanece em centavos inteiros.

Exemplo:

```text
R$ 10,50
→ 1050
```

Contrato externo:

```ts
amountCents: number;
```

Regras:

- precisa ser inteiro;
- precisa ser seguro para JavaScript;
- precisa ser maior que zero;
- não aceitar `NaN`;
- não aceitar `Infinity`;
- não aceitar casas decimais em centavos.

O `Money` existente continua sendo a base determinística do domínio.

---

## 7. Conta de caixa geral

Cada usuário pode possuir uma conta de caixa do tipo:

```text
GENERAL
```

Modelo conceitual:

```text
CashAccount
- id
- userId
- type
- createdAt
- updatedAt
```

Regra:

```text
userId + GENERAL
→ no máximo uma conta
```

A conta pertence exclusivamente ao usuário autenticado.

---

## 8. Criação da conta

A ausência de uma conta ainda não significa erro.

Para leitura:

```text
sem conta
→ saldo 0
→ histórico vazio
```

A conta pode ser criada automaticamente na primeira mutação financeira.

Evitar criação de registros somente por uma requisição GET.

---

## 9. Tipos de movimento

Neste ciclo:

```ts
type CashMovementType = 'deposit' | 'withdrawal';
```

Persistência pode normalizar os valores como:

```text
DEPOSIT
WITHDRAWAL
```

Transferências não são expostas neste ciclo.

---

## 10. Movimento financeiro

Contrato público:

```ts
interface CashMovement {
  id: string;
  type: 'deposit' | 'withdrawal';
  amountCents: number;
  description: string;
  occurredAt: string;
  createdAt: string;
}
```

`amountCents` é sempre positivo no contrato público.

A direção financeira é representada por `type`.

---

## 11. Delta interno

Na persistência, o ledger pode representar o efeito financeiro como delta assinado:

```text
DEPOSIT
→ deltaCents positivo

WITHDRAWAL
→ deltaCents negativo
```

Exemplo:

```text
deposit R$ 100
→ +10000

withdrawal R$ 30
→ -3000
```

Saldo:

```text
SUM(deltaCents)
```

Resultado:

```text
7000
→ R$ 70,00
```

---

## 12. Persistência monetária

No PostgreSQL, valores do ledger devem utilizar `BIGINT`.

Motivo:

- evitar precisão de ponto flutuante;
- permitir valores maiores que o limite de `INTEGER`;
- preservar centavos exatos.

Ao atravessar a fronteira Prisma → aplicação:

- converter com segurança;
- rejeitar valor fora de `Number.MAX_SAFE_INTEGER`.

A API continua utilizando `number` inteiro.

---

## 13. Imutabilidade

Um movimento criado não pode ser alterado ou apagado neste ciclo.

Não existirão endpoints:

```text
PATCH /api/cash/movements/:id
DELETE /api/cash/movements/:id
```

Correções futuras deverão ocorrer por movimento compensatório.

O ledger não será silenciosamente reescrito.

---

## 14. Descrição

Todo movimento deve possuir descrição.

Regras:

```text
trim
mínimo 1 caractere útil
máximo 160 caracteres
```

Exemplos:

```text
Salário
Pagamento de aluguel
Aporte inicial
Compra de equipamento
```

---

## 15. Data do movimento

Cada movimento possui:

```text
occurredAt
createdAt
```

`occurredAt`:

- representa quando o evento financeiro ocorreu;
- pode ser informado pelo usuário;
- se omitido, utiliza horário atual do servidor.

`createdAt`:

- representa quando o ApexFinance registrou o movimento;
- sempre definido pelo servidor.

---

## 16. Saldo

Contrato:

```ts
interface CashSummary {
  balanceCents: number;
}
```

Saldo é:

```text
soma de todos os deltaCents
da conta GENERAL
do usuário autenticado
```

Não armazenar um campo editável:

```text
balance
```

como fonte autoritativa.

---

## 17. Saldo nunca negativo

Regra absoluta:

```text
saldo após withdrawal >= 0
```

Exemplo:

```text
saldo = R$ 100

saída = R$ 80
→ permitido

saída = R$ 120
→ rejeitado
```

Erro esperado:

```json
{
  "code": "INSUFFICIENT_CASH_BALANCE",
  "error": "Saldo insuficiente para realizar esta saída."
}
```

Resposta HTTP:

```text
409 Conflict
```

---

## 18. Concorrência

A regra de saldo não pode existir somente em memória.

Duas saídas simultâneas não podem ultrapassar o saldo disponível.

Exemplo:

```text
saldo inicial
R$ 100

requisição A
- R$ 80

requisição B
- R$ 80
```

Resultado correto:

```text
uma operação pode concluir
a outra deve ser rejeitada
saldo nunca fica negativo
```

A implementação deve utilizar transação PostgreSQL com isolamento adequado.

Preferência:

```text
SERIALIZABLE
```

Conflitos de serialização podem receber retry limitado.

---

## 19. Isolamento multiusuário

Regra herdada do Ciclo 4:

```text
Request
    ↓
Better Auth
    ↓
AuthenticatedActor
    ↓
actor.userId
    ↓
Use Case
    ↓
Repository
    ↓
dados daquele usuário
```

Nunca aceitar como autoridade:

```text
body.userId
query.userId
header.userId
```

Não existirão endpoints como:

```text
GET /api/cash?userId=...
```

---

## 20. Repositories privados

Leituras devem possuir ownership explícito semanticamente.

Exemplos:

```ts
findGeneralAccountForUser(userId);

listMovementsForUser(userId);

getBalanceForUser(userId);
```

Nunca:

```ts
findAccount(accountId);
```

sem confirmação do proprietário quando a operação partir de contexto privado.

---

## 21. Endpoint de saldo

```text
GET /api/cash/summary
```

Requer usuário autenticado.

Resposta:

```json
{
  "balanceCents": 125050
}
```

Sem movimentos:

```json
{
  "balanceCents": 0
}
```

---

## 22. Endpoint de histórico

```text
GET /api/cash/movements
```

Requer usuário autenticado.

Resposta:

```json
{
  "movements": [
    {
      "id": "movement-id",
      "type": "deposit",
      "amountCents": 100000,
      "description": "Aporte inicial",
      "occurredAt": "2026-09-19T18:00:00.000Z",
      "createdAt": "2026-09-19T18:00:01.000Z"
    }
  ]
}
```

Ordenação:

```text
occurredAt DESC
createdAt DESC
```

Não implementar paginação neste ciclo.

---

## 23. Endpoint de criação

```text
POST /api/cash/movements
```

Body de entrada:

```json
{
  "type": "deposit",
  "amountCents": 100000,
  "description": "Aporte inicial",
  "occurredAt": "2026-09-19T18:00:00.000Z"
}
```

`occurredAt` é opcional.

Resposta:

```text
201 Created
```

Contrato:

```json
{
  "movement": {
    "...": "CashMovement"
  },
  "balanceCents": 100000
}
```

---

## 24. Validação do payload

Rejeitar com `422`:

- type desconhecido;
- `amountCents <= 0`;
- centavos não inteiros;
- número inseguro;
- descrição vazia;
- descrição maior que 160 caracteres;
- data inválida;
- propriedades obrigatórias ausentes.

Não arredondar valor inválido automaticamente.

---

## 25. Erros

Casos principais:

```text
401
não autenticado

409
saldo insuficiente
ou conflito financeiro conhecido

422
payload inválido

500
falha interna não mapeada
```

Mensagens de domínio podem permanecer em português.

---

## 26. Contratos compartilhados

Criar contratos equivalentes a:

```ts
export type CashMovementType = 'deposit' | 'withdrawal';

export interface CashMovement {
  id: string;
  type: CashMovementType;
  amountCents: number;
  description: string;
  occurredAt: string;
  createdAt: string;
}

export interface CashSummary {
  balanceCents: number;
}

export interface CreateCashMovementRequest {
  type: CashMovementType;
  amountCents: number;
  description: string;
  occurredAt?: string;
}
```

---

## 27. Interface

Criar página:

```text
/app/cash
```

Adicionar item:

```text
Caixa
```

à navegação autenticada.

---

## 28. Estrutura visual

A página deve seguir a identidade existente:

- preto;
- verde vivo;
- glassmorphism;
- bordas discretas;
- hierarquia tipográfica limpa.

Estrutura conceitual:

```text
Caixa

Seu saldo disponível e movimentações.

┌─────────────────────────────────┐
│ SALDO ATUAL                     │
│ R$ 12.505,00                    │
│                                 │
│ [ Nova entrada ] [ Nova saída ] │
└─────────────────────────────────┘

Movimentações

Aporte inicial              + R$ 1.000,00
Pagamento                   - R$   150,00
```

Não inventar dados.

---

## 29. Formulário

O usuário deve conseguir escolher:

```text
Entrada
Saída
```

Campos:

```text
Valor
Descrição
Data
```

A interface converte moeda para centavos antes de enviar.

O backend continua sendo autoridade para validação.

---

## 30. Estados da interface

Obrigatório:

- loading de saldo;
- loading de histórico;
- empty state;
- erro de leitura;
- mutação em andamento;
- sucesso;
- erro de validação;
- saldo insuficiente.

A interface não deve perder o estado inteiro da página por uma falha de mutação.

---

## 31. Formatação monetária

Exibição em pt-BR:

```text
125050
→ R$ 1.250,50
```

Não fazer cálculos financeiros usando strings formatadas.

Formatação ocorre somente na apresentação.

---

## 32. Entradas e saídas

Entrada:

```text
deposit
→ aumenta saldo
```

Saída:

```text
withdrawal
→ reduz saldo
```

Transferência interna futura:

```text
não representa receita
não representa despesa
não cria patrimônio
não destrói patrimônio
```

Ela será tratada no ciclo de carteiras.

---

## 33. Segurança

Obrigatório:

- autenticação no backend;
- usuário vem da sessão;
- nenhum `userId` controlado pelo cliente;
- ownership em todas as queries privadas;
- inputs validados;
- saldo nunca negativo;
- transação para operação crítica;
- ledger imutável;
- ausência de secrets nas respostas.

---

## 34. TDD

Mudanças comportamentais seguem:

```text
RED
→ confirmar falha correta

GREEN
→ implementação mínima

VERIFY
→ teste alvo + regressão

REFACTOR
→ somente com testes verdes
```

Nenhuma regra financeira deve nascer sem teste correspondente.

---

## 35. Testes obrigatórios da API

Cobrir pelo menos:

```text
summary sem sessão → 401
summary novo usuário → 0
summary não lê dados de outro usuário

movements sem sessão → 401
histórico vazio
histórico ordenado
histórico não vaza movimentos de outro usuário

deposit válido → 201
withdrawal válido → 201
valor zero → 422
valor negativo → 422
valor fracionário em centavos → 422
descrição vazia → 422
type inválido → 422
data inválida → 422

withdrawal acima do saldo → 409

payload com userId forjado
→ identidade ignorada

duas saídas concorrentes
→ saldo nunca negativo
```

---

## 36. Testes obrigatórios da Web

Cobrir:

```text
rota /app/cash
item Caixa na navegação
loading
saldo zero
saldo real
histórico vazio
histórico real
formatação monetária
abrir entrada
abrir saída
criar entrada
criar saída
erro de saldo insuficiente
erro de API
estado de envio
atualização do saldo após movimento
```

---

## 37. Responsividade

Desktop:

- saldo em destaque;
- ações visíveis;
- histórico legível.

Tablet/mobile:

- cards reorganizados verticalmente;
- sem scroll horizontal obrigatório;
- botões acessíveis;
- formulário utilizável;
- histórico legível.

---

## 38. Acessibilidade

Exigir:

- labels;
- inputs associados;
- botões reais;
- foco visível;
- mensagens de erro acessíveis;
- não depender somente de verde/vermelho;
- modal ou diálogo navegável por teclado quando utilizado.

---

## 39. Critérios de aceite

O Ciclo 5 termina quando:

1. existe caixa geral privado por usuário;
2. usuário autenticado vê saldo próprio;
3. novo usuário vê saldo zero;
4. usuário registra entrada;
5. usuário registra saída;
6. saída altera saldo corretamente;
7. saída maior que saldo é rejeitada;
8. concorrência não permite saldo negativo;
9. histórico é persistido;
10. histórico é imutável;
11. dados de outro usuário não são acessíveis;
12. nenhum `userId` arbitrário controla ownership;
13. valores permanecem em centavos inteiros;
14. API valida payloads;
15. `/app/cash` é funcional;
16. interface não usa dados fictícios;
17. desktop/tablet/mobile são validados;
18. testes completos passam;
19. lint passa;
20. Prettier passa;
21. build passa;
22. `git diff --check` passa;
23. console não possui erros relevantes.

---

## 40. Decisões consolidadas

- ledger é a fonte da verdade;
- saldo é derivado;
- dinheiro permanece em centavos;
- PostgreSQL utiliza `BIGINT`;
- API expõe inteiros seguros;
- movimentos são imutáveis;
- descrição é obrigatória;
- `occurredAt` pode ser informado;
- saldo nunca fica negativo;
- operações críticas são transacionais;
- identidade vem exclusivamente da sessão;
- Caixa pertence ao usuário;
- não existe acesso administrativo automático ao caixa de terceiros;
- transferências ficam para o próximo ciclo;
- carteiras ficam para o próximo ciclo;
- Dashboard não será expandido neste ciclo.
