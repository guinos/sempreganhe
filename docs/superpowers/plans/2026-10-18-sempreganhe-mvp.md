# SempreGanhe MVP Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Construir o MVP web do SempreGanhe para um restaurante piloto, com arquitetura multi-restaurante, promoções de prêmio fixo, raspadinha pública e painel administrativo.

**Architecture:** Aplicação full-stack Next.js com App Router e TypeScript. A área pública usa um identificador público da promoção; a área administrativa exige autenticação e valida o restaurante associado em cada operação. PostgreSQL e Drizzle persistem os dados, com a separação por restaurante aplicada no servidor.

**Tech Stack:** Next.js, TypeScript, React, Tailwind CSS, PostgreSQL, Drizzle, Zod, bcryptjs, qrcode, Vitest e Playwright.

**Spec:** `docs/superpowers/specs/2026-10-18-sempreganhe-mvp-design.md`

## Global Constraints

- O cliente raspa antes de informar os dados.
- O prêmio é fixo por promoção e aparece imediatamente após a raspagem.
- O cadastro obrigatório contém nome, telefone e aceite dos termos/privacidade.
- O cadastro concluído transforma a participação em resgate utilizado.
- O MVP não envia WhatsApp nem valida automaticamente uma compra.
- O MVP começa com um restaurante piloto, mas os dados devem ser isolados por restaurante.
- O painel usa login por e-mail e senha.
- Promoções fora da validade ou inativas não iniciam novas participações.
- O cliente não cria senha nem faz login.

## Review Focus

- Acesso a uma promoção inativa ou fora da validade deve bloquear uma nova raspadinha: teste na tarefa de domínio de promoções.
- Usuário administrativo de um restaurante não pode ler ou alterar dados de outro: teste na tarefa de autorização e isolamento.
- Cliente que raspa e abandona não deve aparecer como resgatado: teste na tarefa do fluxo público.
- Reenvio do formulário de cadastro não deve criar um resgate duplicado para a mesma participação: teste na tarefa de resgate.
- Nome, telefone e aceite ausentes ou inválidos devem impedir a conclusão: teste na tarefa de validação do formulário.

### Task 1: Scaffold e fundação do projeto

**Files:**
- Create: `package.json`, `tsconfig.json`, `next.config.ts`, `postcss.config.mjs`, `tailwind.config.ts`
- Create: `app/layout.tsx`, `app/page.tsx`, `app/globals.css`
- Create: `src/lib/env.ts`, `src/lib/db.ts`
- Create: `.env.example`, `.gitignore`
- Test: `tests/smoke/app.test.ts`

**Interfaces:**
- Produces: aplicação Next.js executável com `pnpm dev`, cliente Drizzle centralizado em `src/db/index.ts` e validação das variáveis de ambiente.

- [ ] **Step 1: Write the failing smoke test**

  Criar um teste que importe a configuração mínima do projeto e confirme que a aplicação possui o módulo público inicial e a variável de ambiente documentada para o banco.

- [ ] **Step 2: Run test to verify it fails**

  Run: `pnpm vitest run tests/smoke/app.test.ts`
  Expected: FAIL because the project files and configuration do not exist.

- [ ] **Step 3: Scaffold the Next.js application and configure Tailwind**

  Inicializar o projeto com TypeScript, App Router, ESLint e `pnpm`; manter a página inicial mínima e criar a estrutura `src/lib`.

- [ ] **Step 4: Add environment validation and Drizzle client placeholder**

  Implementar `src/lib/env.ts` com validação de `DATABASE_URL` e `AUTH_SECRET`, e `src/db/index.ts` com um pool lazy e uma única instância do cliente Drizzle.

- [ ] **Step 5: Run the smoke test**

  Run: `pnpm vitest run tests/smoke/app.test.ts`
  Expected: PASS.

- [ ] **Step 6: Commit**

  `git add . && git commit -m "chore: scaffold SempreGanhe"`

### Task 2: Modelo de dados, migrações e isolamento do restaurante

**Files:**
- Create: `src/db/schema/`, `src/db/index.ts`, `drizzle/`, `drizzle.config.ts`
- Create: `src/domain/promotion.ts`, `src/domain/participation.ts`
- Create: `tests/domain/promotion.test.ts`, `tests/domain/participation.test.ts`

