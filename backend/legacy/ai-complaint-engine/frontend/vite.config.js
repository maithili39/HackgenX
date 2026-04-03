import { defineConfig, loadEnv } from 'vite'
import react from '@vitejs/plugin-react'

// https://vitejs.dev/config/
export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd(), '')
  const API_URL = env.VITE_API_URL || 'http://localhost:5000'
  const ML_URL  = env.VITE_ML_URL  || 'http://localhost:8000'

  return {
    plugins: [react()],
    // Inject build-time globals — no import needed anywhere
    define: {
      __API_BASE__: JSON.stringify(API_URL),
      __ML_BASE__:  JSON.stringify(ML_URL),
    },
    // Dev proxy so cookies / CORS work locally
    server: {
      proxy: {
        '/api': { target: API_URL, changeOrigin: true },
      },
    },
  }
})
