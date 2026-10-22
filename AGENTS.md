<!-- BEGIN:nextjs-agent-rules -->

## This is NOT the Next.js you know

This version has breaking changes — APIs, conventions, and file structure may all differ from your training data. Read the relevant guide in `node_modules/next/dist/docs/` (resolved from this file's directory; in monorepos the `next` package may not be visible from the repo root) before writing any code. Heed deprecation notices.

This block is written and re-added by `next dev` — verify at `node_modules/next/dist/server/lib/generate-agent-files.js`. Removing it from a diff only re-creates the uncommitted change; committing it with your work keeps the tree clean.

<!-- END:nextjs-agent-rules -->

## Projeto SempreGanhe

- Produto e escopo: `PRODUCT.md`.
- Decisões de arquitetura: `docs/architecture.md`.
- Setup e evidências do bootstrap: `docs/setup.md`.
- Use pnpm; não use npm ou yarn neste projeto.
- Não exponha valores de `.env.local`, tokens, cookies, senhas ou telefones de clientes em logs, commits ou respostas.
- Execute `pnpm check` antes de considerar uma alteração pronta.
- Acesso a dados deve permanecer no servidor e sempre respeitar o `partnerId` da sessão administrativa.
- A especificação e o plano aprovados ficam em `docs/superpowers/`.
