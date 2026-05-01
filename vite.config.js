import { defineConfig, loadEnv } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'

// https://vite.dev/config/
export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, '.', '');
  
  return {
    plugins: [
      react(),
      tailwindcss()
    ],
    define: {
      'process.env.GEMINI_API_KEY': JSON.stringify(env.GEMINI_API_KEY),
      'process.env.USER_EMAIL': JSON.stringify(env.USER_EMAIL || 'user@example.com'),
    },
    server: {
      headers: {
        'Cross-Origin-Opener-Policy': 'same-origin',
        'Cross-Origin-Embedder-Policy': 'require-corp',
      },
    },
    optimizeDeps: {
      exclude: ['@ffmpeg/ffmpeg', '@ffmpeg/util'],
    },
  }
})
