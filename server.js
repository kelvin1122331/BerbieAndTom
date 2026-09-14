/**
 * Server statis minim dependensi untuk Berbie & Tom.
 * Tidak butuh paket apa pun: cukup `node server.js` lalu buka http://localhost:8080
 */
import { createServer } from 'node:http';
import { createReadStream, promises as fs } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT = path.dirname(fileURLToPath(import.meta.url));
const PORT = Number(process.env.PORT || 8080);
const HOST = process.env.HOST || '0.0.0.0';

const MIME = {
  '.html': 'text/html; charset=utf-8',
  '.js': 'text/javascript; charset=utf-8',
  '.mjs': 'text/javascript; charset=utf-8',
  '.css': 'text/css; charset=utf-8',
  '.json': 'application/json; charset=utf-8',
  '.svg': 'image/svg+xml',
  '.png': 'image/png',
  '.jpg': 'image/jpeg',
  '.jpeg': 'image/jpeg',
  '.webp': 'image/webp',
  '.ico': 'image/x-icon',
  '.woff2': 'font/woff2',
  '.txt': 'text/plain; charset=utf-8',
};

/** Path aman: tidak boleh keluar dari folder proyek. */
function resolveSafe(urlPath) {
  const clean = decodeURIComponent(urlPath.split('?')[0].split('#')[0]);
  const rel = clean === '/' || clean === '' ? 'index.html' : clean.replace(/^\/+/, '');
  const full = path.resolve(ROOT, rel);
  return full === ROOT || full.startsWith(ROOT + path.sep) ? full : null;
}

const server = createServer(async (req, res) => {
  try {
    const target = resolveSafe(req.url || '/');
    if (!target) {
      res.writeHead(403, { 'content-type': 'text/plain; charset=utf-8' });
      res.end('403 - akses ditolak');
      return;
    }

    let filePath = target;
    const stat = await fs.stat(filePath).catch(() => null);
    if (stat?.isDirectory()) {
      filePath = path.join(filePath, 'index.html');
    }
    if (!(await fs.stat(filePath).catch(() => null))) {
      res.writeHead(404, { 'content-type': 'text/plain; charset=utf-8' });
      res.end('404 - file tidak ditemukan');
      return;
    }

    const ext = path.extname(filePath).toLowerCase();
    res.writeHead(200, {
      'content-type': MIME[ext] || 'application/octet-stream',
      'cache-control': 'no-cache',
      'access-control-allow-origin': '*',
    });
    createReadStream(filePath).pipe(res);
  } catch (error) {
    res.writeHead(500, { 'content-type': 'text/plain; charset=utf-8' });
    res.end('500 - kesalahan server');
  }
});

server.listen(PORT, HOST, () => {
  console.log(`\n  Berbie & Tom aktif  →  http://localhost:${PORT}\n`);
});
