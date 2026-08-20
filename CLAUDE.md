# Project Guidelines & Hydration Rules

## Component & Rendering Rules

1. **Mount Gating for Client-Only Effects:** Any component whose output depends on `window`, mouse/scroll position, `Math.random()`, `Date.now()`, or a `ref.current` value must render `null` (not a placeholder `<div>`) until `mounted` is `true` via `useEffect` (use `useMounted()`).
2. **Consistent JSX Shape:** Never branch to a different JSX shape for loading/unmounted states — either render `null` on both SSR and initial client pass, or render the exact same component tree with only inner values/props differing.
3. **Chakra/Emotion Style Mount Gating:** Any Chakra/Emotion-styled component that computes inline `style` from client-only data (mouse position, viewport size) needs the mount-gate (`useMounted()`).
4. **Pre-Merge Audit Checklist:** Audit whether new components read `window`, `document`, `navigator`, mouse events, or generate random/time-based values in the render body. If yes → mount-gate with `useMounted()`.
5. **CSS-Only Mouse Effects:** Prefer CSS-only mouse-follow effects (via CSS custom properties updated in a `useEffect`/event listener) over recomputing `style` objects in render.

## Repo shape

This repo holds two apps behind one domain (see README.md):

- **Root Next app** — the landing page, game and `/dashboard`, styled with Chakra +
  `app/home.css`. Rules 1-5 above apply here.
- **`marketplace-app/`** — the Holder Hub, a Vite SPA served at `/marketplace` from
  `public/marketplace/`. It is a plain client-rendered app: there is no SSR pass, so
  the hydration rules above do not apply to it.

6. **Do not merge the Hub into a Next route.** Its stylesheet is a full
   `@import "tailwindcss"` including preflight, a global reset. Next keeps a visited
   route's CSS in the document across client-side navigation, so preflight would
   follow the user back to the Chakra landing page and trample it. The separate
   document is what keeps each reset scoped to the page that wants it.
7. **`/marketplace` is not in the router.** It is a static document under `public/`.
   `next/link` still reaches it — the rewrite answers an RSC request with plain
   `text/html`, so the client router falls back to a full page load — but it is a
   full document load either way, never a client-side transition.
8. **Hub API handlers live once**, in `marketplace/api/`, wrapped by thin route files
   in `app/api/marketplace/`. The Hub front end reaches them through the base set in
   `marketplace-app/vite.config.ts`.
