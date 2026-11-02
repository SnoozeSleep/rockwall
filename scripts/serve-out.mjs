/* Serves the static export (out/) with Vercel-style clean URLs for the local checks: node scripts/serve-out.mjs [port=4178] */
import fs from 'node:fs'; import http from 'node:http'; import path from 'node:path'; import { fileURLToPath } from 'node:url';
const OUT = path.join(path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..'), 'out');
const PORT = Number(process.argv[2]) || 4178;
const MIME = { '.html': 'text/html; charset=utf-8', '.js': 'text/javascript', '.css': 'text/css', '.json': 'application/json', '.png': 'image/png', '.jpg': 'image/jpeg', '.jpeg': 'image/jpeg', '.webp': 'image/webp', '.svg': 'image/svg+xml', '.woff2': 'font/woff2', '.woff': 'font/woff', '.txt': 'text/plain', '.xml': 'application/xml', '.ico': 'image/x-icon' };
http.createServer((req, res) => {
  const url = decodeURIComponent(new URL(req.url, 'http://x').pathname);
  const file = [url, `${url}.html`, path.posix.join(url, 'index.html')].map((p) => path.join(OUT, p)).find((p) => fs.existsSync(p) && fs.statSync(p).isFile()) || path.join(OUT, '404.html');
  res.writeHead(file.endsWith('404.html') ? 404 : 200, { 'content-type': MIME[path.extname(file)] || 'application/octet-stream' });
  fs.createReadStream(file).pipe(res);
}).listen(PORT, '127.0.0.1', () => console.log(`serving ${OUT} at http://127.0.0.1:${PORT}`));
