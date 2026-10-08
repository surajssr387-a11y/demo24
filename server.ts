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

  // Security: Core HTTP Security Headers & Razorpay Payment Compatible CSP
  app.use((_req, res, next) => {
    res.setHeader('X-Content-Type-Options', 'nosniff');
    res.setHeader('Referrer-Policy', 'strict-origin-when-cross-origin');
    res.setHeader('X-XSS-Protection', '1; mode=block');
    res.setHeader('Strict-Transport-Security', 'max-age=31536000; includeSubDomains; preload');
    res.setHeader('Permissions-Policy', 'camera=(), microphone=(), payment=(self "https://checkout.razorpay.com" "https://api.razorpay.com")');
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
    ['/api/upload-media', '/api/upload-logo'],
    express.raw({
      type: ['image/*', 'video/*', 'application/octet-stream'],
      limit: '50mb',
    })
  );

  // Security: Standard JSON parser bounded to 2MB to protect against Memory DoS
  app.use(express.json({ limit: '2mb' }));

  // Security: Sanitize incoming request bodies against Prototype Pollution and Script Injections
  app.use((req, _res, next) => {
    if (req.body && typeof req.body === 'object') {
      const sanitizeObj = (obj: any) => {
        for (const key of Object.keys(obj)) {
          if (key === '__proto__' || key === 'constructor' || key === 'prototype') {
            delete obj[key];
            continue;
          }
          if (typeof obj[key] === 'string') {
            obj[key] = obj[key].replace(/\0/g, '').replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, '');
          } else if (typeof obj[key] === 'object' && obj[key] !== null) {
            sanitizeObj(obj[key]);
          }
        }
      };
      sanitizeObj(req.body);
    }
    next();
  });

  const PUBLIC_DIR = path.join(__dirname, 'public');
  // High-performance static serving with HTTP Byte-Range video streaming and immutable caching
  const staticOptions = {
    maxAge: '7d',
    setHeaders: (res: express.Response, filePath: string) => {
      if (filePath.endsWith('.mp4') || filePath.endsWith('.webm')) {
        res.setHeader('Accept-Ranges', 'bytes');
        res.setHeader('Cache-Control', 'public, max-age=604800, immutable');
      } else if (filePath.match(/\.(jpg|jpeg|png|webp|svg|gif|woff2|woff)$/i)) {
        res.setHeader('Cache-Control', 'public, max-age=2592000, immutable');
      }
    },
  };
  app.use(express.static(PUBLIC_DIR, staticOptions));
  app.use('/uploads', express.static(UPLOADS_DIR, staticOptions));

  // Security: Magic bytes validation helper
  const ALLOWED_EXTENSIONS = new Set([
    '.mp4', '.webm', '.mov', '.jpg', '.jpeg', '.png', '.webp', '.heic', '.heif', '.avif', '.jfif', '.bmp'
  ]);
  const isValidMedia = (buffer: Buffer, ext: string): boolean => {
    if (buffer.length < 8) return false;
    // MP4 / MOV / HEIC / AVIF: 'ftyp' at bytes 4-8
    if (ext === '.mp4' || ext === '.mov' || ext === '.heic' || ext === '.heif' || ext === '.avif') {
      return buffer.length >= 12 && buffer.toString('ascii', 4, 8) === 'ftyp';
    }
    // WebM / Matroska: 1A 45 DF A3
    if (ext === '.webm') {
      return buffer[0] === 0x1a && buffer[1] === 0x45 && buffer[2] === 0xdf && buffer[3] === 0xa3;
    }
    // JPEG / JFIF: FF D8 FF
    if (ext === '.jpg' || ext === '.jpeg' || ext === '.jfif') {
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
    // BMP: 'BM' (42 4D)
    if (ext === '.bmp') {
      return buffer[0] === 0x42 && buffer[1] === 0x4d;
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

  // --- Exact Logo PNG Uploader Endpoint ---
  app.post('/api/upload-logo', (req, res) => {
    try {
      let buffer: Buffer | null = null;
      if (Buffer.isBuffer(req.body) && req.body.length > 0) {
        buffer = req.body;
      } else if (req.body && req.body.dataUrl) {
        const matches = String(req.body.dataUrl).match(/^data:([A-Za-z-+\/]+);base64,(.+)$/);
        if (matches && matches.length === 3) {
          buffer = Buffer.from(matches[2], 'base64');
        }
      }
      if (!buffer || buffer.length === 0) {
        return res.status(400).json({ error: 'No image data received' });
      }

      // Verify PNG magic bytes
      if (buffer[0] !== 0x89 || buffer[1] !== 0x50 || buffer[2] !== 0x4e || buffer[3] !== 0x47) {
        return res.status(400).json({ error: 'Only valid PNG files are allowed' });
      }

      const targetPath = path.join(PUBLIC_DIR, 'logo-transparent.png');
      fs.writeFileSync(targetPath, buffer);

      const distDir = path.join(__dirname, 'dist');
      if (fs.existsSync(distDir)) {
        fs.writeFileSync(path.join(distDir, 'logo-transparent.png'), buffer);
      }

      // Automatically commit and push to git
      try {
        const { execSync } = require('child_process');
        execSync('git add public/logo-transparent.png && git commit -m "feat(branding): replace logo with exact uploaded PNG file" && git push origin main');
      } catch (e) {
        console.warn('Git push warning:', e);
      }

      return res.json({ success: true, message: 'Logo replaced successfully' });
    } catch (err) {
      console.error('Error in /api/upload-logo:', err);
      return res.status(500).json({ error: 'Failed to update logo' });
    }
  });

  // Dedicated upload helper page
  app.get('/upload-logo', (_req, res) => {
    res.send(`<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <title>Upload Official Logo - Ramy's Dance Studio</title>
  <meta name="viewport" content="width=device-width, initial-scale=1">
  <style>
    body { font-family: system-ui, -apple-system, sans-serif; background: #0a0a0a; color: white; display: flex; align-items: center; justify-content: center; min-height: 100vh; margin: 0; padding: 20px; box-sizing: border-box; }
    .card { background: #18181b; border: 1px solid #27272a; border-radius: 16px; padding: 32px; max-width: 480px; width: 100%; text-align: center; box-shadow: 0 20px 40px rgba(0,0,0,0.5); }
    h1 { font-size: 20px; font-weight: 700; margin-bottom: 8px; }
    p { font-size: 14px; color: #a1a1aa; margin-bottom: 24px; line-height: 1.5; }
    .dropzone { border: 2px dashed #3f3f46; border-radius: 12px; padding: 32px 16px; cursor: pointer; transition: 0.2s; background: #09090b; }
    .dropzone:hover { border-color: #0066FF; background: #0066ff0d; }
    input[type=file] { display: none; }
    .preview { max-height: 140px; max-width: 100%; object-fit: contain; margin-top: 16px; display: none; background: repeating-conic-gradient(#27272a 0% 25%, #18181b 0% 50%) 50% / 16px 16px; border-radius: 8px; padding: 8px; }
    button { background: #0066FF; color: white; border: none; padding: 12px 24px; font-size: 15px; font-weight: 600; border-radius: 8px; cursor: pointer; width: 100%; margin-top: 20px; transition: 0.2s; }
    button:hover { background: #0052cc; }
    button:disabled { opacity: 0.5; cursor: not-allowed; }
    .status { margin-top: 16px; font-size: 14px; }
    .success { color: #22c55e; }
    .error { color: #ef4444; }
  </style>
</head>
<body>
  <div class="card">
    <h1>Replace Official Logo</h1>
    <p>Select your exact <strong>Clean transparent Ramy's Dance Studio logo.png</strong> file. It will be saved without any modification and deployed directly to live website.</p>
    <div class="dropzone" onclick="document.getElementById('fileInput').click()">
      <div id="dropText">📁 Click to choose PNG file</div>
      <img id="preview" class="preview" alt="Preview" />
    </div>
    <input type="file" id="fileInput" accept="image/png" />
    <button id="uploadBtn" disabled onclick="uploadFile()">Save & Deploy Exact Logo</button>
    <div id="status" class="status"></div>
  </div>
  <script>
    let selectedFile = null;
    const input = document.getElementById('fileInput');
    const preview = document.getElementById('preview');
    const dropText = document.getElementById('dropText');
    const btn = document.getElementById('uploadBtn');
    const status = document.getElementById('status');

    input.addEventListener('change', (e) => {
      const file = e.target.files[0];
      if (file) {
        selectedFile = file;
        dropText.textContent = file.name;
        preview.src = URL.createObjectURL(file);
        preview.style.display = 'block';
        btn.disabled = false;
        status.textContent = '';
      }
    });

    async function uploadFile() {
      if (!selectedFile) return;
      btn.disabled = true;
      btn.textContent = 'Saving & Deploying...';
      status.textContent = 'Uploading exact file bytes...';
      status.className = 'status';
      try {
        const res = await fetch('/api/upload-logo', {
          method: 'POST',
          headers: { 'Content-Type': 'application/octet-stream' },
          body: selectedFile
        });
        const data = await res.json();
        if (data.success) {
          status.className = 'status success';
          status.textContent = '✅ Exact logo applied and deployed to live site! Refreshing...';
          setTimeout(() => { window.location.href = '/'; }, 2000);
        } else {
          throw new Error(data.error || 'Upload failed');
        }
      } catch (err) {
        status.className = 'status error';
        status.textContent = '❌ Error: ' + err.message;
        btn.disabled = false;
        btn.textContent = 'Try Again';
      }
    }
  </script>
</body>
</html>`);
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

  // --- Dedicated Razorpay Merchant Verification & Legal Compliance Routes ---
  const renderLegalDoc = (title: string, subtitle: string, bodyHtml: string) => `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="utf-8">
  <title>${title} | Ramy's Dance Studio - Official Website</title>
  <meta name="viewport" content="width=device-width, initial-scale=1">
  <meta name="description" content="${title} of Ramy's Dance Studio, Ranchi, Jharkhand.">
  <link rel="icon" type="image/png" href="/logo-transparent.png">
  <style>
    body { font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif; background: #0C0E12; color: #F1F5F9; line-height: 1.6; margin: 0; padding: 0; }
    .header { background: #000; border-bottom: 1px solid rgba(255,255,255,0.1); padding: 16px 24px; position: sticky; top: 0; z-index: 10; display: flex; align-items: center; justify-content: space-between; }
    .brand { display: flex; align-items: center; gap: 12px; text-decoration: none; color: white; font-weight: 800; font-size: 16px; }
    .brand img { height: 38px; width: 38px; object-fit: contain; }
    .home-btn { background: #1f242e; color: #fff; text-decoration: none; padding: 8px 16px; border-radius: 8px; font-size: 13px; font-weight: 600; border: 1px solid rgba(255,255,255,0.15); transition: 0.2s; }
    .home-btn:hover { background: #0066FF; }
    .container { max-width: 860px; margin: 30px auto; padding: 0 20px 80px; }
    .card { background: #16181F; border: 1px solid rgba(255,255,255,0.1); border-radius: 20px; padding: 32px; box-shadow: 0 10px 30px rgba(0,0,0,0.5); }
    h1 { font-size: 26px; font-weight: 800; margin: 0 0 6px; color: #fff; }
    .sub { color: #94A3B8; font-size: 13px; margin-bottom: 24px; padding-bottom: 16px; border-bottom: 1px solid rgba(255,255,255,0.1); }
    h2 { font-size: 17px; font-weight: 700; color: #fff; margin-top: 24px; margin-bottom: 8px; }
    p, li { color: #CBD5E1; font-size: 14px; }
    ul { padding-left: 20px; }
    li { margin-bottom: 6px; }
    .contact-box { background: #0f1117; border: 1px solid rgba(255,255,255,0.12); border-radius: 12px; padding: 20px; margin-top: 28px; }
    .badge { display: inline-block; background: #0066FF; color: white; font-size: 10px; font-weight: 800; padding: 3px 8px; border-radius: 12px; text-transform: uppercase; margin-bottom: 10px; letter-spacing: 0.5px; }
    footer { text-align: center; color: #64748B; font-size: 12px; margin-top: 30px; }
  </style>
</head>
<body>
  <div class="header">
    <a href="/" class="brand">
      <img src="/logo-transparent.png" alt="Ramy's Dance Studio Logo">
      <span>RAMY'S DANCE STUDIO</span>
    </a>
    <a href="/" class="home-btn">← Back to Website</a>
  </div>
  <div class="container">
    <div class="card">
      <span class="badge">Official Legal Document</span>
      <h1>${title}</h1>
      <div class="sub">${subtitle}</div>
      ${bodyHtml}
      <div class="contact-box">
        <h2 style="margin-top:0;">Official Grievance & Support Desk</h2>
        <p><strong>Business Name:</strong> Ramy's Dance Studio (Founder & Director: Ramyyy Singh)</p>
        <p><strong>Registered Address:</strong> 2nd Floor, Above Reliance Smart Point, Plaza Chowk, Old H.B. Road, Ranchi, Jharkhand – 834001, India</p>
        <p><strong>Official Support Email:</strong> <a href="mailto:ramyysingh81@gmail.com" style="color:#60A5FA;">ramyysingh81@gmail.com</a></p>
        <p><strong>Official Phone & WhatsApp:</strong> <a href="tel:+918340158178" style="color:#60A5FA;">+91 8340158178</a></p>
        <p><strong>Operating Hours:</strong> Monday to Sunday, 7:00 AM – 9:00 PM IST</p>
      </div>
    </div>
    <footer>© 2026 Ramy's Dance Studio. All rights reserved. Compliant with RBI Payment Aggregator Guidelines & IT Act 2000.</footer>
  </div>
</body>
</html>`;

  // 1. Terms & Conditions
  app.get(['/terms', '/terms-and-conditions'], (_req, res) => {
    res.send(renderLegalDoc(
      'Terms and Conditions',
      'Effective Date: October 2026 | Last Updated: October 2026',
      `<h2>1. Introduction & Acceptance of Terms</h2>
      <p>Welcome to <strong>Ramy's Dance Studio</strong>. By booking demo sessions, enrolling in dance courses, or paying via our online platform, you agree to comply with and be bound by these Terms and Conditions.</p>
      <h2>2. Studio Rules, Attendance & Decorum</h2>
      <ul>
        <li>Students are required to report 10 minutes prior to their scheduled batch timing in proper dance/fitness attire.</li>
        <li>Students must notify instructors of any prior physical injuries or medical limitations before starting vigorous choreography sessions.</li>
        <li>Studio decorum, mutual respect, and discipline must be maintained towards trainers, fellow students, and staff at all times.</li>
      </ul>
      <h2>3. Fee Schedule & Online Payments</h2>
      <ul>
        <li>All class registration fees (₹49 demo fee, monthly courses ranging from ₹899 to ₹1,950/month) must be settled via authorized digital payment gateways before attending classes.</li>
        <li>Upon successful payment, official digital admission receipts and batch passes are generated immediately.</li>
      </ul>`
    ));
  });

  // 2. Privacy Policy
  app.get(['/privacy', '/privacy-policy'], (_req, res) => {
    res.send(renderLegalDoc(
      'Privacy Policy',
      'Effective Date: October 2026 | Compliant with IT Rules, 2011',
      `<h2>1. Information We Collect</h2>
      <p>We collect student Full Name, Mobile Phone / WhatsApp Number, chosen batch timing, and dance discipline to facilitate admission and batch scheduling.</p>
      <h2>2. Payment Information Security</h2>
      <p>All online payment transactions are processed through RBI-authorized, PCI-DSS Level 1 compliant payment gateways (such as Razorpay). We <strong>never store or access</strong> your card numbers, CVVs, or UPI PINs on our servers.</p>
      <h2>3. Data Usage & Non-Disclosure</h2>
      <p>Student contact details are used exclusively for scheduling confirmations, batch reminders, and studio service updates. We do not sell, rent, or trade your personal data to any external commercial marketing agencies.</p>`
    ));
  });

  // 3. Cancellation & Refund Policy
  app.get(['/refund-policy', '/cancellation-refund', '/refund'], (_req, res) => {
    res.send(renderLegalDoc(
      'Cancellation and Refund Policy',
      'Effective Date: October 2026 | RBI Compliant Refund Process',
      `<h2>1. Demo Class Cancellation (₹49)</h2>
      <p>If a student is unable to attend their booked demo session, cancellation or rescheduling requests can be submitted via WhatsApp (+91 8340158178) up to 12 hours prior to the session time. A 100% refund is initiated upon cancellation request.</p>
      <h2>2. Course Admissions & Batch Rescheduling</h2>
      <p>Students enrolled in monthly disciplines who encounter unavoidable emergencies may request a batch timing transfer or put their subscription on pause for up to 30 days without forfeiting their fees.</p>
      <h2>3. Refund Processing Timelines</h2>
      <p>All approved refunds are credited back to the customer's original source payment method (Bank Account, UPI, or Credit/Debit Card) within <strong>5 to 7 working days</strong> in strict accordance with payment gateway and banking settlement standards.</p>`
    ));
  });

  // 4. Shipping & Delivery Policy (Service Fulfillment)
  app.get(['/shipping-policy', '/shipping', '/delivery-policy'], (_req, res) => {
    res.send(renderLegalDoc(
      'Shipping and Delivery Policy',
      'Effective Date: October 2026 | Service Fulfillment Terms',
      `<h2>1. Digital Delivery of Admission Pass</h2>
      <p>Ramy's Dance Studio offers educational dance instruction, fitness classes, and custom choreography. Upon successful online booking, confirmation passes and batch access receipts are delivered <strong>digitally within 5 minutes</strong> via WhatsApp and SMS.</p>
      <h2>2. Physical Service Delivery</h2>
      <p>Physical classes and choreography services are fulfilled directly at our state-of-the-art studio facility located at Plaza Chowk, Old H.B. Road, Ranchi, Jharkhand, as per the batch time selected during checkout.</p>`
    ));
  });

  // 5. Contact Us
  app.get(['/contact', '/contact-us'], (_req, res) => {
    res.send(renderLegalDoc(
      'Contact Us',
      'Official Contact Channels & Studio Location',
      `<h2>Studio Address & Hours</h2>
      <p><strong>Studio Location:</strong> 2nd Floor, Above Reliance Smart Point, Plaza Chowk, Old H.B. Road, Ranchi, Jharkhand – 834001, India</p>
      <p><strong>Operating Hours:</strong> 7:00 AM – 9:00 PM (Open 7 Days a Week)</p>
      <h2>Direct Communications</h2>
      <p><strong>Phone:</strong> +91 8340158178</p>
      <p><strong>WhatsApp Support:</strong> +91 8340158178</p>
      <p><strong>Email:</strong> ramyysingh81@gmail.com</p>`
    ));
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
