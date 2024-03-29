import { defineConfig } from 'vite'
import solid from 'vite-plugin-solid'
import * as path from 'path';

const isDev = true;

const alias = [];

if (isDev) {
  alias.push({
    find: 'form-cross-view-core',
    replacement: path.resolve(__dirname, '../../packages/form-cross-view-core/index'),
  });
}

export default defineConfig({
  plugins: [solid()],
  resolve: {
    alias
  }
})
