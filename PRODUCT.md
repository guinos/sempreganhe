# SempreGanhe

## Problema

Partners têm dificuldade para estimular recorrência de clientes em compras presenciais e delivery.

## Público

- Clientes finais de partners presenciais e delivery.
- Partners que desejam criar promoções simples de fidelização.

## Objetivo

Permitir que o cliente acesse uma promoção por QR Code ou link, raspe uma raspadinha digital, descubra um prêmio fixo e informe nome e telefone para resgatá-lo.

## MVP

- SaaS web responsivo;
- um partner piloto, com dados isolados para expansão futura;
- login administrativo por e-mail e senha;
- promoção com um prêmio fixo, descrição, status e período de validade;
- QR Code e link público por promoção;
- raspadinha antes do cadastro;
- cadastro do cliente com nome, telefone e aceite de privacidade;
- resgate registrado no painel após o cadastro;
- sem WhatsApp automático ou validação automática de compra nesta fase.

## Fluxos principais

1. Administrador entra no painel e cria uma promoção.
2. Sistema gera o link e QR Code da promoção.
3. Cliente acessa, raspa e vê o prêmio.
4. Cliente informa os dados para concluir o resgate.
5. Partner acompanha o resgate no painel.

## Requisitos e restrições

- Um prêmio fixo por promoção no MVP.
- O mesmo link pode ser usado por vários clientes e em compras recorrentes.
- Promoção inativa ou fora da validade não inicia nova participação.
- Cliente não cria conta nem senha.
- Dados de partners devem ser isolados no servidor.
- PostgreSQL é a persistência planejada; Drizzle é o ORM adotado pelo bootstrap.

## Critérios de aceitação

- Administrador consegue criar e ativar uma promoção.
- Cliente acessa a promoção pelo link/QR Code em celular.
- Cliente raspa e vê o prêmio.
- Cadastro concluído aparece como resgate no painel.
- Promoção inválida bloqueia nova participação.
- Usuário de um partner não acessa dados de outro.

## Assumptions reversíveis

- A confirmação será exibida no sistema durante o piloto; WhatsApp automático será avaliado depois.
- A compra não é verificada automaticamente no MVP; a operação do restaurante controla o uso do QR Code.
- O banco pode ser executado localmente ou em um provedor PostgreSQL compatível.
