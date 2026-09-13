import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

/**
 * @see https://vite.dev/config/
 */
export default defineConfig({
  plugins: [react()],
  server: {
    port: 5173,
    open: false,
  },
  build: {
    outDir: 'dist',
    sourcemap: true,
    rollupOptions: {
      output: {
        /**
         * Split the map engine and React out of the app bundle: both are large,
         * change rarely, and therefore cache well on their own.
         */
        manualChunks(id) {
          if (!id.includes('node_modules')) return undefined;
          if (id.includes('leaflet')) return 'leaflet';
          if (id.includes('react')) return 'react';
          return undefined;
        },
      },
    },
  },
});
