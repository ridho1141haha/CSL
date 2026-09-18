## 2024-05-18 - Deep Equality Check in useObjective
**Learning:** In React components that derive complex objects from stores (like `target` derived from `questStore` in `Hud.tsx`), using strict equality (`===`) inside a state setter (e.g., `setState((prev) => ...)`) causes unnecessary re-renders if the derived object is recreated on every frame/tick, even if its properties remain identical.
**Action:** Always use a deep or structural comparison based on unique identifiers (e.g., `questId` and `zoneId`) for complex derived objects to properly avoid state churn.
