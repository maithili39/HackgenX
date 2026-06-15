import { defineConfig, loadEnv } from 'vite'
import react from '@vitejs/plugin-react'

// https://vitejs.dev/config/
export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd(), '')
  const API_URL = env.VITE_API_URL || 'http://localhost:5000'

  return {
    plugins: [react()],
    // Dev proxy so cookies / CORS work locally
    server: {
      proxy: {
        '/api': { target: API_URL, changeOrigin: true },
      },
    },
  }
})
