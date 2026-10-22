# Motion — nova direção v0.3

- Interações comuns: 180–240 ms, `cubic-bezier(0.2, 0.8, 0.2, 1)`.
- Gesto principal: o dedo acompanha o toque enquanto a camada prateada é removida em uma máscara/clip-path.
- Revelação do prêmio: 500–700 ms, com brilho curto e confetes discretos.
- CTA: microescala de até 1.02 e brilho de 120 ms; sem pulsação infinita.
- Marca: o cartão aparece, a raspagem abre a superfície e a estrela surge como recompensa.
- Microfeedback: riscos prateados diminuem, o prêmio ganha contraste e o estado final recebe um brilho dourado com pulso vermelho curto.
- `prefers-reduced-motion: reduce`: remover confetes, brilho e transformações; manter apenas mudança de estado e opacidade.
- Não usar movimento que pareça roleta, jackpot ou aposta contínua.
- Evitar confetes infantis; preferir reflexo metálico, selo de prêmio ou brilho controlado.
