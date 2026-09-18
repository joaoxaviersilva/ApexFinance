Boa. A branch está certa e limpa. Eu também usei o GitHub para conferir a `main` atual antes de fechar o plano técnico: o `/app` ainda aponta para a `SessionPage`, o `AppShell` compartilhado ainda é mínimo, e o backend já devolve `role` na sessão de `/api/me`. Para tipar a role no client, o Better Auth documenta o `adminClient()` junto ao plugin admin que já usamos no servidor. ([Better Auth][1])

Agora vamos registrar **spec + plano**, sem implementar nada ainda.

### 1. Crie as pastas e os dois arquivos

Rode exatamente:

```powershell
New-Item `
  -ItemType Directory `
  -Force `
  "docs\superpowers\specs" |
  Out-Null

New-Item `
  -ItemType Directory `
  -Force `
  "docs\superpowers\plans" |
  Out-Null

New-Item `
  -ItemType File `
  -Force `
  "docs\superpowers\specs\2026-09-17-ciclo-3-app-shell.md" |
  Out-Null

New-Item `
  -ItemType File `
  -Force `
  "docs\superpowers\plans\2026-09-17-ciclo-3-app-shell.md" |
  Out-Null
```

Agora coloque **todo este conteúdo** em:

`docs/superpowers/specs/2026-09-17-ciclo-3-app-shell.md`

````markdown
# Ciclo 3 — App Shell autenticado

**Data:** 17/09/2026  
**Status:** Aprovado  
**Branch:** `feat/ciclo-3-app-shell`

## 1. Contexto

O Ciclo 2 consolidou a autenticação do ApexFinance com Better Auth, PostgreSQL e Prisma.

O sistema já possui:

- cadastro;
- login;
- persistência de sessão;
- logout;
- papel `USER`;
- papel `ADMIN`;
- proteção de endpoints administrativos;
- redefinição local de senha;
- revogação de sessões;
- rota protegida `/app`.

Neste momento, entretanto, `/app` ainda representa apenas uma tela mínima de confirmação de autenticação.

O Ciclo 3 transforma essa área autenticada na estrutura definitiva da aplicação.

## 2. Objetivo

Construir o shell principal autenticado do ApexFinance, estabelecendo:

- layout persistente;
- identidade visual da área interna;
- navegação;
- roteamento interno;
- menu de usuário;
- diferenciação visual por papel;
- dashboard estrutural;
- responsividade;
- acessibilidade básica.

Ao final deste ciclo, o ApexFinance deverá parecer e se comportar como uma aplicação financeira completa mesmo antes da implementação dos módulos financeiros.

## 3. Escopo

### 3.1 App Shell

A área autenticada deverá utilizar um shell persistente composto por:

- sidebar;
- header;
- área principal de conteúdo;
- navegação mobile;
- menu do usuário.

O shell deverá ser reutilizado em todas as rotas internas.

O componente `AppShell` existente em `packages/ui` deverá ser evoluído em vez de ser duplicado dentro da aplicação web.

O `AppShell` compartilhado será responsável apenas pela estrutura visual genérica.

Conhecimento específico do ApexFinance, como rotas, usuário, papel e itens de navegação, continuará pertencendo a `apps/web`.

## 4. Identidade visual

A identidade visual aprovada no Ciclo 2 deverá ser preservada.

Direção visual:

- fundo preto profundo;
- verde vivo como cor principal;
- superfícies escuras;
- bordas sutis;
- glassmorphism moderado;
- hierarquia tipográfica limpa;
- aparência premium;
- alto contraste;
- animações discretas.

A área autenticada não deverá redesenhar login ou cadastro.

As telas de autenticação ficam congeladas neste ciclo, exceto se alguma alteração técnica mínima for necessária para manter compatibilidade.

## 5. Roteamento

A área autenticada utilizará rotas aninhadas.

Estrutura prevista:

```text
/app
├── /app
├── /app/portfolio
├── /app/intelligence
├── /app/goals
├── /app/fire
├── /app/factoring
├── /app/copilot
└── /app/admin
```
````

