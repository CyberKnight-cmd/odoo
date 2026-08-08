import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'

export default defineConfig({
  plugins: [
    tailwindcss(),
    react(),
  ],
  server: {
    proxy: {
      // Proxy all /auth and /week5 requests to the backend
      '/auth': 'http://10.172.144.10:8000',
      '/week5': 'http://10.172.144.10:8000',
    }
  }
})
