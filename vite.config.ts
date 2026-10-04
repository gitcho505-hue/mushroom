import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig(({ isSsrBuild }) => ({
  plugins: [react()],
  server: {
    watch: {
      ignored: ['**/snimki/**'],
    },
  },
  build: {
    assetsInlineLimit: 0,
    ...(isSsrBuild ? {} : {
      rollupOptions: {
        output: {
          manualChunks: {
            vendor: ['react', 'react-dom', 'react-router-dom'],
          },
        },
      },
    }),
  },
}));