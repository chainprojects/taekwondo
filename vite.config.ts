import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

export default defineConfig({
  plugins: [react()],
  base: "/my-repo/",
  server: {
    host: true,
    port: 5173,
    hmr: {
      timeout: 5000,
      overlay: true
    },
    watch: {
      usePolling: true,
      interval: 1000
    }
  },
  optimizeDeps: {
    include: ['web3']
  },
  build: {
    commonjsOptions: {
      transformMixedEsModules: true
    }
  }
})