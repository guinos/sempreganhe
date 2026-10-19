# SempreGanhe — Design do MVP

**Data:** 2026-10-18  
**Status:** aguardando revisão do usuário

## 1. Objetivo

O SempreGanhe será um SaaS web de promoções para fidelização de clientes de restaurantes. O cliente acessa uma promoção por QR Code ou link, raspa uma raspadinha digital e descobre um prêmio fixo definido pelo restaurante. Para resgatar o prêmio, informa nome e telefone.

O MVP será operado inicialmente com um restaurante piloto, mas a estrutura será multi-restaurante desde o início para evitar reconstrução da base quando novos restaurantes forem adicionados.

## 2. Escopo do MVP

Incluído:

- área pública da promoção, acessível sem login;
- raspadinha digital com prêmio fixo por promoção;
- cadastro simples do cliente com nome e telefone;
- registro do resgate após o cadastro;
- painel administrativo protegido por e-mail e senha;
- criação, edição, ativação e desativação de promoções;
- período de validade da promoção;
- geração e exibição de QR Code e link por promoção;
- listagem de participações e resgates no painel;
- separação de dados por restaurante;
- interface responsiva para uso em celular e desktop.

Fora do MVP:

- envio automático por WhatsApp;
- validação automática de compra ou pedido;
- QR Code individual por compra;
- múltiplos prêmios dentro da mesma promoção;
- estoque ou limite de prêmios;
- múltiplos usuários administrativos por restaurante;
- relatórios avançados, cobrança e planos SaaS;
- aplicativo nativo para Android ou iOS.

## 3. Fluxo do cliente

1. O cliente abre o QR Code ou link exclusivo da promoção.
2. A página exibe o restaurante, a promoção e o período de validade, sem revelar o prêmio.
3. O cliente raspa a raspadinha.
4. O prêmio fixo da promoção é exibido imediatamente.
5. A participação fica pendente enquanto o cliente não informar os dados.
6. O cliente seleciona “Resgatar prêmio”.
7. O cliente informa nome, telefone e aceite dos termos de uso e privacidade.
8. O sistema registra o resgate e mostra uma confirmação.

O cliente não cria senha nem precisa fazer login. O mesmo link da promoção pode ser usado por vários clientes e em participações recorrentes, conforme a operação do restaurante. O MVP não verifica automaticamente se houve uma compra.

## 4. Fluxo do restaurante

1. O usuário administrativo acessa a tela de login.
2. Informa e-mail e senha.
3. Visualiza o painel com indicadores básicos.
4. Cria uma promoção informando nome, descrição, prêmio fixo e período de validade.
5. O sistema gera um link público e um QR Code para a promoção.
6. O restaurante divulga o QR Code no estabelecimento, embalagem ou WhatsApp.
7. O restaurante acompanha as participações e os resgates no painel.

O cadastro concluído pelo cliente é o gatilho do resgate. Não haverá uma etapa posterior de validação manual no MVP: depois do cadastro, o prêmio é considerado resgatado/utilizado.

## 5. Arquitetura proposta

O projeto será uma aplicação full-stack em um único repositório:

- **Next.js e TypeScript:** páginas públicas, painel administrativo e endpoints do servidor;
- **PostgreSQL:** persistência dos restaurantes, usuários, promoções e participações;
- **Drizzle ORM:** acesso tipado ao banco de dados e migrações SQL versionadas;
- **Tailwind CSS:** interface responsiva;
- autenticação por e-mail e senha para a área administrativa.

As áreas pública e administrativa ficarão separadas por rotas e controles de autorização. Cada consulta e alteração administrativa deverá ser limitada ao restaurante associado ao usuário autenticado.

## 6. Modelo conceitual de dados

### Restaurante

- identificação;
- nome;
- status;
- datas de criação e atualização.

### Usuário administrativo

- identificação;
- restaurante associado;
- e-mail único;
- senha armazenada com hash;
- datas de criação e atualização.

### Promoção

- identificação;
- restaurante associado;
- nome;
- descrição;
- texto do prêmio fixo;
- identificador público único para o link e QR Code;
- início da validade;
- fim da validade;
- status ativo/inativo;
- datas de criação e atualização.

### Participação/resgate

- identificação;
- promoção associada;
- nome informado pelo cliente;
- telefone informado pelo cliente;
- estado da participação: pendente ou resgatado;
- data de início da participação;
- data de conclusão do cadastro/resgate.

Uma participação pode existir antes do cadastro ser concluído, para representar que a raspadinha foi iniciada. Ao concluir o formulário, ela passa para resgatado. O prêmio é sempre obtido da promoção associada.

## 7. Regras de negócio

- Uma promoção possui exatamente um prêmio fixo no MVP.
- Cada promoção possui seu próprio link público e QR Code.
- Promoções fora do período de validade não podem iniciar novas participações.
- Promoções inativas não podem ser acessadas para novas raspadinhas.
- O prêmio é exibido antes do cadastro.
- O cadastro é obrigatório para concluir o resgate.
- O nome e o telefone são obrigatórios para concluir o cadastro.
- O mesmo restaurante pode ter várias promoções, inclusive em períodos diferentes.
- Dados de um restaurante nunca podem ser exibidos ou alterados por outro restaurante.
- A confirmação do resgate será exibida no sistema; o envio automático por WhatsApp fica para uma etapa futura.

## 8. Segurança e privacidade

- senhas administrativas devem ser armazenadas apenas como hash;
- rotas do painel exigem autenticação;
- autorização deve validar o restaurante associado ao usuário em cada operação;
- o identificador público da promoção não deve expor IDs internos sequenciais;
- o formulário do cliente deve apresentar aceite dos termos e referência à política de privacidade;
- entradas de nome e telefone devem ser validadas no cliente e no servidor;
- o acesso público deve evitar exposição de dados de outros clientes.

## 9. Critérios de sucesso do MVP

O MVP será considerado funcional quando:

1. o administrador conseguir entrar no painel;
2. o administrador conseguir criar uma promoção válida;
3. o sistema gerar um link e QR Code utilizáveis;
4. um cliente conseguir acessar a promoção pelo celular;
5. o cliente conseguir raspar e visualizar o prêmio;
6. o cliente conseguir concluir o cadastro;
7. o resgate aparecer no painel do restaurante;
8. uma promoção fora da validade ou inativa impedir nova participação;
9. testes confirmarem que um restaurante não acessa dados de outro.

## 10. Estratégia inicial de testes

- testes de regras de validade e status da promoção;
- testes do fluxo de raspadinha até o resgate;
- testes de validação de nome e telefone;
- testes de autenticação do painel;
- testes de isolamento entre restaurantes;
- teste manual em celular para QR Code, raspadinha e formulário;
- teste manual em desktop para login e painel administrativo.

## 11. Evoluções posteriores

Depois de validar o piloto, poderão ser avaliados:

- integração real com WhatsApp;
- código do pedido ou QR Code individual por compra;
- múltiplos prêmios e regras mais avançadas;
- múltiplos usuários por restaurante;
- relatórios e métricas de recorrência;
- cobrança, planos e onboarding automatizado de restaurantes.
