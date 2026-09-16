## 2024-05-24 - React High-Frequency Event Optimization
**Learning:** Frequent state updates in React (e.g., from `pointermove` events for an on-screen joystick) can cause continuous component re-renders, impacting performance, especially on mobile devices.
**Action:** Move high-frequency visual updates out of React state and manipulate the DOM directly using a `ref` and `style.transform` to prevent unnecessary re-renders.
