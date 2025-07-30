import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import { VitePWA } from 'vite-plugin-pwa'
import legacy from '@vitejs/plugin-legacy'
import compression from 'vite-plugin-compression'



export default defineConfig({
  define: {
    global: 'globalThis',
    'process.env': {},
    'process.browser': true,
  },
  plugins: [
    react(),
    legacy({
      targets: ['defaults', 'not IE 11'],
      additionalLegacyPolyfills: ['regenerator-runtime/runtime'],
      renderLegacyChunks: true,
      polyfills: [
        'es.symbol',
        'es.promise',
        'es.promise.finally',
        'es/map',
        'es/set',
        'es.array.filter',
        'es.array.for-each',
        'es.array.flat-map',
        'es.object.define-properties',
        'es.object.define-property',
        'es.object.get-own-property-descriptor',
        'es.object.get-own-property-descriptors',
        'es.object.keys',
        'es.object.to-string',
        'web.dom-collections.for-each',
        'esnext.global-this',
        'esnext.string.match-all'
      ]
    }),
    compression({
      algorithm: 'gzip',
      ext: '.gz'
    }),
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
    commonjsOptions: {
      include: [/node_modules/],
      transformMixedEsModules: true,
      requireReturnsDefault: 'preferred',
      esmExternals: true
    },
    rollupOptions: {
      output: {
        manualChunks: {
          vendor: ['react', 'react-dom'],
          router: ['react-router-dom'],
          ui: ['react-hot-toast', 'framer-motion', 'react-icons'],
          forms: ['react-hook-form', '@hookform/resolvers', 'zod', 'react-imask'],
          media: ['compressorjs', '@uiw/react-signature'],
          calendar: ['react-calendar'],
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
  esbuild: {
    keepNames: true
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
      'react-calendar',
      'uuid',
      'crypto-js',
      'dayjs',
      '@tanstack/react-query',
      '@tanstack/react-query-devtools'
    ],
    esbuildOptions: {
      target: 'esnext',
      format: 'esm'
    }
  },
  resolve: {
    dedupe: ['react', 'react-dom', '@supabase/supabase-js'],
    mainFields: ['module', 'main'],
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