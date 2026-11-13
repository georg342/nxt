# commit ao fim da tarefa

## regra

- toda tarefa que altera arquivo termina com commit, feito antes do resumo final.
- mensagem: uma linha, `type: descrição`, imperativa, pt-BR, subject <= 50 chars. tipos: `feat`, `fix`, `refactor`, `docs`, `chore`.
- exemplos: `feat: anima badges por semana`, `fix: corrige comparação de datas`.

## como

- `git add <caminhos explícitos>`, só os arquivos alterados nesta tarefa.
- `git commit -m "<mensagem>"`, depois `git status --short` para confirmar que saiu do pendente só o que era desta tarefa.

## nunca

- `git add -A` ou `git add .`.
- commitar `.env`/`.env.local`, credencial, ou artefato (`repomix-output.xml`, cache `.aider*`).
- `--amend`, `reset --hard` ou `push --force` sem confirmação explícita.
- push em `main`: dispara deploy no GitHub Pages, só quando pedido.

## sem mudança

- tarefa não alterou arquivo: não commitar, só avisar no resumo.