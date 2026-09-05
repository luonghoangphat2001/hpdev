import { defineConfig, loadEnv } from 'vite';
import vue from '@vitejs/plugin-vue';
import path from 'path';

export default defineConfig(({ command, mode }) => {
  const env = loadEnv(mode, process.cwd(), '');

  const serverConfig = {
    port: 5173,
  };

  if (command === 'serve') {
    let proxyTarget = '';
    try {
      const raw = env.VITE_DEV_API_URL;
      if (!raw || typeof raw !== 'string' || raw.trim().length === 0) {
        throw new Error('VITE_DEV_API_URL is required in environment');
      }
      proxyTarget = raw.trim();
    } catch (error) {
      throw new Error(`[ViteConfig] Failed to configure dev proxy: ${error.message}`);
    }

    serverConfig.proxy = {
      '/api': {
        target: proxyTarget,
        changeOrigin: true,
      },
    };
  }

  return {
    plugins: [vue()],
    resolve: {
      alias: {
        '@': path.resolve(__dirname, './src'),
        '@api': path.resolve(__dirname, './src/api'),
        '@stores': path.resolve(__dirname, './src/stores'),
        '@components': path.resolve(__dirname, './src/components'),
        '@composables': path.resolve(__dirname, './src/composables'),
        '@views': path.resolve(__dirname, './src/views'),
      },
    },
    server: serverConfig,
    build: {
      outDir: 'dist',
      emptyOutDir: true,
    },
  };
});
