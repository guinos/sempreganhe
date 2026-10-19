# SempreGanhe Domain Schema Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Implementar o schema Drizzle do MVP para restaurantes, usuários administrativos, promoções, clientes e participações.

**Architecture:** O schema será centralizado em `src/db/schema/index.ts`, usando tabelas PostgreSQL com UUIDs, enums e chaves estrangeiras. Cada entidade tenant-aware terá `restaurantId`; `participations` será criada sem cliente e associada a `customers` somente quando o cadastro for concluído. A migração SQL será gerada pelo Drizzle Kit e validada sem inserir dados reais.

**Tech Stack:** TypeScript, Drizzle ORM, PostgreSQL, Drizzle Kit, Vitest, pnpm.

**Spec:** `docs/superpowers/specs/2026-10-19-domain-schema-design.md`

## Global Constraints

- O cliente é isolado por restaurante; nenhuma consulta pode localizar cliente somente pelo telefone sem o filtro de `restaurantId`.
- Apenas hashes de senha serão persistidos.
- O telefone do cliente é dado pessoal e deve ser tratado apenas no servidor e no painel autorizado.
- Tokens públicos devem ser gerados com entropia suficiente e não devem expor IDs previsíveis.
- Valores de telefone não aparecerão em logs de aplicação.
- A especificação não autoriza inserir dados reais ou credenciais nos testes.
- Exclusões em cascata ficam fora do comportamento padrão do MVP.

## Review Focus

- Uma participação pendente deve aceitar `customerId` nulo e não deve exigir nome ou telefone no insert: teste em `src/db/schema/index.test.ts`.
- O mesmo telefone deve poder existir em restaurantes diferentes, mas não duas vezes no mesmo restaurante: teste de constraint composta em `src/db/schema/index.test.ts`.
- Uma promoção com `endsAt` igual ou anterior a `startsAt` deve ser rejeitada pelo check constraint: teste da definição gerada/migração em `src/db/schema/index.test.ts`.
- As FKs de promoção e cliente devem apontar para o mesmo restaurante da participação na camada de aplicação futura; o schema deve expor os campos explícitos necessários para essa validação: teste de colunas e relações em `src/db/schema/index.test.ts`.
- A migração deve conter somente as cinco tabelas do domínio e não deve incluir seed ou credenciais: inspeção automatizada do SQL após `pnpm db:generate`.

## File Map

- Modify: `src/db/schema/index.ts` — enums, tabelas, relações, índices, constraints e tipos inferidos.
- Create: `src/db/schema/index.test.ts` — testes estruturais do schema sem conexão ou dados reais.
- Create: `drizzle/0000_*.sql` — migração inicial gerada pelo Drizzle Kit.
- Modify: `drizzle/meta/_journal.json` — metadados gerados pelo Drizzle Kit.

### Task 1: Define the Drizzle domain schema

**Files:**
- Modify: `src/db/schema/index.ts`
- Test: `src/db/schema/index.test.ts`

**Interfaces:**
- Produces: exports `restaurants`, `users`, `promotions`, `customers`, `participations`; enums `userRole`, `promotionStatus`, `participationStatus`; and inferred types `Restaurant`, `NewRestaurant`, `User`, `NewUser`, `Promotion`, `NewPromotion`, `Customer`, `NewCustomer`, `Participation`, `NewParticipation`.

- [ ] **Step 1: Write failing schema tests**

  Criar testes que importem os exports do schema e verifiquem: cinco tabelas presentes; colunas obrigatórias `restaurantId`, `customerId`, `publicCode`, `publicToken`, `passwordHash`; enums com os valores definidos na especificação; `customerId` opcional; tipos de insert/select exportados; e índices/constraints declarados.

- [ ] **Step 2: Run tests to verify they fail**

  Run: `pnpm vitest run src/db/schema/index.test.ts`
  Expected: FAIL because the schema currently exports no tables.

- [ ] **Step 3: Implement enums and tables in `src/db/schema/index.ts`**

  Usar `pgTable`, `pgEnum`, `uuid().defaultRandom()`, `timestamp({ withTimezone: true })`, `text`, `varchar` quando houver limite útil, `uniqueIndex`, `index` e `check` do Drizzle. Definir FKs sem cascade delete. Criar `customers` com unique composto em `(restaurantId, phone)`, `participations.customerId` nullable e check de período em `promotions` usando `endsAt > startsAt`.

- [ ] **Step 4: Add Drizzle relations and inferred types**

  Exportar relações explícitas entre restaurante/usuários, restaurante/promoções, restaurante/clientes, restaurante/participações, promoção/participações e cliente/participações. Usar `InferSelectModel` e `InferInsertModel` para os tipos públicos.

- [ ] **Step 5: Run schema tests**

  Run: `pnpm vitest run src/db/schema/index.test.ts`
  Expected: PASS.

- [ ] **Step 6: Commit**

  `git add src/db/schema/index.ts src/db/schema/index.test.ts && git commit -m "feat: add domain drizzle schema"`

### Task 2: Generate and inspect the PostgreSQL migration

**Files:**
- Create: `drizzle/0000_*.sql`
- Modify: `drizzle/meta/_journal.json`

**Interfaces:**
- Consumes: schema exports from Task 1.
- Produces: migration SQL containing the five domain tables, enums, foreign keys, unique constraints, indexes and the valid-promotion-period check.

- [ ] **Step 1: Generate the migration**

  Run: `pnpm db:generate`
  Expected: Drizzle Kit creates one initial migration and updates the journal without connecting to PostgreSQL.

- [ ] **Step 2: Inspect the generated SQL with a failing guard test**

  Add a test or verification script assertion that the migration contains `restaurants`, `users`, `promotions`, `customers`, `participations`, the `(restaurant_id, phone)` uniqueness, and no literal password/seed values. Run it before correcting any missing schema declaration so the guard fails if the generated contract is incomplete.

- [ ] **Step 3: Run migration guard and regenerate if needed**

  Run: `pnpm vitest run src/db/schema/index.test.ts` and inspect the generated SQL with `rg`.
  Expected: all schema assertions pass; migration contains only the declared domain objects and no credentials.

- [ ] **Step 4: Commit migration artifacts**

  `git add drizzle src/db/schema/index.ts src/db/schema/index.test.ts && git commit -m "feat: add initial domain migration"`

### Task 3: Run project-wide verification

**Files:**
- No new production files expected.

**Interfaces:**
- Consumes: completed schema and migration from Tasks 1–2.
- Produces: verified type-safe schema integrated with the existing Drizzle client and project quality gates.

- [ ] **Step 1: Run targeted schema tests**

  Run: `pnpm vitest run src/db/schema/index.test.ts`
  Expected: PASS.

- [ ] **Step 2: Run type and quality checks**

  Run: `pnpm lint`, `pnpm typecheck`, `pnpm lint:typed`, `pnpm lint:rules`.
  Expected: all commands exit successfully.

- [ ] **Step 3: Run the full test suite and build**

  Run: `pnpm test` and `pnpm build`.
  Expected: all existing and schema tests pass; Next.js production build succeeds.

- [ ] **Step 4: Verify repository diff and generated migration**

  Run: `git diff --check`, `git status --short`, and inspect `drizzle/` with `rg`. Confirm that only the planned schema/test/migration files changed and no credentials or real customer data were introduced.

- [ ] **Step 5: Commit final verified changes**

  `git add src/db/schema drizzle && git commit -m "chore: verify domain schema"`
