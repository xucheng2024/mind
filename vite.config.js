import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react-swc'
import { VitePWA } from 'vite-plugin-pwa'

export default defineConfig({
  define: {
    global: 'globalThis',
    'process.env': {},
    'process.browser': true,
  },
  plugins: [
    react(),
    VitePWA({
      registerType: 'autoUpdate',
      workbox: {
        globPatterns: ['**/*.{js,css,html,ico,png,svg}'],
        globIgnores: ['**/node_modules/**/*', 'sw.js', 'workbox-*.js'],
        cleanupOutdatedCaches: true,
        skipWaiting: true,
        clientsClaim: true
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
    minify: 'terser',
    target: 'esnext',
    chunkSizeWarningLimit: 1000,
    rollupOptions: {
      output: {
        manualChunks: {
          vendor: ['react', 'react-dom'],
          router: ['react-router-dom'],
          ui: ['react-hot-toast', 'framer-motion', 'react-icons'],
          forms: ['react-hook-form', '@hookform/resolvers', 'zod', 'react-imask'],
          media: ['compressorjs', '@uiw/react-signature', 'react-camera-pro'],
          calendar: ['@fullcalendar/react', '@fullcalendar/daygrid', '@fullcalendar/timegrid', '@fullcalendar/interaction', '@fullcalendar/list'],
          utils: ['uuid', 'crypto-js', 'dayjs'],
          query: ['@tanstack/react-query', '@tanstack/react-query-devtools']
        }
      }
    },
    terserOptions: {
      compress: {
        drop_console: false,
        drop_debugger: true
      },
      mangle: {
        safari10: true
      }
    }
  },
  optimizeDeps: {
    include: [
      'react',
      'react-dom',
      'react-router-dom',
      '@supabase/supabase-js',
      'react-hot-toast',
      'framer-motion',
      'react-icons',
      'react-hook-form',
      '@hookform/resolvers',
      'zod',
      'react-imask',
      'compressorjs',
      '@uiw/react-signature',
      'react-camera-pro',
      '@fullcalendar/react',
      '@fullcalendar/daygrid',
      '@fullcalendar/timegrid',
      '@fullcalendar/interaction',
      '@fullcalendar/list',
      'uuid',
      'crypto-js',
      'dayjs',
      '@tanstack/react-query',
      '@tanstack/react-query-devtools'
    ]
  },
  resolve: {
    dedupe: ['react', 'react-dom', '@supabase/supabase-js'],
    alias: {
      stream: 'stream-browserify',
      util: 'util/',
    }
  },
  server: {
    port: 5173,
    host: true,
    open: true,
    cors: true,
    hmr: {
      overlay: true
    }
  },
  preview: {
    port: 4173,
    host: true,
    open: true
  }
}) 