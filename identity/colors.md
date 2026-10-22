# Sistema de cores — nova direção v0.3

## Ideia

Base de cassino premium: preto fosco dominante, dourado quente como assinatura e vermelho profundo como acento de ação. A paleta deve parecer material e sofisticada, não neon.

| Token | Hex | Uso |
|---|---|---|
| `color-brand-matte-black` | `#111111` | Fundo principal e campos premium |
| `color-brand-black` | `#050505` | Fundo profundo e contraste máximo |
| `color-brand-gold` | `#C9A24A` | Recompensa, detalhes e assinatura |
| `color-brand-gold-light` | `#E7C873` | Highlights, bordas e reflexos |
| `color-brand-gold-text` | `#765A12` | Texto/ícone dourado sobre fundo claro |
| `color-brand-red` | `#A61B2B` | CTA, urgência e celebração controlada |
| `color-brand-red-bright` | `#C92A3A` | Destaque visual e estados ativos |
| `color-brand-cream` | `#F4EFE5` | Texto quente e fundos claros |
| `color-neutral-0` | `#FFFFFF` | Texto inverso e fundo claro |
| `color-neutral-100` | `#F4EFE5` | Fundo claro quente |
| `color-neutral-300` | `#D6D1C8` | Bordas e divisores |
| `color-neutral-700` | `#625E57` | Texto secundário |
| `color-neutral-950` | `#171717` | Texto principal em fundo claro |

## Regras

- Preto fosco ocupa a maior parte das peças de campanha e dos momentos de marca.
- Dourado aparece em prêmios, bordas, tipografia de destaque e detalhes de materialidade.
- Vermelho é reservado para ação, validade, CTA e celebração; não deve dominar a interface.
- Não usar vermelho e dourado em excesso ao mesmo tempo: um deve liderar e o outro apoiar.
- Para textos pequenos, usar `color-brand-gold-text` ou `color-brand-cream`; dourado claro não substitui texto acessível.
- Verde/vermelho nunca serão o único indicador de sucesso/erro: sempre incluir ícone e rótulo.
- `color-brand-gold` é para gráficos grandes, prêmio e decoração; não é cor de texto de corpo.

## Semânticas preliminares

| Token | Valor | Uso |
|---|---|---|
| `color-success` | `#1F7A4D` | Resgate confirmado, sempre com ícone |
| `color-warning` | `#A66B16` | Promoção perto do fim |
| `color-error` | `#B42332` | Erro ou promoção inválida |
| `color-info` | `#356B73` | Ajuda e informação |
