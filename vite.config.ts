import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

export default defineConfig({
  plugins: [react()],
  server: {
    port: 5173,
    open: true,
  },
  build: {
    // Vercel serves from dist/ — this is the default, stated explicitly for clarity
    outDir: 'dist',
    // Emit source maps for production error tracing (optional — remove to shrink deploy)
    sourcemap: false,
    // Increase chunk warn threshold to suppress the existing recharts/leaflet size warning
    chunkSizeWarningLimit: 1000,
    rollupOptions: {
      output: {
        // Split vendor chunks so users don't re-download everything on each deploy
        manualChunks: {
          'vendor-react': ['react', 'react-dom', 'react-router-dom'],
          'vendor-charts': ['recharts'],
          'vendor-map': ['leaflet', 'react-leaflet'],
          'vendor-csv': ['papaparse'],
        },
      },
    },
  },
})