**Interfaces:**
- Produces: tabelas Drizzle `restaurants`, `adminUsers`, `promotions` e `participations`; estados `PENDING` e `REDEEMED`; funções `isPromotionAvailable()` e `completeParticipation()`.

- [ ] **Step 1: Write failing domain tests**

  Cobrir promoção ativa dentro do intervalo, promoção inativa, promoção fora do intervalo, participação pendente e conclusão idempotente da participação.

- [ ] **Step 2: Run tests to verify they fail**

  Run: `pnpm vitest run tests/domain/promotion.test.ts tests/domain/participation.test.ts`
  Expected: FAIL because the domain functions and models do not exist.

- [ ] **Step 3: Define the Drizzle schema**

  Criar os quatro modelos com IDs internos, relação `restaurantId`, slug público único da promoção, datas de validade, prêmio fixo, status e índices para painel e consultas públicas.

- [ ] **Step 4: Implement the domain rules**

  Implementar `isPromotionAvailable(promotion, now): boolean` e `completeParticipation(participation, input): Participation`, rejeitando promoções indisponíveis e mantendo uma participação já resgatada idempotente.

- [ ] **Step 5: Add SQL migration, seed and run tests**

  Gerar a migração SQL inicial, criar seed de um restaurante piloto com usuário administrativo e executar os testes de domínio.

  Run: `pnpm db:generate` and `pnpm vitest run tests/domain/promotion.test.ts tests/domain/participation.test.ts`
  Expected: migration succeeds and tests PASS.

- [ ] **Step 6: Commit**

  `git add src/db drizzle drizzle.config.ts src/domain tests/domain && git commit -m "feat: add MVP data model"`

### Task 3: Autenticação administrativa e autorização por restaurante

**Files:**
- Create: `src/lib/auth.ts`, `src/app/(admin)/login/page.tsx`
- Create: `src/app/api/auth/login/route.ts`, `src/app/api/auth/logout/route.ts`
- Create: `src/middleware.ts`
- Create: `tests/auth/auth.test.ts`, `tests/auth/tenant-isolation.test.ts`

**Interfaces:**
- Consumes: `AdminUser.restaurantId` e `src/lib/db.ts`.
- Produces: sessão autenticada contendo `adminUserId` e `restaurantId`; helper `requireAdminSession()` para rotas administrativas.

- [ ] **Step 1: Write failing authentication tests**

  Testar login válido, senha inválida, sessão ausente e tentativa de consultar um `restaurantId` diferente do restaurante da sessão.

- [ ] **Step 2: Run tests to verify they fail**

  Run: `pnpm vitest run tests/auth`
  Expected: FAIL because session and route helpers do not exist.

- [ ] **Step 3: Implement password hashing and cookie session**

  Usar `bcryptjs` para comparar hashes e cookie httpOnly assinado com `AUTH_SECRET`; não retornar senha ou hash nas respostas.

- [ ] **Step 4: Implement login, logout and middleware**

  Proteger rotas sob `/admin` e `/api/admin`; redirecionar usuários não autenticados para `/login`.

- [ ] **Step 5: Apply tenant authorization in server helpers**

  Implementar `requireAdminSession()` e consultas que sempre filtrem por `restaurantId` da sessão, ignorando IDs de restaurante enviados pelo cliente.

- [ ] **Step 6: Run tests**

  Run: `pnpm vitest run tests/auth`
  Expected: PASS.

- [ ] **Step 7: Commit**

  `git add src/lib/auth.ts src/app src/middleware.ts tests/auth && git commit -m "feat: add admin authentication"`

### Task 4: CRUD de promoções e QR Code/link público

**Files:**
- Create: `src/app/(admin)/admin/page.tsx`, `src/app/(admin)/admin/promotions/page.tsx`
- Create: `src/app/(admin)/admin/promotions/new/page.tsx`
- Create: `src/app/api/admin/promotions/route.ts`, `src/app/api/admin/promotions/[id]/route.ts`
- Create: `src/lib/validation/promotion.ts`, `src/lib/public-promotion.ts`
- Test: `tests/promotions/promotion-api.test.ts`, `tests/promotions/public-link.test.ts`

