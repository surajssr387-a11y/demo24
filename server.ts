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

  // Security: Disable X-Powered-By header to prevent fingerprinting
  app.disable('x-powered-by');

  // Security: Core HTTP Security Headers (without blocking studio iframe)
  app.use((_req, res, next) => {
    res.setHeader('X-Content-Type-Options', 'nosniff');
    res.setHeader('Referrer-Policy', 'strict-origin-when-cross-origin');
    res.setHeader('X-XSS-Protection', '1; mode=block');
    next();
  });

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

  // Security: Sliding window in-memory rate limiter
  const rateLimitMap = new Map<string, { count: number; resetTime: number }>();
  const createRateLimiter = (maxRequests: number, windowMs: number) => {
    return (req: express.Request, res: express.Response, next: express.NextFunction) => {
      const ip = (req.headers['x-forwarded-for'] as string)?.split(',')[0]?.trim() || req.socket.remoteAddress || 'client';
      const now = Date.now();
      const record = rateLimitMap.get(ip);
      if (!record || now > record.resetTime) {
        rateLimitMap.set(ip, { count: 1, resetTime: now + windowMs });
        return next();
      }
      if (record.count >= maxRequests) {
        return res.status(429).json({ error: 'Too many requests, please slow down.' });
      }
      record.count++;
      next();
    };
  };

  const uploadLimiter = createRateLimiter(20, 60 * 1000); // 20 uploads per minute
  const bookingLimiter = createRateLimiter(30, 60 * 1000); // 30 booking attempts per minute

  // Media upload raw body parser with bounded limit (50MB max)
  app.use(
    '/api/upload-media',
    express.raw({
      type: ['image/*', 'video/*', 'application/octet-stream'],
      limit: '50mb',
    })
  );

  // Security: Standard JSON parser bounded to 2MB to protect against Memory DoS
  app.use(express.json({ limit: '2mb' }));

  const PUBLIC_DIR = path.join(__dirname, 'public');
  // Serve static public assets and uploads
  app.use(express.static(PUBLIC_DIR));
  app.use('/uploads', express.static(UPLOADS_DIR));

  // Security: Magic bytes validation helper
  const ALLOWED_EXTENSIONS = new Set(['.mp4', '.webm', '.mov', '.jpg', '.jpeg', '.png', '.webp']);
  const isValidMedia = (buffer: Buffer, ext: string): boolean => {
    if (buffer.length < 8) return false;
    // MP4 / MOV: 'ftyp' at bytes 4-8
    if (ext === '.mp4' || ext === '.mov') {
      return buffer.length >= 12 && buffer.toString('ascii', 4, 8) === 'ftyp';
    }
    // WebM / Matroska: 1A 45 DF A3
    if (ext === '.webm') {
      return buffer[0] === 0x1a && buffer[1] === 0x45 && buffer[2] === 0xdf && buffer[3] === 0xa3;
    }
    // JPEG: FF D8 FF
    if (ext === '.jpg' || ext === '.jpeg') {
      return buffer[0] === 0xff && buffer[1] === 0xd8 && buffer[2] === 0xff;
    }
    // PNG: 89 50 4E 47
    if (ext === '.png') {
      return buffer[0] === 0x89 && buffer[1] === 0x50 && buffer[2] === 0x4e && buffer[3] === 0x47;
    }
    // WebP: 'RIFF'....'WEBP'
    if (ext === '.webp') {
      return (
        buffer.length >= 12 &&
        buffer.toString('ascii', 0, 4) === 'RIFF' &&
        buffer.toString('ascii', 8, 12) === 'WEBP'
      );
    }
    return false;
  };

  // --- Upload Media Endpoint (Hardened against RCE, XSS, Path Traversal) ---
  app.post('/api/upload-media', uploadLimiter, (req, res) => {
    try {
      let buffer: Buffer | null = null;
      let rawName =
        (req.query.name as string) ||
        (req.headers['x-filename'] as string) ||
        'uploaded_video.mp4';
      try {
        rawName = decodeURIComponent(rawName);
      } catch {}

      if (Buffer.isBuffer(req.body) && req.body.length > 0) {
        buffer = req.body;
      } else if (req.body && req.body.dataUrl) {
        const matches = String(req.body.dataUrl).match(/^data:([A-Za-z-+\/]+);base64,(.+)$/);
        if (matches && matches.length === 3) {
          buffer = Buffer.from(matches[2], 'base64');
        }
        if (req.body.name) rawName = String(req.body.name);
      }

      if (!buffer || buffer.length === 0) {
        return res.status(400).json({ error: 'No media data received' });
      }

      // Security: Extension allowlist check
      const ext = path.extname(rawName).toLowerCase();
      if (!ALLOWED_EXTENSIONS.has(ext)) {
        return res.status(400).json({
          error: 'Unsupported file type. Only MP4, WebM, MOV, JPG, PNG, and WebP are allowed.',
        });
      }

      // Security: Content verification via Magic Bytes
      if (!isValidMedia(buffer, ext)) {
        return res.status(400).json({
          error: 'Invalid file signature. File content does not match expected media format.',
        });
      }

      // Security: Filename sanitization & path traversal mitigation
      const cleanBase = path
        .basename(rawName, ext)
        .replace(/[^a-zA-Z0-9_-]/g, '_')
        .slice(0, 60);
      const filename = `media_${Date.now()}_${cleanBase}${ext}`;
      const targetPath = path.join(UPLOADS_DIR, filename);

      // Verify resolved path resides strictly within UPLOADS_DIR
      if (!path.resolve(targetPath).startsWith(path.resolve(UPLOADS_DIR))) {
        return res.status(403).json({ error: 'Invalid file destination path' });
      }

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
      videoUrl: '/uploads/media_1791123532086_IMG_3618.mp4',
      xPosition: 50,
      yPosition: 21,
      zoom: 1,
      overlayDarkness: 0.35,
      brightness: 1,
      contrast: 1,
      topGapPx: 0,
    });
  });

  app.post('/api/hero-config', (req, res) => {
    try {
      const config = req.body?.config || req.body;
      if (!config || typeof config !== 'object') {
        return res.status(400).json({ error: 'Invalid config format' });
      }
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

  // --- Bookings Endpoint (Hardened with Input Sanitization & PII Privacy Masking) ---
  app.get('/api/bookings', (req, res) => {
    try {
      if (!fs.existsSync(BOOKINGS_FILE)) {
        return res.json([]);
      }
      const raw = fs.readFileSync(BOOKINGS_FILE, 'utf-8');
      const list: any[] = JSON.parse(raw);

      // Security: Check admin authorization to view unmasked student records
      const adminSecret = process.env.ADMIN_SECRET || 'ramy-admin-secure-key';
      const authHeader = req.headers['x-admin-key'] || req.query.key;
      const isAdmin = authHeader === adminSecret;

      if (isAdmin) {
        return res.json(list);
      }

      // Security: Mask Personally Identifiable Information (PII) for unauthenticated queries
      const sanitized = list.map((b) => ({
        id: b.id,
        program: b.program,
        plan: b.plan,
        batch: b.batch,
        receivedAt: b.receivedAt,
        isDemo: b.isDemo,
        // Masked PII
        name: b.name ? `${b.name.charAt(0)}***` : 'Anonymous',
        phone: b.phone ? `******${b.phone.slice(-4)}` : '******',
        paymentStatus: b.paymentStatus,
        utrNumber: b.utrNumber ? `****${b.utrNumber.slice(-4)}` : undefined,
      }));

      return res.json(sanitized);
    } catch {
      return res.json([]);
    }
  });

  app.post('/api/bookings', bookingLimiter, (req, res) => {
    try {
      const payload = req.body?.booking || req.body;
      if (!payload || typeof payload !== 'object') {
        return res.status(400).json({ error: 'Invalid booking data format' });
      }

      // Strict server-side input validation and sanitization
      const name = String(payload.name || '').trim().slice(0, 100);
      const cleanPhone = String(payload.phone || '').trim().replace(/\D/g, '').slice(0, 15);

      if (!name || cleanPhone.length < 10) {
        return res.status(400).json({ error: 'Valid student name and 10-digit mobile number are required' });
      }

      const safeBooking = {
        name,
        phone: cleanPhone,
        program: String(payload.program || 'Dance Class').slice(0, 80),
        level: payload.level ? String(payload.level).slice(0, 30) : undefined,
        plan: String(payload.plan || 'Monthly').slice(0, 80),
        batch: String(payload.batch || 'Standard').slice(0, 80),
        schedule: Array.isArray(payload.schedule)
          ? payload.schedule.slice(0, 6).map((s: unknown) => String(s).slice(0, 100))
          : [],
        fee: String(payload.fee || '').slice(0, 40),
        preferredDate: String(payload.preferredDate || '').slice(0, 50),
        paymentStatus: String(payload.paymentStatus || 'PENDING').slice(0, 60),
        utrNumber: String(payload.utrNumber || '').trim().replace(/[^a-zA-Z0-9]/g, '').slice(0, 50),
        isDemo: Boolean(payload.isDemo),
        receivedAt: new Date().toISOString(),
      };

      let bookings: any[] = [];
      if (fs.existsSync(BOOKINGS_FILE)) {
        try {
          bookings = JSON.parse(fs.readFileSync(BOOKINGS_FILE, 'utf-8'));
          if (!Array.isArray(bookings)) bookings = [];
        } catch {
          bookings = [];
        }
      }

      bookings.push(safeBooking);
      // Keep file bounded to prevent disk exhaustion
      if (bookings.length > 500) {
        bookings = bookings.slice(-500);
      }

      fs.writeFileSync(BOOKINGS_FILE, JSON.stringify(bookings, null, 2), 'utf-8');
      return res.json({ success: true, booking: safeBooking });
    } catch (e) {
      console.error('Error saving booking:', e);
      return res.status(500).json({ error: 'Failed to record booking securely' });
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
    console.log(`Server listening securely on port ${PORT}`);
  });
}

startServer();
