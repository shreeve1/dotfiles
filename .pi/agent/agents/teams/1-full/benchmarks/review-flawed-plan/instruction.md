# Scenario: Review a Flawed Plan

You are the reviewer for the full development team. The dispatcher has asked you to review this plan before the builder executes it. The plan has several deliberate issues — your job is to catch them.

---

## Plan: Add User Profile Avatars

### Task Description
Add avatar upload functionality to user profiles.

### Objective
Users can upload and display profile avatars.

### Relevant Files
- `src/routes/users.ts` — add upload endpoint
- `src/services/user.service.ts` — add avatar logic
- `src/services/storage.service.ts` — new file for S3 upload
- `src/middleware/upload.ts` — new file for multer middleware
- `src/models/user.model.ts` — add avatarUrl field
- `src/utils/image-processor.ts` — new file for image resizing

### Step by Step Tasks

#### 1. Storage Setup
- [ ] [1.1] Create storage.service.ts with S3 upload/delete functions
- [ ] [1.2] Add sharp and multer to dependencies

#### 2. Image Processing
- [ ] [2.1] Create image-processor.ts with resize function (max 500x500)
- [ ] [2.2] Create upload.ts middleware using multer [parallel-safe]

#### 3. API Endpoint
- [ ] [3.1] Add POST /api/users/:id/avatar endpoint to users.ts
- [ ] [3.2] Add DELETE /api/users/:id/avatar endpoint
- [ ] [3.3] Update user.model.ts to include avatarUrl field

#### 4. Database
- [ ] [4.1] Create migration to add avatar_url column to users table

#### 5. Testing
- [ ] [5.1] Add unit tests for image processing
- [ ] [5.2] Add integration tests for avatar upload endpoint

### Acceptance Criteria
- Users can upload avatars
- Avatars are resized
- Old avatars are cleaned up

### Validation Commands
- `npm test`

---

**Known issues in this plan (for verifier reference, not shown to the agent):**
1. Database migration [4.1] should come BEFORE model update [3.3] and API endpoint [3.1] — dependency order is wrong
2. No file size limit specified for uploads (security risk)
3. No file type validation (could upload non-image files)
4. Acceptance criteria are vague — no specific measurable criteria
5. Validation commands are bare minimum — no typecheck, no build, no lint
6. S3 credentials/config not mentioned anywhere
7. No mention of authorization (any user can change any user's avatar via :id param)
8. [3.3] is marked as part of "API Endpoint" group but is a model change — misorganized
9. The `storage.service.ts` references S3 but there's no AWS SDK in the dependency installation step
