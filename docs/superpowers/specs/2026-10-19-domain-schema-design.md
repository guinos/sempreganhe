# Schema de domínio do MVP — SempreGanhe

## Objetivo

Implementar o primeiro schema persistente do SempreGanhe usando Drizzle ORM e PostgreSQL, cobrindo restaurantes, usuários administrativos, promoções, clientes e participações.

O schema deve atender ao piloto atual e preservar o isolamento necessário para a futura operação SaaS com vários restaurantes.

## Escopo

Incluído:

- tabela de restaurantes;
- usuários administrativos vinculados a restaurantes;
- promoções com prêmio fixo e link/QR Code público;
- tabela de clientes;
- participações criadas no momento da raspagem;
- conclusão da participação pelo cadastro do cliente;
- enums, chaves estrangeiras, constraints e índices necessários ao MVP.

Fora do escopo:

- telas e rotas HTTP;
- login, sessões e recuperação de senha;
- integração com WhatsApp;
- validação automática de compra;
- conta ou senha para clientes;
- regras de limite por cliente ou antifraude avançado;
- modelagem de múltiplos prêmios por promoção.

## Modelo de dados

### `restaurants`

Representa o tenant do SaaS.

- `id`: UUID, chave primária;
- `name`: nome exibido do restaurante;
- `slug`: identificador amigável e único;
- `createdAt` e `updatedAt`.

### `users`

Representa usuários do painel administrativo.

- `id`: UUID, chave primária;
- `restaurantId`: FK obrigatória para `restaurants`;
- `name`: nome do administrador;
- `email`: e-mail normalizado, único;
- `passwordHash`: hash da senha, nunca senha em texto puro;
- `role`: `owner` ou `admin`;
- `createdAt` e `updatedAt`.

Um usuário pertence a um restaurante no MVP. A estrutura pode evoluir para uma tabela de associação caso seja necessário permitir acesso a vários restaurantes.

### `promotions`

Representa uma promoção criada pelo restaurante.

- `id`: UUID, chave primária;
- `restaurantId`: FK obrigatória para `restaurants`;
- `title`: nome interno ou público da promoção;
- `prizeDescription`: prêmio fixo exibido após a raspagem;
- `publicCode`: código opaco e único usado no link/QR Code;
- `status`: `draft`, `active`, `paused` ou `ended`;
- `startsAt` e `endsAt`: período de validade;
- `createdAt` e `updatedAt`.

Constraint: `endsAt` deve ser posterior a `startsAt`.

O código público não deve conter o ID sequencial nem dados do restaurante.

### `customers`

Representa o cliente final do restaurante. O cliente não possui conta ou senha.

- `id`: UUID, chave primária;
- `restaurantId`: FK obrigatória para `restaurants`;
- `name`: nome informado pelo cliente;
- `phone`: telefone normalizado como texto;
- `createdAt` e `updatedAt`.

O cliente é isolado por restaurante. O mesmo telefone pode existir em restaurantes diferentes sem criar vínculo entre tenants. Dentro de um restaurante, a combinação `restaurantId` + `phone` deve ser única para permitir reutilização do cadastro em novas participações.

O telefone deve ser normalizado antes da persistência, preferencialmente em formato internacional sem formatação visual. A validação detalhada do formato fica na camada de aplicação.

### `participations`

Representa uma raspagem individual e seu eventual resgate.

- `id`: UUID, chave primária;
- `restaurantId`: FK obrigatória para `restaurants`;
- `promotionId`: FK obrigatória para `promotions`;
- `customerId`: FK opcional para `customers`, inicialmente nula;
- `publicToken`: token opaco e único para continuar a participação entre raspagem e cadastro;
- `prizeDescription`: cópia do prêmio revelado no momento da raspagem;
- `privacyAcceptedAt`: inicialmente nulo;
- `scrapedAt`: momento da raspagem;
- `registeredAt`: momento do cadastro, inicialmente nulo;
- `status`: `pending_registration` ou `redeemed`;
- `createdAt` e `updatedAt`.

O prêmio é copiado para a participação para manter o histórico imutável mesmo que o texto da promoção seja alterado posteriormente.

Uma participação não exige cadastro no momento da raspagem. No cadastro, o sistema cria ou localiza o `customer` pelo telefone dentro do restaurante, associa `customerId`, registra o aceite de privacidade, define `registeredAt` e muda o status para `redeemed`.

## Integridade e isolamento

- Todas as relações devem usar chaves estrangeiras.
- Usuários, clientes, promoções e participações devem possuir `restaurantId` explícito.
- Consultas futuras do painel deverão sempre filtrar pelo `restaurantId` do usuário autenticado.
- A camada de serviço deverá validar que `participations.restaurantId` corresponde ao restaurante da promoção e do cliente relacionados.
- Exclusões em cascata ficam fora do comportamento padrão do MVP; o código deve evitar apagar dados históricos de participações por acidente.
- E-mails e códigos/tokens públicos terão índices únicos.
- Índices adicionais serão criados para `restaurantId`, status e período de promoções.

## Critérios de aceitação

1. O schema Drizzle exporta as cinco tabelas e seus enums.
2. O TypeScript infere tipos de inserção e seleção a partir do schema.
3. O Drizzle Kit gera uma migração PostgreSQL sem tabelas fictícias adicionais.
4. As constraints impedem e-mail duplicado, código de promoção duplicado e token de participação duplicado.
5. A constraint de período impede promoção com término anterior ou igual ao início.
6. A tabela de participações permite o estado sem cadastro e o estado resgatado.
7. A combinação `customers.restaurantId` + `customers.phone` é única.
8. Uma participação pode existir sem cliente e pode ser associada a um cliente no cadastro.
9. Os testes verificam as definições exportadas e as relações essenciais sem depender de dados reais.
10. `pnpm check` permanece verde.

## Arquivos previstos

- `src/db/schema/index.ts`: tabelas, enums, relações e tipos do domínio;
- `src/db/schema/index.test.ts`: testes do schema e constraints verificáveis sem banco externo;
- `drizzle/`: migração gerada pelo Drizzle Kit;
- documentação do schema, se necessário após a implementação.

## Segurança e privacidade

- Apenas hashes de senha serão persistidos.
- O telefone do cliente é dado pessoal e deve ser tratado apenas no servidor e no painel autorizado.
- O cliente é isolado por restaurante; nenhuma consulta pode localizar cliente somente pelo telefone sem o filtro de `restaurantId`.
- Tokens públicos devem ser gerados com entropia suficiente e não devem expor IDs previsíveis.
- Valores de telefone não aparecerão em logs de aplicação.
- A especificação não autoriza inserir dados reais ou credenciais nos testes.

## Fora da especificação

Esta especificação não define a estratégia de sessão administrativa, o algoritmo de hash de senha, a API pública da raspadinha nem a política final de retenção de dados. Esses pontos serão tratados nas respectivas etapas de implementação.