Correspondência visual:

| Rota                | Módulo        |
| ------------------- | ------------- |
| `/app`              | Dashboard     |
| `/app/portfolio`    | Carteira      |
| `/app/intelligence` | Inteligência  |
| `/app/goals`        | Metas         |
| `/app/fire`         | FIRE          |
| `/app/factoring`    | Factoring     |
| `/app/copilot`      | Copilot       |
| `/app/admin`        | Administração |

A rota `/app` será a rota inicial após login e cadastro.

Rotas desconhecidas dentro da área autenticada deverão retornar ao Dashboard.

## 6. Proteção de autenticação

Todo o grupo `/app/*` continuará protegido por `RequireAuth`.

Usuários não autenticados que tentarem acessar qualquer rota interna deverão ser redirecionados para `/`.

A autenticação continuará sendo determinada pelo Better Auth.

O Ciclo 3 não introduzirá um mecanismo paralelo de sessão.

## 7. Autorização administrativa

O plugin administrativo do Better Auth continuará sendo a fonte de papel do usuário.

O cliente web deverá reconhecer a propriedade `role` da sessão.

A navegação “Administração” será exibida somente quando:

```text
role === "admin"
```

A rota `/app/admin` terá uma guarda específica de frontend.

Usuários comuns que tentarem acessar `/app/admin` diretamente deverão ser redirecionados para `/app`.

Essa proteção de frontend existe para UX e roteamento.

Ela não substitui autorização de backend.

Endpoints administrativos continuarão protegidos no servidor por `requireAdmin`.

## 8. Navegação principal

A sidebar deverá apresentar:

- Dashboard;
- Carteira;
- Inteligência;
- Metas;
- FIRE;
- Factoring;
- Copilot;
- Administração, apenas para ADMIN.

Cada item deve possuir:

- ícone;
- texto;
- estado ativo;
- foco visível;
- navegação sem recarregar a aplicação.

A sidebar deverá exibir a marca ApexFinance.

## 9. Header

O header autenticado deverá possuir:

- título ou contexto da página atual;
- controle para abrir navegação em telas pequenas;
- identificação do usuário;
- acesso ao menu do usuário.

Informações pessoais devem vir da sessão real.

Nenhum nome, e-mail ou papel poderá ser hardcoded.

## 10. Menu do usuário

O menu deverá mostrar de forma compacta:

- nome;
- e-mail;
- papel quando relevante;
- ação “Sair”.

O logout existente deverá ser reaproveitado.

Não deverá existir uma segunda implementação independente de logout.

Ao sair:

1. Better Auth encerra a sessão;
2. o usuário é redirecionado para `/`;
3. rotas protegidas deixam de ser acessíveis.

## 11. Dashboard

O Dashboard deste ciclo será estrutural.

Ele não deverá inventar informações financeiras.

É permitido mostrar:

- saudação baseada no usuário;
- contexto introdutório;
- cards de estado vazio;
- ações para módulos futuros;
- indicadores explicitamente marcados como ainda sem dados.

Não será permitido mostrar valores financeiros fictícios como se fossem dados reais.

Exemplos proibidos:

```text
Patrimônio: R$ 245.000
Rentabilidade: +12,4%
Dividendos: R$ 2.350
```

sem que essas informações existam no banco.

## 12. Páginas dos módulos futuros

Carteira, Inteligência, Metas, FIRE, Factoring e Copilot receberão páginas estruturais.

Essas páginas poderão conter:

- título;
- descrição;
- estado vazio;
- indicação de que o módulo será implementado em ciclo posterior.

Não deverão conter regras financeiras ou dados simulados tratados como reais.

## 13. Administração

A página Administração deste ciclo será estrutural.

Ela poderá indicar que a gestão administrativa está disponível apenas para administradores.

A integração visual com a listagem real de usuários poderá ser feita neste ciclo somente se puder reutilizar de forma simples o endpoint já existente:

```text
GET /api/admin/users
```

A criação de um painel administrativo completo não faz parte deste ciclo.

## 14. Responsividade

O shell deverá funcionar em:

