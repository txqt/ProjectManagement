import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react-swc'
import svgr from 'vite-plugin-svgr'

// https://vite.dev/config/
export default defineConfig({
  plugins: [
    svgr(),
    react()
  ],
  resolve: {
    alias: [
      { find: '~', replacement: '/src' }
    ]
  },
  preview: {
    port: 5173,
    strictPort: true
  }
})
