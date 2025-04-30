import { fileURLToPath, URL } from 'node:url'

import { defineConfig } from 'vite'
import vue from '@vitejs/plugin-vue'
import vueDevTools from 'vite-plugin-vue-devtools'

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [
    vue(),
    vueDevTools(),
  ],
  resolve: {
    alias: {
      '@': fileURLToPath(new URL('./src', import.meta.url))
    }
  },
  build: {
    chunkSizeWarningLimit: 800, // 提高警告阈值到800kb
    rollupOptions: {
      output: {
        manualChunks: {
          // 将echarts库单独打包
          echarts: ['echarts'],
          // 将element-plus单独打包
          'element-plus': ['element-plus'],
          // 将所有图标分组
          'element-icons': ['@element-plus/icons-vue'],
          // 核心依赖
          'vue-vendor': ['vue', 'vue-router', 'pinia'],
        }
      }
    }
  },
  server: {
    port: 4100,
    proxy: {
      // 代理所有/api开头的请求到后端服务
      '/api': {
        target: 'http://localhost:8080', // 修改为您的实际后端地址
        changeOrigin: true,
      }
    }
  },
})