**Interfaces:**
- Consumes: `requireAdminSession()`, `isPromotionAvailable()` e `Promotion`.
- Produces: CRUD autenticado de promoções; `getPublicPromotionBySlug(slug)` sem expor IDs internos.

- [ ] **Step 1: Write failing API and link tests**

  Testar criação com nome, descrição, prêmio e intervalo válidos; rejeição de campos ausentes; edição/ativação; isolamento por restaurante; e consulta pública por slug.

- [ ] **Step 2: Run tests to verify they fail**

  Run: `pnpm vitest run tests/promotions`
  Expected: FAIL because routes, validation and public lookup do not exist.

- [ ] **Step 3: Implement promotion validation and CRUD**

  Usar Zod no servidor; gerar slug aleatório não sequencial; aplicar `restaurantId` exclusivamente da sessão; impedir fim anterior ao início.

- [ ] **Step 4: Build the promotions list and create/edit forms**

  Exibir status, validade, prêmio, link público e ações de editar/ativar/desativar.

- [ ] **Step 5: Add QR Code rendering/download**

  Renderizar o QR Code a partir do link público da promoção, sem criar uma nova regra de negócio.

- [ ] **Step 6: Run tests**

  Run: `pnpm vitest run tests/promotions`
  Expected: PASS.

- [ ] **Step 7: Commit**

  `git add src/app src/lib/validation src/lib/public-promotion.ts tests/promotions && git commit -m "feat: manage promotions and public links"`

### Task 5: Raspadinha pública e registro da participação pendente

**Files:**
- Create: `src/app/p/[slug]/page.tsx`, `src/app/p/[slug]/scratch/page.tsx`
- Create: `src/app/api/public/promotions/[slug]/participations/route.ts`
- Create: `src/components/scratch-card.tsx`
- Create: `src/lib/validation/participation.ts`
- Test: `tests/public/scratch-flow.test.ts`

**Interfaces:**
- Consumes: `getPublicPromotionBySlug(slug)` e `isPromotionAvailable()`.
- Produces: participação pendente com `promotionId` e prêmio derivado da promoção; cliente consegue manter a participação entre as telas.

- [ ] **Step 1: Write failing scratch-flow tests**

  Testar que promoção disponível cria participação pendente, promoção inativa/expirada é rejeitada e o prêmio retornado é o prêmio fixo da promoção.

- [ ] **Step 2: Run tests to verify they fail**

  Run: `pnpm vitest run tests/public/scratch-flow.test.ts`
  Expected: FAIL because the public route and scratch component do not exist.

- [ ] **Step 3: Implement participation creation**

  Criar participação pendente no servidor após a raspagem; retornar somente token público da participação, prêmio e dados de apresentação necessários.

- [ ] **Step 4: Implement the scratch card UI**

  Criar interação responsiva para toque e mouse; o resultado visual deve revelar o texto do prêmio e oferecer o botão “Resgatar prêmio”.

- [ ] **Step 5: Run tests and manual browser check**

  Run: `pnpm vitest run tests/public/scratch-flow.test.ts` and `pnpm dev`.
  Expected: automated tests PASS; mobile viewport allows scratch and result display.

- [ ] **Step 6: Commit**

  `git add src/app/p src/app/api/public src/components src/lib/validation/participation.ts tests/public && git commit -m "feat: add public scratch card"`

### Task 6: Cadastro do cliente e conclusão do resgate

**Files:**
- Create: `src/app/p/[slug]/redeem/page.tsx`, `src/app/p/[slug]/success/page.tsx`
- Create: `src/app/api/public/participations/[token]/redeem/route.ts`
- Create: `src/lib/validation/customer.ts`
- Test: `tests/public/redeem-flow.test.ts`

**Interfaces:**
- Consumes: token público da participação pendente e `completeParticipation()`.
- Produces: participação `REDEEMED`; resposta de confirmação sem expor dados de outros clientes.

- [ ] **Step 1: Write failing redemption tests**

  Testar sucesso com nome, telefone e aceite válidos; rejeição de dados inválidos; participação inexistente; participação já resgatada sem duplicação.

