# WNXT

Electronic music event calendar. Vue 3 `<script setup>` SPA.

- Stack: Vite, Pinia (+ persisted state), Vue Router, vue-i18n, Supabase, `@phosphor-icons/vue`.
- Styling: scoped CSS with the tokens in `src/assets/main.css` (neo-brutalism). No Tailwind.
- Layers: `views/` + `components/` -> `stores/` -> `services/` -> `repositories/` -> `lib/supabase.js`.
  Only repositories import Supabase.

## Commands

```bash
npm install
npm run dev       # dev server
npm run build     # build + copies dist/index.html to dist/404.html (GitHub Pages)
npm run preview   # serve the build
```

## Config

`.env.local` needs `VITE_SUPABASE_URL` and `VITE_SUPABASE_ANON_KEY`. Never commit it.
The anon key is public by design; authorization lives in Postgres RLS.

## Deploy

Push to `main` triggers `.github/workflows/deploy.yml` (GitHub Pages, https://wnxt.com.br).
Work lands on `dev` first.

## Rules

See `AGENTS.md` (working rules) and `AI_CONTEXT.md` (detailed spec).
