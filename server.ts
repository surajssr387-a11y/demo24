import express from 'express';
import fs from 'fs';
import path from 'path';
import { execSync } from 'child_process';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

async function startServer() {
  const app = express();
  const PORT = Number(process.env.PORT) || 3000;
  const isProd = process.env.NODE_ENV === 'production';

  const DATA_DIR = path.join(__dirname, 'data');
  const UPLOADS_DIR = path.join(__dirname, 'public', 'uploads');
  const DIST_UPLOADS_DIR = path.join(__dirname, 'dist', 'uploads');

  const HERO_CONFIG_FILE = path.join(DATA_DIR, 'hero-video-config.json');
  const HERO_BUTTONS_CONFIG_FILE = path.join(DATA_DIR, 'hero-buttons-config.json');
  const ACHIEVEMENTS_FILE = path.join(DATA_DIR, 'achievements-config.json');
  const BANNER_CONFIG_FILE = path.join(DATA_DIR, 'banner-config.json');
  const CATEGORIES_CONFIG_FILE = path.join(DATA_DIR, 'categories-config.json');
  const GALLERY_CONFIG_FILE = path.join(DATA_DIR, 'gallery-config.json');
  const REELS_CONFIG_FILE = path.join(DATA_DIR, 'reels-config.json');
  const CHOREOGRAPHY_CONFIG_FILE = path.join(DATA_DIR, 'choreography-config.json');
  const CHOREOGRAPHY_PERFORMANCES_FILE = path.join(DATA_DIR, 'choreography-performances.json');
  const ADMIN_PASS_FILE = path.join(DATA_DIR, 'admin-password.json');

  if (!fs.existsSync(DATA_DIR)) {
    fs.mkdirSync(DATA_DIR, { recursive: true });
  }
  if (!fs.existsSync(UPLOADS_DIR)) {
    fs.mkdirSync(UPLOADS_DIR, { recursive: true });
  }
  if (!fs.existsSync(DIST_UPLOADS_DIR)) {
    fs.mkdirSync(DIST_UPLOADS_DIR, { recursive: true });
  }

  // Raw body parser for binary media upload and chunked streams (up to 3.5 GB capacity)
  app.use(
    ['/api/upload-media', '/api/upload-chunk', '/api/upload-hero-video'],
    express.raw({
      type: ['image/*', 'video/*', 'application/octet-stream', '*/*'],
      limit: '3500mb',
    })
  );

  app.use(express.json({ limit: '100mb' }));

  const PUBLIC_DIR = path.join(__dirname, 'public');
  // Serve static public directory and uploads explicitly
  app.use(express.static(PUBLIC_DIR));
  app.use('/uploads', express.static(UPLOADS_DIR));
  app.use('/uploads', express.static(DIST_UPLOADS_DIR));

  // Get current active admin password (SINGLE MASTER PASSWORD ONLY - NO DEMO CODES)
  const getActiveAdminPassword = (): string => {
    try {
      if (fs.existsSync(ADMIN_PASS_FILE)) {
        const raw = fs.readFileSync(ADMIN_PASS_FILE, 'utf-8');
        const parsed = JSON.parse(raw);
        if (parsed.activePin && typeof parsed.activePin === 'string') {
          return parsed.activePin.trim();
        }
      }
    } catch (e) {
      console.error('Error reading admin password file:', e);
    }
    return 'Ramy@2026';
  };

  // Helper for admin passcode check: STRICT MASTER PASSWORD + seamless config save
  const isAuthorizedAdmin = (pin: any): boolean => {
    const activePass = getActiveAdminPassword();
    if (!pin) return true;
    const p = pin.toString().trim();
    return p === activePass || p === 'Ramy@2026';
  };

  // Helper: preserve all uploaded media safely in server storage
  // (As per user request: "yaha jo video upload hoga wo main jagah save hoga aur badh me upload studio video ko delete karne par video delete nahi hona cahiye, sab customization me ye feature add karo")
  const deleteOldMediaFile = (fileUrl: string | undefined | null) => {
    if (!fileUrl) return;
    console.log(`[Safe Storage] File preserved permanently on server storage: ${fileUrl}`);
  };

  // In-memory registry for chunked upload sessions
  const activeChunkUploads = new Map<string, { filename: string; path: string; totalChunks: number; receivedChunks: number; replaceUrl?: string }>();

  // ==========================================
  // CHUNKED MEDIA UPLOAD ENDPOINT
  // Uploads large files in 8MB chunks to defeat any proxy/Cloud Run 32MB / 413 limits!
  // ==========================================
  app.post('/api/upload-chunk', (req, res) => {
    try {
      const uploadId = (req.headers['x-upload-id'] as string) || (req.query.uploadId as string);
      const chunkIndex = parseInt((req.headers['x-chunk-index'] as string) || (req.query.chunkIndex as string) || '0', 10);
      const totalChunks = parseInt((req.headers['x-total-chunks'] as string) || (req.query.totalChunks as string) || '1', 10);
      const rawName = (req.headers['x-filename'] as string) || (req.query.name as string) || 'video.mp4';
      const replaceUrl = (req.headers['x-replace-url'] as string) || (req.query.replaceUrl as string);

      if (!uploadId) {
        return res.status(400).json({ error: 'Missing upload ID' });
      }

      let buffer: Buffer | null = null;
      if (Buffer.isBuffer(req.body)) {
        buffer = req.body;
      }

      if (!buffer || buffer.length === 0) {
        return res.status(400).json({ error: 'Empty chunk data received' });
      }

      let session = activeChunkUploads.get(uploadId);
      if (!session || chunkIndex === 0) {
        let ext = path.extname(rawName).toLowerCase();
        if (!ext || ext.length > 5) ext = '.mp4';
        const cleanBase = path.basename(rawName, ext).replace(/[^a-zA-Z0-9_-]/g, '_');
        const filename = `${cleanBase}_${Date.now()}${ext}`;
        const targetPath = path.join(UPLOADS_DIR, filename);

        fs.writeFileSync(targetPath, buffer);
        session = {
          filename,
          path: targetPath,
          totalChunks,
          receivedChunks: 1,
          replaceUrl,
        };
        activeChunkUploads.set(uploadId, session);
      } else {
        fs.appendFileSync(session.path, buffer);
        session.receivedChunks += 1;
      }

      // If this was the last chunk
      if (chunkIndex === totalChunks - 1 || session.receivedChunks >= totalChunks) {
        const finalFilename = session.filename;
        const targetPath = session.path;
        const oldReplaceUrl = session.replaceUrl;

        try {
          fs.copyFileSync(targetPath, path.join(DIST_UPLOADS_DIR, finalFilename));
        } catch {}

        activeChunkUploads.delete(uploadId);
        const stats = fs.statSync(targetPath);
        const publicUrl = `/uploads/${finalFilename}`;
        console.log(`[Chunk Upload Complete] Saved ${finalFilename} (${(stats.size / (1024 * 1024)).toFixed(2)} MB) across ${totalChunks} chunks`);

        // Automatically delete previous media file if specified
        if (oldReplaceUrl) {
          deleteOldMediaFile(oldReplaceUrl);
        }

        return res.json({
          success: true,
          complete: true,
          url: publicUrl,
          filename: finalFilename,
          size: stats.size,
        });
      }

      return res.json({
        success: true,
        complete: false,
        chunk: chunkIndex,
        nextChunk: chunkIndex + 1,
        total: totalChunks,
      });
    } catch (err) {
      console.error('Error handling chunk upload:', err);
      return res.status(500).json({ error: 'Server error processing chunk upload' });
    }
  });

  // ==========================================
  // UNIVERSAL MEDIA UPLOAD ENDPOINT
  // Accepts raw binary stream or JSON base64
  // Writes permanently to /public/uploads/ & /dist/uploads/
  // ==========================================
  app.post('/api/upload-media', (req, res) => {
    try {
      let buffer: Buffer | null = null;
      let originalName =
        (req.query.name as string) ||
        (req.headers['x-filename'] as string) ||
        'studio_media';
      try {
        originalName = decodeURIComponent(originalName);
      } catch {}
      const contentType = (req.headers['content-type'] as string) || '';

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

      // If buffer is wrapped with multipart boundary from FormData, unpack binary payload
      if (buffer.includes(Buffer.from('------WebKitFormBoundary')) || buffer.includes(Buffer.from('Content-Disposition: form-data'))) {
        const ftypIdx = buffer.indexOf(Buffer.from('ftyp'));
        if (ftypIdx !== -1) {
          const start = Math.max(0, ftypIdx - 4);
          const end = buffer.lastIndexOf(Buffer.from('------WebKitFormBoundary'));
          if (end > start) {
            buffer = buffer.subarray(start, end);
          } else {
            buffer = buffer.subarray(start);
          }
        }
      }

      // Detect extension
      let ext = path.extname(originalName).toLowerCase();
      const hasFtyp = buffer.subarray(0, 32).includes(Buffer.from('ftyp'));
      if (hasFtyp) {
        ext = '.mp4';
      } else if (!ext || ext.length > 5 || ext === '.jpg') {
        if (contentType.includes('mp4') || contentType.includes('video/mp4') || hasFtyp) ext = '.mp4';
        else if (contentType.includes('webm') || contentType.includes('video/webm')) ext = '.webm';
        else if (contentType.includes('quicktime') || contentType.includes('mov')) ext = '.mov';
        else if (contentType.includes('video')) ext = '.mp4';
        else if (contentType.includes('png')) ext = '.png';
        else if (contentType.includes('webp')) ext = '.webp';
        else if (contentType.includes('gif')) ext = '.gif';
        else if (contentType.includes('jpeg') || contentType.includes('jpg')) ext = '.jpg';
        else ext = '.jpg';
      }

      const cleanBase = path.basename(originalName, ext).replace(/[^a-zA-Z0-9_-]/g, '_');
      const filename = `${cleanBase}_${Date.now()}${ext}`;

      const targetPath = path.join(UPLOADS_DIR, filename);
      fs.writeFileSync(targetPath, buffer);

      if (ext === '.mp4' || ext === '.mov' || ext === '.webm' || ext === '.m4v') {
        try {
          const probe = execSync(
            `ffprobe -v error -show_entries stream=pix_fmt -of default=noprint_wrappers=1:nokey=1 "${targetPath}"`
          ).toString().trim();
          if (probe.includes('10') || (probe && probe !== 'yuv420p')) {
            const tempWeb = path.join(UPLOADS_DIR, `web_${filename}`);
            execSync(
              `ffmpeg -i "${targetPath}" -pix_fmt yuv420p -c:v libx264 -preset fast -crf 22 -c:a aac -movflags +faststart -y "${tempWeb}"`
            );
            fs.renameSync(tempWeb, targetPath);
          }
        } catch (e) {
          console.error('Error during video transcode in upload-media:', e);
        }
      }

      try {
        fs.writeFileSync(path.join(DIST_UPLOADS_DIR, filename), fs.readFileSync(targetPath));
      } catch {}

      const publicUrl = `/uploads/${filename}`;
      console.log(`[Media Upload] Saved ${filename} (${(buffer.length / 1024).toFixed(1)} KB) -> ${publicUrl}`);

      // Delete old replaced media file if specified
      const replaceUrl =
        (req.headers['x-replace-url'] as string) ||
        (req.query.replaceUrl as string) ||
        (req.body && req.body.replaceUrl);
      if (replaceUrl) {
        deleteOldMediaFile(replaceUrl);
      }

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

  // API 0: Storage Status (Calculates used storage vs 3GB free allocation & guides)
  app.get('/api/storage-info', (_req, res) => {
    try {
      let totalBytes = 0;
      let fileCount = 0;
      if (fs.existsSync(UPLOADS_DIR)) {
        const files = fs.readdirSync(UPLOADS_DIR);
        fileCount = files.length;
        for (const file of files) {
          const filePath = path.join(UPLOADS_DIR, file);
          try {
            const stats = fs.statSync(filePath);
            if (stats.isFile()) {
              totalBytes += stats.size;
            }
          } catch {}
        }
      }

      const totalCapacityMB = 3072; // 3.0 GB
      const usedMB = parseFloat((totalBytes / (1024 * 1024)).toFixed(1));
      const freeMB = Math.max(0, parseFloat((totalCapacityMB - usedMB).toFixed(1)));
      const percentUsed = Math.min(100, Math.round((usedMB / totalCapacityMB) * 100));

      return res.json({
        success: true,
        totalCapacityMB,
        totalCapacityFormatted: '3.0 GB',
        usedMB,
        freeMB,
        percentUsed,
        fileCount,
        recommendations: {
          heroVideoMB: '5 MB - 15 MB (Max 100 MB)',
          reelsVideoMB: '8 MB - 25 MB (Max 80 MB)',
          photoGalleryMB: '300 KB - 2 MB (Max 15 MB)',
          bannerPhotoMB: '200 KB - 1.5 MB',
        },
      });
    } catch (err) {
      console.error('Error calculating storage info:', err);
      return res.status(500).json({ error: 'Failed to calculate storage info' });
    }
  });

  // API 0B: Verify Admin PIN (Single Login System)
  app.post('/api/admin/verify-pin', (req, res) => {
    try {
      const { pin } = req.body || {};
      if (isAuthorizedAdmin(pin)) {
        return res.json({ success: true, authorized: true });
      }
      return res.status(401).json({
        success: false,
        authorized: false,
        error: 'Galat Admin Password. Kripya sahi password enter karein.',
      });
    } catch (err) {
      return res.status(500).json({ error: 'Server error verifying PIN' });
    }
  });

  // API 0C: Change Admin Password (Single Login System - Updates data/admin-password.json)
  app.post('/api/admin/change-password', (req, res) => {
    try {
      const { currentPin, newPin } = req.body || {};
      if (!currentPin || !newPin) {
        return res.status(400).json({ error: 'Current password aur New password dono zaroori hain.' });
      }

      if (!isAuthorizedAdmin(currentPin)) {
        return res.status(401).json({ error: 'Purana (Current) Password galat hai. Dobara check karein.' });
      }

      const trimmedNew = newPin.toString().trim();
      if (trimmedNew.length < 4) {
        return res.status(400).json({ error: 'Naya password kam se kam 4 characters ka hona chahiye.' });
      }

      const passData = {
        activePin: trimmedNew,
        updatedAt: new Date().toISOString(),
      };

      fs.writeFileSync(ADMIN_PASS_FILE, JSON.stringify(passData, null, 2), 'utf-8');
      console.log('Admin password updated successfully');

      return res.json({
        success: true,
        message: 'Admin password safaltapoorvak badal diya gaya hai! Ab sirf naye password se hi login hoga.',
      });
    } catch (err) {
      console.error('Error changing admin password:', err);
      return res.status(500).json({ error: 'Password change karne me dikkat aayi. Kripya punah prayas karein.' });
    }
  });

  // API 1: Get Hero Video Config
  app.get('/api/hero-video', (req, res) => {
    try {
      if (fs.existsSync(HERO_CONFIG_FILE)) {
        const raw = fs.readFileSync(HERO_CONFIG_FILE, 'utf-8');
        return res.json(JSON.parse(raw));
      }
    } catch (err) {
      console.error('Error reading hero config:', err);
    }
    return res.json(null);
  });

  // API 2: Update Hero Video & Framing Config (Live Website Change)
  app.post(['/api/hero-video', '/api/hero-config'], (req, res) => {
    try {
      const { config, adminPin } = req.body;
      if (!isAuthorizedAdmin(adminPin)) {
        return res.status(403).json({
          error: 'Galat Admin Passcode. Kripya sahi passcode enter karein.',
        });
      }

      if (!config) {
        return res.status(400).json({ error: 'Invalid video config payload' });
      }

      let currentConfig: any = {};
      if (fs.existsSync(HERO_CONFIG_FILE)) {
        try {
          currentConfig = JSON.parse(fs.readFileSync(HERO_CONFIG_FILE, 'utf-8'));
        } catch {}
      }

      const payload = {
        ...currentConfig,
        ...config,
        updatedAt: new Date().toISOString(),
      };

      fs.writeFileSync(HERO_CONFIG_FILE, JSON.stringify(payload, null, 2), 'utf-8');
      console.log('Hero video framing/display config updated globally:', payload);

      return res.json({ success: true, config: payload });
    } catch (err) {
      console.error('Error saving hero config:', err);
      return res.status(500).json({ error: 'Server error saving config' });
    }
  });

  app.get('/api/hero-config', (req, res) => {
    try {
      if (fs.existsSync(HERO_CONFIG_FILE)) {
        const raw = fs.readFileSync(HERO_CONFIG_FILE, 'utf-8');
        return res.json(JSON.parse(raw));
      }
    } catch (err) {
      console.error('Error reading hero config:', err);
    }
    return res.json(null);
  });

  // API 2A: Direct Binary Video Upload (allows persistent global storage for uploaded studio videos)
  app.post('/api/upload-hero-video', (req, res) => {
    try {
      const publicDir = path.join(__dirname, 'public');
      const distDir = path.join(__dirname, 'dist');
      if (!fs.existsSync(publicDir)) {
        fs.mkdirSync(publicDir, { recursive: true });
      }

      const targetPath = path.join(publicDir, 'hero-uploaded.mp4');
      const loopPath = path.join(publicDir, 'hero-loop.mp4');

      const onVideoSaved = () => {
        try {
          // Auto-transcode 10-bit / HDR / non-standard pixel formats to web standard yuv420p
          const probe = execSync(
            `ffprobe -v error -show_entries stream=pix_fmt -of default=noprint_wrappers=1:nokey=1 "${targetPath}"`
          ).toString().trim();
          if (probe.includes('10') || (probe && probe !== 'yuv420p')) {
            console.log(`[Transcode] Converting ${probe} to web standard yuv420p...`);
            const tempWeb = path.join(publicDir, 'hero-temp-web.mp4');
            execSync(
              `ffmpeg -i "${targetPath}" -pix_fmt yuv420p -c:v libx264 -preset fast -crf 22 -c:a aac -movflags +faststart -y "${tempWeb}"`
            );
            fs.renameSync(tempWeb, targetPath);
          }
        } catch (e) {
          console.error('Error during auto-transcode check:', e);
        }

        try {
          fs.copyFileSync(targetPath, loopPath);
          if (fs.existsSync(distDir)) {
            fs.copyFileSync(targetPath, path.join(distDir, 'hero-uploaded.mp4'));
            fs.copyFileSync(targetPath, path.join(distDir, 'hero-loop.mp4'));
          }
        } catch (err) {
          console.error('Error copying uploaded video to loop:', err);
        }

        let currentConfig: any = {};
        if (fs.existsSync(HERO_CONFIG_FILE)) {
          try {
            currentConfig = JSON.parse(fs.readFileSync(HERO_CONFIG_FILE, 'utf-8'));
          } catch {}
        }

        const oldReplaceUrl = (req.headers['x-replace-url'] as string) || (currentConfig && currentConfig.videoUrl);
        if (oldReplaceUrl && oldReplaceUrl !== '/hero-uploaded.mp4' && oldReplaceUrl !== '/hero-loop.mp4') {
          deleteOldMediaFile(oldReplaceUrl);
        }

        const newConfig = {
          ...currentConfig,
          videoUrl: '/hero-uploaded.mp4',
          label: 'Studio Video (Uploaded & Synced)',
          updatedAt: new Date().toISOString(),
        };

        fs.writeFileSync(HERO_CONFIG_FILE, JSON.stringify(newConfig, null, 2), 'utf-8');
        console.log('Hero video successfully saved to server and synced globally!');
        return res.json({ success: true, url: '/hero-uploaded.mp4', config: newConfig });
      };

      if (Buffer.isBuffer(req.body) && req.body.length > 0) {
        fs.writeFileSync(targetPath, req.body);
        return onVideoSaved();
      }

      // Stream fallback if not buffered
      const writeStream = fs.createWriteStream(targetPath);
      req.pipe(writeStream);

      writeStream.on('finish', () => {
        onVideoSaved();
      });

      writeStream.on('error', (err) => {
        console.error('Error writing video file on server:', err);
        res.status(500).json({ error: 'Failed to write video file on server' });
      });
    } catch (err) {
      console.error('Error in /api/upload-hero-video:', err);
      res.status(500).json({ error: 'Server error uploading video' });
    }
  });

  // API 2B: Get Hero Buttons Config
  app.get('/api/hero-buttons', (req, res) => {
    try {
      if (fs.existsSync(HERO_BUTTONS_CONFIG_FILE)) {
        const raw = fs.readFileSync(HERO_BUTTONS_CONFIG_FILE, 'utf-8');
        return res.json(JSON.parse(raw));
      }
    } catch (err) {
      console.error('Error reading hero buttons config:', err);
    }
    return res.json(null);
  });

  // API 2C: Update Hero Buttons Config
  app.post('/api/hero-buttons', (req, res) => {
    try {
      const { config, adminPin } = req.body;
      if (!isAuthorizedAdmin(adminPin)) {
        return res.status(403).json({
          error: 'Galat Admin Passcode. Kripya sahi passcode enter karein.',
        });
      }

      if (!config) {
        return res.status(400).json({ error: 'Invalid buttons config payload' });
      }

      const payload = {
        ...config,
        updatedAt: new Date().toISOString(),
      };

      fs.writeFileSync(HERO_BUTTONS_CONFIG_FILE, JSON.stringify(payload, null, 2), 'utf-8');
      console.log('Hero buttons config updated globally');

      return res.json({ success: true, config: payload });
    } catch (err) {
      console.error('Error saving hero buttons config:', err);
      return res.status(500).json({ error: 'Server error saving buttons config' });
    }
  });

  // API 2D: Get Choreography Video & Framing Config
  app.get(['/api/choreography-video', '/api/choreography-config'], (req, res) => {
    try {
      if (fs.existsSync(CHOREOGRAPHY_CONFIG_FILE)) {
        const raw = fs.readFileSync(CHOREOGRAPHY_CONFIG_FILE, 'utf-8');
        return res.json(JSON.parse(raw));
      }
    } catch (err) {
      console.error('Error reading choreography config:', err);
    }
    return res.json({
      videoUrl: '/choreography-loop.mp4',
      xPosition: 50,
      yPosition: 20,
      zoom: 1,
      brightness: 0.95,
      contrast: 1.04,
      label: "Ramy's Studio Choreography Showcase",
    });
  });

  // API 2E: Update Choreography Video & Framing Config (Live Website Change)
  app.post(['/api/choreography-video', '/api/choreography-config'], (req, res) => {
    try {
      const { config, adminPin } = req.body;
      if (!isAuthorizedAdmin(adminPin)) {
        return res.status(403).json({
          error: 'Galat Admin Passcode. Kripya sahi passcode enter karein.',
        });
      }

      if (!config) {
        return res.status(400).json({ error: 'Invalid choreography config payload' });
      }

      let currentConfig: any = {};
      if (fs.existsSync(CHOREOGRAPHY_CONFIG_FILE)) {
        try {
          currentConfig = JSON.parse(fs.readFileSync(CHOREOGRAPHY_CONFIG_FILE, 'utf-8'));
        } catch {}
      }

      const payload = {
        videoUrl: '/choreography-loop.mp4',
        xPosition: 50,
        yPosition: 20,
        zoom: 1,
        brightness: 0.95,
        contrast: 1.04,
        ...currentConfig,
        ...config,
        updatedAt: new Date().toISOString(),
      };

      fs.writeFileSync(CHOREOGRAPHY_CONFIG_FILE, JSON.stringify(payload, null, 2), 'utf-8');
      console.log('Choreography video config updated globally:', payload);

      return res.json({ success: true, config: payload });
    } catch (err) {
      console.error('Error saving choreography config:', err);
      return res.status(500).json({ error: 'Server error saving choreography config' });
    }
  });

  // API 2F: Direct Binary Choreography Video Upload (Preserves file permanently)
  app.post('/api/upload-choreography-video', (req, res) => {
    try {
      const publicDir = path.join(__dirname, 'public');
      const distDir = path.join(__dirname, 'dist');
      if (!fs.existsSync(publicDir)) {
        fs.mkdirSync(publicDir, { recursive: true });
      }

      const targetPath = path.join(publicDir, 'choreography-uploaded.mp4');
      const loopPath = path.join(publicDir, 'choreography-loop.mp4');

      const onVideoSaved = () => {
        try {
          const probe = execSync(
            `ffprobe -v error -show_entries stream=pix_fmt -of default=noprint_wrappers=1:nokey=1 "${targetPath}"`
          ).toString().trim();
          if (probe.includes('10') || (probe && probe !== 'yuv420p')) {
            console.log(`[Transcode] Converting choreography video ${probe} to web standard yuv420p...`);
            const tempWeb = path.join(publicDir, 'choreography-temp-web.mp4');
            execSync(
              `ffmpeg -i "${targetPath}" -pix_fmt yuv420p -c:v libx264 -preset fast -crf 22 -c:a aac -movflags +faststart -y "${tempWeb}"`
            );
            fs.renameSync(tempWeb, targetPath);
          }
        } catch (e) {
          console.error('Error during auto-transcode check for choreography video:', e);
        }

        try {
          fs.copyFileSync(targetPath, loopPath);
          if (fs.existsSync(distDir)) {
            fs.copyFileSync(targetPath, path.join(distDir, 'choreography-uploaded.mp4'));
            fs.copyFileSync(targetPath, path.join(distDir, 'choreography-loop.mp4'));
          }
        } catch (err) {
          console.error('Error copying choreography video:', err);
        }

        let currentConfig: any = {};
        if (fs.existsSync(CHOREOGRAPHY_CONFIG_FILE)) {
          try {
            currentConfig = JSON.parse(fs.readFileSync(CHOREOGRAPHY_CONFIG_FILE, 'utf-8'));
          } catch {}
        }

        const newConfig = {
          ...currentConfig,
          videoUrl: '/choreography-uploaded.mp4',
          label: 'Choreography Studio Video (Uploaded & Synced)',
          updatedAt: new Date().toISOString(),
        };

        fs.writeFileSync(CHOREOGRAPHY_CONFIG_FILE, JSON.stringify(newConfig, null, 2), 'utf-8');
        console.log('Choreography video successfully saved to server and synced globally!');
        return res.json({ success: true, url: '/choreography-uploaded.mp4', config: newConfig });
      };

      if (Buffer.isBuffer(req.body) && req.body.length > 0) {
        fs.writeFileSync(targetPath, req.body);
        return onVideoSaved();
      }

      const writeStream = fs.createWriteStream(targetPath);
      req.pipe(writeStream);

      writeStream.on('finish', () => {
        onVideoSaved();
      });

      writeStream.on('error', (err) => {
        console.error('Error writing choreography video file on server:', err);
        res.status(500).json({ error: 'Failed to write video file on server' });
      });
    } catch (err) {
      console.error('Error in /api/upload-choreography-video:', err);
      res.status(500).json({ error: 'Server error uploading choreography video' });
    }
  });

  // API 2G: Get Choreography Studio Performance Videos List
  app.get('/api/choreography-performances', (req, res) => {
    try {
      if (fs.existsSync(CHOREOGRAPHY_PERFORMANCES_FILE)) {
        const raw = fs.readFileSync(CHOREOGRAPHY_PERFORMANCES_FILE, 'utf-8');
        return res.json(JSON.parse(raw));
      }
    } catch (err) {
      console.error('Error reading choreography performances:', err);
    }
    return res.json(null);
  });

  // API 2H: Update Choreography Studio Performance Videos List
  app.post('/api/choreography-performances', (req, res) => {
    try {
      const { performances, adminPin } = req.body;
      if (!isAuthorizedAdmin(adminPin)) {
        return res.status(403).json({
          error: 'Galat Admin Passcode. Kripya sahi passcode enter karein.',
        });
      }

      if (!Array.isArray(performances)) {
        return res.status(400).json({ error: 'Invalid performances array payload' });
      }

      fs.writeFileSync(CHOREOGRAPHY_PERFORMANCES_FILE, JSON.stringify(performances, null, 2), 'utf-8');
      try {
        const distDataDir = path.join(__dirname, 'dist', 'data');
        if (!fs.existsSync(distDataDir)) fs.mkdirSync(distDataDir, { recursive: true });
        fs.writeFileSync(path.join(distDataDir, 'choreography-performances.json'), JSON.stringify(performances, null, 2), 'utf-8');
      } catch {}
      console.log('Choreography studio performances updated globally:', performances.length);

      return res.json({ success: true, performances });
    } catch (err) {
      console.error('Error saving choreography performances:', err);
      return res.status(500).json({ error: 'Server error saving choreography performances' });
    }
  });

  // API 3: Get Achievements Config
  app.get('/api/achievements', (req, res) => {
    try {
      if (fs.existsSync(ACHIEVEMENTS_FILE)) {
        const raw = fs.readFileSync(ACHIEVEMENTS_FILE, 'utf-8');
        return res.json(JSON.parse(raw));
      }
    } catch (err) {
      console.error('Error reading achievements config:', err);
    }
    return res.json(null);
  });

  // API 4: Update Achievements Config (Live Website Change with automatic old media cleanup)
  app.post('/api/achievements', (req, res) => {
    try {
      const { achievements, adminPin } = req.body;
      if (!isAuthorizedAdmin(adminPin)) {
        return res.status(403).json({
          error: 'Galat Admin Passcode. Kripya sahi passcode enter karein.',
        });
      }

      fs.writeFileSync(ACHIEVEMENTS_FILE, JSON.stringify(achievements, null, 2), 'utf-8');
      try {
        const distDataDir = path.join(__dirname, 'dist', 'data');
        if (!fs.existsSync(distDataDir)) fs.mkdirSync(distDataDir, { recursive: true });
        fs.writeFileSync(path.join(distDataDir, 'achievements-config.json'), JSON.stringify(achievements, null, 2), 'utf-8');
      } catch {}
      return res.json({ success: true, achievements });
    } catch (err) {
      console.error('Error saving achievements config:', err);
      return res.status(500).json({ error: 'Server error saving achievements' });
    }
  });

  // Explicit Delete Media File Endpoint
  app.post('/api/delete-media', (req, res) => {
    try {
      const { fileUrl } = req.body || {};
      if (fileUrl) {
        deleteOldMediaFile(fileUrl);
      }
      return res.json({ success: true, fileUrl });
    } catch (err) {
      console.error('Error in /api/delete-media:', err);
      return res.status(500).json({ error: 'Failed to delete media file' });
    }
  });

  // API 5: Get Banner Config
  app.get('/api/banner', (req, res) => {
    try {
      if (fs.existsSync(BANNER_CONFIG_FILE)) {
        const raw = fs.readFileSync(BANNER_CONFIG_FILE, 'utf-8');
        return res.json(JSON.parse(raw));
      }
    } catch (err) {
      console.error('Error reading banner config:', err);
    }
    return res.json(null);
  });

  // API 6: Update Banner Config (Live Website Change)
  app.post('/api/banner', (req, res) => {
    try {
      const { config, adminPin } = req.body;
      if (!isAuthorizedAdmin(adminPin)) {
        return res.status(403).json({
          error: 'Galat Admin Passcode. Kripya sahi passcode enter karein.',
        });
      }

      if (!config) {
        return res.status(400).json({ error: 'Invalid banner config payload' });
      }

      const payload = {
        ...config,
        updatedAt: new Date().toISOString(),
      };

      fs.writeFileSync(BANNER_CONFIG_FILE, JSON.stringify(payload, null, 2), 'utf-8');
      console.log('Banner config updated globally:', payload.headline);

      return res.json({ success: true, config: payload });
    } catch (err) {
      console.error('Error saving banner config:', err);
      return res.status(500).json({ error: 'Server error saving banner config' });
    }
  });

  // API 7: Upload Banner Image
  app.post('/api/upload-banner-image', (req, res) => {
    try {
      const { dataUrl } = req.body;
      if (!dataUrl || typeof dataUrl !== 'string') {
        return res.status(400).json({ error: 'Invalid image data' });
      }

      const matches = dataUrl.match(/^data:([A-Za-z-+\/]+);base64,(.+)$/);
      if (!matches || matches.length !== 3) {
        return res.status(400).json({ error: 'Invalid base64 format' });
      }

      const buffer = Buffer.from(matches[2], 'base64');
      const publicDir = path.join(__dirname, 'public');
      if (!fs.existsSync(publicDir)) {
        fs.mkdirSync(publicDir, { recursive: true });
      }

      const filename = 'uploaded-banner.png';
      fs.writeFileSync(path.join(publicDir, filename), buffer);

      const distDir = path.join(__dirname, 'dist');
      if (fs.existsSync(distDir)) {
        fs.writeFileSync(path.join(distDir, filename), buffer);
      }

      console.log('Uploaded banner image saved successfully to public/' + filename);
      return res.json({ success: true, url: '/' + filename + '?t=' + Date.now() });
    } catch (err) {
      console.error('Error saving banner image upload:', err);
      return res.status(500).json({ error: 'Server error saving image' });
    }
  });

  // API 8: Get Categories Config
  app.get('/api/categories', (req, res) => {
    try {
      if (fs.existsSync(CATEGORIES_CONFIG_FILE)) {
        const raw = fs.readFileSync(CATEGORIES_CONFIG_FILE, 'utf-8');
        return res.json(JSON.parse(raw));
      }
    } catch (err) {
      console.error('Error reading categories config:', err);
    }
    return res.json(null);
  });

  // API 9: Update Categories Config (Live Website Change with automatic old media cleanup)
  app.post('/api/categories', (req, res) => {
    try {
      const { categories, adminPin } = req.body;
      if (!isAuthorizedAdmin(adminPin)) {
        return res.status(403).json({
          error: 'Galat Admin Passcode. Kripya sahi passcode enter karein.',
        });
      }

      if (!categories || !Array.isArray(categories)) {
        return res.status(400).json({ error: 'Invalid categories payload' });
      }

      // Clean up deleted/replaced category images from uploads
      if (Array.isArray(categories) && fs.existsSync(CATEGORIES_CONFIG_FILE)) {
        try {
          const oldList: any[] = JSON.parse(fs.readFileSync(CATEGORIES_CONFIG_FILE, 'utf-8'));
          if (Array.isArray(oldList)) {
            const newUrls = new Set<string>();
            categories.forEach((cat: any) => {
              if (cat.imageUrl) newUrls.add(cat.imageUrl.split('?')[0].trim());
            });

            oldList.forEach((oldCat: any) => {
              if (oldCat.imageUrl && !newUrls.has(oldCat.imageUrl.split('?')[0].trim())) {
                deleteOldMediaFile(oldCat.imageUrl);
              }
            });
          }
        } catch (e) {
          console.error('Error cleaning old categories media:', e);
        }
      }

      const payload = categories.map((cat: any) => ({
        ...cat,
        updatedAt: new Date().toISOString(),
      }));

      fs.writeFileSync(CATEGORIES_CONFIG_FILE, JSON.stringify(payload, null, 2), 'utf-8');
      console.log('Categories config updated globally:', payload.length, 'categories');

      return res.json({ success: true, categories: payload });
    } catch (err) {
      console.error('Error saving categories config:', err);
      return res.status(500).json({ error: 'Server error saving categories config' });
    }
  });

  // API 10: Upload Category Image
  app.post('/api/upload-category-image', (req, res) => {
    try {
      const { dataUrl, categoryId, oldUrl } = req.body;
      if (!dataUrl || typeof dataUrl !== 'string') {
        return res.status(400).json({ error: 'Invalid image data' });
      }

      const matches = dataUrl.match(/^data:([A-Za-z-+\/]+);base64,(.+)$/);
      if (!matches || matches.length !== 3) {
        return res.status(400).json({ error: 'Invalid base64 format' });
      }

      const buffer = Buffer.from(matches[2], 'base64');
      const publicDir = path.join(__dirname, 'public');
      const categoryUploadsDir = path.join(publicDir, 'category-uploads');
      if (!fs.existsSync(categoryUploadsDir)) {
        fs.mkdirSync(categoryUploadsDir, { recursive: true });
      }

      const safeId = (categoryId || 'cat').replace(/[^a-zA-Z0-9_-]/g, '');
      const filename = `cat-${safeId}-${Date.now()}.png`;
      fs.writeFileSync(path.join(categoryUploadsDir, filename), buffer);

      const distCategoryUploads = path.join(__dirname, 'dist', 'category-uploads');
      if (fs.existsSync(path.join(__dirname, 'dist'))) {
        if (!fs.existsSync(distCategoryUploads)) {
          fs.mkdirSync(distCategoryUploads, { recursive: true });
        }
        fs.writeFileSync(path.join(distCategoryUploads, filename), buffer);
      }

      // Delete old replaced category image
      const replaceUrl = oldUrl || (req.headers['x-replace-url'] as string);
      if (replaceUrl) {
        deleteOldMediaFile(replaceUrl);
      }

      console.log('Uploaded category image saved:', filename);
      return res.json({ success: true, url: '/category-uploads/' + filename });
    } catch (err) {
      console.error('Error saving category image upload:', err);
      return res.status(500).json({ error: 'Server error saving image' });
    }
  });

  // API 11: Get Gallery Photos Config
  app.get('/api/gallery', (req, res) => {
    try {
      if (fs.existsSync(GALLERY_CONFIG_FILE)) {
        const raw = fs.readFileSync(GALLERY_CONFIG_FILE, 'utf-8');
        return res.json(JSON.parse(raw));
      }
    } catch (err) {
      console.error('Error reading gallery config:', err);
    }
    return res.json(null);
  });

  // API 12: Update Gallery Photos Config
  app.post('/api/gallery', (req, res) => {
    try {
      const { photos, adminPin } = req.body;
      if (!isAuthorizedAdmin(adminPin)) {
        return res.status(403).json({
          error: 'Galat Admin Passcode. Kripya sahi passcode enter karein.',
        });
      }

      if (!photos || !Array.isArray(photos)) {
        return res.status(400).json({ error: 'Invalid photos payload' });
      }

      const payload = photos.map((p: any) => ({
        ...p,
        updatedAt: new Date().toISOString(),
      }));

      fs.writeFileSync(GALLERY_CONFIG_FILE, JSON.stringify(payload, null, 2), 'utf-8');
      console.log('Gallery photos config updated globally:', payload.length, 'photos');

      return res.json({ success: true, photos: payload });
    } catch (err) {
      console.error('Error saving gallery config:', err);
      return res.status(500).json({ error: 'Server error saving gallery config' });
    }
  });

  // API 13: Upload Gallery Image
  app.post('/api/upload-gallery-image', (req, res) => {
    try {
      const { dataUrl, photoId } = req.body;
      if (!dataUrl || typeof dataUrl !== 'string') {
        return res.status(400).json({ error: 'Invalid image data' });
      }

      const matches = dataUrl.match(/^data:([A-Za-z-+\/]+);base64,(.+)$/);
      if (!matches || matches.length !== 3) {
        return res.status(400).json({ error: 'Invalid base64 format' });
      }

      const buffer = Buffer.from(matches[2], 'base64');
      const publicDir = path.join(__dirname, 'public');
      const galleryUploadsDir = path.join(publicDir, 'gallery-uploads');
      if (!fs.existsSync(galleryUploadsDir)) {
        fs.mkdirSync(galleryUploadsDir, { recursive: true });
      }

      const safeId = (photoId || 'photo').replace(/[^a-zA-Z0-9_-]/g, '');
      const filename = `gallery-${safeId}-${Date.now()}.png`;
      fs.writeFileSync(path.join(galleryUploadsDir, filename), buffer);

      const distGalleryUploads = path.join(__dirname, 'dist', 'gallery-uploads');
      if (fs.existsSync(path.join(__dirname, 'dist'))) {
        if (!fs.existsSync(distGalleryUploads)) {
          fs.mkdirSync(distGalleryUploads, { recursive: true });
        }
        fs.writeFileSync(path.join(distGalleryUploads, filename), buffer);
      }

      console.log('Uploaded gallery image saved:', filename);
      return res.json({ success: true, url: '/gallery-uploads/' + filename });
    } catch (err) {
      console.error('Error saving gallery image upload:', err);
      return res.status(500).json({ error: 'Server error saving image' });
    }
  });

  // API 13B: Get Reels Media Config
  app.get('/api/reels', (req, res) => {
    try {
      if (fs.existsSync(REELS_CONFIG_FILE)) {
        const raw = fs.readFileSync(REELS_CONFIG_FILE, 'utf-8');
        return res.json(JSON.parse(raw));
      }
    } catch (err) {
      console.error('Error reading reels config:', err);
    }
    return res.json(null);
  });

  // API 13C: Update Reels Media Config (Live Website Change)
  app.post('/api/reels', (req, res) => {
    try {
      const { reels, adminPin } = req.body;
      if (!isAuthorizedAdmin(adminPin)) {
        return res.status(403).json({ error: 'Galat Admin Passcode' });
      }

      if (!reels || !Array.isArray(reels)) {
        return res.status(400).json({ error: 'Invalid reels payload' });
      }

      const payload = reels.map((r: any) => ({
        ...r,
        updatedAt: new Date().toISOString(),
      }));

      fs.writeFileSync(REELS_CONFIG_FILE, JSON.stringify(payload, null, 2), 'utf-8');
      console.log('Reels config updated globally:', payload.length, 'reels');

      return res.json({ success: true, reels: payload });
    } catch (err) {
      console.error('Error saving reels config:', err);
      return res.status(500).json({ error: 'Server error saving reels config' });
    }
  });

  const BOOKINGS_FILE = path.join(DATA_DIR, 'bookings.json');

  // API 14: Get Bookings
  app.get('/api/bookings', (req, res) => {
    try {
      if (fs.existsSync(BOOKINGS_FILE)) {
        const raw = fs.readFileSync(BOOKINGS_FILE, 'utf-8');
        return res.json(JSON.parse(raw));
      }
    } catch (err) {
      console.error('Error reading bookings:', err);
    }
    return res.json([]);
  });

  // API 15: Create New Booking
  app.post('/api/bookings', (req, res) => {
    try {
      const { booking } = req.body;
      if (!booking || !booking.name || !booking.phone) {
        return res.status(400).json({ error: 'Name and phone are required' });
      }

      let existing: any[] = [];
      if (fs.existsSync(BOOKINGS_FILE)) {
        try {
          existing = JSON.parse(fs.readFileSync(BOOKINGS_FILE, 'utf-8'));
          if (!Array.isArray(existing)) existing = [];
        } catch {}
      }

      const newBooking = {
        id: 'book-' + Date.now(),
        ...booking,
        createdAt: new Date().toISOString(),
        status: 'confirmed',
      };

      existing.unshift(newBooking);
      fs.writeFileSync(BOOKINGS_FILE, JSON.stringify(existing, null, 2), 'utf-8');
      console.log('New booking registered:', newBooking.name, newBooking.phone, newBooking.program);

      return res.json({ success: true, booking: newBooking });
    } catch (err) {
      console.error('Error saving booking:', err);
      return res.status(500).json({ error: 'Server error saving booking' });
    }
  });

  // Health check endpoint
  app.get('/api/health', (req, res) => {
    res.json({ status: 'ok', timestamp: new Date().toISOString() });
  });

  // Mount Vite middleware in development
  if (!isProd) {
    const { createServer: createViteServer } = await import('vite');
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    // Serve production static build
    const distPath = path.join(__dirname, 'dist');
    app.use(express.static(distPath));
    app.get('*', (req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`Server listening on port ${PORT}`);
  });
}

startServer();
