# Sistema de cores — referência selecionada v0.2

## Ideia

Base noturna de cassino casual, roxo luminoso, dourado de recompensa e acentos neon de game. O conjunto aprovado é multicolorido, mas deve manter o roxo escuro como campo de união visual.

| Token | Hex | Uso |
|---|---|---|
| `color-brand-midnight` | `#140B2E` | Fundo principal, hero e modo escuro |
| `color-brand-purple` | `#6D28D9` | Marca, superfícies e estados ativos |
| `color-brand-gold` | `#FFC857` | Prêmios, estrelas e destaque visual |
| `color-brand-gold-text` | `#8A5A00` | Texto/ícone dourado sobre fundo claro |
| `color-brand-cyan` | `#22D3EE` | Ação secundária e energia de game |
| `color-brand-pink` | `#F43F5E` | Celebração e acento pontual |
| `color-brand-orange` | `#FF8A00` | Gradiente e contorno quente de “Ganhe” |
| `color-brand-blue` | `#119BD7` | Faixas de energia e contraste |
| `color-brand-violet` | `#8B35E8` | Brilho e profundidade do cartão |
| `color-neutral-0` | `#FFFFFF` | Texto inverso e fundo claro |
| `color-neutral-100` | `#F8F7FC` | Fundo claro |
| `color-neutral-300` | `#D8D3E5` | Bordas e divisores |
| `color-neutral-700` | `#514A61` | Texto secundário |
| `color-neutral-950` | `#17131F` | Texto principal em fundo claro |

## Regras

- Branco sobre `#140B2E` é a combinação padrão para leitura.
- Nunca usar branco sobre o dourado vibrante em texto normal.
- Para texto, usar `color-brand-gold-text` sobre branco.
- Verde/vermelho nunca serão o único indicador de sucesso/erro: sempre incluir ícone e rótulo.
- `color-brand-gold` é para gráficos grandes, prêmio e decoração; não é cor de texto de corpo.

## Semânticas preliminares

| Token | Valor | Uso |
|---|---|---|
| `color-success` | `#15803D` | Resgate confirmado, sempre com ícone |
| `color-warning` | `#A16207` | Promoção perto do fim |
| `color-error` | `#B91C1C` | Erro ou promoção inválida |
| `color-info` | `#0E7490` | Ajuda e informação |
