# WNXT_AI_CONTEXT

## SYSTEM_DIRECTIVES & LLM CONVENTIONS
- ROLE: Canonical Single Source of Truth for CLI coding agents (Aider, Cursor) & LLMs.
- LANGUAGE_RULE: 100% English for code, filenames, variables, comments, and git commit messages. UI text must use `vue-i18n` translation keys or default to Portuguese.
- TECH_CONSTRAINTS: Vue 3 (Composition API, `<script setup>`), Vite, Pinia, Vue Router. 
- STRICTLY NO TAILWIND CSS: Use pure scoped CSS and CSS variables exclusively.
- LIBRARY_SUGGESTIONS: AI agents may suggest new packages, but MUST explicitly consult the user for approval before installation.
- ARCHITECTURE_PHILOSOPHY: SOLID principles. Strict Separation of Concerns (SoC) between UI (Vue SFCs), State (Pinia), and Database operations (Repository Pattern).

## AIDER BEHAVIORAL & AUTONOMY PROTOCOL
1. DIRECT ANALYTICAL THINKING: You may output your thinking process, but it MUST be strictly analytical and direct. Completely eliminate humanized conversational filler, hesitations, or self-debates (e.g., NO "Hmm...", "But wait...", "Let me think...").
2. AUTONOMOUS UX MICRO-ENHANCEMENTS: You are encouraged to proactively implement standard UX best practices (e.g., click-outside to close, escape key bindings, debouncing, basic focus management) even if not explicitly requested by the user, provided they fit the project's architecture.
3. ENHANCEMENT NOTIFICATION: Whenever you implement an autonomous enhancement, you MUST briefly notify the user in your output summary, stating exactly *what* was added and *why* (e.g., "Added click-outside handler to the dropdown to improve mobile UX.").
4. NO LAZY CODE: Never emit placeholders like `// ... rest of code unchanged ...`. Match exact lines for `SEARCH` and replace them completely.
5. CONTEXT MINIMIZATION: Keep Vue SFCs under ~200 lines. Extract complex logic into `src/composables/` or `src/utils/`.

## PROJECT_META
- NAME: WNXT ("What's Next") - Electronic music event calendar.
- DOMAIN: `https://wnxt.com.br` (Hosted on GitHub Pages).
- DEPENDENCIES: `@supabase/supabase-js`, `vue-router`, `pinia`, `pinia-plugin-persistedstate`, `@vueuse/core`, `@vueuse/motion`, `vue-i18n`, `@phosphor-icons/vue`.
- EXTERNAL_APIS: OpenStreetMap (Nominatim) for location search (strictly free/no-auth).

## BACKEND & DATABASE SPECIFICATION (SUPABASE)
- AUTH: Google OAuth provider enabled.
- SECURITY: Client-side `anon` key exposed; row access strictly controlled via Postgres RLS policies.
- RLS_POLICIES (`public.events`):
  - `anon`: `SELECT` WHERE `status = 'published'`.
  - `authenticated`: `INSERT` WHERE `status = 'pending'`.
  - `admin`: Full CRUD on all records via `admin_users` lookup table.

## STATE MANAGEMENT & ARCHITECTURE
- BOOTSTRAP & AUTH FLOW: `main.js` MUST await `supabase.auth.getSession()` before calling `app.mount('#app')` to prevent Flash of Unauthenticated Content (FOUC).
- PINIA STORES:
  - `useAuthStore`: Manages session, `isAdmin`, and `isSuperAdmin` claims.
  - `useEventStore`: Manages events, caching, and filtering logic.
  - `useUIStore`: Manages toasts, modals, theme, and mobile window manager state.
- REPOSITORY PATTERN (SOLID): UI and Stores NEVER call Supabase directly. 

## DESIGN_SYSTEM (NEO_BRUTALISM + MOBILE-FIRST UX)
- NATIVE APP ILLUSION: Web artifacts disabled. `-webkit-tap-highlight-color: transparent`, `user-select: none`. Strictly NO native browser alerts or native datetime pickers.
- GEOMETRY & ELEVATION: Thick borders (`border-2 border-black` or thicker). Hard offset shadows (`box-shadow: var(--shadow-1)`). 
- COLOR PALETTE: Vibrant, contrasting colors (lime, orange, cyan, pink, yellow).
- CUSTOM SCROLLBARS: Replaced native scrollbars with thin, rounded, semi-transparent dark pills to contrast with hard brutalist UI.

## UX_PATTERNS & MOBILE CONSTRAINTS
- STRICT MOBILE VIEWPORT: Modals and overlays must NEVER go behind the mobile browser's address bar (use `max-h-[95dvh]` and safe-area margins). Form actions (Submit) must be sticky at the bottom.
- FLOATING LABELS: All inputs use the floating label pattern (label translates up on focus/value). Input text and label must not overlap.
- KEYBOARD MANAGEMENT: Mobile keyboards must be strictly managed. Auto-blur inputs after selecting dropdown items.
- TOAST NOTIFICATIONS: Custom Neo-Brutalist floating toasts (`max-w-[85vw]`, single line preferred). Click anywhere to dismiss. No "X" buttons. Green for success, Orange for errors.
- TAG/PILL INPUT: Typing a comma `,` instantly converts the previous text into a Pill. Pills stack vertically *above* the input area. 

## ADMIN CMS DASHBOARD
- MODAL APROVAÇÃO RÁPIDA: Triggered by a FAB. Only shows pending events for quick approve/reject.
- FULL CMS DASHBOARD: Triggered by long-press on Language Toggle. Full screen overlay (`/admin` route). Table-like accordion layout for deep management (edit, bulk actions, master filters).