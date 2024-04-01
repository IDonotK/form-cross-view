import { defineConfig } from 'vite';
import * as path from 'path';

export default defineConfig({
  build: {
    target: "esnext",
    lib: {
      entry: path.resolve(__dirname, './index.ts'),
      formats: ['es'],
      fileName: 'index',
    },
    minify: true,
  }
})
