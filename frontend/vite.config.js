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
      // Trick the browser into thinking the backend is on the same port!
      // (Change 3000 to whatever port your backend is actually running on)
      '/signup': 'http://10.172.144.10:8000',
      '/login': 'http://10.172.144.10:8000',
      '/refresh': 'http://10.172.144.10:8000',
      '/logout': 'http://10.172.144.10:8000',
    }
  }
})
