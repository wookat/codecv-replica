import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'

export default defineConfig({
  root: 'web',
  publicDir: '../../public',   // 直引仓库根 public/（皮肤 css/字体/seeds），不拷贝防漂移
  plugins: [react(), tailwindcss()],
  build: { outDir: '../dist', emptyOutDir: true },
  server: { proxy: { '/api': { target: 'http://localhost:8788', changeOrigin: true } } },
})
