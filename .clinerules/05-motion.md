# movimento e animação

- duração e easing existentes não mudam sem pedido: `--transition-fast: 120ms`, stagger de 35ms nos day-cards, animação de entrada de 0.4s, loop de digitação dos badges.
- valor novo entra como token em `src/assets/main.css`, nunca número solto no componente.
- hover/active: inversão sólida e `translate`/`scale`, sem blur na sombra.
- `prefers-reduced-motion` só existe em `src/components/admin/AdminGateway.vue`: animação longa nova trata isso no próprio componente.
- `will-change: transform` só em elemento que se move sempre.