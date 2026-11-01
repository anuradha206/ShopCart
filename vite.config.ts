import tailwindcss from '@tailwindcss/vite';
import react from '@vitejs/plugin-react';
import path from 'path';
import { defineConfig, Plugin } from 'vite';
import { spawn, ChildProcess } from 'child_process';
import http from 'http';

function pythonBackendPlugin(): Plugin {
  let pyProc: ChildProcess | null = null;
  return {
    name: 'python-backend',
    configureServer(server) {
      const checkAndStart = () => {
        const req = http.get('http://127.0.0.1:8001/api/health', () => {
          // Already running
        });
        req.on('error', () => {
          const script = path.resolve(import.meta.dirname, 'backend/run_server.py');
          const python = process.env.PYTHON || (process.platform === 'win32' ? 'python' : 'python3');
          pyProc = spawn(python, [script], {
            cwd: path.resolve(import.meta.dirname, 'backend'),
            stdio: 'inherit',
          });
          pyProc.on('error', (err) => {
            console.error('[Vite] Error spawning python backend:', err);
          });
        });
      };

      checkAndStart();

      server.httpServer?.on('close', () => {
        if (pyProc) {
          try {
            pyProc.kill();
          } catch (e) {}
        }
      });
    },
  };
}

export default defineConfig(() => {
  return {
    plugins: [react(), tailwindcss(), pythonBackendPlugin()],
    resolve: {
      alias: {
        '@': path.resolve(import.meta.dirname, '.'),
      },
    },
    server: {
      port: 3000,
      host: '0.0.0.0',
      proxy: {
        '/api': {
          target: 'http://127.0.0.1:8001',
          changeOrigin: true,
        },
        '/docs': {
          target: 'http://127.0.0.1:8001',
          changeOrigin: true,
        },
        '/openapi.json': {
          target: 'http://127.0.0.1:8001',
          changeOrigin: true,
        },
        '/redoc': {
          target: 'http://127.0.0.1:8001',
          changeOrigin: true,
        },
      },
      hmr: process.env.DISABLE_HMR !== 'true',
      watch: process.env.DISABLE_HMR === 'true' ? null : {},
    },
  };
});
