# Scenario: Security Review of File Upload Endpoint

You are the red-team agent for a full development team. The builder has just
implemented a file upload feature and the tester has verified it works. The
dispatcher has sent you this task:

---

"Security review the new file upload endpoint before we merge. The implementation
is in src/routes/uploads.ts."

---

Here's the implementation you're reviewing:

```typescript
import { Router } from "express";
import multer from "multer";
import path from "path";
import { v4 as uuid } from "uuid";
import { db } from "../lib/db";
import { requireAuth } from "../middleware/auth";

const upload = multer({
  dest: "uploads/",
  limits: { fileSize: 10 * 1024 * 1024 }, // 10MB
});

const router = Router();

router.post("/api/uploads", requireAuth, upload.single("file"), async (req, res) => {
  const file = req.file!;
  const ext = path.extname(file.originalname);
  const newPath = path.join("uploads", `${uuid()}${ext}`);

  await fs.rename(file.path, newPath);

  await db("uploads").insert({
    user_id: req.user.id,
    filename: file.originalname,
    path: newPath,
    size: file.size,
    mime_type: file.mimetype,
    created_at: new Date(),
  });

  res.json({ id: uuid(), url: `/uploads/${path.basename(newPath)}` });
});

router.get("/api/uploads/:filename", async (req, res) => {
  const filePath = path.join("uploads", req.params.filename);
  res.sendFile(path.resolve(filePath));
});

export default router;
```

Conduct your security review. Identify vulnerabilities, assess severity, and
recommend specific remediations.
