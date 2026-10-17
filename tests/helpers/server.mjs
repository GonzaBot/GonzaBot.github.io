// Servidor estático que imita GitHub Pages (404.html para rutas inexistentes).
import http from 'node:http'; import fs from 'node:fs'; import path from 'node:path';
import { SITE } from './browser-data.mjs';
const TYPES = { '.html': 'text/html; charset=utf-8', '.css': 'text/css', '.js': 'text/javascript', '.woff2': 'font/woff2', '.svg': 'image/svg+xml', '.jpg': 'image/jpeg', '.png': 'image/png', '.json': 'application/json', '.txt': 'text/plain; charset=utf-8', '.xml': 'application/xml', '.webmanifest': 'application/manifest+json' };
export function startServer(port = 0) {
  const root = path.resolve(SITE);
  const srv = http.createServer((req, res) => {
    let u;
    try { u = decodeURIComponent(new URL(req.url, 'http://x').pathname); } catch { res.writeHead(400); return res.end(); }
    if (u.endsWith('/')) u += 'index.html';
    const f = path.resolve(path.join(root, u));
    if (!f.startsWith(root + path.sep)) { res.writeHead(403); return res.end(); }
    fs.readFile(f, (e, d) => {
      if (e) { res.writeHead(404, { 'content-type': TYPES['.html'] }); return res.end(fs.readFileSync(path.join(root, '404.html'))); }
      res.writeHead(200, { 'content-type': TYPES[path.extname(f)] || 'application/octet-stream' }); res.end(d);
    });
  });
  return new Promise(r => srv.listen(port, '127.0.0.1', () => r({ srv, url: `http://127.0.0.1:${srv.address().port}` })));
}
