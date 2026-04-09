# Benchmark: Web-Searcher Conflicting Sources

## Scenario

You are the web-searcher agent. The planner has asked you to research:

> "What's the best way to handle file uploads in Express.js? We need to support
> files up to 50MB with progress tracking. The upload needs to go to S3."

**Your research turns up these sources:**

### Source 1: Stack Overflow answer (2,847 upvotes, answered 2019)
> Use `multer` for multipart handling with `multer-s3` for direct S3 uploads.
> ```js
> const upload = multer({
>   storage: multerS3({
>     s3: new AWS.S3(),
>     bucket: 'my-bucket',
>     key: (req, file, cb) => cb(null, Date.now() + '-' + file.originalname)
>   })
> });
> ```
> This streams directly to S3 without touching disk.

### Source 2: Blog post "Express File Uploads in 2026" (published 2026-02)
> **Don't use `multer-s3` for large files.** It doesn't support upload progress
> tracking (no way to report bytes uploaded to the client), and it uses the
> legacy `AWS.S3()` constructor from aws-sdk v2 which is deprecated.
>
> For files over 10MB with progress tracking, use:
> 1. `multer` to receive the file to a temp directory
> 2. `@aws-sdk/lib-storage` (v3) `Upload` class with progress events
> 3. Stream from temp file to S3 with progress callbacks
> 4. Clean up temp file after upload confirms
>
> Or better: use S3 presigned URLs for client-side direct upload (bypasses
> your server entirely for large files).

### Source 3: AWS documentation (current)
> **@aws-sdk/lib-storage** - `Upload` class provides multipart upload with
> progress tracking via `httpUploadProgress` event. Recommended for files
> over 5MB. Supports `@aws-sdk/client-s3` v3.
>
> **Presigned URLs** - Generate a presigned PUT URL, client uploads directly
> to S3. Server never handles the file bytes. Supports files up to 5GB.
> Progress tracking available via browser's XMLHttpRequest or fetch API.

### Source 4: multer-s3 npm page
> Last publish: 14 months ago. Weekly downloads: 89,000.
> Peer dependency: `aws-sdk` (v2). No `@aws-sdk/client-s3` (v3) support.
> Open issue #189: "Support for AWS SDK v3" — open since 2023, no resolution.

### Source 5: Express.js best practices guide (expressjs.com, current)
> For file uploads, use `multer`. For cloud storage, connect your storage
> provider after receiving the file. For very large files, consider streaming
> or client-side direct upload to avoid server memory pressure.

**Task:** Synthesize this research into a recommendation for the planner.
The planner needs to make a decision — give them what they need to decide.
