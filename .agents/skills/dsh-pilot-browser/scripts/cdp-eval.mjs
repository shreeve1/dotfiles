#!/usr/bin/env node
// cdp-eval.mjs — run a JS expression in the dsh-pilot browser's page over CDP.
// Usage: node cdp-eval.mjs '<url-substring>' '<js expression>'
// Env (optional): DSH_LOGIN_USER, DSH_LOGIN_PASS — injected into the page as
// globals (for login fills). Credentials never print.
// NOTE: deliberately NOT plain USER/PASS — USER is already set in most shells,
// so a forgotten export would inject the machine username into a login form.
const [sub, expr] = process.argv.slice(2);
if (!sub || !expr) { console.error('usage: node cdp-eval.mjs <url-substring> <js-expression>'); process.exit(2); }

let target = null;
for (let port = 9222; port <= 9262; port++) {
  try {
    const version = await fetch(`http://127.0.0.1:${port}/json/version`, { signal: AbortSignal.timeout(800) });
    if (!version.ok) continue;
    const pages = await (await fetch(`http://127.0.0.1:${port}/json`, { signal: AbortSignal.timeout(800) })).json();
    const t = pages.find((x) => x.type === 'page' && x.url.includes(sub));
    if (t) { target = t; break; }
  } catch { /* try next port */ }
}
// error hint for the common "browser not running" case
if (!target) {
  console.error(`cdp-eval: no pilot page target matching "${sub}" — boot the browser first with pilot_open('<url>'), then retry. If a tab is open, pass a more specific url-substring (first match wins).`);
  process.exit(1);
}

const ws = new WebSocket(target.webSocketDebuggerUrl);
let id = 0; const pending = new Map();
const send = (method, params = {}) => new Promise((res) => { const i = ++id; pending.set(i, res); ws.send(JSON.stringify({ id: i, method, params })); });
ws.onmessage = (e) => { const m = JSON.parse(e.data); if (m.id && pending.has(m.id)) { pending.get(m.id)(m); pending.delete(m.id); } };
await new Promise((res, rej) => { ws.onopen = res; ws.onerror = rej; });

const prefix = Object.entries({ DSH_LOGIN_USER: process.env.DSH_LOGIN_USER, DSH_LOGIN_PASS: process.env.DSH_LOGIN_PASS })
  .filter(([, v]) => v !== undefined && v !== '')
  .map(([k, v]) => `const ${k} = ${JSON.stringify(v)};`)
  .join(' ');

const r = await send('Runtime.evaluate', { expression: `${prefix}\n${expr}`, returnByValue: true, awaitPromise: true });
ws.close();
if (r.result?.exceptionDetails) {
  console.error('cdp-eval: exception: ' + JSON.stringify(r.result.exceptionDetails.exception?.description ?? r.result.exceptionDetails));
  process.exit(1);
}
console.log(JSON.stringify(r.result?.result?.value ?? null, null, 1));
process.exit(0);