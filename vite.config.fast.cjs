const { defineConfig } = require('vite')
const react = require('@vitejs/plugin-react')
const { VitePWA } = require('vite-plugin-pwa')

module.exports = defineConfig({
  plugins: [
    react(),
    VitePWA({
      registerType: 'autoUpdate',
      workbox: {
        globPatterns: ['**/*.{js,css,html,ico,png,svg}']
      },
      manifest: {
        name: 'Clinic App',
        short_name: 'Clinic',
        description: 'Modern clinic management and appointment booking app',
        theme_color: '#3b82f6',
        background_color: '#ffffff',
        display: 'standalone',
        orientation: 'portrait-primary',
        scope: '/',
        start_url: '/',
        icons: [
          {
            src: '/logo.png',
            sizes: '192x192',
            type: 'image/png',
            purpose: 'any maskable'
          },
          {
            src: '/logo.png',
            sizes: '512x512',
            type: 'image/png',
            purpose: 'any maskable'
          }
        ]
      }
    })
  ],
  build: {
    minify: 'esbuild', // 比 terser 快很多
    target: 'esnext',
    chunkSizeWarningLimit: 1000,
    rollupOptions: {
      output: {
        manualChunks: {
          vendor: ['react', 'react-dom'],
          router: ['react-router-dom'],
          ui: ['react-hot-toast', 'framer-motion', 'react-icons'],
          forms: ['react-hook-form', '@hookform/resolvers', 'zod', 'react-input-mask'],
          media: ['react-webcam', 'compressorjs', 'react-signature-canvas'],
          calendar: ['react-big-calendar'],
          supabase: ['@supabase/supabase-js'],
          utils: ['uuid', 'crypto-js', 'dayjs'],
          query: ['@tanstack/react-query', '@tanstack/react-query-devtools'],
          virtual: ['react-window', 'react-virtualized-auto-sizer', 'react-intersection-observer']
        }
      }
    }
  },
  esbuild: {
    keepNames: true
  },
  optimizeDeps: {
    include: ['react', 'react-dom', 'react-router-dom'],
    exclude: ['@supabase/supabase-js']
  }
}) 