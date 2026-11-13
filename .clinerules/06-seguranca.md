# segurança

- autorização real é Postgres RLS. `authStore.isAdmin` é só UX: nunca implemente permissão que dependa do cliente.
- nunca `v-html`/`innerHTML` com dado externo (Supabase, Nominatim, input do usuário). use interpolação Vue ou `textContent`. hoje o `src/` tem zero ocorrências: mantenha assim.
- todo `await` de Supabase fica no repositório com `try/catch` e retorno explícito; falha silenciosa em `fetchEvents` quebra a tela.
- `.env` e `.env.local` nunca commitados nem lidos como texto no contexto.
- nenhuma chave embutida no cliente. a anon key é pública por natureza: a segurança vem do RLS e das policies.
- única API externa permitida é Nominatim (OpenStreetMap). qualquer outro serviço: pedir aprovação antes.
- `localStorage`/`sessionStorage` só para preferência de UI; nunca para segredo ou permissão. (hoje `AppGate.vue` usa sessionStorage para o gate de entrada.)