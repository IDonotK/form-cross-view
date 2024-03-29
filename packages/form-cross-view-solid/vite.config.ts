import { defineConfig } from 'vite';
import solid from 'vite-plugin-solid';
import * as path from 'path';

export default defineConfig({
  build: {
    target: "esnext",
    lib: {
      entry: path.resolve(__dirname, './index.tsx'),
      formats: ['es'],
      fileName: 'index',
    },
    rollupOptions: {
      external: ['solid-js'],
    },
    minify: true,
  },
  plugins: [solid()],
})
