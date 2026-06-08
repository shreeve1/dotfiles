---
name: youtube
description: Ingest a YouTube URL, pull subtitles + metadata via yt-dlp, then run web search to verify and augment, producing two separate markdown artifacts (transcript extract vs. web research) under .rpiv/artifacts/youtube/. Use when the user says `/youtube <url>`, "youtube knowledge extract", "pull this youtube and extract", "extract from youtube", or wants a video's claims captured and cross-checked against primary sources.
argument-hint: "<youtube url>"
allowed-tools: Bash, Read, Write, WebSearch, WebFetch
---

# YouTube Knowledge Extract

You are tasked with ingesting a single YouTube video, extracting its claims from the subtitle track, and cross-checking those claims against primary sources on the web. The deliverable is **two separate** markdown documents — one strictly from the video, one strictly from web research — so a reader can tell what came from the creator vs. what came from authoritative sources.

## Input

`$ARGUMENTS` — a YouTube URL (`https://youtu.be/<id>`, `https://www.youtube.com/watch?v=<id>`, etc.).

## Metadata

```!
node "${CLAUDE_SKILL_DIR}/../_shared/now.mjs"
echo
node "${CLAUDE_SKILL_DIR}/../_shared/git-context.mjs"
```

Copy values verbatim — do not reformat the timezone offset.

## Flow

1. Input → 2. Pull (`yt-dlp`) → 3. Parse metadata → 4. Synthesize transcript extract → 5. Web verify + augment → 6. Write both docs → 7. Present

The two artifacts are independent. Do **not** mix transcript-derived claims into `web-research.md` or web-derived claims into `transcript-extract.md`.

## Steps

### Step 1: Input Handling

1. **Argument is empty:**
   ```
   Please provide a YouTube URL.
   ```
   Then wait for input.

2. **Validate URL shape** — must contain a YouTube video host (`youtu.be/`, `youtube.com/watch`, `youtube.com/shorts/`). If it doesn't, stop and ask the user to confirm the URL.

3. **Extract the 11-char video ID** from the URL (the path segment after `youtu.be/`, or the `v` query parameter). Hold it as `VIDEO_ID` for later filename suffixing.

### Step 2: Pull Subtitles + Metadata via `yt-dlp`

1. **Pre-flight: confirm `yt-dlp` is installed.** Run `command -v yt-dlp` via Bash. If it exits non-zero, do **not** create the artifact directory. Report verbatim to the user and stop:

   ```
   yt-dlp not found. Install with: pipx install yt-dlp   (or: pip install -U yt-dlp)
   ```

2. **Stage into a temp directory** so a failed pull leaves no half-written artifact dir. Bind the URL from `$ARGUMENTS` first:

   ```bash
   URL="$ARGUMENTS"
   TMPDIR="$(mktemp -d -t yt-extract-XXXXXX)"
   yt-dlp \
     --skip-download \
     --write-auto-sub \
     --write-sub \
     --sub-lang en \
     --sub-format vtt \
     --write-info-json \
     -o "${TMPDIR}/%(title)s [%(id)s].%(ext)s" \
     "$URL"
   ```

   Flags are **mandatory and exact**:
   `--skip-download --write-auto-sub --write-sub --sub-lang en --sub-format vtt --write-info-json`

   - `--skip-download` keeps it subtitles-only (no `.mp4`).
   - `--write-auto-sub` is the fallback when the channel has no human-uploaded English subs.
   - `--sub-lang en --sub-format vtt` constrains to English VTT.

3. **Handle pull failures** — inspect `yt-dlp`'s exit code and stderr:

   - **Age-restricted / region-blocked / private** (`ERROR: Sign in to confirm`, `Video unavailable`, `is not available`): delete `${TMPDIR}`, report the reason to the user, and stop. Do **not** create the final artifact dir.
   - **No English subtitles at all** (no `.en.vtt` in `${TMPDIR}` after a successful exit): both `--write-sub` and `--write-auto-sub` already attempted. Report unavailable and stop. Audio transcription fallback (Whisper etc.) is out of scope for v1.
   - **Network / DNS / transient**: report stderr verbatim and stop.

