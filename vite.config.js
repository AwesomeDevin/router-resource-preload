const _path = require('path')
import { defineConfig } from 'vite'

import react from '@vitejs/plugin-react'
import commonjs from '@rollup/plugin-commonjs';

export default  defineConfig({
  // 配置选项
  build: {
    // minify: false,
    lib: {
      entry: [_path.resolve(__dirname, './src/index.ts'),_path.resolve(__dirname, './src/webpack-plugin.ts'), _path.resolve(__dirname, './src/react/index.react.ts')], // 设置入口文件

      name: 'route-resource-preload', 
      formats: ['es','cjs'],
      fileName: (format, entryName) => {
        if(entryName.match(/plugin/)){
          return `${entryName}.${format}.js`
        }else if(entryName.match(/react/)){
          return `react/index.${format}.js`
        }else{
          return `${entryName}.${format}.js`
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