- [ ] **Step 2: Run tests to verify they fail**

  Run: `pnpm vitest run tests/public/redeem-flow.test.ts`
  Expected: FAIL because the redemption route and form do not exist.

- [ ] **Step 3: Implement server-side validation and idempotent redemption**

  Validar nome, telefone e aceite com Zod; atualizar apenas a participação identificada pelo token; definir `redeemedAt` uma única vez.

- [ ] **Step 4: Build registration and success screens**

  Mostrar o prêmio relacionado à participação, coletar os campos obrigatórios e exibir confirmação após sucesso.

- [ ] **Step 5: Run tests and manual browser check**

  Run: `pnpm vitest run tests/public/redeem-flow.test.ts` and `pnpm dev`.
  Expected: tests PASS; cadastro funciona em viewport móvel.

- [ ] **Step 6: Commit**

  `git add src/app/p src/app/api/public/participations src/lib/validation/customer.ts tests/public && git commit -m "feat: complete customer redemption"`

### Task 7: Painel de participações e indicadores do restaurante

**Files:**
- Create: `src/app/(admin)/admin/participations/page.tsx`
- Create: `src/app/api/admin/participations/route.ts`, `src/app/api/admin/dashboard/route.ts`
- Create: `tests/admin/participations.test.ts`, `tests/admin/dashboard.test.ts`

**Interfaces:**
- Consumes: `requireAdminSession()` e estados `PENDING`/`REDEEMED`.
- Produces: lista paginada/ordenada de participações do restaurante autenticado e indicadores básicos.

- [ ] **Step 1: Write failing panel tests**

  Testar listagem por promoção, filtro por status, ordenação por data e contagens de promoções/participações/resgates restritas ao restaurante.

- [ ] **Step 2: Run tests to verify they fail**

  Run: `pnpm vitest run tests/admin`
  Expected: FAIL because the admin queries and routes do not exist.

- [ ] **Step 3: Implement tenant-scoped queries and API routes**

  Usar sempre `restaurantId` da sessão; não aceitar filtro de restaurante do navegador; limitar campos retornados ao painel.

- [ ] **Step 4: Build dashboard and participation table**

  Mostrar os indicadores e a tabela com nome, telefone, promoção, prêmio, data e estado.

- [ ] **Step 5: Run tests**

  Run: `pnpm vitest run tests/admin`
  Expected: PASS.

- [ ] **Step 6: Commit**

  `git add src/app/(admin) src/app/api/admin tests/admin && git commit -m "feat: add restaurant dashboard"`

### Task 8: Verificação ponta a ponta e preparação do piloto

**Files:**
- Create: `tests/e2e/customer-redemption.spec.ts`, `tests/e2e/admin-promotion.spec.ts`
- Modify: `README.md`, `.env.example`
- Create: `playwright.config.ts`

**Interfaces:**
- Consumes: todos os fluxos implementados nas tarefas anteriores.
- Produces: roteiro reproduzível para iniciar localmente, popular o restaurante piloto e validar o caminho completo.

- [ ] **Step 1: Write failing end-to-end scenarios**

  Criar cenários para administrador criar promoção e cliente acessar o link, raspar, cadastrar e aparecer no painel; incluir cenário de promoção expirada.

- [ ] **Step 2: Run E2E tests to verify baseline failures**

  Run: `pnpm exec playwright test`
  Expected: failures until the browser environment and final integration are configured.

- [ ] **Step 3: Configure Playwright and test database lifecycle**

  Configurar servidor local, seed do piloto e limpeza isolada dos dados de teste sem usar credenciais reais.

- [ ] **Step 4: Run the full verification suite**

  Run: `pnpm lint`, `pnpm vitest run`, `pnpm exec playwright test` and `pnpm build`.
  Expected: all commands exit successfully.

- [ ] **Step 5: Document local setup and pilot checklist**

  Registrar instalação com pnpm, configuração do PostgreSQL, migração, seed, login do piloto, criação de promoção e teste com QR Code.

- [ ] **Step 6: Commit**

  `git add . && git commit -m "test: verify SempreGanhe MVP"`
