# Setup e evidências

## Toolkit

- Fonte: `https://github.com/soumatheusgomes/vibe-coding-toolkit`;
- revisão usada: `790a895304e0c08b70a5b215c9d334f1c86b816c`;
- data do bootstrap: 2026-10-19;
- adaptação: projeto novo já continha a especificação e o plano em `docs/superpowers/`, que foram preservados;
- decisão: Drizzle + PostgreSQL, conforme os defaults do toolkit para novos projetos com persistência.

## Ambiente observado

- Node.js 24.19.0;
- pnpm 11.25.0;
- Git 2.53.0.windows.2;
- npm e Yarn não disponíveis;
- Docker Desktop 4.95.0 e Docker Engine 29.8.2 disponíveis após autorização do usuário;
- plataforma Windows;
- shell operacional usado no bootstrap: cmd/PowerShell sem perfil interativo.

## Fundação gerada

- Next.js 16.4.2;
- React 19.3.0;
- TypeScript;
- Tailwind;
- ESLint;
- App Router com `src/` e alias `@/*`;
- Drizzle ORM, `pg`, Zod, Pino, `server-only`, Vitest e regras de qualidade;
- `packageManager`: pnpm 11.25.0.

## Evidência e estado

- `create-next-app --help`: validado em 2026-10-19;
- scaffold Next.js: configurado sem React Compiler, Cache Components ou feedback anônimo;
- dependências: instaladas com `pnpm install` e `pnpm add`;
- credenciais PostgreSQL: pendentes, portanto nenhuma migração real foi aplicada;
- funcionalidades do produto: pendentes, próximas tarefas estão no plano de implementação.
- `pnpm lint`: validado;
- `pnpm typecheck`: validado;
- `pnpm lint:typed`: validado;
- `pnpm lint:rules`: validado;
- `pnpm test`: 3 arquivos e 8 testes aprovados;
- `pnpm build`: validado;
- servidor Next.js: validado com `HTTP 200` em `http://localhost:3100`.
- Compose PostgreSQL: executado com `postgres:16-alpine`; container `sempreganhe-postgres` saudável na porta `5432`;
- `pg_isready`: confirmou `accepting connections`;
- `pnpm db:generate`: executado; nenhuma tabela ainda foi criada, portanto não houve migração SQL.

## Próximo passo

Implementar a primeira tarefa do MVP: modelo de dados e regras de domínio de partners, usuários, promoções e participações.
