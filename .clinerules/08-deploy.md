# subir pra produção

"subir pra prd" (ou "deploy", "publicar") significa exatamente isto:

1. commit das alterações em `dev` e `git push origin dev`.
2. `git checkout main`.
3. `git merge dev -m "Merge branch 'dev': <resumo curto>"`
4. `git push origin main` — o push em `main` dispara `.github/workflows/deploy.yml` e publica no GitHub Pages (`https://wnxt.com.br`).
5. `git checkout dev` de volta.

O push em `main` é o que dispara o deploy. Não existe outro gatilho, exceto `workflow_dispatch` manual.

## conferir

- `gh run list --limit 1 --json status,conclusion` deve terminar com `"conclusion":"success"`.
- falha em `Deploy to GitHub Pages` com `No artifacts named "github-pages"` ou `Multiple artifacts named`: ver o comentário `Shortcut:` em `.github/workflows/deploy.yml` antes de mexer no workflow. Rerun de job que sobe artifact duplica artifact e quebra o deploy.

## nunca

- deploy sem o usuário pedir.
- `--amend`, `reset --hard` ou `push --force`.
- assumir que `.md` de regra precisa ir pra produção: o deploy publica o build, não os arquivos de documentação.
