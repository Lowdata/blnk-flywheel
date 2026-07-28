# Project Guidelines & Hydration Rules

## Component & Rendering Rules

1. **Mount Gating for Client-Only Effects:** Any component whose output depends on `window`, mouse/scroll position, `Math.random()`, `Date.now()`, or a `ref.current` value must render `null` (not a placeholder `<div>`) until `mounted` is `true` via `useEffect` (use `useMounted()`).
2. **Consistent JSX Shape:** Never branch to a different JSX shape for loading/unmounted states — either render `null` on both SSR and initial client pass, or render the exact same component tree with only inner values/props differing.
3. **Chakra/Emotion Style Mount Gating:** Any Chakra/Emotion-styled component that computes inline `style` from client-only data (mouse position, viewport size) needs the mount-gate (`useMounted()`).
4. **Pre-Merge Audit Checklist:** Audit whether new components read `window`, `document`, `navigator`, mouse events, or generate random/time-based values in the render body. If yes → mount-gate with `useMounted()`.
5. **CSS-Only Mouse Effects:** Prefer CSS-only mouse-follow effects (via CSS custom properties updated in a `useEffect`/event listener) over recomputing `style` objects in render.
