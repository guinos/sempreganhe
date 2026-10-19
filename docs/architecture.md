# Arquitetura

## Estado atual

O projeto está na fundação inicial: Next.js App Router, TypeScript estrito, Tailwind, ESLint, Drizzle, validação de ambiente, logger e Vitest foram configurados. O domínio do MVP ainda será implementado conforme o plano em `docs/superpowers/plans/`.

## Estrutura

- `src/app/`: rotas e telas Next.js;
- `src/db/`: conexão lazy e schema Drizzle;
- `src/lib/`: ambiente, logger e utilidades de fronteira;
- `drizzle/`: SQL versionado gerado pelo Drizzle;
- `eslint-rules/`: regras locais do perfil de qualidade;
- `docs/`: documentação canônica do projeto.

## Decisões

- Next.js full-stack com App Router;
- PostgreSQL com Drizzle ORM e driver `pg`;
- pnpm como package manager;
- área pública sem login e painel administrativo autenticado;
- isolamento multi-restaurante por `restaurantId` no servidor;
- QR Code fixo por promoção;
- WhatsApp e validação automática de compra fora do MVP.

## Pendências

- modelar as tabelas do domínio;
- escolher a estratégia final de sessão administrativa;
- configurar um PostgreSQL autorizado para migrações e teste integrado;
- implementar raspadinha e painel.
