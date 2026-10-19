# Pendências do MVP

## Login administrativo

O login valida tamanho máximo de e-mail e senha antes da verificação de senha e aceita somente usuários com role `owner` ou `admin`.

Ainda não há rate limiter externo ou armazenamento distribuído de tentativas de login. Isso permanece como pendência antes de uma operação pública em escala, para reduzir brute force e abuso de autenticação.

## RLS no PostgreSQL

Implementar após a validação do MVP, sem bloquear o piloto atual.

Escopo futuro:

- habilitar Row-Level Security nas tabelas multi-tenant;
- criar políticas baseadas no `restaurant_id` da sessão PostgreSQL;
- configurar o acesso do aplicativo com uma role que não seja proprietária das tabelas;
- adicionar testes de isolamento diretamente no banco.

## Confirmação do prêmio

O cadastro do cliente cria a participação como `pending_confirmation`. O restaurante pode confirmar ou recusar a participação no painel administrativo. A página pública consulta o status automaticamente e exibe `Prêmio resgatado` somente após a confirmação.
