# Ciclo 4 — Administração e isolamento multiusuário

**Status:** aprovado  
**Data:** 2026-09-19  
**Produto:** ApexFinance  
**Branch:** `feat/ciclo-4-admin-isolation`

---

## 1. Contexto

Os Ciclos 1 a 3 estabeleceram:

- monorepo TypeScript;
- Fastify;
- PostgreSQL + Prisma;
- Better Auth;
- autenticação por email e senha;
- papéis `user` e `admin`;
- bootstrap e reset administrativo;
- proteção de rotas autenticadas;
- `RequireAdmin` no frontend;
- `requireAdmin` no backend;
- endpoint `GET /api/admin/users`;
- AppShell autenticado;
- navegação administrativa visível apenas para ADMIN;
- `/app/admin` protegido;
- layout responsivo.

O Ciclo 4 transforma essa base em um módulo administrativo real e define a regra de isolamento que será seguida pelos futuros domínios financeiros.

---

## 2. Objetivo

Ao final do ciclo, um ADMIN autenticado deve conseguir:

- visualizar usuários cadastrados;
- identificar papel e status de cada usuário;
- promover USER para ADMIN;
- rebaixar ADMIN para USER;
- bloquear usuários;
- desbloquear usuários.

Ao mesmo tempo:

- USER não acessa funcionalidades administrativas;
- um ADMIN não pode bloquear a própria conta;
- um ADMIN não pode retirar o próprio papel administrativo;
- usuários bloqueados não devem continuar operando normalmente;
- nenhuma operação administrativa expõe secrets;
- a arquitetura estabelece o usuário autenticado como origem da identidade para futuros dados privados.

---

## 3. Escopo

Incluído:

- contratos administrativos compartilhados;
- página real `/app/admin`;
- listagem de usuários;
- alteração de role;
- bloqueio;
- desbloqueio;
- motivo de bloqueio;
- revogação de sessões ao bloquear;
- guardrails contra auto-bloqueio e auto-rebaixamento;
- contexto de ator autenticado no backend;
- testes de autorização;
- testes de regras administrativas;
- testes de UI;
- responsividade;
- acessibilidade;
- revisão completa.

---

## 4. Fora de escopo

Não implementar neste ciclo:

- exclusão de usuário;
- recuperação de senha por email;
- alteração manual da senha de terceiros pela interface;
- impersonation;
- visualização dos dados financeiros de outro usuário;
- organizações;
- workspaces;
- permissões granulares além de `user` e `admin`;
- auditoria completa persistida;
- painel de métricas administrativas;
- caixa;
- carteiras;
- ativos;
- transações;
- market data;
- factoring;
- Copilot.

Audit Log continuará sendo uma evolução posterior.

---

## 5. Estado atual do domínio de identidade

O modelo `User` já possui:

```text
id
name
email
emailVerified
image
createdAt
updatedAt
role
banned
banReason
banExpires
````

O Better Auth está configurado com:

```text
defaultRole = user
adminRoles = [admin]
```

Portanto, o Ciclo 4 não criará um segundo sistema de autorização.

As informações administrativas existentes serão normalizadas para contratos do ApexFinance.

---

## 6. Papéis

Papéis válidos:

```text
user
admin
```

Contrato TypeScript:

```ts
type UserRole = 'user' | 'admin';
```

Não aceitar valores arbitrários enviados pelo cliente.

O frontend nunca é autoridade para autorização.

---

## 7. Status administrativo

O status público utilizado pelo ApexFinance será:

```ts
type AdminUserStatus = 'active' | 'blocked';
```

Mapeamento:

```text
banned = true
→ blocked

