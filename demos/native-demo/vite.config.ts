import { defineConfig, Alias, ConfigEnv } from 'vite';
import * as path from 'path';

export default defineConfig((env: ConfigEnv) => {
  const { mode } = env;

  const alias: Alias[] = [];
  if (mode === 'dev') {
    const pkgsHmr = [
      'core',
      'native-view',
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
    resolve: {
      alias
    }
  }
})
