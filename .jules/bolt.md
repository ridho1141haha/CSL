## 2023-11-20 - [Player Component Performance Optimization]
**Learning:** In heavy React Three Fiber components connected to rapidly changing Zustand state (like player coordinates), using reactive selectors (e.g. `usePlayer((s) => s.x)`) causes massive, continuous re-renders.
**Action:** Replace direct reactive selectors for high-frequency data with a `useEffect` and `useStore.subscribe()` to manually handle changes without triggering component renders.
