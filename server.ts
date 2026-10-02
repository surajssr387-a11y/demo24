import express from 'express';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

async function startServer() {
  const app = express();
  const PORT = Number(process.env.PORT) || 3000;
  const isProd = process.env.NODE_ENV === 'production';

  const DATA_DIR = path.join(__dirname, 'data');
  const HERO_CONFIG_FILE = path.join(DATA_DIR, 'hero-video-config.json');
  const ACHIEVEMENTS_FILE = path.join(DATA_DIR, 'achievements-config.json');
  const CATEGORIES_CONFIG_FILE = path.join(DATA_DIR, 'categories-config.json');
  const CHOREOGRAPHY_PERFORMANCES_FILE = path.join(DATA_DIR, 'choreography-performances.json');
  const BOOKINGS_FILE = path.join(DATA_DIR, 'bookings.json');

  const UPLOADS_DIR = path.join(__dirname, 'public', 'uploads');
  if (!fs.existsSync(UPLOADS_DIR)) {
    fs.mkdirSync(UPLOADS_DIR, { recursive: true });
  }

  // Raw body parser for binary media upload
  app.use(
    '/api/upload-media',
    express.raw({
      type: ['image/*', 'video/*', 'application/octet-stream', '*/*'],
      limit: '250mb',
    })
  );

  app.use(express.json({ limit: '100mb' }));

  const PUBLIC_DIR = path.join(__dirname, 'public');
  // Serve static public assets and uploads
  app.use(express.static(PUBLIC_DIR));
  app.use('/uploads', express.static(UPLOADS_DIR));

  // --- Upload Media Endpoint ---
  app.post('/api/upload-media', (req, res) => {
    try {
      let buffer: Buffer | null = null;
      let originalName =
        (req.query.name as string) ||
        (req.headers['x-filename'] as string) ||
        'uploaded_video.mp4';
      try {
        originalName = decodeURIComponent(originalName);
      } catch {}

      if (Buffer.isBuffer(req.body) && req.body.length > 0) {
        buffer = req.body;
      } else if (req.body && req.body.dataUrl) {
        const matches = req.body.dataUrl.match(/^data:([A-Za-z-+\/]+);base64,(.+)$/);
        if (matches && matches.length === 3) {
          buffer = Buffer.from(matches[2], 'base64');
        }
        if (req.body.name) originalName = req.body.name;
      }

      if (!buffer || buffer.length === 0) {
        return res.status(400).json({ error: 'No media data received' });
      }

      const safeExt = path.extname(originalName) || '.mp4';
      const cleanBase = path.basename(originalName, safeExt).replace(/[^a-zA-Z0-9_-]/g, '_');
      const filename = `media_${Date.now()}_${cleanBase}${safeExt}`;
      const targetPath = path.join(UPLOADS_DIR, filename);

      fs.writeFileSync(targetPath, buffer);

      const publicUrl = `/uploads/${filename}`;
      return res.json({
        success: true,
        url: publicUrl,
        filename,
        size: buffer.length,
      });
    } catch (err) {
      console.error('Error in /api/upload-media:', err);
      return res.status(500).json({ error: 'Server error saving uploaded media' });
    }
  });

  // --- Hero Video Config ---
  app.get('/api/hero-config', (_req, res) => {
    try {
      if (fs.existsSync(HERO_CONFIG_FILE)) {
        const raw = fs.readFileSync(HERO_CONFIG_FILE, 'utf-8');
        return res.json(JSON.parse(raw));
      }
    } catch (e) {
      console.error('Error reading hero config:', e);
    }
    return res.json({
      videoUrl: '/hero-uploaded.mp4',
      xPosition: 50,
      yPosition: 16,
      zoom: 1,
      overlayDarkness: 0.35,
      brightness: 0.95,
      contrast: 1.04,
      topGapPx: 0,
    });
  });

  app.post('/api/hero-config', (req, res) => {
    try {
      const config = req.body?.config || req.body;
      fs.writeFileSync(HERO_CONFIG_FILE, JSON.stringify(config, null, 2), 'utf-8');
      return res.json({ success: true, config });
    } catch (e) {
      return res.status(500).json({ error: 'Failed to save hero config' });
    }
  });

  // --- Choreography Performances ---
  app.get('/api/choreography-performances', (_req, res) => {
    try {
      if (fs.existsSync(CHOREOGRAPHY_PERFORMANCES_FILE)) {
        const raw = fs.readFileSync(CHOREOGRAPHY_PERFORMANCES_FILE, 'utf-8');
        return res.json(JSON.parse(raw));
      }
    } catch (e) {
      console.error('Error reading choreo performances:', e);
    }
    return res.json([]);
  });

  app.post('/api/choreography-performances', (req, res) => {
    try {
      const list = req.body?.performances || req.body;
      if (Array.isArray(list)) {
        fs.writeFileSync(CHOREOGRAPHY_PERFORMANCES_FILE, JSON.stringify(list, null, 2), 'utf-8');
        return res.json({ success: true, count: list.length });
      }
      return res.status(400).json({ error: 'Expected an array of performances' });
    } catch (e) {
      return res.status(500).json({ error: 'Failed to save performances' });
    }
  });

  // --- Achievements ---
  app.get('/api/achievements', (_req, res) => {
    try {
      if (fs.existsSync(ACHIEVEMENTS_FILE)) {
        const raw = fs.readFileSync(ACHIEVEMENTS_FILE, 'utf-8');
        return res.json(JSON.parse(raw));
      }
    } catch (e) {
      console.error('Error reading achievements:', e);
    }
    return res.json([]);
  });

  app.post('/api/achievements', (req, res) => {
    try {
      const list = req.body?.achievements || req.body;
      if (Array.isArray(list)) {
        fs.writeFileSync(ACHIEVEMENTS_FILE, JSON.stringify(list, null, 2), 'utf-8');
        return res.json({ success: true, count: list.length });
      }
      return res.status(400).json({ error: 'Expected an array of achievements' });
    } catch (e) {
      return res.status(500).json({ error: 'Failed to save achievements' });
    }
  });

  // --- Categories ---
  app.get('/api/categories', (_req, res) => {
    try {
      if (fs.existsSync(CATEGORIES_CONFIG_FILE)) {
        const raw = fs.readFileSync(CATEGORIES_CONFIG_FILE, 'utf-8');
        return res.json(JSON.parse(raw));
      }
    } catch (e) {
      console.error('Error reading categories:', e);
    }
    return res.json([]);
  });

  app.post('/api/categories', (req, res) => {
    try {
      const list = req.body?.categories || req.body;
      if (Array.isArray(list)) {
        fs.writeFileSync(CATEGORIES_CONFIG_FILE, JSON.stringify(list, null, 2), 'utf-8');
        return res.json({ success: true, count: list.length });
      }
      return res.status(400).json({ error: 'Expected an array of categories' });
    } catch (e) {
      return res.status(500).json({ error: 'Failed to save categories' });
    }
  });

  // --- Bookings ---
  app.get('/api/bookings', (_req, res) => {
    try {
      if (fs.existsSync(BOOKINGS_FILE)) {
        const raw = fs.readFileSync(BOOKINGS_FILE, 'utf-8');
        return res.json(JSON.parse(raw));
      }
    } catch {
      // Return empty
    }
    return res.json([]);
  });

  app.post('/api/bookings', (req, res) => {
    try {
      const newBooking = req.body;
      let bookings: any[] = [];
      if (fs.existsSync(BOOKINGS_FILE)) {
        try {
          bookings = JSON.parse(fs.readFileSync(BOOKINGS_FILE, 'utf-8'));
        } catch {}
      }
      bookings.push({ ...newBooking, receivedAt: new Date().toISOString() });
      fs.writeFileSync(BOOKINGS_FILE, JSON.stringify(bookings, null, 2), 'utf-8');
      return res.json({ success: true, booking: newBooking });
    } catch (e) {
      return res.status(500).json({ error: 'Failed to save booking' });
    }
  });

  // --- Health Check ---
  app.get('/api/health', (_req, res) => {
    res.json({ status: 'ok', timestamp: new Date().toISOString() });
  });

  // --- Vite Dev or Production Static Serving ---
  if (!isProd) {
    const { createServer: createViteServer } = await import('vite');
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(__dirname, 'dist');
    app.use(express.static(distPath));
    app.get('*', (_req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`Server listening on port ${PORT}`);
  });
}

startServer();