banned != true
→ active
```

A interface não precisa conhecer detalhes internos do Better Auth para determinar o status.

---

## 8. Contrato de usuário administrativo

A listagem administrativa deve expor somente dados necessários:

```ts
interface AdminUser {
  id: string;
  name: string;
  email: string;
  role: 'user' | 'admin';
  status: 'active' | 'blocked';
  banReason: string | null;
  createdAt: string;
}
```

Não retornar:

* password;
* password hash;
* session token;
* access token;
* refresh token;
* Better Auth secret;
* provider secret;
* API key.

---

## 9. Listagem administrativa

Endpoint:

```text
GET /api/admin/users
```

Somente ADMIN.

Resposta:

```json
{
  "users": [
    {
      "id": "user-id",
      "name": "João",
      "email": "joao@example.com",
      "role": "admin",
      "status": "active",
      "banReason": null,
      "createdAt": "2026-09-19T18:00:00.000Z"
    }
  ]
}
```

A ordenação inicial permanece por data de criação.

---

## 10. Alteração de papel

Endpoint proposto:

```text
PATCH /api/admin/users/:userId/role
```

Body:

```json
{
  "role": "admin"
}
```

ou:

```json
{
  "role": "user"
}
```

Regras:

* requer ADMIN autenticado;
* alvo precisa existir;
* role precisa ser válida;
* administrador não pode alterar o próprio papel para `user`;
* nenhuma role diferente de `user` ou `admin` é aceita;
* atualização deve refletir imediatamente na listagem.

Resposta:

```json
{
  "user": {
    "...": "AdminUser"
  }
}
```

---

## 11. Bloqueio de usuário

Endpoint proposto:

```text
PATCH /api/admin/users/:userId/status
```

Bloquear:

```json
{
  "status": "blocked",
  "reason": "Motivo administrativo"
}
```

Desbloquear:

```json
{
  "status": "active"
}
```

Regras:

* requer ADMIN;
* alvo precisa existir;
* administrador não pode bloquear a própria conta;
* bloqueio exige motivo não vazio;
* motivo é armazenado em `banReason`;
* bloqueio será permanente até desbloqueio manual;
* `banExpires` permanece `null` na V1;
* ao bloquear, sessões existentes do usuário devem ser invalidadas;
* desbloquear limpa o estado de bloqueio;
* desbloquear não autentica automaticamente o usuário.

---

## 12. Sessão de usuário bloqueado

Usuário bloqueado não deve:

* criar nova sessão normalmente;
* continuar utilizando uma sessão previamente válida após o bloqueio.

O backend deve garantir isso.

A implementação pode utilizar capacidades do Better Auth e/ou transação Prisma, mas o comportamento acima é obrigatório.

---

## 13. Guardrails

### 13.1 Auto-rebaixamento

ADMIN autenticado não pode executar:

```text
ADMIN atual → USER
```

sobre a própria conta.

Motivo:

* evitar lockout administrativo acidental.

### 13.2 Auto-bloqueio

ADMIN autenticado não pode bloquear a própria conta.

### 13.3 Outro administrador

Um ADMIN pode administrar outro ADMIN, desde que o alvo não seja ele próprio.

### 13.4 Frontend não basta

Botões desabilitados na interface são apenas UX.

As regras precisam existir no backend.

---

## 14. Erros

As rotas administrativas devem retornar erros previsíveis.

Casos principais:

```text
401
não autenticado

403
não administrador

404
usuário alvo inexistente

409
ação administrativa conflitante
ex.: auto-bloqueio ou auto-rebaixamento

422
payload inválido
```

Mensagens podem permanecer em português.

Quando útil, respostas podem incluir código estável:

```json
{
  "code": "SELF_ROLE_CHANGE_NOT_ALLOWED",
  "error": "Você não pode remover seu próprio acesso administrativo."
}
```

---

## 15. Página `/app/admin`

O placeholder atual será substituído por uma página real.

Estrutura:

```text
Administração

Gerenciamento de usuários da plataforma.

[ resumo discreto ]

Usuários
┌────────────────────────────────────────────┐
│ Nome / Email                              │
│ Papel             Status        Criado em │
│ Ações                                      │
└────────────────────────────────────────────┘
```

A página deve utilizar dados reais da API.

Não usar números fictícios.

---

## 16. Estados da interface

A página deve possuir:

* loading;
* sucesso;
* lista vazia;
* erro;
* mutação em andamento;
* feedback de sucesso;
* feedback de falha.

A UI não deve travar a aplicação inteira durante uma mutação individual.

---

## 17. Ações administrativas na UI

Por usuário:

```text
Alterar papel
Bloquear
Desbloquear
```

As ações disponíveis dependem do estado.

Exemplos:

```text
USER ativo
→ Tornar ADMIN
→ Bloquear

ADMIN ativo
→ Tornar USER
→ Bloquear

Usuário bloqueado
→ Desbloquear
```

Para o próprio ADMIN autenticado:

```text
Tornar USER
→ indisponível

