import { defineConfig } from 'vite';
import libCss from 'vite-plugin-libcss';
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
    cssCodeSplit: true,
  },
  plugins: [
    libCss()
  ],
})
