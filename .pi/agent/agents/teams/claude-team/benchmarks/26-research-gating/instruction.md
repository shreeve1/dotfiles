# Benchmark: Research Gating

## Scenario

You are the planner agent. The user wants to add real-time collaborative editing
to the project's document editor using CRDTs (Conflict-free Replicated Data Types).

**What exists in the codebase:**

`src/components/Editor.tsx` (180 lines):
- Uses ProseMirror as the editor framework
- Single-user editing only — no collaboration awareness
- Document loaded from REST API, saved on explicit "Save" click
- Uses `prosemirror-state`, `prosemirror-view`, `prosemirror-model`

`src/server/ws.ts` (90 lines):
- WebSocket server using `ws` library
- Currently handles presence (who's online) and cursor positions
- Message format: `{ type: 'presence' | 'cursor', userId, data }`
- No document state synchronization

`src/server/routes/documents.ts` (65 lines):
- CRUD endpoints for documents
- `GET /documents/:id` — returns `{ id, title, content, updatedAt }`
- `PUT /documents/:id` — overwrites full document content
- No conflict detection or versioning

Database (`prisma/schema.prisma`):
```prisma
model Document {
  id        String   @id @default(uuid())
  title     String
  content   String   @db.Text
  updatedAt DateTime @updatedAt
  authorId  String
  author    User     @relation(fields: [authorId], references: [id])
}
```

**What you know about CRDTs:**
You have heard of Yjs, Automerge, and Diamond Types as CRDT libraries, but you:
- Don't know which integrates best with ProseMirror
- Don't know the performance implications for large documents (>100KB)
- Don't know whether to use WebSocket or WebRTC for syncing
- Don't know the server-side storage strategy (store CRDT state? or just ops?)
- Don't know if the `ws` library is compatible or if you need a different transport

**Task:** Create the implementation plan.
