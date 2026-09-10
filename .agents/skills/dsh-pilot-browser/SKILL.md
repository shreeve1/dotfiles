---
name: dsh-pilot-browser
description: >-
  Browser automation with the dsh-pilot pilot_* tools (headless Chrome over
  CDP, driven from dsh chat, with the ✈️ cockpit panel as the live view).
  Use when the user wants to drive a browser: log into a site, take actions in
  an account, scrape a page, click/fill forms, upload or download files, or
  take screenshots. Also use when pilot tools or the cockpit are mentioned, or
  when a site's UI hides content in shadow DOM (web components) that plain
  page snapshots cannot see. For Playwright-CLI flows (own browsers,
  --storage-state sessions) use the playwright-browser skill instead.
---

# dsh-pilot browser automation

The dsh harness ships `pilot_*` tools that drive a real headless Chrome/Edge
over CDP, with a live ✈️ cockpit panel in the web GUI (you watch; the agent
drives). This is the playbook for using them well: read pages as text with
numbered refs, act by ref, and know the two things that bite — web-component
(shadow DOM) UIs that text snapshots can't see, and credential-safe login.

## Rules (non-negotiable)

1. **The cockpit is watch-only.** Nobody can type into the page from the
   panel; only the agent's tools can. Never promise the user "log in in the
   cockpit."
2. **Credentials never enter the transcript.** Never ask the user to paste a
   password in chat, and never echo one from a file. Use the secrets-file
   + CDP pattern below.
3. **Act by snapshot ref, never by guessed CSS.** `pilot_snapshot` returns a
   numbered element list; target those refs. Stale refs are expected after
   navigation — re-snapshot.
4. **If the user has Fusion ON**, the orchestrator is withheld `pilot_*`
   (and bash/web_search): delegate browser work to a worker subagent instead
   of calling the tools directly. **The worker gets its own pilot browser
   session** (the cockpit has a session switcher) — a login done by the
   orchestrator does not carry over; re-run the login (secrets file +
   helper) inside the worker.
5. **First pilot call may time out** while the browser boots — retry once
   before diagnosing.

## The loop

### 1. Open and read
`pilot_open(url)` — on CDP timeout, curl the site once (reachable ≠ the
browser issue) then retry. Follow with `pilot_snapshot` for a text-first
numbered view. For SPAs, `pilot_wait_for` a visible marker (title/text)
before re-snapshotting.

*Done when:* you have a numbered list of the page's interactive elements, or
a concrete failure to report.

### 2. Fill, click, submit — by ref
`pilot_type` / `pilot_fill` for inputs, `pilot_click` on refs, `pilot_press`
for Enter/Escape/Tab, `pilot_upload` for file inputs (absolute paths),
`pilot_download` to fetch a resource through the page (inherits session
cookies — use for downloads behind login).
Verify each effect with `pilot_diff` or a targeted re-read.

*Done when:* the action produced its observable effect (nav, state change,
dialog), not merely "no error."

### 3. Credential-safe login
- Hand the user this exact snippet (swap `<name>` for a short site name,
  e.g. `ha-login`, and fill in the two placeholders), verify the file exists
  with 2 lines and mode 600 — never print its contents — then say go:

```bash
mkdir -p ~/.dsh/secrets && chmod 700 ~/.dsh/secrets
printf 'YOUR_USERNAME\nYOUR_PASSWORD\n' > ~/.dsh/secrets/<name> && chmod 600 ~/.dsh/secrets/<name>
```

  If the password contains quotes, `$`, or backticks, `printf` will mangle
  it — use a quoted heredoc instead (nothing is interpreted):
  `cat > ~/.dsh/secrets/<name> <<'EOF'` then the username / password on two
  lines, then `EOF`.

- When the user confirms, read the file into `DSH_LOGIN_USER`/`DSH_LOGIN_PASS`
  env vars at runtime (e.g. `CREDS=$(cat ~/.dsh/secrets/<name>);
  DSH_LOGIN_USER=$(sed -n 1p <<<"$CREDS") DSH_LOGIN_PASS=$(sed -n 2p <<<"$CREDS")
  node scripts/cdp-eval.mjs …`), then call `scripts/cdp-eval.mjs` with the
  login expression template in the reference below: native setters +
  input/change events, then click submit (searching shadow roots too).
- After submit: follow redirects (SPA auth-callback hops). If a 2FA /
  one-time-code challenge appears, use the same secrets-file pattern (the
  user writes the current code to the file, you inject immediately — codes
  expire) — never ask the user to paste it in chat. If the site uses an
  external identity provider you cannot drive, report that honestly and stop.
- Some login buttons live inside shadow DOM and have no queryable text —
  find them by walking `shadowRoot`s and, if needed, click by coordinates
  with `Input.dispatchMouseEvent` (snippet in reference).

*Done when:* `location.href` is past the login page AND a logged-in marker
(element/title) exists — check both, they're independent.

