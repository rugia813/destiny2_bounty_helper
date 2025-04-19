import { defineConfig } from 'vite'
import vue from '@vitejs/plugin-vue2'
import { VitePWA } from 'vite-plugin-pwa'
import path from 'path'

export default defineConfig({
  plugins: [
    vue(),
    VitePWA({
      registerType: 'autoUpdate',
      workbox: {
        globPatterns: ['**/*.{js,css,html,ico,png,svg}'],
        skipWaiting: true
      },
      includeAssets: ['favicon.ico'],
      manifest: {
        icons: [
          {
            src: './favicon.ico',
            sizes: '48x48',
            type: 'image/x-icon'
          }
        ]
      }
    })
  ],
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src')
    },
    extensions: ['.mjs', '.js', '.ts', '.jsx', '.tsx', '.json']
  },
  build: {
    commonjsOptions: {
      include: [/bungie-api-ts/, /node_modules/]
    }
  },
  optimizeDeps: {
    include: ['bungie-api-ts/destiny2', 'bungie-api-ts/app']
  },
  server: {
    port: 8161
  }
})