4. **Locate the produced files** in `${TMPDIR}`:
   - The `.info.json` (always one).
   - One English VTT. With both `--write-sub` and `--write-auto-sub` set, `yt-dlp` writes the human-uploaded `.en.vtt` if the channel provides one, and otherwise the auto-generated `.en.vtt`. Pick whichever single `.en.vtt` is present — do not assume both exist.

### Step 3: Parse Metadata

Run a `python3` one-liner over the `info.json` to extract a fixed field set. Description is truncated to 500 chars to keep the artifact readable.

```bash
python3 - <<'PY' "${TMPDIR}"/*.info.json
import json, sys
m = json.load(open(sys.argv[1]))
desc = (m.get("description") or "")[:500]
print(f"title:        {m.get('title')}")
print(f"uploader:     {m.get('uploader')}")
print(f"channel:      {m.get('channel')}")
print(f"upload_date:  {m.get('upload_date')}")
print(f"duration:     {m.get('duration')}")
print(f"view_count:   {m.get('view_count')}")
print(f"like_count:   {m.get('like_count')}")
print(f"description:  {desc}")
PY
```

Hold these values in working state — they feed both the directory slug and the transcript-extract front matter.

### Step 4: Materialize the Artifact Directory

Now that the pull succeeded and metadata is in hand, compute the final output path and move the temp files into it.

1. **Compute the slug** from `info.json.title`:
   - Lowercase, replace any run of non-alphanumerics with `-`, strip leading/trailing `-`, cap at ~60 chars.
   - Suffix with `-<VIDEO_ID>` so reruns of the same video idempotently land in the same dir, and different videos with similar titles don't collide.
   - Example: `OpenAI Dreaming V3 — The Quiet Update That Ends RAG` + id `i3mejqRikzk` → `openai-dreaming-v3-the-quiet-update-that-ends-rag-i3mejqRikzk`.

2. **Create the layout:**

   ```
   .rpiv/artifacts/youtube/<slug>-<videoId>/
   ├── transcript-extract.md
   ├── web-research.md
   └── raw/
       ├── <title>.en.vtt
       └── <title>.info.json
   ```

