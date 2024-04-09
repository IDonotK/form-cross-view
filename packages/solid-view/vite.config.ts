import { defineConfig } from 'vite';
import solid from 'vite-plugin-solid';
import libCss from 'vite-plugin-libcss';
import * as path from 'path';

export default defineConfig({
  build: {
    target: "esnext",
    lib: {
      entry: path.resolve(__dirname, './index.tsx'),
      formats: ['es'],
      fileName: 'index'
    },
    rollupOptions: {
      external: ['solid-js'],
    },
    minify: true,
    cssCodeSplit: true,
  },
  plugins: [
    solid(),
    libCss()
  ],
})
