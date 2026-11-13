# segurança em refatoração

## etapas

- etapa grande: divida em sub-passos, cada um com objetivo próprio.
- arquivo existente: editar por trecho, nunca reescrever o conteúdo inteiro.
- antes de editar, ler o trecho exato; não confiar em memória de versão anterior.

## preservação

- não remova código de negócio marcado `TODO`/`FIXME` sem confirmar.
- não modernize o visual: o neo-brutalism atual fica.
- não introduza dependência, bundler, linter, formatter ou framework.

## duplicatas conhecidas (manter em sync, não unificar sem pedido)

- `src/i18n/locales/pt.js` e `src/i18n/locales/en.js`: mesmas chaves, sempre.
- `normalizeList` (`src/stores/eventStore.js`) e `parsePills` (`src/components/calendar/EventCard.vue`).
- labels de `ACCENT_PRESETS` em `src/stores/uiStore.js`, hardcoded em pt.

## dúvida = pare

- dois arquivos parecidos, CSS duplicado ou código ambíguo: pergunte antes de agir.