3. **Create the dir and move the pulled files** from `${TMPDIR}` into `raw/`. Keep the original filenames (yt-dlp's `%(title)s [%(id)s]` shape, which contains spaces and `[...]`) so they remain self-identifying when copied out of the repo. **Quote every path** — bracketed `[id]` and spaces both break unquoted shell expansion:

   ```bash
   OUT_DIR=".rpiv/artifacts/youtube/<slug>-<VIDEO_ID>"
   mkdir -p "${OUT_DIR}/raw"
   mv "${TMPDIR}"/*.en.vtt    "${OUT_DIR}/raw/"
   mv "${TMPDIR}"/*.info.json "${OUT_DIR}/raw/"
   rm -rf "${TMPDIR}"
   ```

   Substitute the computed `<slug>-<VIDEO_ID>` from sub-step 1 before running.

### Step 5: Synthesize `transcript-extract.md`

Read the `.en.vtt` from `raw/` and produce a transcript-grounded knowledge document. **This file represents the creator's claims only — no external verification, no primary-source corrections.**

Required sections, in order:

```markdown
---
date: {iso from Metadata block}
author: {author from Metadata block}
source: youtube
url: {original $ARGUMENTS URL}
video_id: {VIDEO_ID}
title: {info.json title}
channel: {info.json channel}
uploader: {info.json uploader}
upload_date: {info.json upload_date}
duration_seconds: {info.json duration}
view_count: {info.json view_count}
like_count: {info.json like_count}
status: transcript-only
last_updated: {same iso as date}
last_updated_by: {author}
---

# Transcript Extract: {title}

## Source Posture
{One-paragraph honest framing of what this video is. Call out reach signals
explicitly: view count, like count, channel size if known. For low-view
and/or single-creator videos, state "This is creator interpretation, not a
primary source — claims below are recorded as the creator presented them
and require independent verification (see web-research.md)."}

## Core Claim
{The single load-bearing claim the video is making, in one or two sentences.}

## Mechanics
{How the video says the thing works — the step-by-step or component-by-component
breakdown as the creator explains it. Stay faithful to the video's framing even
if it sounds wrong; corrections belong in web-research.md.}

## Architecture
{Diagrams, system shape, where the feature sits relative to other components,
named modules / services / models the video references. Bullet form.}

## When It Applies
{The use cases, workloads, or scenarios the video says this is for. Plus any
the video says it's NOT for, if mentioned.}

## Builder Takeaway
{What a developer should walk away thinking they could build / try / measure
after watching. One short paragraph.}

## Description (truncated)
{First 500 chars of info.json description, verbatim.}
```

**Rules for this file:**
- Quote phrasing from the transcript where the exact wording matters (especially for marketing-style claims like "ends RAG" or "X is dead").
- **Do not** insert citations to external sources — that's `web-research.md`'s job.
- **Do** flag low-reach / single-creator videos in `## Source Posture`. The thresholds in the worked example (a 35-view explainer from a small channel) treat the video as creator interpretation, not authoritative.

### Step 6: Synthesize `web-research.md`

Now cross-check what the video said against the open web. **This file represents external evidence only — every non-trivial claim ends with a markdown hyperlink to where it came from.**

1. **Derive search queries** from the transcript extract:
   - The named feature(s) the video introduces (e.g., `OpenAI Dreaming`, `ChatGPT memory dreaming`).
   - The video's core marketing claim (e.g., `Dreaming V3 ends RAG`) — useful for spotting whether anyone else is making the same claim.
   - Upload date plus feature name (e.g., `OpenAI Dreaming June 2026`) — useful for finding the launch announcement.

2. **WebSearch** each query. Aim for 3–5 distinct queries total. Capture the top 3–5 results per query in working state with title + URL + 1-line snippet.

3. **Primary-source fetch via WebFetch** for the most authoritative-looking hit per topic — vendor blogs, official product pages, release notes, the original GitHub repo.

   - Expect occasional **403 Forbidden** (`openai.com` blocked WebFetch in the worked example). When that happens, **do not retry the same URL** — fall back to the highest-signal secondary coverage (e.g., `implicator.ai`, `techtimes.com`, established trade press) that quotes or summarizes the primary source. Note in the artifact which primary URLs were unreachable so a human reader knows what gap to close manually.
   - Other failure modes to handle:
     - **Paywall / login wall** — note it, fall back to secondary.
     - **404 / link rot** — drop the source, search for a replacement.
     - **Timeout** — retry once with a slightly different URL (e.g., trailing slash, AMP version); then drop.

4. **Cross-reference** the transcript extract against what the web returns. Answer three questions explicitly:
   - **What did the video get right?** Where do primary sources confirm the creator's framing?
   - **What did the video oversell?** Marketing claims that primary sources don't support, or that the vendor specifically pulled back from.
   - **What did the video omit?** Facts the primary sources include that materially change the picture (limits, pricing, rollout scope, deprecations).

Required sections, in order:

```markdown
---
date: {iso from Metadata block}
author: {author from Metadata block}
source: web-verification
video_url: {original $ARGUMENTS URL}
video_id: {VIDEO_ID}
topic: "{Feature / claim being verified}"
status: complete
last_updated: {same iso as date}
last_updated_by: {author}
---

# Web Research: {Feature / claim being verified}

## Verification Question
{One sentence — what we set out to verify against external sources.}

## Verdict
**Real / Partially real / Overstated / Fabricated:** {choose one}
{One paragraph synthesizing the evidence. Lead with what primary sources
confirm, then what the video oversold, then what it omitted.}

## What the Video Got Right
- {Claim} — confirmed by [Source title](url)
- ...

## What the Video Oversold
- {Marketing claim} — primary sources say {what they actually say} — [Source title](url)
- ...

## What the Video Omitted
- {Material fact} — [Source title](url)
- ...

## Primary Sources Attempted
{List vendor / official URLs the agent tried to fetch. Mark each as
fetched-ok, 403-blocked, paywalled, 404, or timeout. This makes it
obvious to a human reader which gaps remain.}
- `https://example.com/primary-source` — fetched-ok
- `https://openai.com/index/...` — 403-blocked, fell back to secondary

## Sources
- [Source title 1](https://...)
- [Source title 2](https://...)
- ...
```

**Rules for this file:**
- **Every non-trivial claim** ends with a markdown hyperlink. The WebSearch tool prompt enforces this; the artifact must too.
- **No transcript paraphrasing** without an external source. If only the video says it, it belongs in `transcript-extract.md`, not here.
- The `## Sources` block at the end is a flat list — duplicates of the inline links are fine and expected (it doubles as a bibliography).

### Step 7: Present and Hand Off

Print a short summary, then a footer pointing at both artifacts:

```
Pulled: {title}
{channel} · {duration_seconds}s · {view_count} views · uploaded {upload_date}

Wrote:
- `.rpiv/artifacts/youtube/{slug}/transcript-extract.md`
- `.rpiv/artifacts/youtube/{slug}/web-research.md`

Raw VTT + info.json under `.rpiv/artifacts/youtube/{slug}/raw/`.

Verdict (web research): {Real / Partially real / Overstated / Fabricated}
Primary sources unreachable: {N} (see web-research.md → Primary Sources Attempted)
```

User-facing summary is terse. The two artifact files themselves are written in normal prose so they read cleanly when opened standalone.

## Important Notes

- **Two artifacts, hard separation.** Transcript-derived claims live only in `transcript-extract.md`; web-derived claims live only in `web-research.md`. The split is the whole point of the skill — do not merge them "for convenience".
- **Read-only network posture.** The skill never uploads, never posts, never authenticates. `yt-dlp` is configured with `--skip-download` so no media files are written either. The only writes are inside `.rpiv/artifacts/youtube/`.
- **No half-written artifact dirs.** Stage the `yt-dlp` pull into a `mktemp -d` tmpdir first; only create `.rpiv/artifacts/youtube/<slug>-<videoId>/` after the pull and metadata parse both succeed.
- **Idempotent reruns.** The `<slug>-<videoId>` suffix ensures rerunning the skill on the same URL overwrites the same directory rather than spawning a new one each time.
- **Failure modes, enumerated:**
  - `yt-dlp` missing → install-hint error, no artifact dir created.
  - Age-restricted / region-blocked / private video → graceful fail, no artifact dir created.
  - No English subtitles (after `--write-auto-sub` fallback) → report unavailable, stop. Whisper-style audio transcription is out of scope.
  - `WebFetch` 403 / paywall → fall back to secondary coverage, note the gap in `## Primary Sources Attempted`.
- **Source posture matters.** For low-view / single-creator videos, mark them as creator interpretation in `transcript-extract.md` → `## Source Posture`. Verdict in `web-research.md` is what calibrates the reader to actual ground truth.
- **English only, v1.** Cross-language subtitle support and audio transcription fallback are out of scope unless explicitly requested.
- **Critical ordering**: Follow the numbered steps exactly
  - ALWAYS check `yt-dlp` is installed before staging the pull (Step 2.1)
  - ALWAYS stage into `mktemp -d` first, never write directly into `.rpiv/artifacts/youtube/` (Step 2.2 → Step 4)
  - ALWAYS write `transcript-extract.md` with **no** external citations (Step 5)
  - ALWAYS write `web-research.md` with **every** non-trivial claim cited (Step 6)
  - NEVER mix transcript-only claims and web-verified claims in the same file