### 4. Shadow-DOM pages
Text snapshots only see light DOM. For web-component UIs (Home Assistant,
many dashboards), walk `shadowRoot`s with `scripts/cdp-eval.mjs`
(`Runtime.evaluate`): count elements, read entity labels/titles, click
deep elements, read `document.body.innerText`. Use `pilot_eval` for quick
reads; use the helper for anything the snapshot must not contain
(credentials) or that needs shadow traversal.

*Done when:* the information or effect that light DOM couldn't give you is
in hand.

### 5. Verify and close
Confirm the user-visible result; save artifacts (screenshots/downloads) to
disk and report their paths, not raw bytes. When the session's browser work
is finished, tell the user the secrets file can be removed
(`rm ~/.dsh/secrets/<name>`) — and note that login state lives in the pilot
browser and is lost on pilot restart/relaunch (re-login takes seconds with
the same secrets file).

*Done when:* the user's task has a stated outcome or a stated blocker.

## Reference

### Helper: `scripts/cdp-eval.mjs`

Runs a JS expression in the dsh-pilot browser's active page over CDP.

```bash
node .claude/skills/dsh-pilot-browser/scripts/cdp-eval.mjs '<url-substring>' '<js expression>'
# env: DSH_LOGIN_USER, DSH_LOGIN_PASS exported before the call become page
# globals inside the expression (for login fills):
#   DSH_LOGIN_USER=... DSH_LOGIN_PASS=... node cdp-eval.mjs ...
```

It scans ports 9222-9262 for the pilot browser, picks the first page target
whose URL contains the substring, evaluates the expression with
`returnByValue`, and prints the JSON result. Node ≥22 (native WebSocket).
If it can't find a target, boot the browser first with `pilot_open(url)`;
use the most specific URL substring you can (first match wins — multiple
tabs are common).

### Login expression template

```js
(() => {
  const u = DSH_LOGIN_USER, p = DSH_LOGIN_PASS; // injected as page globals by cdp-eval.mjs
  const set = (el, v) => {
    Object.getOwnPropertyDescriptor(HTMLInputElement.prototype, 'value').set.call(el, v);
    el.dispatchEvent(new Event('input', { bubbles: true }));
    el.dispatchEvent(new Event('change', { bubbles: true }));
  };
  const name = document.querySelector('input[type=text]') || document.querySelector('input[name=username]');
  const pass = document.querySelector('input[type=password]');
  if (!name || !pass) return { ok: false, reason: 'inputs not found' };
  set(name, u); set(pass, p);
  // find submit across shadow roots; text often lives in a slot:
  (function walk(root) {
    for (const el of root.querySelectorAll('*')) {
      if (el.shadowRoot) walk(el.shadowRoot);
      if (el.tagName.toLowerCase() === 'button' && (el.type === 'submit' || /log ?in|sign ?in/.test(el.textContent || ''))) { el.click(); return true; }
    }
    return false;
  })(document);
  return { ok: true };
})()
```

Then wait ~6-10 s and check `location.href` + a logged-in marker from the
same page (see step 3's completion criterion). **If `el.click()` doesn't
navigate (web-component submits often ignore it), fall back to the
coordinate click** in the next section — that is the battle-tested path
(Home Assistant's `ha-button` needed it).

### Click by coordinates (shadow-DOM button without queryable text)

```js
// pilot may be on any port in 9222-9262 — scan like cdp-eval.mjs does:
for (let port = 9222; port <= 9262; port++) {
  const r = await fetch(`http://127.0.0.1:${port}/json`).then(r => r.json()).catch(() => null);
  // first page target whose url includes your substring -> webSocketDebuggerUrl
}
// then over that WebSocket:
//   Runtime.evaluate: getBoundingClientRect() center of the target element
//   Input.dispatchMouseEvent mousePressed + mouseReleased at (x, y), left
```

### Ports and CDP facts

- Pilot browser listens on the first free port in `http://127.0.0.1:9222-9262`.
- `GET /json/version` = it's up; `GET /json` lists page targets with
  `webSocketDebuggerUrl` (the CDP channel).
- One pilot browser per plugin; each page target is one tab.

### Gotcha archive

- **Helper env vars are `DSH_LOGIN_USER`/`DSH_LOGIN_PASS`** — a plain
  `USER`/`PASS` collision with the shell's own `USER` would inject the
  wrong username. Never shorten them.
- **Cockpit watch-only** → rule 1.
- **Shadow DOM invisible to snapshots** → use the helper / shadow walking.
- **`ha-button`-style wrappers**: display is `block`, the label is a slot
  text node — `textContent` of the outer element can be empty; check
  `getBoundingClientRect()` and the inner slotted text.
- **Anti-bot challenges** (Cloudflare-style) may still block headless use;
  report it honestly, don't fight it.
- **`playwright-browser` skill** is the alternative when you need your own
  persistent, named browser sessions — pilot's browser is shared and its
  state is tied to the running pilot process.