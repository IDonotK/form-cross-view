import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import libCss from 'vite-plugin-libcss';
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
      external: ['react', 'react-dom'],
    },
    minify: true,
    cssCodeSplit: true,
  },
  plugins: [
    react(),
    libCss()
  ],
})
