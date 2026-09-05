import { defineConfig, loadEnv } from 'vite';
import vue from '@vitejs/plugin-vue';
import path from 'path';

export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd(), '');
  let proxyTarget;
  try {
    proxyTarget = env.VITE_DEV_API_URL;
    if (!proxyTarget) {
      throw new Error('VITE_DEV_API_URL is required in environment');
    }
  } catch (error) {
    throw new Error(`[ViteConfig] ${error.message}`);
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
    server: {
      port: 5173,
      proxy: {
        '/api': {
          target: proxyTarget,
          changeOrigin: true,
        },
      },
    },
    build: {
      outDir: 'dist',
      emptyOutDir: true,
    },
  };
});
