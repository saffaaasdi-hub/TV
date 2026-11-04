import express from 'express';
import { createServer as createViteServer } from 'vite';
import path from 'path';
import { fileURLToPath } from 'url';
import os from 'os';
import { Readable } from 'node:stream';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

async function startServer() {
  const app = express();
  const PORT = Number(process.env.PORT) || 3000;

  // Global CORS and headers for Local Network HTTP access
  app.use((req, res, next) => {
    res.header('Access-Control-Allow-Origin', '*');
    res.header('Access-Control-Allow-Methods', 'GET, POST, OPTIONS, HEAD');
    res.header('Access-Control-Allow-Headers', 'Content-Type, Range, Authorization');
    res.header('Access-Control-Expose-Headers', 'Content-Length, Content-Range');
    if (req.method === 'OPTIONS') {
      return res.sendStatus(200);
    }
    next();
  });

  // Local Network Information Endpoint
  app.get('/api/network-info', (_req, res) => {
    const interfaces = os.networkInterfaces();
    const addresses: { interface: string; ip: string }[] = [];

    for (const name of Object.keys(interfaces)) {
      for (const iface of interfaces[name] || []) {
        if (iface.family === 'IPv4' && !iface.internal) {
          addresses.push({ interface: name, ip: iface.address });
        }
      }
    }

    // Prioritize 192.168.99.x or 192.168.x.x LAN addresses
    const lan192 = addresses.find((a) => a.ip.startsWith('192.168.99.') || a.ip.startsWith('192.168.'));
    const primaryIp = lan192 ? lan192.ip : '192.168.99.10';

    if (!addresses.some((a) => a.ip === '192.168.99.10')) {
      addresses.unshift({ interface: 'سيرفر الشبكة المحلية', ip: '192.168.99.10' });
    }

    res.json({
      status: 'active',
      protocol: 'http',
      port: PORT,
      host: '0.0.0.0',
      ips: addresses,
      localHttpUrl: `http://${primaryIp}:${PORT}`,
      loopbackUrl: `http://localhost:${PORT}`,
      allUrls: addresses.map((a) => `http://${a.ip}:${PORT}`),
    });
  });

  // Local HTTP IPTV Stream Proxy
  // Allows playing HTTP m3u8 streams on local networks and overcomes Mixed Content & CORS restrictions
  app.get('/api/stream-proxy', async (req, res) => {
    const targetUrl = req.query.url as string;
    if (!targetUrl) {
      return res.status(400).send('Missing target stream url parameter');
    }

    try {
      const parsedUrl = new URL(targetUrl);
      const controller = new AbortController();
      const timeout = setTimeout(() => controller.abort(), 15000);

      const upstreamRes = await fetch(targetUrl, {
        signal: controller.signal,
        headers: {
          'User-Agent':
            'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/122.0.0.0 Safari/537.36',
          Accept: '*/*',
        },
      });
      clearTimeout(timeout);

      const contentType = upstreamRes.headers.get('content-type') || '';
      const isM3u8 =
        targetUrl.toLowerCase().includes('.m3u8') ||
        contentType.includes('mpegurl') ||
        contentType.includes('application/x-mpegURL');

      if (isM3u8) {
        const manifest = await upstreamRes.text();
        const baseUrl = targetUrl.substring(0, targetUrl.lastIndexOf('/') + 1);
        const originUrl = `${parsedUrl.protocol}//${parsedUrl.host}`;

        // Rewrite playlist lines so nested playlists and TS segments are routed through proxy
        const lines = manifest.split(/\r?\n/);
        const rewrittenLines = lines.map((line) => {
          const trimmed = line.trim();
          if (!trimmed) return line;

          if (trimmed.startsWith('#')) {
            // Handle URI attributes in tags like #EXT-X-KEY or #EXT-X-MAP
            if (trimmed.includes('URI="')) {
              return trimmed.replace(/URI="([^"]+)"/g, (_match, uri) => {
                const fullUri = uri.startsWith('http')
                  ? uri
                  : uri.startsWith('/')
                  ? `${originUrl}${uri}`
                  : `${baseUrl}${uri}`;
                return `URI="/api/stream-proxy?url=${encodeURIComponent(fullUri)}"`;
              });
            }
            return line;
          }

          // Video chunk segment or sub-playlist URL
          const fullSegmentUrl = trimmed.startsWith('http')
            ? trimmed
            : trimmed.startsWith('/')
            ? `${originUrl}${trimmed}`
            : `${baseUrl}${trimmed}`;

          return `/api/stream-proxy?url=${encodeURIComponent(fullSegmentUrl)}`;
        });

        res.setHeader('Content-Type', 'application/vnd.apple.mpegurl');
        res.setHeader('Access-Control-Allow-Origin', '*');
        res.setHeader('Cache-Control', 'no-cache, no-store, must-revalidate');
        return res.send(rewrittenLines.join('\n'));
      }

      // Binary stream (MPEG-TS chunk or video buffer)
      res.setHeader('Content-Type', contentType || 'video/MP2T');
      res.setHeader('Access-Control-Allow-Origin', '*');
      res.setHeader('Cache-Control', 'public, max-age=3600');

      if (upstreamRes.body) {
        // @ts-ignore
        const nodeStream = Readable.fromWeb(upstreamRes.body as any);
        nodeStream.pipe(res);
      } else {
        res.end();
      }
    } catch (err: any) {
      console.warn('Stream proxy warning:', err.message);
      res.status(502).json({
        error: 'تعذر الاتصال برابط البث عبر الشبكة المحلية',
        details: err.message,
        url: targetUrl,
      });
    }
  });

  // Mount Vite middleware in dev or static files in production
  if (process.env.NODE_ENV === 'production') {
    app.use(express.static(path.join(__dirname, 'dist')));
    app.get('*', (_req, res) => {
      res.sendFile(path.join(__dirname, 'dist', 'index.html'));
    });
  } else {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`> منصة صفاء الأسدي - مشغل القنوات الرياضية`);
    console.log(`> سيرفر الشبكة المحلية HTTP يعمل على: http://0.0.0.0:${PORT}`);
  });
}

startServer();
