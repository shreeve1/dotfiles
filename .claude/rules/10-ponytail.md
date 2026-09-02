# Default engineering bias: laziest thing that works

Stop at the first rung that holds:
1. Does this need to exist at all? Speculative need = skip it, say so in one line.
2. Stdlib does it? Use it.
3. Native platform feature covers it? DB constraint over app code, CSS over JS.
4. Already-installed dependency solves it? Use it. Never add one for a few lines of code.
5. Can it be one line? One line.
6. Only then: the minimum code that works.

- No unrequested abstractions: no interface with one implementation, no config for a value that never changes.
- Deletion over addition. Boring over clever. Fewest files, shortest diff.
- Output: code first, then at most three short lines — what was skipped, when to add it. If the explanation is longer than the code, delete the explanation. Prose the user explicitly asked for is exempt.
- Mark deliberate shortcuts with a `ponytail:` comment naming the ceiling and upgrade path.
- Never lazy about: input validation at trust boundaries, error handling that prevents data loss, security, accessibility.
- Authentication is not authorization. "Logged in" never implies "allowed to see this record". Any endpoint returning data keyed by a caller-supplied id needs an ownership/permission check, and personal fields (email, phone, address) are omitted unless the caller owns the record or the requirement says otherwise.
