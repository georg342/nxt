# WNXT_AI_CONTEXT

## SYSTEM_DIRECTIVES & LLM CONVENTIONS
- ROLE: Canonical Single Source of Truth for CLI coding agents (Aider, Cursor) & LLMs.
- LANGUAGE_RULE: 100% English for code, filenames, variables, comments, and git commit messages. UI text must use `vue-i18n` translation keys.
- TECH_CONSTRAINTS: Vue 3 (Composition API, `<script setup>`), Vite, Pinia, Vue Router. Strictly ZERO Node.js backend logic, zero Tailwind (use CSS/SCSS modules or scoped CSS).
- ARCHITECTURE_PHILOSOPHY: SOLID principles. Strict Separation of Concerns (SoC) between UI (Vue SFCs), State (Pinia), and Database operations (Repository Pattern).

## AIDER & TOKEN CONSERVATION PROTOCOL
1. STRICT DIFF ADHERENCE: Never output conversational filler. Jump straight to search/replace blocks or code deliverables.
2. NO LAZY CODE / NO OMISSIONS: Never emit placeholders or comments like `// ... rest of code unchanged ...`. Match exact lines for `SEARCH` and replace them completely.
3. CONTEXT MINIMIZATION: Keep Vue SFCs under ~200 lines. Extract complex logic into `src/composables/` or `src/utils/`.
4. ATOMIC PATCHES: Modify only the requested files. Do not refactor adjacent methods unless explicitly asked.

## PROJECT_META
- NAME: WNXT ("What's Next") - Electronic music event calendar.
- DOMAIN: `https://wnxt.com.br` (Hosted on GitHub Pages).
- DEPENDENCIES: `@supabase/supabase-js`, `vue-router`, `pinia`, `pinia-plugin-persistedstate`, `@vueuse/core`, `@vueuse/motion`, `vue-i18n`, `@phosphor-icons/vue`.

## BACKEND & DATABASE SPECIFICATION (SUPABASE)
- AUTH: Google OAuth provider enabled.
- SECURITY: Client-side `anon` key exposed; row access strictly controlled via Postgres RLS policies.
- RLS_POLICIES (`public.events`):
  - `anon`: `SELECT` WHERE `status = 'approved'`.
  - `authenticated`: `INSERT` WHERE `status = 'pending'` AND `created_by = auth.uid()`.
  - `admin`: Full CRUD on all records.

## STATE MANAGEMENT & ARCHITECTURE
- BOOTSTRAP & AUTH FLOW: `main.js` MUST await `supabase.auth.getSession()` before calling `app.mount('#app')` to prevent Flash of Unauthenticated Content (FOUC).
- INTERNATIONALIZATION (i18n): Managed via `vue-i18n` (PT/EN). All dynamic dates must strictly use `Intl.DateTimeFormat` combined with the active i18n locale and locked to `America/Sao_Paulo` (Brasília) timezone.
- PINIA STORES (`pinia-plugin-persistedstate` enabled for mobile lifecycle survival):
  - `useAuthStore`: Manages session and admin claims.
  - `useEventStore`: Manages events, caching, and filtering logic.
  - `useUIStore`: Manages theme (dark/light), locale (pt/en), current JS `Date` state, spatial transition directions (`ios-push`/`ios-pop`), and mobile window manager state.
- REPOSITORY PATTERN (SOLID): UI and Stores NEVER call Supabase directly. Interface `src/services/EventService.js` -> Implementation `src/repositories/SupabaseEventRepository.js`.

## DESIGN_SYSTEM (NEO_BRUTALISM + iOS 18 SPATIAL UI)
- THEME_MECHANISM: `<html data-theme="light|dark">` toggled via Pinia.
- NATIVE APP ILLUSION: Web artifacts are strictly disabled globally. `-webkit-tap-highlight-color: transparent`, `user-select: none`, and native scrollbars are visually hidden (`scrollbar-width: none`) while preserving scroll mechanics.
- GEOMETRY (Squircles & Hard Borders): Borders `2px solid var(--border-color)`. Radius mimics Apple's squircle: `var(--radius-md): 16px`, `var(--radius-lg): 24px`. 
- ELEVATION & PHYSICS:
  - Shadows (0px blur): `--shadow-1`: `4px 4px 0px var(--shadow-color)`.
  - Interactive Physics: Handled by `@vueuse/motion` `v-motion`. Tap states use fluid spring physics (e.g., `scale: 0.94`, `stiffness: 400`, `damping: 20`) rather than linear CSS transforms.
- ANIMATIONS & SPATIAL NAVIGATION:
  - iOS Push/Pop transitions for View changes (New screens slide in over blurred, scaled-down underlying screens) using custom `cubic-bezier(0.32, 0.72, 0, 1)`.
  - Staggered cascading animations (Domino effect) using transition delays for Grid items (e.g., Week cards sliding in/out sequentially).
- ICONS: STRICTLY NO EMOJIS. Use `@phosphor-icons/vue` exclusively. Default `weight="duotone"` for aesthetic/creative depth, `weight="bold"` for directional arrows.

## UI_PATTERNS & WINDOW MANAGER
- Header Dock: Logo (dbl-click for Admin Gateway) + Locale Toggle + Theme Toggle + Nav (`[ 12M ]`, `[ 30D ]`, `[ 7D ]`, `[ Today ]`, `+`).
- SubHeader (Context Bar): Animated information bar displaying the active contextual date range (e.g., "Oct 14 - Oct 20") bound to real JS Date logic.
- Year View: Fixed 2x6 grid of 12 month folder-tab cards.
- Month View: Unified grid of 35/42 cells (empty space padded with blank bordered cells to maintain geometry). No gaps.
- Week View (2x4 Grid): 7 daily blocks (cascading entry) + 8th block as a fixed bright yellow "Next Week ->" shortcut.
- Day View & Feed: Vertical feed of time-sorted event cards occupying full width, with internal scroll and bottom shadow fade indicating overflow.
- Inline Accordion: Tapping an event expands it *in-place* to reveal full lineup, genres, and ticket link. No full-page popups.

## ADMIN CMS DASHBOARD
- GATEWAY: Triggered by double-clicking the WNXT logo.
- TOOLBAR: Quick status tabs, origin filters, and dual date filters.
- STAGING & BULK ACTIONS: Admin creations default to `pending`. Master checkbox for atomic bulk actions (Approve, Reject, Delete) via `.in('id', selectedIds)`.