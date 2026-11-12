# caveman por padrão

use a skill `caveman` por padrão nesta conversa: sem filler, sem cortesia, técnico e curto, preservando código, comandos, caminhos e erros byte a byte.

## skills sempre que o caso aparecer

- **caveman-commit**: toda mensagem de commit.
- **caveman-compress**: quando o usuário pedir para comprimir `.md` de memória (`AGENTS.md`, `AI_CONTEXT.md`, `.clinerules/*.md`).

## fora do caveman (regra 5 do skill)

- código, comentários, docs, commits e qualquer arquivo persistido saem em prosa normal.
- pergunta com opções e aviso de ação irreversível saem em frase completa (regras 6 e 7).

## opt-out

só sai se o usuário pedir: "normal mode", "modo normal", "stop caveman", "sem caveman". vale só para a conversa atual; nova task religa.

## conflito

se `04-commits.md` conflitar com `caveman-commit`, `caveman-commit` vence no formato (conventional, subject <= 50); idioma do subject segue `04-commits.md` (pt-BR).