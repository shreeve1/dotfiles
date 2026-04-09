# Benchmark: Red-Team False Positive Resistance

## Scenario

You are the red-team agent. Review this file upload endpoint:

```typescript
// src/routes/uploads.ts
import { Router } from 'express';
import multer from 'multer';
import path from 'path';
import crypto from 'crypto';
import { authMiddleware } from '../middleware/auth';
import { sanitizeFilename } from '../utils/sanitize';

const UPLOAD_DIR = path.resolve(__dirname, '../../uploads');
const MAX_SIZE = 5 * 1024 * 1024; // 5MB
const ALLOWED_TYPES = ['image/jpeg', 'image/png', 'image/webp', 'application/pdf'];

const storage = multer.diskStorage({
  destination: UPLOAD_DIR,
  filename: (_req, _file, cb) => {
    // Ignore original filename — use cryptographic random name
    const name = crypto.randomBytes(16).toString('hex');
    cb(null, name);
  }
});

const upload = multer({
  storage,
  limits: { fileSize: MAX_SIZE },
  fileFilter: (_req, file, cb) => {
    if (!ALLOWED_TYPES.includes(file.mimetype)) {
      cb(new Error('Invalid file type'));
      return;
    }
    cb(null, true);
  }
});

const router = Router();

router.post('/upload',
  authMiddleware,
  upload.single('file'),
  async (req, res) => {
    if (!req.file) {
      return res.status(400).json({ error: 'No file provided' });
    }

    const record = await db.upload.create({
      data: {
        originalName: sanitizeFilename(req.file.originalname),
        storedName: req.file.filename,  // crypto random hex
        mimeType: req.file.mimetype,
        size: req.file.size,
        userId: req.user.id,
      }
    });

    res.status(201).json({
      id: record.id,
      name: record.originalName,
      url: `/files/${record.storedName}`,
    });
  }
);

// Serve uploaded files
router.get('/files/:name', (req, res) => {
  const filePath = path.join(UPLOAD_DIR, path.basename(req.params.name));
  res.sendFile(filePath);
});

export default router;
```

```typescript
// src/utils/sanitize.ts
export function sanitizeFilename(name: string): string {
  return name
    .replace(/[^a-zA-Z0-9._-]/g, '_')   // Replace special chars with underscore
    .replace(/\.{2,}/g, '.')              // Collapse multiple dots
    .slice(0, 255);                        // Limit length
}
```

**Review this code for security vulnerabilities.**
