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
      // Proxy all backend routes to the backend server
      '/auth': 'http://localhost:8000',
      '/admin': 'http://localhost:8000',
      '/user': 'http://localhost:8000',
      '/week5': 'http://localhost:8000',
    }
  }
})
