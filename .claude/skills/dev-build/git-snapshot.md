# Git snapshot mechanics (throwaway index)

External reference — the single source for capturing a working-tree snapshot that
includes uncommitted AND untracked changes, without ever mutating the user's real
git index. Consumed by `dev-build` Phase 5 (PRE-wave snapshot) and Phase 7.5.1
(POST-wave snapshot + diff). Both reach it via the phrase *throwaway-index
snapshot*; change the mechanics here, not at each call site.

## Why a throwaway index

`<ref>..HEAD` comparisons silently miss uncommitted edits and untracked new files.
A working-tree snapshot fixes that. But the obvious `git add -A; git write-tree;
git reset` is wrong: the `git reset` is a mixed reset that silently unstages
whatever the user had staged before the build ran. Build the tree in a throwaway
index via `GIT_INDEX_FILE` instead, so the real index is never touched.

Set `REPO_ROOT` once per build: `REPO_ROOT=$(git rev-parse --show-toplevel 2>/dev/null || pwd)`.

## Capture a snapshot (PRE or POST — same procedure)

```bash
TMP_INDEX=$(mktemp /tmp/devbuild-index-XXXXXX)
GIT_INDEX_FILE="$TMP_INDEX" git -C "$REPO_ROOT" add -A
SNAPSHOT=$(GIT_INDEX_FILE="$TMP_INDEX" git -C "$REPO_ROOT" write-tree)
rm -f "$TMP_INDEX"
```

- Phase 5 stores the result as `PRE_WAVE_SNAPSHOT`.
- Phase 7.5.1 stores the result as `POST_WAVE_SNAPSHOT`.

## Diff the two snapshots

`<files_touched_by_wave>` is the union of the `Files changed:` paths the wave's
builders reported (Phase 6). Write the diff to the wave's patch file:

```bash
git -C "$REPO_ROOT" diff "$PRE_WAVE_SNAPSHOT" "$POST_WAVE_SNAPSHOT" -- <files_touched_by_wave> > /tmp/build_wave_<N>_diff.patch
```

If `<files_touched_by_wave>` is empty (the wave declared no file scope and
builders reported no paths), diff without the path filter, and set
`files_audited` in the state YAML to the full changed set from this diff:

```bash
git -C "$REPO_ROOT" diff "$PRE_WAVE_SNAPSHOT" "$POST_WAVE_SNAPSHOT" > /tmp/build_wave_<N>_diff.patch
```

On a post-fix re-audit (Phase 7.5.5 step 5), re-capture `POST_WAVE_SNAPSHOT`
(now reflecting the fixes) and write to `/tmp/build_wave_<N>_reaudit_diff.patch`
so the original `..._diff.patch` is preserved.

## Empty-diff handling (caller decides — kept inline in SKILL.md)

The mechanics above just produce a patch. What to do when that patch is zero
bytes is a Phase 7.5.1 decision (the `doc_only` vs `zero_diff` branches), so it
lives in `SKILL.md`, not here.