Bloquear
→ indisponível
```

---

## 18. Confirmação de ações sensíveis

Ações de impacto devem solicitar confirmação antes da mutação.

Obrigatório para:

* rebaixar ADMIN;
* bloquear usuário.

Não é necessário modal complexo.

Pode ser utilizada confirmação visual compatível com o design do ApexFinance.

---

## 19. Identidade visual

Manter a identidade aprovada no Ciclo 3:

* preto;
* verde vivo;
* superfícies translúcidas;
* bordas discretas;
* tipografia limpa;
* sem dashboard administrativo genérico;
* sem alterações no Login/Cadastro.

A autenticação visual permanece congelada.

---

## 20. Responsividade

Desktop:

* tabela/listagem confortável;
* sidebar persistente.

Tablet/mobile:

* conteúdo administrativo não pode gerar scroll horizontal obrigatório;
* informações podem reorganizar-se em cards/linhas responsivas;
* ações continuam acessíveis;
* drawer existente continua funcionando.

---

## 21. Acessibilidade

Exigir:

* labels acessíveis;
* botões reais para ações;
* foco visível;
* feedback compreensível;
* estado disabled correto;
* diálogos/confirmadores navegáveis por teclado;
* sem depender apenas de cor para status.

---

## 22. Isolamento multiusuário

Este ciclo estabelece uma regra arquitetural para todos os domínios privados futuros.

Dados financeiros nunca devem ser buscados utilizando um `userId` arbitrário fornecido pelo frontend como autoridade.

Fluxo esperado:

```text
Request HTTP
    ↓
Sessão Better Auth
    ↓
AuthenticatedActor
    ↓
userId confiável
    ↓
Use Case
    ↓
Repository filtrado por userId
```

O `userId` autorizado vem da sessão.

---

## 23. AuthenticatedActor

Criar uma representação mínima:

```ts
interface AuthenticatedActor {
  userId: string;
  role: 'user' | 'admin';
}
```

Sua finalidade é:

* representar a identidade autenticada;
* permitir guardrails;
* servir de base para futuros use cases financeiros;
* evitar dependência direta de payloads arbitrários.

Não criar abstrações de domínio financeiro ainda.

---

## 24. Regra futura de repositories

Futuros repositories privados deverão seguir semanticamente:

```ts
findByIdForUser(resourceId, userId)
```

em vez de:

```ts
findById(resourceId)
```

quando o recurso pertencer a um usuário.

O Ciclo 4 documenta e prepara essa fronteira, mas não cria tabelas financeiras antecipadamente.

---

## 25. Segurança

Obrigatório:

* autorização no backend;
* inputs validados;
* secrets nunca retornados;
* sessão derivada de cookie/header autenticado;
* mutações administrativas não dependem apenas da UI;
* sessões do alvo revogadas no bloqueio;
* ações sobre usuário inexistente não geram comportamento ambíguo.

---

## 26. Testes obrigatórios

### API

Cobrir pelo menos:

* GET users sem sessão → 401;
* GET users como USER → 403;
* GET users como ADMIN → 200;
* contrato normalizado de usuário;
* alteração de role como ADMIN;
* USER não altera role;
* role inválida;
* usuário inexistente;
* auto-rebaixamento bloqueado;
* bloqueio por ADMIN;
* USER não bloqueia;
* bloqueio exige motivo;
* auto-bloqueio bloqueado;
* desbloqueio;
* sessão invalidada após bloqueio;
* usuário bloqueado não opera normalmente.

### Web

Cobrir:

* USER continua sem acesso a `/app/admin`;
* ADMIN acessa página;
* loading;
* listagem;
* role/status visíveis;
* alterar role;
* confirmação;
* bloquear;
* desbloquear;
* erro de API;
* ações próprias indisponíveis;
* responsividade estrutural quando viável.

---

## 27. Critérios de aceite

O Ciclo 4 só termina quando:

1. `/app/admin` não é mais placeholder;
2. usuários reais aparecem;
3. role real aparece;
4. status real aparece;
5. ADMIN promove USER;
6. ADMIN rebaixa outro ADMIN;
7. ADMIN bloqueia usuário;
8. ADMIN desbloqueia usuário;
9. auto-rebaixamento é impedido no backend;
10. auto-bloqueio é impedido no backend;
11. sessão do bloqueado é revogada;
12. USER continua sem acesso administrativo;
13. contratos não expõem secrets;
14. contexto autenticado está preparado para isolamento futuro;
15. testes completos passam;
16. lint passa;
17. Prettier passa;
18. build passa;
19. desktop/mobile são validados visualmente;
20. console não possui erros relevantes.

---

## 28. Decisões consolidadas

* Better Auth continua como sistema de autenticação;
* não duplicar RBAC;
* roles permanecem `user` e `admin`;
* status público será `active` ou `blocked`;
* bloqueio manual é permanente até desbloqueio;
* motivo de bloqueio é obrigatório;
* excluir usuário está fora de escopo;
* ADMIN não acessa automaticamente dados financeiros alheios;
* ADMIN não pode bloquear a própria conta;
* ADMIN não pode remover o próprio papel;
* backend é autoridade;
* identidade futura dos use cases vem da sessão;
* nenhuma tabela financeira será antecipada neste ciclo.