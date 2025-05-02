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
        manualChunks: (id) => {
          // 根据模块ID动态确定分块
          if (id.includes('node_modules')) {
            if (id.includes('echarts')) {
              return 'echarts';
            }
            if (id.includes('element-plus') || id.includes('@element-plus')) {
              return 'element-plus-all'; // 将Element Plus和图标放在同一块中
            }
            if (id.includes('vue') || id.includes('pinia')) {
              return 'vue-vendor';
            }
            // 其他第三方库归入vendor
            return 'vendor';
          }
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
