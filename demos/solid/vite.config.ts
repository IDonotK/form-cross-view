import { defineConfig } from 'vite'
import solid from 'vite-plugin-solid'
import * as path from 'path';

export default defineConfig({
  plugins: [solid()],
  resolve: {
    alias: [
      {
        find: 'form-cross-view',
        // replacement: path.resolve(__dirname, '../../dist/index.js'),
        replacement: path.resolve(__dirname, '../../index'),
      }
    ]
  }
})
