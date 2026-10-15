## 2024-05-18 - [React Three Fiber - Optimize rapid state updates]
**Learning:** In React Three Fiber components connected to rapid Zustand state updates (like player movement), using reactive hook selectors like `usePlayer((s) => s.x)` causes excessive re-renders of heavy components (e.g., `RigidBody`).
**Action:** Use transient updates via `useStore.subscribe` inside a `useEffect` to react to state changes without re-rendering the component, initializing values with `useStore.getState()`.
