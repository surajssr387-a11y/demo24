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

  if (!fs.existsSync(DATA_DIR)) {
    fs.mkdirSync(DATA_DIR, { recursive: true });
  }

  app.use(express.json({ limit: '50mb' }));

  const PUBLIC_DIR = path.join(__dirname, 'public');
  // Serve static public assets
  app.use(express.static(PUBLIC_DIR));

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
      topGapPx: 48,
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
