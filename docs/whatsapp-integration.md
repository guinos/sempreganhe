# Módulo WhatsApp

## Objetivo

Enviar ao cliente uma confirmação oficial quando o partner aprovar o prêmio. A mensagem servirá como comprovante para apresentação no próximo pedido.

## Estado atual

- O sistema ainda usa um link `wa.me` aberto pelo cliente.
- O envio automático ainda não está ativado.
- A base técnica deve ser criada sem armazenar access tokens no PostgreSQL.
- O telefone em `partners.whatsappPhone` continua sendo o contato do negócio; ele não representa uma conexão da Cloud API.

## Fluxo planejado

1. O cliente solicita o resgate.
2. A participação fica `pending_confirmation`.
3. O partner aprova no painel.
4. A confirmação e o evento de mensagem são persistidos de forma idempotente.
5. Um worker envia um template utilitário pelo provedor configurado.
6. Webhooks atualizam `sent`, `delivered`, `read` ou `failed`.
7. A tela pública informa que a confirmação será enviada por WhatsApp, sem expor token ou credencial.

## Requisitos da integração

- Meta Business Portfolio e WhatsApp Business Account (WABA).
- Número de telefone comercial habilitado na WhatsApp Business Platform.
- App Meta com produto WhatsApp/Cloud API.
- Phone Number ID, WABA ID e template aprovado.
- Access token mantido exclusivamente em secret manager/variável protegida.
- Endpoint HTTPS para webhooks quando o recebimento de status for ativado.
- Consentimento/opt-in do cliente e política de comunicação documentada.

## Decisões de dados

Quando a migração for gerada pelo Drizzle Kit, criar uma conexão separada por partner e uma outbox de mensagens contendo, no mínimo:

- `partnerId`, `participationId` e `customerId`;
- telefone normalizado como snapshot da participação;
- `provider`, `templateKey` e `templateLocale`;
- `providerMessageId`;
- status `queued`, `processing`, `sent`, `delivered`, `read` ou `failed`;
- `attemptCount`, lease/lock de processamento e timestamps de ciclo;
- erro técnico sanitizado, sem token ou conteúdo sensível desnecessário;
- restrição única por partner, participação, evento/template e idioma.

## Critério de ativação

Não ligar o disparo automático no fluxo de aprovação até que a migration, os testes de idempotência/isolamento, o provider adapter e as variáveis protegidas estejam validados.
