# WNXT_AI_CONTEXT

## SYSTEM_DIRECTIVES
- ROLE: Single source of truth for CLI coding agents (Aider, Cursor) & LLMs on this repo.
- LANGUAGE: Code, filenames, variables, comments and git commits in English. All user-facing UI text goes through `vue-i18n` keys, with `pt-BR` as the default locale.
- TECH: Vue 3 (Composition API, `<script setup>`), Vite, Pinia (+ `pinia-plugin-persistedstate`), Vue Router.
- STYLING: Pure scoped CSS with CSS variables only. No Tailwind — do not write utility-class syntax anywhere, including in this file.
- ARCHITECTURE: Separation of Concerns between UI (Vue SFCs), State (Pinia) and Database (Repository Pattern). UI and stores never call Supabase directly; only repositories do.
- DEPENDENCIES: `@supabase/supabase-js`, `vue-router`, `pinia`, `pinia-plugin-persistedstate`, `@vueuse/core`, `@vueuse/motion`, `vue-i18n`, `@phosphor-icons/vue`.
- EXTERNAL APIS: OpenStreetMap Nominatim for location search (free, no auth). Any other external service or package must be approved by the user before installation.

## PROJECT
- NAME: WNXT ("What's Next") — electronic music event calendar.
- DOMAIN: `https://wnxt.com.br`, hosted on GitHub Pages.

## BACKEND (SUPABASE)
- AUTH: Google OAuth.
- SECURITY: client-side `anon` key; access governed strictly by Postgres RLS.
- RLS on `public.events`:
  - `anon`: `SELECT` where `status = 'published'`.
  - `authenticated`: `INSERT` where `status = 'pending'`.
  - admin: full CRUD via `admin_users` lookup.

## STATE
- BOOTSTRAP: `main.js` awaits `supabase.auth.getSession()` before `app.mount('#app')` to prevent FOUC.
- Stores:
  - `useAuthStore`: session, `isAdmin`, `isSuperAdmin`.
  - `useEventStore`: events, cache, filters.
  - `useUIStore`: toasts, modals, theme, mobile window manager.

## DESIGN SYSTEM (NEO-BRUTALISM, MOBILE-FIRST)
- Native-app feel: `-webkit-tap-highlight-color: transparent`, `user-select: none`. Never use native `alert`/`confirm` or native datetime pickers.
- Geometry: borders of 2px or thicker, solid black; hard offset shadows via `var(--shadow-1)`.
- Palette: vibrant, contrasting (lime, orange, cyan, pink, yellow).
- Scrollbars: thin, rounded, semi-transparent dark pills, contrasted against the brutalist UI.

## UX PATTERNS
- Viewport: modals and overlays must never sit behind the mobile address bar — cap height around `95dvh` (via CSS var/class, not Tailwind) and respect safe-area insets. Form action rows stay sticky at the bottom.
- Inputs: floating labels — label translates up on focus/value and never overlaps input text.
- Keyboard: auto-blur inputs after a dropdown selection.
- Toasts: custom floating brutalist toasts, `max-width: 85vw`, single line preferred, tap anywhere to dismiss. No `X` button. Green = success, orange = error.
- Tag/pill input: typing `,` converts the preceding text into a pill; pills stack vertically above the input.

## ADMIN
- Quick approve modal: opened from a FAB, lists only pending events for approve/reject.
- Full CMS: `/admin` route, full-screen overlay, opened by long-press on the language toggle. Table-style accordion for edit, bulk actions and master filters.

## AIDER NOTES
- Output only direct, analytical reasoning; no conversational filler.
- Never emit placeholders like `// ... unchanged ...` — always write the full replacement block for each SEARCH/REPLACE.
- If a task would need a new dependency or a new external service, stop and ask instead of adding it.
- Always use SEARCH/REPLACE blocks with exact, unique context. Never rewrite a whole file unless the user explicitly asks for a full rewrite.