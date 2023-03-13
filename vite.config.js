const _path = require('path')
import { defineConfig } from 'vite'

import react from '@vitejs/plugin-react'
import commonjs from '@rollup/plugin-commonjs';

export default  defineConfig({
  // 配置选项
  build: {
    minify: false,
    lib: {
      entry: [_path.resolve(__dirname, './src/webpack-plugin.ts'), _path.resolve(__dirname, './src/react/index.ts')], // 设置入口文件
      name: 'route-resource-preload', 
      formats: ['es','cjs'],
      fileName: (format, entryName) => {
        if(entryName.match(/plugin/)){
          return `${entryName}.js`
        }else{
          return `react/${entryName}.js`
        }
        
      }
    },
    // sourcemap: true, // 输出.map文件
    rollupOptions: {
      external: ['react'],
    }
  },
  plugins: [react(),commonjs()]
})