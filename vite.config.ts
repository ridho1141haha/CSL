import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

// Phase 16: manual chunk splitting to reduce main bundle size and improve
// initial load. Three.js + Rapier physics get their own chunks so the React
// app code can load independently.
export default defineConfig({
  plugins: [react()],
  build: {
    chunkSizeWarningLimit: 1500,
    rollupOptions: {
      output: {
        manualChunks(id) {
          if (id.includes('node_modules')) {
            if (id.includes('three') || id.includes('@react-three')) return 'engine3d';
            if (id.includes('zustand')) return 'state';
            if (id.includes('react') || id.includes('scheduler')) return 'react-vendor';
          }
        },
      },
    },
  },
});
