import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'

export default defineConfig({
  plugins: [
    react(),
    tailwindcss(),
  ],
  build: {
    rollupOptions: {
      output: {
        manualChunks(id) {
          if (id.includes('node_modules')) {
            if (/[\\/]node_modules[\\/](react|react-dom|scheduler|react-router|react-router-dom|react-is)[\\/]/.test(id)) {
              return 'vendor-react';
            }
            if (id.includes('@xyflow')) {
              return 'vendor-xyflow';
            }
            if (id.includes('@supabase')) {
              return 'vendor-supabase';
            }
          }
        },
      },
    },
    chunkSizeWarningLimit: 600,
  },
})
