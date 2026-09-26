## 2024-05-24 - Transient Updates in usePlayerPos
**Learning:** In heavy components that are connected to rapidly changing Zustand state (like player movement), using transient updates via `useStore.subscribe` or polling with `useStore.getState()` inside a `useEffect` is much more performant than using reactive hook selectors (e.g. `useStore((s) => s.x)`).
**Action:** Convert `useStore((s) => s.x)` to a local state initialized with `useStore.getState()` and updated via polling/subscription to prevent unnecessary re-renders.
