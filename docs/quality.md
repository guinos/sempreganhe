# Qualidade

## Comandos

- `pnpm lint`: verifica regras ESLint;
- `pnpm typecheck`: gera tipos de rota e verifica TypeScript;
- `pnpm lint:typed`: verifica regras assíncronas tipadas;
- `pnpm lint:rules`: valida as regras locais;
- `pnpm test`: executa testes Vitest;
- `pnpm build`: verifica o build de produção;
- `pnpm check`: executa a sequência completa sem migrar ou conectar automaticamente ao banco.

## Regras do projeto

- Valide entradas de formulários e rotas com Zod.
- Não faça acesso direto ao banco em componentes de apresentação.
- Não registre tokens, cookies, URLs de conexão ou dados pessoais completos.
- Toda operação administrativa deve filtrar pelo restaurante da sessão.
- Migrações devem ser geradas, revisadas e aplicadas separadamente.

## Segurança

O prompt de revisão de segurança do toolkit será incorporado quando o bootstrap de qualidade for concluído. Até lá, revisões devem cobrir autenticação, autorização por restaurante, validação de entrada e exposição de dados pessoais.

## Estado

Os testes de domínio e fluxo ainda estão pendentes; a fundação possui testes de ambiente, logger e conexão que serão executados na verificação do bootstrap.
