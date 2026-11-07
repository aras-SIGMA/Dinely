import { defineConfig, type Plugin } from 'vite';
import { svelte } from '@sveltejs/vite-plugin-svelte';
import tailwindcss from '@tailwindcss/vite';
import { fileURLToPath, URL } from 'node:url';
import fs from 'node:fs';
import path from 'node:path';

function apiDevPlugin(): Plugin {
  return {
    name: 'api-dev-server',
    configureServer(server) {
      server.middlewares.use(async (req, res, next) => {
        if (!req.url || !req.url.startsWith('/api/')) {
          return next();
        }

        const url = new URL(req.url, 'http://localhost');
        const relPath = url.pathname.slice(1); // e.g. api/tenant/menu
        const filePath = path.resolve(process.cwd(), `${relPath}.ts`);

        if (fs.existsSync(filePath)) {
          try {
            const mod = await server.ssrLoadModule(`./${relPath}.ts`);
            if (typeof mod.default === 'function') {
              await mod.default(req, res);
              return;
            }
          } catch (err: any) {
            console.error(`[API Dev Error] ${url.pathname}:`, err);
            res.statusCode = 500;
            res.setHeader('Content-Type', 'application/json');
            res.end(JSON.stringify({ error: err?.message || 'Internal server error in dev API' }));
            return;
          }
        }

        next();
      });
    }
  };
}

export default defineConfig({
  plugins: [svelte(), tailwindcss(), apiDevPlugin()],
  resolve: {
    alias: {
      '@': fileURLToPath(new URL('./src', import.meta.url))
    }
  }
});
