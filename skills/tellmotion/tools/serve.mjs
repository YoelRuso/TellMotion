#!/usr/bin/env node
// Tiny static file server for previewing the gallery/site. Usage: node tools/serve.mjs <dir> [port]
import {createServer} from 'node:http';
import {readFile} from 'node:fs/promises';
import {extname, join, normalize} from 'node:path';

const root = process.argv[2] || '.';
const port = Number(process.argv[3] || 9100);
const types = {'.html': 'text/html', '.svg': 'image/svg+xml', '.json': 'application/json', '.js': 'text/javascript', '.css': 'text/css', '.png': 'image/png', '.mp4': 'video/mp4', '.webm': 'video/webm', '.gif': 'image/gif'};

createServer(async (req, res) => {
  const p = normalize(decodeURIComponent(new URL(req.url, 'http://x').pathname)).replace(/^(\.\.[/\\])+/, '');
  const file = join(root, p.endsWith('/') ? p + 'index.html' : p);
  try {
    const data = await readFile(file);
    res.writeHead(200, {'content-type': types[extname(file)] || 'application/octet-stream'});
    res.end(data);
  } catch {
    res.writeHead(404);
    res.end('Not found');
  }
}).listen(port, () => console.log(`Serving ${root} on http://localhost:${port}`));
