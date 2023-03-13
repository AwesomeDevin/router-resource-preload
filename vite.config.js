const _path = require('path')
import { defineConfig } from 'vite'

import react from '@vitejs/plugin-react'
import commonjs from '@rollup/plugin-commonjs';

export default  defineConfig({
  // 配置选项
  build: {
    lib: {
      entry: [_path.resolve(__dirname, './src/index.ts')], // 设置入口文件
      name: 'route-resource-preload', 
      formats: ['es','cjs']
    },
    // sourcemap: true, // 输出.map文件
    rollupOptions: {
      external: ['react','react-router-dom'],
    }
  },
  plugins: [commonjs()]
})