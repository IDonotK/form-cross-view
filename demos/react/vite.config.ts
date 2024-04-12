import { defineConfig, Alias, ConfigEnv } from 'vite';
import react from '@vitejs/plugin-react';
import * as path from 'path';

export default defineConfig((env: ConfigEnv) => {
  const { mode } = env;

  const alias: Alias[] = [];
  if (mode === 'dev') {
    const pkgsHmr = [
      'core',
      'react-view',
    ];
    pkgsHmr.forEach((p: string) => {
      alias.push(
        {
          find: `@form-cross-view/${p}`,
          replacement: path.resolve(__dirname, `../../packages/${p}/index`),
        },
      );
    });
  }

  return {
    plugins: [react()],
    resolve: {
      alias
    }
  }
})