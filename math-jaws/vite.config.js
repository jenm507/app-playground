import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'

// https://vite.dev/config/
export default defineConfig({
  base: '/app-playground/math-jaws/',
  plugins: [
    react(),
    tailwindcss(),
  ],
})
