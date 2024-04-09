import { defineConfig } from 'vite';
import vue from '@vitejs/plugin-vue';
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
    rollupOptions: {
      external: ['vue'],
    },
    minify: true,
    cssCodeSplit: true,
  },
  plugins: [
    vue(),
    libCss()
  ],
})
