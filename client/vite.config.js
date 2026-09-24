import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import path from 'path'
import { fileURLToPath } from 'url'

const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)

// https://vite.dev/config/
export default defineConfig({
  plugins: [react()],
  server: {
    port: 5173,
    host: true,
    proxy: {
      '/api': {
        target: 'http://127.0.0.1:5001',
        changeOrigin: true
      },
      '/uploads': {
        target: 'http://127.0.0.1:5001',
        changeOrigin: true
      },
      '/public': {
        target: 'http://127.0.0.1:5001',
        changeOrigin: true
      }
    }
  }
})
