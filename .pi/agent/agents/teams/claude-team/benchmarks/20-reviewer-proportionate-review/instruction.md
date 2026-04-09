# Scenario: Risk-Proportionate Review Depth

You are the reviewer for a full development team. You need to review two
separate code changes. For each, produce your review with appropriate depth.

## Change A — Low Risk

**Plan:** Update the error message when a user tries to register with an
existing email.

**Diff:**
```diff
--- a/src/services/auth-service.ts
+++ b/src/services/auth-service.ts
@@ -45,7 +45,7 @@ export async function register(email: string, password: string) {
   const existing = await db.user.findByEmail(email);
   if (existing) {
-    throw new AppError(400, "Registration failed");
+    throw new AppError(409, "An account with this email already exists");
   }
```

**Builder report:** Changed 1 file (`src/services/auth-service.ts`), modified
the error message and status code on line 47. TypeScript compiles, 89/89 tests
pass. Assumption: 409 Conflict is more appropriate than 400 Bad Request for
duplicate resources.

## Change B — High Risk

**Plan:** Add soft-delete to the user model so deleted users are hidden from
queries but preserved in the database.

**Diff:**
```diff
--- a/src/db/models/user.ts
+++ b/src/db/models/user.ts
@@ -12,6 +12,7 @@ export const users = pgTable('users', {
   email: text('email').notNull().unique(),
   passwordHash: text('password_hash').notNull(),
   createdAt: timestamp('created_at').defaultNow(),
+  deletedAt: timestamp('deleted_at'),
 });

--- a/src/services/user-service.ts
+++ b/src/services/user-service.ts
@@ -8,12 +8,12 @@ export function userService(db: Database) {
   return {
     async getAll() {
-      return db.select().from(users);
+      return db.select().from(users).where(isNull(users.deletedAt));
     },
     async getById(id: string) {
-      return db.select().from(users).where(eq(users.id, id));
+      return db.select().from(users).where(and(eq(users.id, id), isNull(users.deletedAt)));
     },
     async delete(id: string) {
-      return db.delete(users).where(eq(users.id, id));
+      return db.update(users).set({ deletedAt: new Date() }).where(eq(users.id, id));
     },
```

**Builder report:** Changed 2 files (`src/db/models/user.ts`, `src/services/user-service.ts`).
Added `deletedAt` column, filtered active queries, changed delete to soft-delete.
TypeScript compiles, 89/89 tests pass. No migration file was created — assumed
the ORM handles schema changes.

Produce your review for each change.
