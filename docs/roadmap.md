# Roadmap do SempreGanhe

> Documento central de direção e priorização do produto. Atualizado em 23/10/2026.

## Visão do produto

O SempreGanhe é um SaaS mobile-first de promoções e fidelização para partners. O cliente acessa uma promoção por QR Code ou link, raspa uma experiência digital, descobre um prêmio e solicita o resgate. O partner acompanha e confirma a operação pelo painel administrativo.

## Princípios de priorização

1. Validar valor com um partner real antes de ampliar o escopo.
2. Preservar o fluxo principal: acesso → raspagem → prêmio → resgate → confirmação.
3. Toda funcionalidade administrativa deve respeitar o `partnerId` da sessão.
4. Automatizar somente depois de validar a operação manual correspondente.
5. Toda nova ideia entra primeiro no backlog; só vira desenvolvimento após definição de problema, regra de negócio e critério de sucesso.

## Estado atual

### Entregue

- MVP web publicado na Vercel.
- Estrutura multi-partner desde o início.
- Login administrativo por e-mail e senha.
- Cadastro e edição das informações do partner.
- Gestão de conta administrativa.
- Gestão inicial da equipe.
- CRUD enxuto de promoções com prêmio fixo.
- Link público da promoção e acesso por QR Code/link.
- Raspadinha digital interativa com toque, mouse e caneta.
- Revelação do prêmio após a raspagem.
- Cadastro do cliente no momento do resgate.
- Participação com estados de cadastro pendente, confirmação pendente, resgatado e recusado.
- Painel de participações, filtros e confirmação manual pelo partner.
- Atualização da tela pública conforme a confirmação do partner.
- Migrações PostgreSQL/Drizzle aplicadas no ambiente de produção.
- Deploy de produção validado na Vercel.
- Revisores auxiliares somente leitura configurados em `docs/agent-reviewers/`.
- Fluxo completo em celular usando uma promoção real.
- Operação de confirmação do prêmio pelo partner.
- Clareza da raspagem e do botão `RESGATE`.
- Uso recorrente da mesma promoção por diferentes clientes.
- Onboarding de novo partner validado em produção.

### Em validação com o piloto

- Conferência operacional de um pedido antes da confirmação.
- Qualidade do link público e do QR Code em materiais impressos.

## Fase 0 — Fechar o piloto

Objetivo: provar que o fluxo gera retorno e é simples de operar no dia a dia.

- [x] Executar um teste ponta a ponta com dados limpos.
- [x] Testar em pelo menos dois celulares e navegadores diferentes.
- [x] Testar raspagem por toque, mouse e interrupção do gesto.
- [x] Confirmar que um prêmio só aparece após a raspagem mínima.
- [x] Validar resgate, confirmação, recusa e atualização da tela pública.
- [x] Confirmar que o partner visualiza somente seus próprios dados.
- [ ] Registrar feedback do partner e dos clientes.
- [ ] Definir as métricas mínimas do piloto: acessos, raspagens, cadastros, resgates e retornos.

Critério de saída: um partner consegue operar a promoção sem intervenção técnica e o fluxo é compreendido pelos clientes.

## Fase 1 — Robustez do MVP

Objetivo: eliminar riscos que impedem o uso contínuo por um partner.

- [ ] Revisar todos os endpoints com o `security-data-scope-reviewer`.
- [ ] Implementar RLS no PostgreSQL após a validação do MVP.
- [ ] Melhorar mensagens de erro, estados de carregamento e recuperação de rede.
- [ ] Persistir/recuperar a participação pública de forma mais resiliente em caso de recarregamento.
- [ ] Melhorar filtros, ordenação e visualização do painel de participações.
- [ ] Adicionar paginação ou carregamento incremental para listas maiores.
- [ ] Adicionar auditoria básica de ações administrativas.
- [ ] Revisar acessibilidade e comportamento mobile da raspadinha e do painel.
- [ ] Corrigir avisos de qualidade relevantes e manter `pnpm check` executável.

Critério de saída: o MVP suporta uso diário sem depender de inspeção manual do banco ou do código.

## Fase 2 — Promoções e campanhas

Objetivo: permitir que o partner configure estratégias de fidelização sem perder a simplicidade.

- [ ] Definir o modelo de campanha versus promoção.
- [ ] Definir tipos de campanha: aquisição, `Volta Sempre` e `Sentimos sua Falta`.
- [ ] Definir regras de elegibilidade e recorrência de compras.
- [ ] Definir tipos de prêmio e suas condições de uso.
- [ ] Permitir mais de um tipo de prêmio configurável quando houver regra clara.
- [ ] Permitir calendário e vigência por dia da semana.
- [ ] Permitir limite operacional opcional por promoção, sem transformar o prêmio fixo em estoque individual.
- [ ] Criar duplicação, pausa, encerramento e histórico de promoções.
- [ ] Criar relatórios básicos por promoção e campanha.

