## 2025-02-14 - Transient state subscriptions to avoid React Three Fiber re-renders
**Learning:** Reactive Zustand hooks (e.g., `usePlayer((s) => s.x)`) cause unnecessary re-renders in heavy React Three Fiber component trees when tracking rapidly changing state, such as player locomotion.
**Action:** Use transient state updates via `usePlayer.subscribe` or periodic polling with `usePlayer.getState()` inside `useEffect` or `useFrame` for state that changes frequently but doesn't need to trigger React DOM/Virtual DOM updates for the entire component tree.
