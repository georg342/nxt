# uso do rtk (Rust Token Killer)

`rtk 1.2.0` instalado via winget. filtra e compacta a saída de comandos antes de chegar ao contexto.

- usar: `rtk git status|diff|log|show|add|commit|push` e `rtk run <cmd>`.
- não usar `rtk ls|tree|grep|rg` no windows; use `Get-ChildItem` e `Select-String`.
- não usar `rtk read` em arquivo que vou editar; use read_files.
- ecoar exit code: `...; Write-Output "EXIT=$LASTEXITCODE"`.
- `command completion could not be observed`: reexecutar antes de assumir o resultado.
- `rtk` ausente ou falhando: usar `git` direto e avisar.
- `rtk gain` só quando o usuário pedir estatística.