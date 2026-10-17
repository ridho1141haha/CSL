## 2024-05-24 - Zustand store updates bypassing React render

**Learning:** `usePlayer((s) => s.x)` and similar primitive hooks will trigger re-renders every time the value changes. Since player coordinates (`x`, `z`) update every frame when moving, this can cause continuous re-renders of any component using these selectors, dragging down performance.

**Action:** For frequently updated state like position or animation parameters, use `useStore.getState()` within `useFrame` or `setInterval` polling, OR `useStore.subscribe()` if a transient update is needed without rendering the component.
