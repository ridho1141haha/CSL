
## 2024-05-19 - Use transient state updates for high-frequency stores
**Learning:** Using reactive Zustand hooks (e.g. `usePlayer((s) => s.x)`) in components like `Player.tsx` and `MapPanel` causes frequent React re-renders when the state changes rapidly (like player movement every frame). This forces heavy Three.js or UI components to reconcile unnecessarily.
**Action:** Use `usePlayer.subscribe` inside a `useEffect`, or periodic polling (`setInterval` with `usePlayer.getState()`), rather than reactive hook selectors for highly dynamic variables that drive local component state or coordinate non-React logic.