Decisão pendente: a ativação de campanhas de recorrência depende de uma fonte confiável de pedidos ou de uma comprovação operacional definida.

## Fase 3 — Pedidos e comprovação

Objetivo: reduzir a validação manual e medir recorrência com evidência.

- [ ] Definir o modelo de pedido e sua relação com customer, participation e partner.
- [ ] Permitir envio opcional de foto de comanda ou cupom fiscal no resgate.
- [ ] Criar tela de confirmação com visualização segura do comprovante.
- [ ] Definir retenção, acesso e exclusão das imagens.
- [ ] Criar status para análise, aprovado, recusado e inconsistência.
- [ ] Usar pedidos confirmados para ativar regras de recorrência.
- [ ] Avaliar integração com delivery/PDV somente após validar o fluxo manual.

## Fase 4 — Módulo WhatsApp e retenção

Objetivo: enviar ao cliente uma confirmação oficial do prêmio aprovado, mantendo rastreabilidade, consentimento e isolamento por partner.

Estado: em preparação técnica; o disparo automático ainda não está ativado.

- [x] Mapear o fluxo atual de WhatsApp manual (`wa.me`) e seus limites.
- [x] Redirecionar o cliente para o WhatsApp do partner com mensagem de resgate e código de país configurável.
- [x] Definir a integração inicial com WhatsApp Business Platform Cloud API.
- [ ] Criar a conexão de WhatsApp por partner, sem token em texto no banco.
- [ ] Criar outbox de mensagens com idempotência por evento, status de entrega e retry seguro.
- [ ] Criar o adaptador server-only do provedor Meta.
- [ ] Enfileirar a confirmação quando o partner aprovar o prêmio.
- [ ] Enviar template utilitário aprovado com código/identificação do resgate.
- [ ] Receber webhooks de envio, entrega, leitura e falha.
- [ ] Criar configuração de template e idioma por partner.
- [ ] Registrar opt-in, finalidade e preferências de comunicação.
- [ ] Testar o fluxo com número de teste da Meta antes do piloto.
- [ ] Enviar atualização quando o partner recusar o prêmio, se houver template aprovado.
- [ ] Criar lembretes de retorno baseados em pedidos confirmados.
- [ ] Medir conversão de campanha e retorno do cliente.

Dependência externa: o owner precisa criar/configurar o Meta Business Portfolio, WABA, número de negócio, app Cloud API, template e secrets na Vercel. Tokens não devem ser enviados neste chat ou commitados.

## Fase 5 — SaaS multi-partner

Objetivo: transformar o piloto em produto comercial operável por vários partners.

- [ ] Formalizar onboarding de partner e primeiro usuário owner.
- [x] Criar fluxo inicial de onboarding com partner e primeiro owner em transação.
- [ ] Melhorar gestão de equipe e permissões por módulo.
- [ ] Definir planos, limites e cobrança.
- [ ] Criar administração global da plataforma separada do painel do partner.
- [ ] Criar observabilidade, alertas e auditoria de produção.
- [ ] Definir backups, restauração e política de retenção.
- [ ] Criar documentação de onboarding e operação para novos partners.
- [ ] Validar isolamento multi-tenant com testes automatizados e RLS.
- [ ] Proteger o onboarding público contra abuso com rate limiting, confirmação de e-mail e idempotência.

## Backlog de ideias

Ideias são mantidas aqui até terem problema, regra, impacto e critério de sucesso definidos.

- Google Avaliações.
- Cartão de fidelidade digital.
- Prêmios progressivos por frequência.
- Segmentação de clientes por comportamento.
- QR Code por mesa, caixa, pedido ou canal.
- Campanhas específicas para delivery e presencial.
- Personalização visual da raspadinha por partner.
- Exportação de clientes e participações.
- Integração com plataformas de delivery e PDV.
- Aplicação de cupons ou códigos de uso único no momento da confirmação.

## Registro de decisões

| Data | Decisão | Motivo |
|---|---|---|
| 23/10/2026 | Criar este roadmap como fonte central | Havia planos e pendências, mas não uma visão única de produto e prioridade. |
| 23/10/2026 | Validar o MVP antes de RLS, automações e integrações | Reduzir risco e observar a operação real antes de ampliar a arquitetura. |
| 23/10/2026 | Manter partner como nomenclatura do domínio | Permitir uso por restaurantes e outros estabelecimentos. |
| 23/10/2026 | Iniciar WhatsApp por uma camada server-only e uma outbox idempotente | Evitar token no banco, mensagens duplicadas e acoplamento ao telefone de contato do partner. |

## Como atualizar

Ao surgir uma nova ideia, registrar primeiro no backlog. Ao aprovar uma iniciativa, movê-la para a fase adequada e incluir:

- problema que resolve;
- usuário beneficiado;
- regra de negócio;
- impacto técnico e de dados;
- critério de sucesso;
- dependências e riscos.
