# Onboarding local

## Pré-requisitos

- Node.js 24;
- pnpm 11;
- Docker Desktop com Docker Compose;

## Preparação

```bash
pnpm install
copy .env.example .env.local
docker compose up -d
```

Para o banco local do Compose, use em `.env.local`:

```env
DATABASE_URL=postgresql://sempreganhe:sempreganhe_local@localhost:5432/sempreganhe
```

Não versione credenciais. O banco local usa credenciais de desenvolvimento e não deve ser usado em produção.

## Comandos

```bash
pnpm dev
pnpm test
pnpm lint
pnpm typecheck
pnpm check
```

Quando houver schema:

```bash
pnpm db:generate
pnpm db:migrate
```

As migrações só devem ser aplicadas a um banco autorizado e conhecido. Para desligar o banco local:

```bash
docker compose down
```