- desktop;
- notebook;
- tablet;
- mobile.

Em telas largas:

- sidebar persistente;
- conteúdo ao lado;
- header fixado à região de conteúdo.

Em telas menores:

- sidebar deixa de ocupar espaço permanente;
- navegação abre sob demanda;
- overlay fecha a navegação;
- seleção de rota fecha o menu;
- tecla Escape fecha menus quando aplicável.

Nenhuma página deverá gerar scroll horizontal involuntário.

## 15. Acessibilidade

Os componentes interativos deverão possuir:

- elementos semânticos;
- nomes acessíveis;
- foco visível;
- navegação por teclado;
- `aria-current="page"` no item de rota ativo;
- `aria-expanded` nos controles expansíveis;
- Escape para fechar menus;
- retorno de foco quando apropriado;
- suporte a `prefers-reduced-motion`.

## 16. Arquitetura

A responsabilidade ficará dividida assim:

```text
packages/ui
└── AppShell
    └── estrutura genérica reutilizável

apps/web
├── routing
├── sessão
├── navegação
├── sidebar
├── header
├── menu do usuário
├── autorização visual
└── páginas
```

`packages/ui` não deverá conhecer:

- Better Auth;
- roles;
- URLs do ApexFinance;
- módulos financeiros;
- regras de negócio.

`apps/web` deverá compor essas informações sobre o shell genérico.

## 17. Estado e dados

Não será introduzida biblioteca global de estado neste ciclo.

O estado local do React será suficiente para:

- sidebar mobile;
- menu do usuário;
- interações visuais.

A sessão continuará sendo fornecida pelo Better Auth.

Não haverá Redux, Zustand ou alternativa equivalente sem necessidade concreta.

## 18. Banco e backend

O Ciclo 3 não criará novos modelos financeiros no Prisma.

Não serão criados neste ciclo:

- Portfolio;
- Asset;
- Transaction;
- Goal;
- FIREPlan;
- FactoringOperation;
- MarketQuote.

Também não serão criados endpoints falsos para preencher o Dashboard.

Alterações de backend só serão realizadas caso sejam estritamente necessárias para suportar autenticação ou autorização já existentes.

## 19. Testes

O ciclo seguirá TDD.

Para cada comportamento:

1. escrever teste que falha;
2. executar e confirmar RED;
3. implementar o mínimo;
4. executar e confirmar GREEN;
5. refatorar;
6. executar novamente.

Deverão existir testes para, no mínimo:

- shell autenticado;
- rotas internas;
- acesso sem sessão;
- Dashboard;
- navegação;
- item ativo;
- usuário ADMIN;
- usuário comum;
- acesso direto ao admin;
- logout;
- comportamento mobile estrutural;
- AppShell compartilhado.

## 20. Fora de escopo

Não fazem parte do Ciclo 3:

- carteira real;
- cadastro de ativos;
- transações;
- patrimônio;
- dividendos;
- cotações;
- importação de ativos;
- inteligência de mercado;
- metas financeiras funcionais;
- cálculo FIRE;
- factoring funcional;
- Copilot com IA;
- gráficos financeiros;
- FinTech Academy;
- pagamentos;
- Open Finance;
- corretoras;
- execução de ordens;
- aplicativo mobile nativo.

## 21. Critérios de aceite

O ciclo será considerado concluído quando:

1. login direcionar para um Dashboard real da aplicação;
2. `/app/*` usar um shell persistente;
3. todas as rotas planejadas forem navegáveis;
4. nenhuma rota autenticada estiver acessível sem sessão;
5. usuário comum não visualizar Administração;
6. usuário comum não acessar `/app/admin`;
7. ADMIN visualizar e acessar Administração;
8. logout continuar funcional;
9. desktop e mobile funcionarem sem quebra estrutural;
10. nenhuma informação financeira fictícia for apresentada como real;
11. `packages/ui/AppShell` for reutilizado;
12. testes estiverem verdes;
13. lint estiver verde;
14. Prettier estiver verde;
15. build estiver verde;
16. validação visual manual for aprovada.
