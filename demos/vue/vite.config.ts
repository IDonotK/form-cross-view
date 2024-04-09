import { defineConfig, Alias, ConfigEnv } from 'vite';
import vue from '@vitejs/plugin-vue';
import * as path from 'path';

export default defineConfig((env: ConfigEnv) => {
  const { mode } = env;

  const alias: Alias[] = [];
  if (mode === 'dev') {
    const pkgsHmr = [
      '/@form-cross-view/core/',
      '/@form-cross-view/vue-view/',
    ];
    pkgsHmr.forEach((p: string) => {
      alias.push(
        {
          find: p,
          replacement: path.resolve(__dirname, `../../packages/${p}/index`),
        },
      );
    });
  }

  return {
    plugins: [vue()],
    resolve: {
      alias
    }
  }
})