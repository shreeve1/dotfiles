import { createRequire as __pilensCreateRequire } from "node:module"; const require = __pilensCreateRequire(import.meta.url);

// dist/clients/bounded-cache.js
var BoundedFifoMap = class {
  entries = /* @__PURE__ */ new Map();
  maxEntries;
  constructor(maxEntries) {
    this.maxEntries = maxEntries;
  }
  get(key) {
    return this.entries.get(key);
  }
  has(key) {
    return this.entries.has(key);
  }
  /**
   * Insert or update `key` without reordering. Evicts the oldest
   * (insertion-order) entries once the map exceeds capacity.
   *
   * Returns the evicted `[key, value]` pairs, oldest first — callers with
   * eviction-side bookkeeping use the return value instead of hand-rolling
   * `keys().next().value` (#2442). The VALUE is returned, not just the key,
   * because the eviction-coupled sites need it: `tree-sitter-cache.ts` has to
   * retire the dropped entry's WASM-heap tree (#417/#890) and
   * `tree-sitter-client.ts` has to `delete()` the dropped compiled query.
   * Handing back only the key would force those sites to read the value out
   * of the map before eviction — i.e. to hand-roll the block this class
   * exists to delete.
   */
  set(key, value) {
    this.entries.set(key, value);
    return this.evictOverflow();
  }
  /**
   * Change the capacity ceiling, evicting down to it immediately when it
   * shrinks. Returns the evicted `[key, value]` pairs, oldest first, on the
   * same contract as {@link set} — a caller with a DYNAMIC cap (an env-read
   * ceiling, `TreeCache.setMaxSize`) needs the shrink to free the same
   * resources an ordinary overflow frees.
   */
  setMaxEntries(maxEntries) {
    this.maxEntries = maxEntries;
    return this.evictOverflow();
  }
  /** Current capacity ceiling. */
  getMaxEntries() {
    return this.maxEntries;
  }
  /** Drop oldest-first until within capacity. The one eviction block. */
  evictOverflow() {
    const evicted = [];
    while (this.entries.size > this.maxEntries) {
      const oldest = this.entries.entries().next().value;
      if (oldest === void 0)
        break;
      this.entries.delete(oldest[0]);
      evicted.push(oldest);
    }
    return evicted;
  }
  delete(key) {
    return this.entries.delete(key);
  }
  clear() {
    this.entries.clear();
  }
  get size() {
    return this.entries.size;
  }
  keys() {
    return this.entries.keys();
  }
  values() {
    return this.entries.values();
  }
  entriesArray() {
    return [...this.entries.entries()];
  }
  [Symbol.iterator]() {
    return this.entries[Symbol.iterator]();
  }
};
var BoundedSet = class {
  entries;
  constructor(maxEntries) {
    this.entries = new BoundedFifoMap(maxEntries);
  }
  has(value) {
    return this.entries.has(value);
  }
  /**
   * Insert `value` without reordering an already-present member. Evicts the
   * oldest (insertion-order) members once the set exceeds capacity.
   *
   * Returns the evicted values, oldest first — see the class doc for why a
   * call site consumes this instead of hand-rolling the drop.
   */
  add(value) {
    return this.entries.set(value, true).map(([evicted]) => evicted);
  }
  /**
   * Change the capacity ceiling, evicting down to it immediately when it
   * shrinks. Returns the evicted values, oldest first, on the same contract
   * as {@link add}.
   */
  setMaxEntries(maxEntries) {
    return this.entries.setMaxEntries(maxEntries).map(([evicted]) => evicted);
  }
  /** Current capacity ceiling. */
  getMaxEntries() {
    return this.entries.getMaxEntries();
  }
  delete(value) {
    return this.entries.delete(value);
  }
  clear() {
    this.entries.clear();
  }
  get size() {
    return this.entries.size;
  }
  values() {
    return this.entries.keys();
  }
  [Symbol.iterator]() {
    return this.entries.keys();
  }
};
var BoundedLruCache = class extends BoundedFifoMap {
  /**
   * Read and promote to most-recently-used.
   *
   * A stored `undefined` value is NOT promoted — the hit is indistinguishable
   * from a miss on this signature, and pre-#2442 `BoundedLruCache` behaved
   * the same way. No caller stores `undefined`; the note exists so a future
   * one does not assume otherwise.
   */
  get(key) {
    const value = this.entries.get(key);
    if (value !== void 0) {
      this.entries.delete(key);
      this.entries.set(key, value);
    }
    return value;
  }
  /** Insert or update `key`, moving it to the most-recently-used position. */
  set(key, value) {
    this.entries.delete(key);
    return super.set(key, value);
  }
};

// node_modules/balanced-match/dist/esm/index.js
var balanced = (a, b, str) => {
  const ma = a instanceof RegExp ? maybeMatch(a, str) : a;
  const mb = b instanceof RegExp ? maybeMatch(b, str) : b;
  const r = ma !== null && mb != null && range(ma, mb, str);
  return r && {
    start: r[0],
    end: r[1],
    pre: str.slice(0, r[0]),
    body: str.slice(r[0] + ma.length, r[1]),
    post: str.slice(r[1] + mb.length)
  };
};
var maybeMatch = (reg, str) => {
  const m = str.match(reg);
  return m ? m[0] : null;
};
var range = (a, b, str) => {
  let begs, beg, left, right = void 0, result;
  let ai = str.indexOf(a);
  let bi = str.indexOf(b, ai + 1);
  let i = ai;
  if (ai >= 0 && bi > 0) {
    if (a === b) {
      return [ai, bi];
    }
    begs = [];
    left = str.length;
    while (i >= 0 && !result) {
      if (i === ai) {
        begs.push(i);
        ai = str.indexOf(a, i + 1);
      } else if (begs.length === 1) {
        const r = begs.pop();
        if (r !== void 0)
          result = [r, bi];
      } else {
        beg = begs.pop();
        if (beg !== void 0 && beg < left) {
          left = beg;
          right = bi;
        }
        bi = str.indexOf(b, i + 1);
      }
      i = ai < bi && ai >= 0 ? ai : bi;
    }
    if (begs.length && right !== void 0) {
      result = [left, right];
    }
  }
  return result;
};

// node_modules/brace-expansion/dist/esm/index.js
var escSlash = "\0SLASH" + Math.random() + "\0";
var escOpen = "\0OPEN" + Math.random() + "\0";
var escClose = "\0CLOSE" + Math.random() + "\0";
var escComma = "\0COMMA" + Math.random() + "\0";
var escPeriod = "\0PERIOD" + Math.random() + "\0";
var escSlashPattern = new RegExp(escSlash, "g");
var escOpenPattern = new RegExp(escOpen, "g");
var escClosePattern = new RegExp(escClose, "g");
var escCommaPattern = new RegExp(escComma, "g");
var escPeriodPattern = new RegExp(escPeriod, "g");
var slashPattern = /\\\\/g;
var openPattern = /\\{/g;
var closePattern = /\\}/g;
var commaPattern = /\\,/g;
var periodPattern = /\\\./g;
var EXPANSION_MAX = 1e5;
var EXPANSION_MAX_LENGTH = 4e6;
var EXPANSION_MAX_DEPTH = 1e3;
var EXPANSION_MAX_REWRITES = 1e3;
function numeric(str) {
  return !isNaN(str) ? parseInt(str, 10) : str.charCodeAt(0);
}
function escapeBraces(str) {
  return str.replace(slashPattern, escSlash).replace(openPattern, escOpen).replace(closePattern, escClose).replace(commaPattern, escComma).replace(periodPattern, escPeriod);
}
function unescapeBraces(str) {
  return str.replace(escSlashPattern, "\\").replace(escOpenPattern, "{").replace(escClosePattern, "}").replace(escCommaPattern, ",").replace(escPeriodPattern, ".");
}
function pushAll(target, items) {
  for (let i = 0; i < items.length; i++) {
    target.push(items[i]);
  }
}
function parseCommaParts(str) {
  const parts = [];
  let carry = "";
  for (; ; ) {
    const m = balanced("{", "}", str);
    if (!m) {
      const tail = str.split(",");
      tail[0] = carry + tail[0];
      pushAll(parts, tail);
      return parts;
    }
    const { pre, body, post } = m;
    const p = pre.split(",");
    p[0] = carry + p[0];
    p[p.length - 1] += "{" + body + "}";
    if (!post.length) {
      pushAll(parts, p);
      return parts;
    }
    carry = p.pop();
    pushAll(parts, p);
    str = post;
  }
}
function expand(str, options = {}) {
  if (!str) {
    return [];
  }
  const { max = EXPANSION_MAX, maxLength = EXPANSION_MAX_LENGTH, maxDepth = EXPANSION_MAX_DEPTH, maxRewrites = EXPANSION_MAX_REWRITES } = options;
  if (str.slice(0, 2) === "{}") {
    str = "\\{\\}" + str.slice(2);
  }
  return expand_(escapeBraces(str), max, maxLength, maxDepth, 0, maxRewrites, true).map(unescapeBraces);
}
function embrace(str) {
  return "{" + str + "}";
}
function isPadded(el) {
  return /^-?0\d/.test(el);
}
function lte(i, y) {
  return i <= y;
}
function gte(i, y) {
  return i >= y;
}
function combine(acc, pre, values, max, maxLength, dropEmpties) {
  const out = [];
  let length = 0;
  for (let a = 0; a < acc.length; a++) {
    for (let v = 0; v < values.length; v++) {
      if (out.length >= max)
        return out;
      const expansion = acc[a] + pre + values[v];
      if (dropEmpties && !expansion)
        continue;
      if (length + expansion.length > maxLength)
        return out;
      out.push(expansion);
      length += expansion.length;
    }
  }
  return out;
}
function expandSequence(body, isAlphaSequence, max, maxLength) {
  const n = body.split(/\.\./);
  const N = [];
  if (n[0] === void 0 || n[1] === void 0) {
    return N;
  }
  const x = numeric(n[0]);
  const y = numeric(n[1]);
  const width = Math.max(n[0].length, n[1].length);
  let incr = n.length === 3 && n[2] !== void 0 ? Math.max(Math.abs(numeric(n[2])), 1) : 1;
  let test = lte;
  const reverse = y < x;
  if (reverse) {
    incr *= -1;
    test = gte;
  }
  const pad = n.some(isPadded);
  let length = 0;
  for (let i = x; test(i, y) && N.length < max; i += incr) {
    let c;
    if (isAlphaSequence) {
      c = String.fromCharCode(i);
      if (c === "\\") {
        c = "";
      }
    } else {
      c = String(i);
      if (pad) {
        const need = width - c.length;
        if (need > 0) {
          const z = new Array(need + 1).join("0");
          if (i < 0) {
            c = "-" + z + c.slice(1);
          } else {
            c = z + c;
          }
        }
      }
    }
    if (length + c.length > maxLength)
      break;
    N.push(c);
    length += c.length;
  }
  return N;
}
function expand_(str, max, maxLength, maxDepth, depth, maxRewrites, isTop) {
  if (depth > maxDepth) {
    return [str];
  }
  let acc = [""];
  let rewrites = 0;
  let dropEmpties = false;
  let firstGroup = true;
  for (; ; ) {
    const m = balanced("{", "}", str);
    if (!m) {
      return combine(acc, str, [""], max, maxLength, dropEmpties);
    }
    const pre = m.pre;
    if (/\$$/.test(pre)) {
      acc = combine(acc, pre + "{" + m.body + "}", [""], max, maxLength, dropEmpties && !m.post.length);
      firstGroup = false;
      if (!m.post.length)
        break;
      str = m.post;
      continue;
    }
    const isNumericSequence = /^-?\d+\.\.-?\d+(?:\.\.-?\d+)?$/.test(m.body);
    const isAlphaSequence = /^[a-zA-Z]\.\.[a-zA-Z](?:\.\.-?\d+)?$/.test(m.body);
    const isSequence = isNumericSequence || isAlphaSequence;
    const isOptions = m.body.indexOf(",") >= 0;
    if (!isSequence && !isOptions) {
      if (rewrites < maxRewrites && m.post.match(/,(?!,).*\}/)) {
        rewrites++;
        str = m.pre + "{" + m.body + escClose + m.post;
        isTop = true;
        continue;
      }
      return combine(acc, pre + "{" + m.body + "}" + m.post, [""], max, maxLength, dropEmpties);
    }
    if (firstGroup) {
      dropEmpties = isTop && !isSequence;
      firstGroup = false;
    }
    let values;
    if (isSequence) {
      values = expandSequence(m.body, isAlphaSequence, max, maxLength);
    } else {
      let n = parseCommaParts(m.body);
      if (n.length === 1 && n[0] !== void 0) {
        n = expand_(n[0], max, maxLength, maxDepth, depth + 1, maxRewrites, false).map(embrace);
        if (n.length === 1) {
          acc = combine(acc, pre + n[0], [""], max, maxLength, dropEmpties && !m.post.length);
          if (!m.post.length)
            break;
          str = m.post;
          continue;
        }
      }
      let dropsEmpties = dropEmpties && !m.post.length && !pre;
      for (let d = 0; dropsEmpties && d < acc.length; d++) {
        if (acc[d]) {
          dropsEmpties = false;
        }
      }
      values = [];
      let valuesLength = 0;
      outer: for (let j = 0; j < n.length; j++) {
        const expanded = expand_(n[j], max, maxLength, maxDepth, depth + 1, maxRewrites, false);
        for (let k = 0; k < expanded.length; k++) {
          const v = expanded[k];
          if (dropsEmpties && !v)
            continue;
          if (values.length >= max || valuesLength + v.length > maxLength) {
            break outer;
          }
          values.push(v);
          valuesLength += v.length;
        }
      }
    }
    acc = combine(acc, pre, values, max, maxLength, dropEmpties && !m.post.length);
    if (!m.post.length)
      break;
    str = m.post;
  }
  return acc;
}

// node_modules/@isaacs/nonrecursive-glob-match/dist/esm/parse-class.js
var posixClasses = {
  "[:alnum:]": ["\\p{L}\\p{Nl}\\p{Nd}"],
  "[:alpha:]": ["\\p{L}\\p{Nl}"],
  "[:ascii:]": ["\\x00-\\x7f"],
  "[:blank:]": ["\\p{Zs}\\t"],
  "[:cntrl:]": ["\\p{Cc}"],
  "[:digit:]": ["\\p{Nd}"],
  "[:graph:]": ["\\p{Z}\\p{C}", true],
  "[:lower:]": ["\\p{Ll}"],
  "[:print:]": ["\\p{C}", true],
  "[:punct:]": ["\\p{P}\\p{S}"],
  "[:space:]": ["\\p{Z}\\t\\r\\n\\v\\f"],
  "[:upper:]": ["\\p{Lu}"],
  "[:word:]": ["\\p{L}\\p{Nl}\\p{Nd}\\p{Pc}"],
  "[:xdigit:]": ["A-Fa-f0-9"]
};
var braceEscape = (s) => s.replace(/[[\]\\-]/g, "\\$&");
var noMatch = /$./;
var parseClass = (glob, position, nocase = false, form) => {
  const norm = (c) => {
    const n = form ? c.normalize(form) : c;
    return [...n].length === 1 ? n : c;
  };
  const pos = position;
  if (glob.charAt(pos) !== "[") {
    throw new Error("not in a brace expression");
  }
  const ranges = [];
  const negs = [];
  let i = pos + 1;
  let sawStart = false;
  let escaping = false;
  let negate = false;
  let endPos = pos;
  let rangeStart = "";
  WHILE: while (i < glob.length) {
    const c = String.fromCodePoint(glob.codePointAt(i));
    if ((c === "!" || c === "^") && i === pos + 1) {
      negate = true;
      i++;
      continue;
    }
    if (c === "]" && sawStart && !escaping) {
      endPos = i + 1;
      break;
    }
    sawStart = true;
    if (c === "\\") {
      if (!escaping) {
        escaping = true;
        i++;
        continue;
      }
    }
    if (c === "[" && !escaping) {
      for (const [cls, [unip, neg]] of Object.entries(posixClasses)) {
        if (glob.startsWith(cls, i)) {
          if (rangeStart) {
            return [noMatch, glob.length - pos];
          }
          i += cls.length;
          if (neg)
            negs.push(unip);
          else
            ranges.push(unip);
          continue WHILE;
        }
      }
    }
    escaping = false;
    const n = norm(c);
    if (rangeStart) {
      if (n.codePointAt(0) > rangeStart.codePointAt(0)) {
        ranges.push(braceEscape(rangeStart) + "-" + braceEscape(n));
      } else if (n === rangeStart) {
        ranges.push(braceEscape(n));
      }
      rangeStart = "";
      i += c.length;
      continue;
    }
    if (glob.startsWith("-]", i + c.length)) {
      ranges.push(braceEscape(n + "-"));
      i += c.length + 1;
      continue;
    }
    if (glob.startsWith("-", i + c.length)) {
      rangeStart = n;
      i += c.length + 1;
      continue;
    }
    ranges.push(braceEscape(n));
    i += c.length;
  }
  if (endPos < i) {
    return [noMatch, 0];
  }
  if (!ranges.length && !negs.length) {
    return [noMatch, glob.length - pos];
  }
  const sranges = "[" + (negate ? "^" : "") + ranges.join("") + "]";
  const snegs = "[" + (negate ? "" : "^") + negs.join("") + "]";
  const comb = "^" + (ranges.length && negs.length ? "(" + sranges + "|" + snegs + ")" : ranges.length ? sranges : snegs);
  return [new RegExp(comb, nocase ? "iu" : "u"), endPos - pos];
};

// node_modules/@isaacs/nonrecursive-glob-match/dist/esm/index.js
var MATCH = { t: "match", id: 0 };
var extTypes = "!?+*@";
var lit = (ch) => ({ t: "lit", ch });
var reEscape = (s) => s.replace(/[\\^$.*+?()[\]{}|/]/g, "\\$&");
var newFoldRe = (s) => new RegExp(`^${reEscape(s)}$`, "iu");
var foldCache = /* @__PURE__ */ new Map();
var foldRe = (ch) => {
  let re = foldCache.get(ch);
  if (!re) {
    re = newFoldRe(ch);
    if (foldCache.size >= 1e3)
      foldCache.clear();
    foldCache.set(ch, re);
  }
  return re;
};
var litMatch = (l, c) => {
  if (c === l.ch)
    return true;
  if (!l.re)
    return false;
  const code = c.charCodeAt(0);
  if (code >= 128)
    return l.re.test(c);
  const ascii = l.ascii ??= new Uint8Array(128);
  ascii[code] ||= l.re.test(c) ? 1 : 2;
  return ascii[code] === 1;
};
var tokenize = (p, nocase, noext, form) => {
  const toks = [];
  for (let i = 0; i < p.length; ) {
    const c = String.fromCodePoint(p.codePointAt(i));
    if (c === "\\") {
      const e = p.codePointAt(i + 1);
      const ch = e === void 0 ? c : String.fromCodePoint(e);
      toks.push(lit(ch));
      i += 1 + ch.length;
      continue;
    }
    if (c === "[") {
      const [re, consumed] = parseClass(p, i, nocase, form);
      if (consumed) {
        toks.push({ t: "class", re });
        i += consumed;
        continue;
      }
    }
    if (!noext && extTypes.includes(c) && p[i + 1] === "(") {
      toks.push({ t: "open", type: c });
      i += 2;
      continue;
    }
    toks.push(!noext && c === "|" ? { t: "bar" } : !noext && c === ")" ? { t: "close" } : c === "*" ? { t: "star" } : c === "?" ? { t: "any" } : lit(c));
    i += c.length;
  }
  return toks;
};
var pair = (toks) => {
  const pairs = /* @__PURE__ */ new Map();
  const stack = [];
  toks.forEach((tok, i) => {
    if (tok.t === "open")
      stack.push(i);
    else if (tok.t === "close" && stack.length)
      pairs.set(stack.pop(), i);
  });
  return pairs;
};
var build = (toks, pairs, start, end, top) => {
  let seq = [];
  const alts = [seq];
  for (let i = start; i < end; i++) {
    const tok = toks[i];
    const close = pairs.get(i);
    if (tok.t === "open" && close !== void 0) {
      const sub = build(toks, pairs, i + 1, close, false);
      seq.push({ t: "ext", type: tok.type, alts: sub });
      i = close;
    } else if (tok.t === "bar" && !top) {
      alts.push(seq = []);
    } else if (tok.t === "open") {
      seq.push(lit(tok.type), lit("("));
    } else if (tok.t === "bar") {
      seq.push(lit("|"));
    } else if (tok.t === "close") {
      seq.push(lit(")"));
    } else {
      seq.push(tok);
    }
  }
  return alts;
};
var normalize = (items, form) => {
  const out = [];
  let run = "";
  const flush = () => {
    for (const ch of run.normalize(form))
      out.push(lit(ch));
    run = "";
  };
  for (const it of items) {
    if (it.t === "lit") {
      run += it.ch;
      continue;
    }
    flush();
    out.push(it.t === "ext" ? { ...it, alts: it.alts.map((a) => normalize(a, form)) } : it);
  }
  flush();
  return out;
};
var compile = (items, nocase) => {
  let id = 1;
  const split = (out) => ({ t: "split", id: id++, out });
  const seq = (items2, next) => items2.reduceRight((next2, it) => item(it, next2), next);
  const item = (it, next) => {
    switch (it.t) {
      case "lit":
        const re = nocase ? foldRe(it.ch) : void 0;
        return { t: "lit", id: id++, ch: it.ch, re, next };
      case "any":
      case "star":
        return { t: it.t, id: id++, next };
      case "class":
        return { t: "class", id: id++, re: it.re, next };
    }
    const alts = (next2) => it.alts.map((a) => seq(a, next2));
    switch (it.type) {
      case "@":
        return split(alts(next));
      case "?":
        return split([next, ...alts(next)]);
      case "!":
        return { t: "neg", id: id++, sub: split(alts(MATCH)), next };
    }
    const after = split([]);
    const entry = split(alts(after));
    after.out.push(next, entry);
    return it.type === "*" ? after : entry;
  };
  const start = seq(items, MATCH);
  return [start, id];
};
var show = (start) => {
  const lines = [];
  const seen = /* @__PURE__ */ new Set();
  const ref = (n) => n.t === "match" ? "match" : String(n.id);
  const walk = (n, indent) => {
    if (n.t === "match" || seen.has(n))
      return;
    seen.add(n);
    const line = (desc) => lines.push(`${indent}${n.id}: ${desc}`);
    switch (n.t) {
      case "split":
        line(`split -> ${n.out.map(ref).join(", ")}`);
        for (const o of n.out)
          walk(o, indent);
        return;
      case "neg":
        line(`!(${ref(n.sub)}) -> ${ref(n.next)}`);
        walk(n.sub, indent + "  ");
        return walk(n.next, indent);
      case "lit":
        line(`${JSON.stringify(n.ch)} -> ${ref(n.next)}`);
        break;
      case "class":
        line(`${n.re} -> ${ref(n.next)}`);
        break;
      default:
        line(`${n.t === "any" ? "?" : "*"} -> ${ref(n.next)}`);
    }
    walk(n.next, indent);
  };
  walk(start, "");
  return [`start -> ${ref(start)}`, ...lines].join("\n");
};
var State = class {
  // set by the Sim, to mark the nodes that this state has
  gen;
  threads = [];
  match = false;
  runs = [];
  // the sorted ids of the threads, with 0 for a match, once the
  // state is done
  ids = [];
  constructor(gen) {
    this.gen = gen;
  }
  // no threads, so nothing more can match
  get dead() {
    return !this.threads.length && !this.match && !this.runs.length;
  }
};
var sameState = (a, b) => {
  if (a.ids.length !== b.ids.length)
    return false;
  if (a.runs.length !== b.runs.length)
    return false;
  if (a.ids.some((id, i) => id !== b.ids[i]))
    return false;
  return a.runs.every((r) => b.runs.some((o) => o.neg === r.neg && sameState(o.state, r.state)));
};
var marks = (size) => ({
  has: new Float64Array(size),
  seen: new Float64Array(size),
  gen: 0
});
var Sim = class {
  // `.` and `..` only match literal dots, even with `dot:true`
  dots;
  // the string starts with `.`, and `dot:true` is not set
  dotStart;
  #marks;
  constructor(dots, dotStart, marks2) {
    this.dots = dots;
    this.dotStart = dotStart;
    this.#marks = marks2;
  }
  state() {
    return new State(++this.#marks.gen);
  }
  // sort the ids of a state, once it has all of its threads
  done(state) {
    state.ids = state.threads.map((n) => n.id).sort((a, b) => a - b);
    if (state.match)
      state.ids.unshift(MATCH.id);
    return state;
  }
  // true the first time that the state walks through the node, so
  // that loops in the graph stop
  #visit(state, node) {
    const { seen } = this.#marks;
    if (seen[node.id] === state.gen)
      return false;
    seen[node.id] = state.gen;
    return true;
  }
  #addThread(state, node) {
    const { has } = this.#marks;
    if (has[node.id] === state.gen)
      return false;
    has[node.id] = state.gen;
    state.threads.push(node);
    return true;
  }
  // wildcards only match a leading dot if `dot:true`. In a negated
  // sub-pattern, this does not apply, because the negation itself
  // can not match a leading dot.
  restricted(i, top) {
    return top && (this.dots || this.dotStart && i === 0);
  }
  add(state, node, i, top) {
    switch (node.t) {
      case "split":
        if (!this.#visit(state, node))
          return;
        for (const o of node.out)
          this.add(state, o, i, top);
        return;
      case "neg":
        if (!this.#visit(state, node))
          return;
        const sub = this.state();
        this.add(sub, node.sub, i, false);
        this.done(sub);
        return this.addRun(state, { t: "run", neg: node, state: sub }, i, top);
      case "star":
        if (this.restricted(i, top))
          return;
        if (this.#addThread(state, node))
          this.add(state, node.next, i, top);
        return;
      case "match":
        state.match = true;
        return;
      default:
        this.#addThread(state, node);
    }
  }
  addRun(state, run, i, top) {
    for (const r of state.runs) {
      if (r.neg === run.neg && sameState(r.state, run.state))
        return;
    }
    state.runs.push(run);
    if (!run.state.match) {
      this.add(state, run.neg.next, i, top);
    }
  }
  // the threads after char `c`, at index `i`
  step(state, c, i, top) {
    const next = this.state();
    for (const th of state.threads) {
      switch (th.t) {
        case "lit":
          if (litMatch(th, c)) {
            this.add(next, th.next, i + 1, top);
          }
          break;
        case "any":
          if (!this.restricted(i, top))
            this.add(next, th.next, i + 1, top);
          break;
        case "class":
          if (!this.restricted(i, top) && th.re.test(c)) {
            this.add(next, th.next, i + 1, top);
          }
          break;
        case "star":
          if (!this.restricted(i, top))
            this.add(next, th, i + 1, top);
      }
    }
    if (!this.restricted(i, top)) {
      for (const run of state.runs) {
        if (run.state.dead) {
          this.addRun(next, run, i + 1, top);
          continue;
        }
        const sub = this.step(run.state, c, i, false);
        this.addRun(next, { t: "run", neg: run.neg, state: sub }, i + 1, top);
      }
    }
    return this.done(next);
  }
};
var stateKey = (state) => {
  const ids = state.ids.join();
  if (!state.runs.length)
    return ids;
  const runs = state.runs.map((r) => `${r.neg.id}(${stateKey(r.state)})`);
  return `${ids}|${runs.sort().join("|")}`;
};
var DFA_BUDGET = 1 << 18;
var Dfa = class {
  #start;
  #states = /* @__PURE__ */ new Map();
  #size = 0;
  #plain;
  #dotStart;
  #sim;
  #dotSim;
  constructor(start, marks2) {
    this.#start = start;
    this.#sim = new Sim(false, false, marks2);
    this.#dotSim = new Sim(false, true, marks2);
  }
  #make(state) {
    return {
      state,
      match: state.match,
      dead: state.dead,
      next: /* @__PURE__ */ new Map()
    };
  }
  #intern(state) {
    const key = stateKey(state);
    const found = this.#states.get(key);
    if (found)
      return found;
    if (this.#size > DFA_BUDGET)
      this.#clear();
    const d = this.#make(state);
    this.#states.set(key, d);
    this.#size += key.length + 1;
    return d;
  }
  #clear() {
    this.#states.clear();
    this.#size = 0;
    this.#plain = void 0;
    this.#dotStart = void 0;
  }
  start(dotStart) {
    if (dotStart) {
      if (this.#dotStart)
        return this.#dotStart;
      const state2 = this.#dotSim.state();
      this.#dotSim.add(state2, this.#start, 0, true);
      return this.#dotStart = this.#make(this.#dotSim.done(state2));
    }
    if (this.#plain)
      return this.#plain;
    const state = this.#sim.state();
    this.#sim.add(state, this.#start, 0, true);
    return this.#plain = this.#intern(this.#sim.done(state));
  }
  // the next state, after a miss in `d.ascii`
  next(d, c) {
    const code = c.charCodeAt(0);
    const found = code < 128 ? void 0 : d.next.get(c);
    if (found)
      return found;
    const n = d === this.#dotStart ? this.#intern(this.#dotSim.step(d.state, c, 0, true)) : this.#intern(this.#sim.step(d.state, c, 1, true));
    if (code < 128) {
      if (!d.ascii) {
        d.ascii = new Array(128);
        this.#size += 128;
      }
      d.ascii[code] = n;
    } else {
      d.next.set(c, n);
    }
    this.#size++;
    return n;
  }
};
var linear = (start) => {
  const nodes = [];
  for (let n = start; n.t !== "match"; n = n.next) {
    if (n.t === "split" || n.t === "neg")
      return void 0;
    nodes.push(n);
  }
  return nodes;
};
var testLinear = (nodes, chars, start, end) => {
  let ni = 0;
  let ci = start;
  let starNi = -1;
  let starCi = 0;
  while (ci < end) {
    const n = nodes[ni];
    if (n?.t === "star") {
      starNi = ni++;
      starCi = ci;
      continue;
    }
    const c = chars[ci];
    if (n && (n.t === "any" || n.t === "lit" && litMatch(n, c) || n.t === "class" && n.re.test(c))) {
      ni++;
      ci++;
      continue;
    }
    if (starNi === -1)
      return false;
    ni = starNi + 1;
    ci = ++starCi;
  }
  while (nodes[ni]?.t === "star")
    ni++;
  return ni === nodes.length;
};
var lengths = (items) => {
  let min = 0;
  let max = 0;
  for (const it of items) {
    const [lo, hi] = itemLengths(it);
    min += lo;
    max += hi;
  }
  return [min, max];
};
var itemLengths = (it) => {
  if (it.t === "star")
    return [0, Infinity];
  if (it.t !== "ext")
    return [1, 1];
  if (it.type === "!")
    return [0, Infinity];
  const alts = it.alts.map(lengths);
  const min = Math.min(...alts.map((a) => a[0]));
  const max = Math.max(...alts.map((a) => a[1]));
  const loop = max === 0 ? 0 : Infinity;
  return it.type === "@" ? [min, max] : it.type === "?" ? [0, max] : it.type === "*" ? [0, loop] : [min, loop];
};
var hasAffix = (lits, chars, start) => {
  for (let j = 0; j < lits.length; j++) {
    if (!litMatch(lits[j], chars[start + j]))
      return false;
  }
  return true;
};
var slashOrSurrogate = /[/\ud800-\udfff]/;
var surrogate = /[\ud800-\udfff]/;
var codePoints = (s) => surrogate.test(s) ? [...s] : s;
var noSlash = (s) => {
  if (s.includes("/")) {
    throw new Error("can only match a single path portion, got: " + s);
  }
};
var Matcher = class {
  pattern;
  options;
  #start;
  // the number of node ids
  #size;
  #marks;
  // the Sim for strings that are only `.` or `..`
  #dotsSim;
  // the string to compare, if the pattern has no magic. With
  // `nocase:true`, the RegExp that folds case is made when it is
  // first used.
  #literal;
  #literalFold = false;
  #literalRe;
  // the nodes between the prefix and suffix, if the graph is a
  // single chain
  #linear;
  // the linear nodes are only `*` and `?`, so the length bounds and
  // the prefix and suffix decide the match
  #wild = false;
  // the least and most chars that a match can have
  #min = 0;
  #max = Infinity;
  // the literals that a match must start and end with. Each one
  // matches exactly one char, and they are distinct items in the
  // pattern, so a string that does not have them can not match.
  #prefix = [];
  #suffix = [];
  // the prefix and suffix as strings, if they do not fold case
  #prefixStr;
  #suffixStr;
  // there is a prefix or suffix to check
  #affix = false;
  #dfa;
  #form;
  constructor(pattern, options = {}) {
    if (pattern.includes("/")) {
      throw new Error("can only match a single path portion, got pattern: " + pattern);
    }
    this.pattern = pattern;
    this.options = options;
    const { nocase = false, noext = false, normalize: n } = options;
    this.#form = n === true ? "NFC" : n || void 0;
    const literal2 = /^[?*+@]\(\)$/.test(pattern);
    const toks = tokenize(pattern, nocase, noext || literal2, this.#form);
    let [items] = build(toks, pair(toks), 0, toks.length, true);
    if (this.#form)
      items = normalize(items, this.#form);
    const [start, size] = compile(items, nocase);
    this.#start = start;
    this.#size = size;
    if (items.every((it) => it.t === "lit")) {
      this.#literal = items.map((it) => it.ch).join("");
      this.#literalFold = nocase;
    } else {
      const lit2 = (it) => it.t !== "lit" ? void 0 : nocase ? { ch: it.ch, re: foldRe(it.ch) } : { ch: it.ch };
      for (const it of items) {
        const l = lit2(it);
        if (!l)
          break;
        this.#prefix.push(l);
      }
      for (let j = items.length - 1; j >= 0; j--) {
        const l = lit2(items[j]);
        if (!l)
          break;
        this.#suffix.unshift(l);
      }
      this.#affix = !!(this.#prefix.length || this.#suffix.length);
      if (!nocase) {
        this.#prefixStr = this.#prefix.map((l) => l.ch).join("");
        this.#suffixStr = this.#suffix.map((l) => l.ch).join("");
      }
      this.#linear = linear(this.#start)?.slice(this.#prefix.length, -this.#suffix.length || void 0);
      this.#wild = !!this.#linear?.every((n2) => n2.t === "star" || n2.t === "any");
      const [min, max] = lengths(items);
      this.#min = min;
      this.#max = max;
    }
  }
  test(s) {
    if (this.#form) {
      noSlash(s);
      return this.#test(s.normalize(this.#form));
    }
    if (slashOrSurrogate.test(s)) {
      noSlash(s);
      return this.#test(s, [...s]);
    }
    return this.#test(s, s);
  }
  /**
   * The same as {@link Matcher#test}, but the string is not checked
   * for `/` chars, so the result for a string that has one is not
   * defined. Only use it for a string that is known to be one path
   * portion, such as a part of a path that was split on `/`. It can
   * be faster, because some patterns do not need to look at each char
   * of the string.
   */
  testUnchecked(s) {
    return this.#test(this.#form ? s.normalize(this.#form) : s);
  }
  // Test a string that has no `/`. `chars` indexes it by code point.
  // If it is not given, it is only found if a step needs it.
  #test(s, chars) {
    if (this.#literal !== void 0) {
      return this.#literalFold ? (this.#literalRe ??= newFoldRe(this.#literal)).test(s) : s === this.#literal;
    }
    const min = this.#min;
    const max = this.#max;
    if (chars === void 0) {
      const most = s.length;
      const least = most + 1 >> 1;
      if (most < min || least > max)
        return false;
      if (least < min || most > max)
        chars = codePoints(s);
    }
    if (chars !== void 0 && (chars.length < min || chars.length > max)) {
      return false;
    }
    const prefix = this.#prefix.length;
    if (this.#affix) {
      if (this.#prefixStr !== void 0 && this.#suffixStr !== void 0) {
        if (!s.startsWith(this.#prefixStr) || !s.endsWith(this.#suffixStr)) {
          return false;
        }
      } else {
        chars ??= codePoints(s);
        const end = chars.length - this.#suffix.length;
        if (!hasAffix(this.#prefix, chars, 0) || !hasAffix(this.#suffix, chars, end)) {
          return false;
        }
      }
    }
    const dotStart = !this.options.dot && s.startsWith(".");
    if (this.#linear) {
      if (s === "." || s === "..")
        return false;
      if (dotStart && !prefix)
        return false;
      if (this.#wild)
        return true;
      chars ??= codePoints(s);
      const end = chars.length - this.#suffix.length;
      return testLinear(this.#linear, chars, prefix, end);
    }
    chars ??= codePoints(s);
    if (s === "." || s === "..") {
      this.#marks ??= marks(this.#size);
      const sim = this.#dotsSim ??= new Sim(true, false, this.#marks);
      const start = sim.state();
      sim.add(start, this.#start, 0, true);
      let state = sim.done(start);
      for (let i = 0; i < chars.length; i++) {
        state = sim.step(state, chars[i], i, true);
      }
      return state.match;
    }
    this.#marks ??= marks(this.#size);
    const dfa = this.#dfa ??= new Dfa(this.#start, this.#marks);
    let d = dfa.start(dotStart);
    const str = chars === s;
    for (let i = 0; i < chars.length; i++) {
      if (d.dead)
        return false;
      const code = str ? s.charCodeAt(i) : chars[i].charCodeAt(0);
      d = d.ascii?.[code] ?? dfa.next(d, chars[i]);
    }
    return d.match;
  }
  /** a readable listing of the state machine */
  toString() {
    return show(this.#start);
  }
};

// node_modules/minimatch/dist/esm/assert-valid-pattern.js
var MAX_PATTERN_LENGTH = 1024 * 64;
var assertValidPattern = (pattern) => {
  if (typeof pattern !== "string") {
    throw new TypeError("invalid pattern");
  }
  if (pattern.length > MAX_PATTERN_LENGTH) {
    throw new TypeError("pattern is too long");
  }
};

// node_modules/minimatch/dist/esm/escape.js
var escape = (s, { windowsPathsNoEscape = false, magicalBraces = false } = {}) => {
  if (magicalBraces) {
    return windowsPathsNoEscape ? s.replace(/[?*()[\]{}]/g, "[$&]") : s.replace(/[?*()[\]\\{}]/g, "\\$&");
  }
  return windowsPathsNoEscape ? s.replace(/[?*()[\]]/g, "[$&]") : s.replace(/[?*()[\]\\]/g, "\\$&");
};

// node_modules/minimatch/dist/esm/unescape.js
var unescape = (s, { windowsPathsNoEscape = false, magicalBraces = true } = {}) => {
  if (magicalBraces) {
    return windowsPathsNoEscape ? s.replace(/\[([^/\\])\]/g, "$1") : s.replace(/((?!\\).|^)\[([^/\\])\]/g, "$1$2").replace(/\\([^/])/g, "$1");
  }
  return windowsPathsNoEscape ? s.replace(/\[([^/\\{}])\]/g, "$1") : s.replace(/((?!\\).|^)\[([^/\\{}])\]/g, "$1$2").replace(/\\([^/{}])/g, "$1");
};

// node_modules/minimatch/dist/esm/index.js
var minimatch = (p, pattern, options = {}) => {
  assertValidPattern(pattern);
  if (!options.nocomment && pattern.charAt(0) === "#") {
    return false;
  }
  return cachedMinimatch(pattern, options).match(p);
};
var cache = /* @__PURE__ */ new Map();
var cacheMax = 256;
var cachedMinimatch = (pattern, options) => {
  const key = pattern + "\0" + JSON.stringify(options);
  let mm = cache.get(key);
  if (mm) {
    cache.delete(key);
  } else {
    mm = new Minimatch(pattern, { ...options });
    if (cache.size >= cacheMax) {
      cache.delete(cache.keys().next().value);
    }
  }
  cache.set(key, mm);
  return mm;
};
var defaultPlatform = typeof process === "object" && process ? process.env?.__MINIMATCH_TESTING_PLATFORM__ || process.platform : "posix";
var path = {
  win32: { sep: "\\" },
  posix: { sep: "/" }
};
var sep = defaultPlatform === "win32" ? path.win32.sep : path.posix.sep;
minimatch.sep = sep;
var GLOBSTAR = /* @__PURE__ */ Symbol("globstar **");
minimatch.GLOBSTAR = GLOBSTAR;
var filter = (pattern, options = {}) => (p) => minimatch(p, pattern, options);
minimatch.filter = filter;
var ext = (a, b = {}) => Object.assign({}, a, b);
var defaults = (def) => {
  if (!def || typeof def !== "object" || !Object.keys(def).length) {
    return minimatch;
  }
  const orig = minimatch;
  const m = (p, pattern, options = {}) => orig(p, pattern, ext(def, options));
  return Object.assign(m, {
    Minimatch: class Minimatch extends orig.Minimatch {
      constructor(pattern, options = {}) {
        super(pattern, ext(def, options));
      }
      static defaults(options) {
        return orig.defaults(ext(def, options)).Minimatch;
      }
    },
    unescape: (s, options = {}) => orig.unescape(s, ext(def, options)),
    escape: (s, options = {}) => orig.escape(s, ext(def, options)),
    filter: (pattern, options = {}) => orig.filter(pattern, ext(def, options)),
    defaults: (options) => orig.defaults(ext(def, options)),
    braceExpand: (pattern, options = {}) => orig.braceExpand(pattern, ext(def, options)),
    match: (list, pattern, options = {}) => orig.match(list, pattern, ext(def, options)),
    sep: orig.sep,
    GLOBSTAR
  });
};
minimatch.defaults = defaults;
var braceExpand = (pattern, options = {}) => {
  assertValidPattern(pattern);
  if (options.nobrace || !/\{(?:(?!\{).)*\}/.test(pattern)) {
    return [pattern];
  }
  return expand(pattern, { max: options.braceExpandMax });
};
minimatch.braceExpand = braceExpand;
var match = (list, pattern, options = {}) => {
  const mm = new Minimatch(pattern, options);
  list = list.filter((f) => mm.match(f));
  if (mm.options.nonull && !list.length) {
    list.push(pattern);
  }
  return list;
};
minimatch.match = match;
var globMagic = /[?*]|[+@!]\(.*?\)|\[|\]/;
var classEnd = (pattern, start) => {
  let i = start + 1;
  if (pattern.charAt(i) === "!" || pattern.charAt(i) === "^")
    i++;
  let sawStart = false;
  for (; i < pattern.length; i++) {
    const c = pattern.charAt(i);
    if (c === "]" && sawStart)
      return i;
    sawStart = true;
    if (c === "\\")
      i++;
  }
  return -1;
};
var literal = (pattern, noext) => {
  if (!noext && (pattern === "+()" || pattern === "@()"))
    return pattern;
  let lit2 = "";
  for (let i = 0; i < pattern.length; i++) {
    const c = pattern.charAt(i);
    if (c === "\\") {
      lit2 += pattern.charAt(++i) || c;
    } else if (c === "*" || c === "?") {
      return void 0;
    } else if (c === "[") {
      const close = classEnd(pattern, i);
      if (close === -1) {
        lit2 += c;
        continue;
      }
      let body = pattern.slice(i + 1, close);
      if (body.startsWith("\\"))
        body = body.slice(1);
      if ([...body].length !== 1 || "!^".includes(pattern.charAt(i + 1))) {
        return void 0;
      }
      lit2 += body;
      i = close;
    } else if (!noext && "+@!".includes(c) && pattern.charAt(i + 1) === "(" && pattern.includes(")", i + 2)) {
      return void 0;
    } else {
      lit2 += c;
    }
  }
  return lit2;
};
var extSafe = (pattern) => {
  if (/^[?*+@]\(\)$/.test(pattern) || pattern.includes("[:"))
    return false;
  let depth = 0;
  for (let i = 0; i < pattern.length; i++) {
    const c = pattern.charAt(i);
    if (c === "\\") {
      if (++i === pattern.length)
        return false;
    } else if (c === "[") {
      const close = classEnd(pattern, i);
      if (close !== -1)
        i = close;
    } else if ("+@!?*".includes(c) && pattern.charAt(i + 1) === "(") {
      depth++;
      i++;
    } else if (c === ")") {
      if (!depth--)
        return false;
    } else if (c === "|" && !depth) {
      return false;
    }
  }
  return !depth;
};
var lastSplit;
var lastChecked;
var portionMatch = (p, f) => typeof p === "string" ? f === p : f !== "" && p.testUnchecked(f);
var endIndex = (p, last, lastStart, prev, prevStart) => portionMatch(p, last) ? lastStart : prev !== void 0 && portionMatch(p, prev) ? prevStart : -1;
var isDots = (p) => p === "." || p === "..";
var isDrive = (p) => typeof p === "string" && /^[a-z]:$/i.test(p);
var isLongUNC = (p) => typeof p === "string" && /^unc$/i.test(p);
var uncHost = (p) => {
  if (p[0] !== "" || p[1] !== "")
    return -1;
  const h = p[2] !== "?" ? 2 : isLongUNC(p[3]) ? 4 : -1;
  const host = p[h];
  const share = p[h + 1];
  return h !== -1 && host !== void 0 && host !== "" && host !== GLOBSTAR && share !== void 0 && share !== "" && share !== GLOBSTAR ? h : -1;
};
var walkable = (p, dot) => !isDots(p) && (dot || !p.startsWith("."));
var dotPortion = (f, start, end, dot, sep2) => {
  for (let k = start; k < end; ) {
    if (f.charCodeAt(k) === 46) {
      if (!dot)
        return true;
      const n = f.charCodeAt(k + 1) === 46 ? k + 2 : k + 1;
      if (n >= end || isSep(f.charCodeAt(n), sep2))
        return true;
    }
    const s = nextSep(f, k, sep2);
    if (s === -1)
      return false;
    k = s + 1;
    while (k < end && isSep(f.charCodeAt(k), sep2))
      k++;
  }
  return false;
};
var isSep = (c, sep2) => sep2 === "/" ? c === 47 : sep2 === "\\" ? c === 92 : c === 47 || c === 92;
var nextSep = (f, from, sep2) => {
  if (sep2 !== "both")
    return f.indexOf(sep2, from);
  const s = f.indexOf("/", from);
  const b = f.indexOf("\\", from);
  return s === -1 ? b : b === -1 ? s : Math.min(s, b);
};
var lastSep = (f, from, sep2) => sep2 !== "both" ? f.lastIndexOf(sep2, from) : Math.max(f.lastIndexOf("/", from), f.lastIndexOf("\\", from));
var PENDING = {};
var Minimatch = class {
  options;
  set;
  pattern;
  windowsPathsNoEscape;
  nonegate;
  negate;
  comment;
  empty;
  preserveMultipleSlashes;
  partial;
  globSet;
  globParts;
  nocase;
  isWindows;
  platform;
  windowsNoMagicRoot;
  maxGlobstarRecursion;
  // the path can be checked against the last portion, and the string
  // portions, of each row before it is split. See #canMatch.
  #endCheck;
  #literalCheck;
  // level 2 resolves `.` and `..` portions in the path
  #level2;
  // the unicode normalization form, if any
  #form;
  // the string portions of each row in the set
  #literals = [];
  // the rows that #canMatch can match without splitting the path
  #shapes = [];
  // the rows whose last portion can be checked against the path's
  #endRows = [];
  // brace expansion can make the same portion in many rows, so they
  // share one Matcher, and the states that it caches
  #matchers = /* @__PURE__ */ new Map();
  // parse() returns PENDING in place of a Matcher
  #pending = false;
  // the GlobstarParts of each pattern row, by start index and partial
  #globstarParts = /* @__PURE__ */ new WeakMap();
  constructor(pattern, options = {}) {
    assertValidPattern(pattern);
    options = options || {};
    this.options = options;
    this.maxGlobstarRecursion = options.maxGlobstarRecursion ?? 200;
    this.pattern = pattern;
    this.platform = options.platform || defaultPlatform;
    this.isWindows = this.platform === "win32";
    const awe = "allowWindowsEscape";
    this.windowsPathsNoEscape = !!options.windowsPathsNoEscape || options[awe] === false;
    if (this.windowsPathsNoEscape) {
      this.pattern = this.pattern.replace(/\\/g, "/");
    }
    this.preserveMultipleSlashes = !!options.preserveMultipleSlashes;
    this.negate = false;
    this.nonegate = !!options.nonegate;
    this.comment = false;
    this.empty = false;
    this.partial = !!options.partial;
    this.nocase = !!this.options.nocase;
    this.windowsNoMagicRoot = options.windowsNoMagicRoot !== void 0 ? options.windowsNoMagicRoot : !!(this.isWindows && this.nocase);
    this.globSet = [];
    this.globParts = [];
    this.set = [];
    this.#endCheck = !this.preserveMultipleSlashes;
    this.#level2 = (options.optimizationLevel ?? 1) >= 2;
    const n = options.normalize;
    this.#form = n === true ? "NFC" : n || void 0;
    this.make();
    const drives = this.set.map((row) => this.#rootIndex(row));
    this.#endRows = this.set.map((row, r) => this.#endCheck && row.length - 1 > drives[r]);
    this.#literals = this.set.map((row, r) => {
      const end = this.#endRows[r] ? row.length - 1 : row.length;
      const lits = row.slice(drives[r] + 1, end).filter((p) => typeof p === "string" && !!p);
      return [...new Set(lits)];
    });
    this.#literalCheck = this.#literals.some((l) => l.length);
    this.#shapes = this.set.map((row, r) => {
      const [p0, p1, p2] = row;
      if (this.#endRows[r] && row.length === 2) {
        if (p0 === GLOBSTAR && p1 !== GLOBSTAR)
          return "tail";
      }
      if (this.#endRows[r] && options.matchBase && row.length === 1 && p0 !== GLOBSTAR && p0 !== "") {
        return "base";
      }
      if (!this.#endCheck || drives[r] !== -1)
        return void 0;
      if (row.length === 3 && p0 === GLOBSTAR && p2 === GLOBSTAR && p1 !== GLOBSTAR && p1 !== "" && // the portion between is only matched below this limit
      this.maxGlobstarRecursion > 0) {
        return "mid";
      }
      if (row.length === 2 && p1 === GLOBSTAR && p0 !== GLOBSTAR && p0 !== "") {
        return "head";
      }
      return void 0;
    });
  }
  // a string portion of a pattern, normalized if the option is set
  #norm(p) {
    return this.#form ? p.normalize(this.#form) : p;
  }
  // On Windows, the index of the last root portion of a row, as
  // #matchRow finds it: 0 for `c:/...`, 3 for `//?/c:/...` and
  // `//host/share/...`, and 5 for `//?/UNC/host/share/...`. Otherwise
  // -1.
  #rootIndex(row) {
    if (!this.isWindows)
      return -1;
    if (isDrive(row[0]))
      return 0;
    const uncDrive = row[0] === "" && row[1] === "" && row[2] === "?" && isDrive(row[3]);
    if (uncDrive)
      return 3;
    const h = uncHost(row);
    return h === -1 ? -1 : h + 1;
  }
  hasMagic() {
    if (this.options.magicalBraces && this.set.length > 1) {
      return true;
    }
    for (const pattern of this.set) {
      for (const part of pattern) {
        if (typeof part !== "string")
          return true;
      }
    }
    return false;
  }
  make() {
    const pattern = this.pattern;
    const options = this.options;
    if (!options.nocomment && pattern.charAt(0) === "#") {
      this.comment = true;
      return;
    }
    if (!pattern) {
      this.empty = true;
      return;
    }
    this.parseNegate();
    this.globSet = [...new Set(this.braceExpand())];
    const rawGlobParts = this.globSet.map((s) => this.#slashSplit(s));
    this.globParts = this.preprocess(rawGlobParts);
    this.#pending = true;
    let set = this.globParts.map((s, _, __) => {
      if (this.isWindows && this.windowsNoMagicRoot) {
        const n = s[2] === "?" && isLongUNC(s[3]) ? 6 : 4;
        const isUNC = s[0] === "" && s[1] === "" && (s[2] === "?" || !globMagic.test(s[2])) && s.slice(3, n).every((p) => !globMagic.test(p));
        const isDrive2 = /^[a-z]:/i.test(s[0]);
        if (isUNC) {
          return [
            ...s.slice(0, n).map((p) => this.#norm(p)),
            ...s.slice(n).map((ss) => this.parse(ss))
          ];
        } else if (isDrive2) {
          return [
            this.#norm(s[0]),
            ...s.slice(1).map((ss) => this.parse(ss))
          ];
        }
      }
      return s.map((ss) => this.parse(ss));
    });
    this.set = set.filter((s) => s.indexOf(false) === -1);
    if (this.isWindows) {
      for (let i = 0; i < this.set.length; i++) {
        const p = this.set[i];
        if (p[0] === "" && p[1] === "" && this.globParts[i][2] === "?" && (isDrive(p[3]) || isLongUNC(this.globParts[i][3]))) {
          if (isLongUNC(this.globParts[i][3]))
            p[3] = "UNC";
          p[2] = "?";
        }
      }
    }
    if (!options.noext)
      this.mergeRows();
    this.#pending = false;
    this.set.forEach((row, i) => {
      for (let k = 0; k < row.length; k++) {
        if (row[k] === PENDING) {
          row[k] = this.parse(this.globParts[i][k]);
        }
      }
    });
  }
  // Merge rows that only differ in one portion, where each of them
  // is a Matcher, into one row that matches any of them with
  // `@(a|b|...)`. Then a path is only walked once for all of them,
  // for example with `**/*.{js,ts}`.
  mergeRows() {
    let merged = true;
    while (merged) {
      merged = false;
      const len = Math.max(0, ...this.set.map((r) => r.length));
      for (let k = 0; k < len; k++) {
        const groups = /* @__PURE__ */ new Map();
        this.set.forEach((row, i) => {
          if (!(row[k] instanceof Matcher || row[k] === PENDING) || !extSafe(this.globParts[i][k])) {
            return;
          }
          const parts = [...this.globParts[i]];
          parts[k] = "";
          const key = `${row.length}/${parts.join("/")}`;
          const g = groups.get(key);
          if (g)
            g.push(i);
          else
            groups.set(key, [i]);
        });
        const drop = /* @__PURE__ */ new Set();
        for (const g of groups.values()) {
          if (g.length < 2)
            continue;
          const [first, ...rest] = g;
          const alts = g.map((i) => this.globParts[i][k]);
          const glob = `@(${alts.join("|")})`;
          this.globParts[first][k] = glob;
          this.set[first][k] = this.parse(glob);
          for (const i of rest)
            drop.add(i);
        }
        if (drop.size) {
          merged = true;
          this.set = this.set.filter((_, i) => !drop.has(i));
          this.globParts = this.globParts.filter((_, i) => !drop.has(i));
        }
      }
    }
  }
  // various transforms to equivalent pattern sets that are
  // faster to process in a filesystem walk.  The goal is to
  // eliminate what we can, and push all ** patterns as far
  // to the right as possible, even if it increases the number
  // of patterns that we have to process.
  preprocess(globParts) {
    if (this.options.noglobstar) {
      for (const partset of globParts) {
        for (let j = 0; j < partset.length; j++) {
          if (partset[j] === "**") {
            partset[j] = "*";
          }
        }
      }
    }
    const { optimizationLevel = 1 } = this.options;
    if (optimizationLevel >= 2) {
      globParts = this.firstPhasePreProcess(globParts);
      globParts = this.secondPhasePreProcess(globParts);
    } else if (optimizationLevel >= 1) {
      globParts = this.levelOneOptimize(globParts);
    } else {
      globParts = this.adjascentGlobstarOptimize(globParts);
    }
    return globParts;
  }
  // just get rid of adjascent ** portions
  adjascentGlobstarOptimize(globParts) {
    return globParts.map((parts) => {
      let gs = -1;
      while (-1 !== (gs = parts.indexOf("**", gs + 1))) {
        let i = gs;
        while (parts[i + 1] === "**") {
          i++;
        }
        if (i !== gs) {
          parts.splice(gs, i - gs);
        }
      }
      return parts;
    });
  }
  // get rid of adjascent ** and resolve .. portions
  levelOneOptimize(globParts) {
    return globParts.map((parts) => {
      const root = this.#rootIndex(parts) + 1;
      parts = parts.reduce((set, part) => {
        const prev = set[set.length - 1];
        if (part === "**" && prev === "**") {
          return set;
        }
        if (part === "..") {
          if (set.length > root && prev && prev !== ".." && prev !== "." && prev !== "**") {
            set.pop();
            return set;
          }
        }
        set.push(part);
        return set;
      }, []);
      return parts.length === 0 ? [""] : parts;
    });
  }
  // Check the path against each row before it is split. 'no' if no
  // row can match, so it does not need to be split. 'yes' if a row of
  // `**` and one more portion matches. 'maybe' if it must be split to
  // know. None of this applies with partial, where the path can end
  // before the row does.
  //
  // On Windows, `\` is a separator in the path too, and the portions of
  // a row up to its drive letter or UNC share are not checked (see
  // #rootIndex).
  //
  // Each string portion of a row must be a portion of the path, so the
  // path must contain it. Level 2 can only take portions out of the
  // path, so this is still true then.
  //
  // The last portion of a row must match the last portion of the path,
  // or the one before a trailing `/` (as a/* and a/**/* match a/b/).
  // This does not apply to rows that end in **, rows that end in a
  // root, or preserveMultipleSlashes (which can leave more
  // than one '' at the end). At level 2, it does not apply if that
  // portion is `.` or `..`, which can be
  // resolved away. Level 2 only takes other portions out of the
  // middle of the path.
  //
  // A row of `**/x` then matches if the ** can walk the portions
  // before the one that x matches, the same as #matchGlobstar. At
  // level 2, this is only known if none of them are `.` or `..`, so
  // that the path does not change when it is resolved.
  #canMatch(f) {
    const sep2 = !this.isWindows || !f.includes("\\") ? "/" : f.includes("/") ? "both" : "\\";
    let ends = this.#endCheck ? 0 : -1;
    let last = "";
    let lastStart = 0;
    let prev;
    let prevStart = 0;
    const dot = !!this.options.dot;
    ROWS: for (let r = 0; r < this.set.length; r++) {
      const row = this.set[r];
      const p = row[row.length - 1];
      let end = ends !== -1 && this.#endRows[r] && p !== GLOBSTAR;
      if (end && ends === 0) {
        const i = lastSep(f, f.length, sep2);
        lastStart = i + 1;
        last = f.slice(lastStart);
        if (last === "" && i >= 0) {
          let j = i;
          while (j > 0 && isSep(f.charCodeAt(j - 1), sep2))
            j--;
          prevStart = j === 0 ? 0 : lastSep(f, j - 1, sep2) + 1;
          prev = f.slice(prevStart, j);
        }
        const resolves = this.#level2 && (isDots(last) || last === "" && prev !== void 0 && isDots(prev));
        ends = resolves ? -1 : 1;
        end = !resolves;
      }
      let tailStart = -1;
      if (end && typeof p === "string") {
        tailStart = endIndex(p, last, lastStart, prev, prevStart);
        if (tailStart === -1)
          continue;
      }
      if (this.#literalCheck) {
        for (const l of this.#literals[r]) {
          if (!f.includes(l))
            continue ROWS;
        }
      }
      if (end && typeof p === "object") {
        tailStart = endIndex(p, last, lastStart, prev, prevStart);
        if (tailStart === -1)
          continue;
      }
      const shape = this.#shapes[r];
      if (shape === "base" && end)
        return "yes";
      if (shape === "tail" && end) {
        if (this.#level2 && dotPortion(f, 0, tailStart, true, sep2)) {
          return "maybe";
        }
        if (!dotPortion(f, 0, tailStart, dot, sep2))
          return "yes";
        continue;
      }
      if (shape === "mid" || shape === "head") {
        const m = this.#walk(f, row, shape === "head", dot, sep2);
        if (m !== "no")
          return m;
        continue;
      }
      return "maybe";
    }
    return "no";
  }
  // Match a row of a known shape against the split path, the same as
  // #matchGlobstar and #matchGlobStarBodySections do. None of these
  // rows have a drive letter, so they start at the first portion.
  #matchShape(file, row, shape) {
    const dot = !!this.options.dot;
    const n = file.length;
    if (shape === "head") {
      if (n < 2 || !portionMatch(row[0], file[0])) {
        return false;
      }
      for (let i = 1; i < n; i++)
        if (!walkable(file[i], dot))
          return false;
      return true;
    }
    const x = row[1];
    if (shape === "tail") {
      let t = n - 1;
      if (!portionMatch(x, file[t])) {
        if (file[t] !== "" || n === 1 || !portionMatch(x, file[--t])) {
          return false;
        }
      }
      for (let i = 0; i < t; i++)
        if (!walkable(file[i], dot))
          return false;
      return true;
    }
    for (let k = 0; k < n; k++) {
      if (portionMatch(x, file[k]) && k + 1 < n) {
        let i = k + 1;
        while (i < n && walkable(file[i], dot))
          i++;
        if (i === n)
          return true;
      }
      if (!walkable(file[k], dot))
        return false;
    }
    return false;
  }
  // Match a row of `**/x/**` or `x/**` against the path, the same as
  // #matchGlobstar and #matchGlobStarBodySections do once it is split.
  // x must match a portion (the first one, for `x/**`), the ** before
  // it must be able to walk the portions before that one, and there
  // must be a portion after it, which the ** after it can walk. At
  // level 2, this is only known if no portion is `.` or `..`.
  #walk(f, row, head, dot, sep2) {
    if (this.#level2 && dotPortion(f, 0, f.length, true, sep2))
      return "maybe";
    const x = row[head ? 0 : 1];
    let s = 0;
    for (let e = nextSep(f, s, sep2); e !== -1; e = nextSep(f, s, sep2)) {
      let next = e + 1;
      while (next < f.length && isSep(f.charCodeAt(next), sep2))
        next++;
      const hit = typeof x === "string" ? e - s === x.length && f.startsWith(x, s) : e > s && x.testUnchecked(f.slice(s, e));
      if (hit && !dotPortion(f, next, f.length, dot, sep2))
        return "yes";
      if (head || dotPortion(f, s, next, dot, sep2))
        return "no";
      s = next;
    }
    return "no";
  }
  // the last split, if it was the same path with the same split
  // settings
  #cachedSplit(f) {
    const last = lastSplit;
    return last?.f === f && last.isWindows === this.isWindows && last.preserveMultipleSlashes === this.preserveMultipleSlashes && last.normalize === this.#form ? last : void 0;
  }
  // split a path for match(), and keep the parts for the next call
  #split(f) {
    const { isWindows, preserveMultipleSlashes } = this;
    let parts = this.#slashSplit(isWindows ? f.split("\\").join("/") : f);
    const normalize2 = this.#form;
    if (normalize2)
      parts = parts.map((p) => p.normalize(normalize2));
    lastSplit = {
      f,
      isWindows,
      preserveMultipleSlashes,
      normalize: normalize2,
      parts
    };
    return lastSplit;
  }
  // resolve `.` and `..` portions of a path, for level 2
  #levelTwoFileOptimize(file) {
    const parts = [...file];
    let didSomething = false;
    do {
      didSomething = false;
      if (!this.preserveMultipleSlashes) {
        for (let i = 1; i < parts.length - 1; i++) {
          const p = parts[i];
          if (i === 1 && p === "" && parts[0] === "")
            continue;
          if (p === "." || p === "") {
            didSomething = true;
            parts.splice(i, 1);
            i--;
          }
        }
        if (parts[0] === "." && parts.length === 2 && (parts[1] === "." || parts[1] === "")) {
          didSomething = true;
          parts.pop();
        }
      }
      const root = this.#rootIndex(parts) + 1;
      let dd = root;
      while (-1 !== (dd = parts.indexOf("..", dd + 1))) {
        const p = parts[dd - 1];
        if (p && p !== "." && p !== ".." && p !== "**") {
          didSomething = true;
          parts.splice(dd - 1, 2);
          dd = Math.max(dd - 2, root);
        }
      }
    } while (didSomething);
    return parts.length === 0 ? [""] : parts;
  }
  // First phase: single-pattern processing
  // <pre> is 1 or more portions
  // <rest> is 1 or more portions
  // <p> is any portion other than ., .., '', or **
  // <e> is . or ''
  //
  // **/.. is *brutal* for filesystem walking performance, because
  // it effectively resets the recursive walk each time it occurs,
  // and ** cannot be reduced out by a .. pattern part like a regexp
  // or most strings (other than .., ., and '') can be.
  //
  // <pre>/**/../<p>/<p>/<rest> -> {<pre>/../<p>/<p>/<rest>,<pre>/**/<p>/<p>/<rest>}
  // <pre>/<e>/<rest> -> <pre>/<rest>
  // <pre>/<p>/../<rest> -> <pre>/<rest>
  // **/**/<rest> -> **/<rest>
  //
  // **/*/<rest> -> */**/<rest> <== not valid because ** doesn't follow
  // this WOULD be allowed if ** did follow symlinks, or * didn't
  firstPhasePreProcess(globParts) {
    const { braceExpandMax = 1e5 } = this.options;
    let didSomething = false;
    do {
      didSomething = false;
      for (let parts of globParts) {
        let gs = -1;
        while (-1 !== (gs = parts.indexOf("**", gs + 1))) {
          let gss = gs;
          while (parts[gss + 1] === "**") {
            gss++;
          }
          if (gss > gs) {
            parts.splice(gs + 1, gss - gs);
          }
          let next = parts[gs + 1];
          const p = parts[gs + 2];
          const p2 = parts[gs + 3];
          if (next !== "..")
            continue;
          if (!p || p === "." || p === ".." || !p2 || p2 === "." || p2 === ".." || globParts.length >= braceExpandMax) {
            continue;
          }
          didSomething = true;
          parts.splice(gs, 1);
          const other = parts.slice(0);
          other[gs] = "**";
          globParts.push(other);
          gs--;
        }
        if (!this.preserveMultipleSlashes) {
          for (let i = 1; i < parts.length - 1; i++) {
            const p = parts[i];
            if (i === 1 && p === "" && parts[0] === "")
              continue;
            if (p === "." || p === "") {
              didSomething = true;
              parts.splice(i, 1);
              i--;
            }
          }
          if (parts[0] === "." && parts.length === 2 && (parts[1] === "." || parts[1] === "")) {
            didSomething = true;
            parts.pop();
          }
        }
        const root = this.#rootIndex(parts) + 1;
        let dd = root;
        while (-1 !== (dd = parts.indexOf("..", dd + 1))) {
          const p = parts[dd - 1];
          if (p && p !== "." && p !== ".." && p !== "**") {
            didSomething = true;
            const needDot = dd === 1 && parts[dd + 1] === "**";
            const splin = needDot ? ["."] : [];
            parts.splice(dd - 1, 2, ...splin);
            if (parts.length === 0)
              parts.push("");
            dd = Math.max(dd - 2, root);
          }
        }
      }
    } while (didSomething);
    return globParts;
  }
  // second phase: multi-pattern dedupes
  // {<pre>/*/<rest>,<pre>/<p>/<rest>} -> <pre>/*/<rest>
  // {<pre>/<rest>,<pre>/<rest>} -> <pre>/<rest>
  // {<pre>/**/<rest>,<pre>/<rest>} -> <pre>/**/<rest>
  //
  // {<pre>/**/<rest>,<pre>/**/<p>/<rest>} -> <pre>/**/<rest>
  // ^-- not valid because ** doens't follow symlinks
  secondPhasePreProcess(globParts) {
    if (globParts.length > 1e3)
      return globParts;
    for (let i = 0; i < globParts.length - 1; i++) {
      for (let j = i + 1; j < globParts.length; j++) {
        const matched = this.partsMatch(globParts[i], globParts[j], !this.preserveMultipleSlashes);
        if (matched) {
          globParts[i] = [];
          globParts[j] = matched;
          break;
        }
      }
    }
    return globParts.filter((gs) => gs.length);
  }
  partsMatch(a, b, emptyGSMatch = false) {
    let ai = 0;
    let bi = 0;
    let result = [];
    let which = "";
    while (ai < a.length && bi < b.length) {
      if (a[ai] === b[bi]) {
        result.push(which === "b" ? b[bi] : a[ai]);
        ai++;
        bi++;
      } else if (emptyGSMatch && a[ai] === "**" && b[bi] === a[ai + 1]) {
        result.push(a[ai]);
        ai++;
      } else if (emptyGSMatch && b[bi] === "**" && a[ai] === b[bi + 1]) {
        result.push(b[bi]);
        bi++;
      } else if (a[ai] === "*" && b[bi] && (this.options.dot || !b[bi].startsWith(".")) && b[bi] !== "**") {
        if (which === "b")
          return false;
        which = "a";
        result.push(a[ai]);
        ai++;
        bi++;
      } else if (b[bi] === "*" && a[ai] && (this.options.dot || !a[ai].startsWith(".")) && a[ai] !== "**") {
        if (which === "a")
          return false;
        which = "b";
        result.push(b[bi]);
        ai++;
        bi++;
      } else {
        return false;
      }
    }
    return a.length === b.length && result;
  }
  parseNegate() {
    if (this.nonegate)
      return;
    const pattern = this.pattern;
    let negate = false;
    let negateOffset = 0;
    for (let i = 0; i < pattern.length && pattern.charAt(i) === "!"; i++) {
      negate = !negate;
      negateOffset++;
    }
    if (negateOffset)
      this.pattern = pattern.slice(negateOffset);
    this.negate = negate;
  }
  // Match the parts of a path against one row of the set. `resolved`
  // is the parts after level 2 resolves `.` and `..` in them, or the
  // same parts below level 2. Set partial to true to test if, for
  // example, "/a/b" matches the start of "/*/b/*/d". Partial means, if
  // you run out of file before you run out of pattern, then that's
  // fine, as long as all the parts match.
  #matchRow(file, resolved, pattern, partial) {
    let fileStartIndex = 0;
    let patternStartIndex = 0;
    const fh = this.isWindows ? uncHost(resolved) : -1;
    const ph = fh === -1 ? -1 : uncHost(pattern);
    if (ph !== -1) {
      const host = pattern[ph];
      const share = pattern[ph + 1];
      if (typeof host !== "string" || typeof share !== "string") {
        fileStartIndex = fh;
        patternStartIndex = ph;
      } else if (resolved[fh].toLowerCase() === host.toLowerCase() && resolved[fh + 1].toLowerCase() === share.toLowerCase()) {
        fileStartIndex = fh + 2;
        patternStartIndex = ph + 2;
      }
    } else if (this.isWindows) {
      const fileDrive = typeof file[0] === "string" && /^[a-z]:$/i.test(file[0]);
      const fileUNC = !fileDrive && file[0] === "" && file[1] === "" && file[2] === "?" && /^[a-z]:$/i.test(file[3]);
      const patternDrive = typeof pattern[0] === "string" && /^[a-z]:$/i.test(pattern[0]);
      const patternUNC = !patternDrive && pattern[0] === "" && pattern[1] === "" && pattern[2] === "?" && typeof pattern[3] === "string" && /^[a-z]:$/i.test(pattern[3]);
      const fdi = fileUNC ? 3 : fileDrive ? 0 : void 0;
      const pdi = patternUNC ? 3 : patternDrive ? 0 : void 0;
      if (typeof fdi === "number" && typeof pdi === "number") {
        const [fd, pd] = [
          file[fdi],
          pattern[pdi]
        ];
        if (fd.toLowerCase() === pd.toLowerCase()) {
          patternStartIndex = pdi + 1;
          fileStartIndex = fdi + 1;
        }
      }
    }
    file = resolved;
    if (pattern.includes(GLOBSTAR)) {
      return this.#matchGlobstar(file, pattern, partial, fileStartIndex, patternStartIndex);
    }
    return this.#matchOne(file, pattern, partial, fileStartIndex, patternStartIndex);
  }
  #matchGlobstar(file, pattern, partial, fileIndex, patternIndex) {
    const { head, body, tail, segments } = this.#getGlobstarParts(pattern, partial, patternIndex);
    if (head.length) {
      const headEnd = fileIndex + head.length;
      if (!this.#matchOne(file, head, partial, fileIndex, 0, headEnd)) {
        return false;
      }
      fileIndex += head.length;
      patternIndex += head.length;
    }
    let fileTailMatch = 0;
    if (tail.length) {
      if (tail.length + fileIndex > file.length)
        return false;
      let tailStart = file.length - tail.length;
      if (this.#matchOne(file, tail, partial, tailStart, 0)) {
        fileTailMatch = tail.length;
      } else {
        if (file[file.length - 1] !== "" || fileIndex + tail.length === file.length) {
          return false;
        }
        tailStart--;
        if (!this.#matchOne(file, tail, partial, tailStart, 0)) {
          return false;
        }
        fileTailMatch = tail.length + 1;
      }
    }
    if (!body.length) {
      let sawSome = !!fileTailMatch;
      for (let i = fileIndex; i < file.length - fileTailMatch; i++) {
        const f = String(file[i]);
        sawSome = true;
        if (f === "." || f === ".." || !this.options.dot && f.startsWith(".")) {
          return false;
        }
      }
      return partial || sawSome;
    }
    return !!this.#matchGlobStarBodySections(file, segments, file.length - fileTailMatch, fileIndex, 0, partial, 0, !!fileTailMatch, /* @__PURE__ */ new Set());
  }
  // Split the pattern into head, tail, and middle of ** delimited
  // parts. The tail has to be at the end, and the others just have to
  // be found in order from the head. These only depend on the pattern
  // row, so they are kept for the next path.
  #getGlobstarParts(pattern, partial, patternIndex) {
    let byStart = this.#globstarParts.get(pattern);
    if (!byStart) {
      byStart = [];
      this.#globstarParts.set(pattern, byStart);
    }
    const key = patternIndex * 2 + (partial ? 1 : 0);
    const found = byStart[key];
    if (found)
      return found;
    const firstgs = pattern.indexOf(GLOBSTAR, patternIndex);
    const lastgs = pattern.lastIndexOf(GLOBSTAR);
    const head = pattern.slice(patternIndex, firstgs);
    const body = pattern.slice(firstgs + 1, partial ? void 0 : lastgs);
    const tail = partial ? [] : pattern.slice(lastgs + 1);
    const segments = [[[], 0]];
    let current = segments[0];
    let nonGsParts = 0;
    const nonGsPartsSums = [0];
    for (const b of body) {
      if (b === GLOBSTAR) {
        nonGsPartsSums.push(nonGsParts);
        current = [[], 0];
        segments.push(current);
      } else {
        current[0].push(b);
        nonGsParts++;
      }
    }
    segments.forEach((b, i) => {
      b[1] = nonGsParts - nonGsPartsSums[i];
    });
    const parts = { head, body, tail, segments };
    byStart[key] = parts;
    return parts;
  }
  // return false for "nope, not matching"
  // return null for "not matching, cannot keep trying"
  #matchGlobStarBodySections(file, bodySegments, fileLength, fileIndex, bodyIndex, partial, globStarDepth, sawTail, tried) {
    const bs = bodySegments[bodyIndex];
    if (!bs) {
      if (partial) {
        return fileIndex >= fileLength || fileIndex === fileLength - 1 && file[fileIndex] === "";
      }
      for (let i = fileIndex; i < fileLength; i++) {
        sawTail = true;
        const f = file[i];
        if (f === "." || f === ".." || !this.options.dot && f.startsWith(".")) {
          return false;
        }
      }
      return sawTail;
    }
    const [body, need] = bs;
    const after = partial ? fileLength : fileLength - need;
    while (fileIndex <= after) {
      const key = bodyIndex * (file.length + 1) + fileIndex;
      if (tried.has(key))
        return false;
      tried.add(key);
      const m = this.#matchOne(file, body, partial, fileIndex, 0, fileIndex + body.length);
      if (m && globStarDepth < this.maxGlobstarRecursion) {
        const sub = this.#matchGlobStarBodySections(file, bodySegments, fileLength, fileIndex + body.length, bodyIndex + 1, partial, globStarDepth + 1, sawTail, tried);
        if (sub !== false) {
          return sub;
        }
      }
      if (fileIndex === after)
        break;
      const f = file[fileIndex];
      if (f === "." || f === ".." || !this.options.dot && f.startsWith(".")) {
        return false;
      }
      fileIndex++;
    }
    return partial || null;
  }
  #matchOne(file, pattern, partial, fileIndex, patternIndex, fileEnd = file.length) {
    let fi;
    let pi;
    let pl;
    let fl;
    for (fi = fileIndex, pi = patternIndex, fl = Math.min(fileEnd, file.length), pl = pattern.length; fi < fl && pi < pl; fi++, pi++) {
      let p = pattern[pi];
      let f = file[fi];
      if (p === false || p === GLOBSTAR) {
        return false;
      }
      if (!portionMatch(p, f))
        return false;
    }
    if (fi === fl && pi === pl) {
      return true;
    } else if (fi === fl) {
      return partial;
    } else if (pi === pl) {
      return fi === fl - 1 && file[fi] === "";
    } else {
      throw new Error("wtf?");
    }
  }
  braceExpand() {
    return braceExpand(this.pattern, this.options);
  }
  parse(pattern) {
    assertValidPattern(pattern);
    const options = this.options;
    if (pattern === "**")
      return GLOBSTAR;
    if (pattern === "")
      return "";
    const { nocase, nocaseMagicOnly, noext = false, dot, normalize: normalize2 } = options;
    const lit2 = literal(pattern, noext);
    if (lit2 !== void 0 && !(nocase && !nocaseMagicOnly && pattern.toUpperCase() !== pattern.toLowerCase())) {
      return this.#norm(lit2);
    }
    if (this.#pending)
      return PENDING;
    let m = this.#matchers.get(pattern);
    if (!m) {
      m = new Matcher(pattern, { nocase, noext, dot, normalize: normalize2 });
      this.#matchers.set(pattern, m);
    }
    return m;
  }
  #slashSplit(p) {
    if (this.preserveMultipleSlashes) {
      return p.split("/");
    } else if (this.isWindows && /^\/\/[^/]+/.test(p)) {
      return ["", ...p.split(/\/+/)];
    } else {
      return p.split(/\/+/);
    }
  }
  match(f, partial = this.partial) {
    if (this.comment) {
      return false;
    }
    if (this.empty) {
      return f === "";
    }
    if (f === "/" && partial) {
      return true;
    }
    const options = this.options;
    let split = this.#cachedSplit(f);
    if (!split) {
      if (!partial && !this.#form && (this.#endCheck || this.#literalCheck) && lastChecked !== f) {
        lastChecked = f;
        const can = this.#canMatch(f);
        if (can === "no")
          return options.flipNegate ? false : this.negate;
        if (can === "yes")
          return options.flipNegate ? true : !this.negate;
      }
      split = this.#split(f);
    }
    const ff = split.parts;
    const resolved = this.#level2 ? split.resolved ??= this.#levelTwoFileOptimize(ff) : ff;
    const set = this.set;
    let filename = ff[ff.length - 1];
    if (!filename) {
      for (let i = ff.length - 2; !filename && i >= 0; i--) {
        filename = ff[i];
      }
    }
    for (let r = 0; r < set.length; r++) {
      const pattern = set[r];
      const shape = partial ? void 0 : this.#shapes[r];
      const hit = shape === "base" ? portionMatch(pattern[0], filename) : shape ? this.#matchShape(resolved, pattern, shape) : options.matchBase && pattern.length === 1 ? this.#matchRow([filename], [filename], pattern, partial) : this.#matchRow(ff, resolved, pattern, partial);
      if (hit) {
        if (options.flipNegate) {
          return true;
        }
        return !this.negate;
      }
    }
    if (options.flipNegate) {
      return false;
    }
    return this.negate;
  }
  static defaults(def) {
    return minimatch.defaults(def).Minimatch;
  }
};
minimatch.Minimatch = Minimatch;
minimatch.escape = escape;
minimatch.unescape = unescape;

// dist/clients/path-utils.js
import { existsSync, readFileSync, realpathSync, statSync } from "node:fs";
import { lstat as lstatAsync, realpath as realpathNativeAsync } from "node:fs/promises";
import * as os from "node:os";
import * as path2 from "node:path";
import { win32 } from "node:path";
import { fileURLToPath, pathToFileURL } from "node:url";
function isWindowsPath(filePath) {
  return /^[A-Za-z]:/.test(filePath) || filePath.startsWith("\\");
}
function toPosix(filePath) {
  return filePath.replace(/\\/g, "/");
}
function isFullyQualifiedWin32(filePath) {
  return win32.isAbsolute(filePath) && win32.parse(filePath).root.length > 1;
}
function isFullyQualifiedPosix(filePath) {
  return path2.posix.isAbsolute(filePath) && !isWindowsPath(filePath);
}
function isFullyQualified(filePath) {
  return process.platform === "win32" ? isFullyQualifiedWin32(filePath) : isFullyQualifiedPosix(filePath);
}
function isAbsoluteFilePath(filePath) {
  const p = isWindowsPath(filePath) ? win32 : path2;
  return p.isAbsolute(filePath);
}
function adoptCanonicalCasing(held, canonical) {
  const heldParts = held.split("/");
  const realParts = canonical.split("/");
  let i = heldParts.length - 1;
  let j = realParts.length - 1;
  let changed = false;
  while (i >= 0 && j >= 0) {
    const a = heldParts[i];
    const b = realParts[j];
    if (a !== b) {
      if (a.toLowerCase() !== b.toLowerCase())
        break;
      heldParts[i] = b;
      changed = true;
    }
    i--;
    j--;
  }
  return changed ? heldParts.join("/") : held;
}
function normalizeFilePath(filePath) {
  return normalizePathForm(filePath, true);
}
function normalizePathSpelling(filePath) {
  return normalizePathForm(filePath, false);
}
function normalizePathForm(filePath, identity) {
  if (process.platform === "win32") {
    if (filePath === "")
      return "";
    if (!isFullyQualifiedWin32(filePath)) {
      return win32.normalize(filePath).replace(/\\/g, "/");
    }
  }
  const normalized = filePath.replace(/\\/g, "/");
  if (process.platform !== "win32" && !isWindowsPath(normalized)) {
    const sentinel = normalized === "" || normalized.startsWith("//");
    if (identity && !sentinel && normalized.startsWith("/"))
      return posixPathIdentity(normalized);
    const folded = sentinel ? normalized : path2.posix.normalize(normalized);
    try {
      const canonical = realpathSync.native(folded);
      if (canonical === folded)
        return folded;
      const adopted = adoptCanonicalCasing(folded, canonical);
      if (adopted === folded)
        return folded;
      return realpathSync.native(adopted) === canonical ? adopted : folded;
    } catch {
      return folded;
    }
  }
  try {
    const canonical = realpathSync.native(filePath);
    return canonical.replace(/\\/g, "/");
  } catch {
    try {
      return resolveNonExisting(filePath);
    } catch {
      const resolved = win32.normalize(win32.resolve(filePath));
      return resolved.replace(/\\/g, "/").toLowerCase();
    }
  }
}
var pathIdentityFallbacks = new BoundedFifoMap(16);
function recordPathIdentityFallback(code, spelled) {
  const existing = pathIdentityFallbacks.get(code);
  if (existing)
    existing.count += 1;
  else
    pathIdentityFallbacks.set(code, { code, count: 1, firstPath: spelled });
}
function getPathIdentityFallbacks() {
  return [...pathIdentityFallbacks.values()].map((row) => ({ ...row }));
}
function resetPathIdentityFallbacks() {
  pathIdentityFallbacks.clear();
}
function* identityCandidates(spelled, p) {
  let current = spelled;
  const missing = [];
  for (; ; ) {
    yield { candidate: current, missing };
    const parent = p.dirname(current);
    if (parent === current)
      return;
    missing.push(p.basename(current));
    current = parent;
  }
}
function recordIdentityRefusal(refusal, candidate) {
  if (isAbsenceRefusal(refusal))
    return;
  recordPathIdentityFallback(refusal?.code ?? "unknown", candidate);
}
function isAbsenceRefusal(refusal) {
  const code = refusal?.code;
  return code === "ENOENT" || code === "ENOTDIR";
}
function foldMissingTail(real, missing, p) {
  return missing.length === 0 ? real : p.join(real, ...missing.reverse());
}
function tailHasDotSegment(missing) {
  return missing.some((segment) => segment === "." || segment === "..");
}
function kernelAttempt(spelled, p) {
  for (const { candidate, missing } of identityCandidates(spelled, p)) {
    try {
      const real = realpathSync.native(candidate);
      return {
        answer: foldMissingTail(real, missing, p),
        foldedTail: tailHasDotSegment(missing)
      };
    } catch (refusal) {
      recordIdentityRefusal(refusal, candidate);
    }
  }
  return void 0;
}
function kernelRealPath(spelled, p) {
  const first = kernelAttempt(spelled, p);
  if (!first)
    return void 0;
  if (!first.foldedTail)
    return first.answer;
  return kernelAttempt(first.answer, p)?.answer ?? first.answer;
}
function posixPathIdentity(spelled) {
  return kernelRealPath(spelled, path2.posix) ?? path2.posix.normalize(spelled);
}
function realpathOrResolve(filePath) {
  return kernelRealPath(filePath, path2) ?? path2.resolve(filePath);
}
async function realpathOrResolveAsync(filePath) {
  return (await kernelPathIdentityAsync(filePath))?.identity ?? path2.resolve(filePath);
}
async function kernelAttemptAsync(spelled) {
  let kernelConfirmed = true;
  for (const { candidate, missing } of identityCandidates(spelled, path2)) {
    try {
      const real = await realpathNativeAsync(candidate);
      return {
        answer: foldMissingTail(real, missing, path2),
        foldedTail: tailHasDotSegment(missing),
        kernelConfirmed
      };
    } catch (refusal) {
      recordIdentityRefusal(refusal, candidate);
      if (!isAbsenceRefusal(refusal))
        kernelConfirmed = false;
      else if (!await lstatAsync(candidate).then(() => false, (lstatRefusal) => {
        return isAbsenceRefusal(lstatRefusal);
      })) {
        recordPathIdentityFallback("ENOENT-DANGLING", candidate);
        kernelConfirmed = false;
      }
    }
  }
  return void 0;
}
async function kernelPathIdentityAsync(filePath) {
  const first = await kernelAttemptAsync(filePath);
  if (!first)
    return void 0;
  const settled = first.foldedTail ? await kernelAttemptAsync(first.answer) : void 0;
  return {
    identity: settled?.answer ?? first.answer,
    kernelConfirmed: first.kernelConfirmed && (settled?.kernelConfirmed ?? true)
  };
}
function normalizeLoggedPath(value) {
  return isFullyQualifiedWin32(value) || isFullyQualifiedPosix(value) ? normalizeFilePath(value) : value;
}
function resolveNonExisting(filePath) {
  const resolved = win32.resolve(filePath);
  let current = resolved;
  const nonExistentParts = [];
  while (true) {
    if (existsSync(current)) {
      const canonical = realpathSync.native(current);
      if (nonExistentParts.length === 0) {
        return canonical.replace(/\\/g, "/");
      }
      const tail = nonExistentParts.reverse().join("/").toLowerCase();
      const base = canonical.replace(/\\/g, "/");
      return base.endsWith("/") ? base + tail : `${base}/${tail}`;
    }
    const parent = win32.dirname(current);
    if (parent === current) {
      throw new Error("No existing parent found");
    }
    nonExistentParts.push(win32.basename(current));
    current = parent;
  }
}
function uriToPath(uri) {
  try {
    const filePath = fileURLToPath(uri);
    return normalizeFilePath(filePath);
  } catch {
    return normalizeFilePath(uri);
  }
}
function uriToDiskPath(uri) {
  try {
    return fileURLToPath(uri);
  } catch {
    return uri;
  }
}
function normalizeMapKey(filePath) {
  return normalizeFilePath(filePath);
}
function relativeInside(root, file, pathImpl = path2) {
  const relative = pathImpl.relative(pathImpl.resolve(root), file);
  return relative !== ".." && !relative.startsWith(`..${pathImpl.sep}`) && !pathImpl.isAbsolute(relative) ? relative.replace(/\\/g, "/") : void 0;
}
function toProjectRelativePath(filePath, projectRoot) {
  const p = isWindowsPath(filePath) ? win32 : path2;
  if (!p.isAbsolute(filePath))
    return filePath.replace(/\\/g, "/");
  const direct = relativeInside(projectRoot, filePath, p);
  if (direct)
    return direct;
  const canonical = relativeInside(normalizeFilePath(projectRoot), normalizeFilePath(filePath), p);
  if (canonical)
    return canonical;
  return filePath.replace(/\\/g, "/");
}
function normalizeEphemeralMapKey(filePath) {
  if (process.platform !== "win32" && !filePath.includes("\\"))
    return filePath;
  const slashed = filePath.replace(/\\/g, "/");
  return process.platform === "win32" ? slashed.toLowerCase() : slashed;
}
function pathsEqual(a, b) {
  return normalizeFilePath(a) === normalizeFilePath(b);
}
function* walkUpDirs(startDir, options = {}) {
  const axis = options.spelling ? path2.resolve : realpathOrResolve;
  let current = axis(startDir);
  const home = options.homeDir === void 0 ? void 0 : axis(options.homeDir);
  for (let yielded = 0; yielded < (options.maxDepth ?? Infinity); yielded++) {
    if (home !== void 0 && isAtOrAboveHomeDir(current, home))
      return;
    yield current;
    const parent = path2.dirname(current);
    if (parent === current)
      return;
    current = parent;
  }
}
function findNearestContaining(startDir, candidates) {
  for (const dir of walkUpDirs(startDir)) {
    for (const name of candidates) {
      if (existsSync(path2.join(dir, name)))
        return dir;
    }
  }
  return void 0;
}
function findLocalToolConfig(startDir, names, options = {}) {
  for (const dir of walkUpDirs(startDir || process.cwd(), options)) {
    for (const name of names) {
      const candidate = path2.join(dir, name);
      if (existsSync(candidate))
        return candidate;
    }
  }
  return void 0;
}
function isRealGitMarker(markerPath, details) {
  const detailed = details === true;
  try {
    const marker = statSync(markerPath);
    let valid = false;
    if (marker.isDirectory()) {
      statSync(path2.join(markerPath, "HEAD"));
      valid = true;
    } else if (marker.isFile()) {
      valid = readFileSync(markerPath, "utf8").split(/\r?\n/, 1)[0].startsWith("gitdir:");
    }
    if (!detailed)
      return valid;
    return { kind: valid ? "valid" : "absent" };
  } catch (cause) {
    if (!detailed)
      return false;
    if (typeof cause === "object" && cause !== null && "code" in cause && (cause.code === "ENOENT" || cause.code === "ENOTDIR")) {
      return { kind: "absent" };
    }
    return { kind: "unavailable", cause };
  }
}
function findNearestMarkerRoot(startDir, markers, options = {}) {
  const boundaries = options.boundaries ?? [];
  const markerPredicate = options.markerPredicate ?? (() => true);
  for (const current of walkUpDirs(startDir, {
    homeDir: options.homeDir ?? os.homedir(),
    maxDepth: 64
  })) {
    if (markers.some((m) => existsSync(path2.join(current, m)) && markerPredicate(path2.join(current, m))))
      return current;
    if (boundaries.some((m) => existsSync(path2.join(current, m))))
      return null;
  }
  return null;
}
function findNearestMarkerRootDetailed(startDir, markers, options) {
  let climbed = 0;
  let last;
  for (const current of walkUpDirs(startDir, {
    homeDir: options.homeDir ?? os.homedir(),
    maxDepth: 64
  })) {
    climbed += 1;
    last = current;
    for (const marker of markers) {
      const markerPath = path2.join(current, marker);
      const checked = options.markerPredicate(markerPath);
      if (checked.kind === "unavailable")
        return { kind: "unavailable", markerPath, cause: checked.cause };
      if (checked.kind === "valid")
        return { kind: "found", root: current };
    }
  }
  if (last === void 0)
    return { kind: "not-found", reason: "home-ceiling" };
  if (path2.dirname(last) === last)
    return { kind: "not-found", reason: "root" };
  return {
    kind: "not-found",
    reason: climbed >= 64 ? "depth-limit" : "home-ceiling"
  };
}
function isAtOrAboveHomeDir(dir, homeDir = os.homedir(), pathImpl = path2) {
  return relativeInside(dir, pathImpl.resolve(homeDir), pathImpl) !== void 0;
}
function homeRelativePath(filePath, homeDir = os.homedir()) {
  if (filePath.length === 0)
    return filePath;
  const candidate = toPosix(filePath);
  const home = toPosix(homeDir).replace(/\/+$/, "");
  if (home.length === 0)
    return filePath;
  const fold = (text) => process.platform === "win32" ? text.toLowerCase() : text;
  const foldedHome = fold(home);
  const foldedCandidate = fold(candidate);
  if (foldedCandidate === foldedHome)
    return "~";
  if (!foldedCandidate.startsWith(`${foldedHome}/`))
    return filePath;
  return `~${candidate.slice(home.length)}`;
}
function isUnderDir(child, parent) {
  if (isWithinForm(normalizePathSpelling(child), normalizePathSpelling(parent)))
    return true;
  if (process.platform === "win32")
    return false;
  return isWithinIdentity(child, parent);
}
function isWithinIdentity(child, parent) {
  return isWithinForm(normalizeFilePath(child), normalizeFilePath(parent));
}
function isWithinForm(child, parent) {
  const parentPrefix = parent.endsWith("/") ? parent : `${parent}/`;
  return child === parent || child.startsWith(parentPrefix);
}
function isOutsideProjectRoot(filePath, projectRoot) {
  return !isUnderDir(filePath, projectRoot);
}
var VENDOR_DIR_NAMES = /* @__PURE__ */ new Set([
  "node_modules",
  "vendor",
  "vendors",
  "third_party",
  "third-party",
  ".venv",
  "site-packages",
  "bower_components"
]);
function isVendorPath(filePath) {
  return normalizePathSpelling(filePath).split("/").some((segment) => VENDOR_DIR_NAMES.has(segment.toLowerCase()));
}
function isExternalOrVendorFile(filePath, projectRoot) {
  if (isOutsideProjectRoot(filePath, projectRoot))
    return true;
  return isVendorPath(filePath);
}
function nameMatchesMarkerGlob(name, pattern) {
  return minimatch(name, pattern, {
    dot: true,
    nocase: process.platform === "win32"
  });
}
function direntsHaveMarkerGlobMatch(entries, pattern) {
  return entries.some((entry) => (entry.isFile() || entry.isSymbolicLink()) && nameMatchesMarkerGlob(entry.name, pattern));
}
var CARGO_WORKSPACE_MEMBER_DIALECT = {
  name: "cargo",
  globstar: "pattern-never-matches",
  wildcardCrossesSeparator: false,
  characterClasses: false,
  normalizePattern: (pattern) => pattern.replace(/\/+$/, "")
};
var UV_WORKSPACE_MEMBERS_DIALECT = {
  name: "uv-members",
  globstar: "crosses-components",
  wildcardCrossesSeparator: false,
  characterClasses: true,
  normalizePattern: (pattern) => path2.posix.normalize(toPosix(pattern))
};
var UV_WORKSPACE_EXCLUDE_DIALECT = {
  name: "uv-exclude",
  globstar: "crosses-components",
  wildcardCrossesSeparator: true,
  characterClasses: true,
  normalizePattern: (pattern) => path2.posix.normalize(toPosix(pattern))
};
function findCharacterClassEnd(segment, open) {
  let i = open + 1;
  if (segment[i] === "!" || segment[i] === "^")
    i += 1;
  if (segment[i] === "]")
    i += 1;
  for (; i < segment.length; i += 1)
    if (segment[i] === "]")
      return i;
  return -1;
}
function stepAcceptsChar(crossesSeparator, ch) {
  return crossesSeparator ? ch !== "\n" && ch !== "\r" && ch !== "\u2028" && ch !== "\u2029" : ch !== "/";
}
function compileWorkspaceMemberPattern(pattern, dialect) {
  const isGlobstar = (component) => component === "**" && dialect.globstar === "crosses-components";
  const components = pattern.split("/");
  const steps = [];
  let needSeparator = false;
  for (let c = 0; c < components.length; c += 1) {
    if (needSeparator)
      steps.push({ kind: "literal", char: "/" });
    needSeparator = false;
    const component = components[c];
    if (isGlobstar(component)) {
      if (c === components.length - 1) {
        steps.push({ kind: "one", crossesSeparator: true });
        steps.push({ kind: "star", crossesSeparator: true });
        continue;
      }
      const split = { kind: "split", alternative: -1 };
      steps.push(split);
      steps.push({ kind: "one", crossesSeparator: true });
      steps.push({ kind: "star", crossesSeparator: true });
      steps.push({ kind: "literal", char: "/" });
      split.alternative = steps.length;
      continue;
    }
    for (let i = 0; i < component.length; i += 1) {
      const ch = component[i];
      if (ch === "*") {
        steps.push({
          kind: "star",
          crossesSeparator: dialect.wildcardCrossesSeparator
        });
        continue;
      }
      if (ch === "?") {
        steps.push({
          kind: "one",
          crossesSeparator: dialect.wildcardCrossesSeparator
        });
        continue;
      }
      if (ch === "[" && dialect.characterClasses) {
        const close = findCharacterClassEnd(component, i);
        if (close !== -1) {
          const body = component.slice(i + 1, close).replace(/[\\\]]/g, "\\$&");
          const source = body.startsWith("!") ? `[^${body.slice(1)}]` : `[${body}]`;
          let match2;
          try {
            match2 = new RegExp(`^${source}$`);
          } catch {
            return void 0;
          }
          steps.push({ kind: "class", match: match2 });
          i = close;
          continue;
        }
      }
      steps.push({ kind: "literal", char: ch });
    }
    needSeparator = true;
  }
  return steps;
}
var WORKSPACE_GLOB_MEMO_CELL_CAP = 2e6;
function matchesWorkspaceMemberSteps(steps, subject, onCap) {
  const stepCount = steps.length;
  const width = subject.length + 1;
  if ((stepCount + 1) * width > WORKSPACE_GLOB_MEMO_CELL_CAP) {
    onCap?.();
    return false;
  }
  const table = new Uint8Array((stepCount + 1) * width);
  for (let p = subject.length; p >= 0; p -= 1) {
    const atEnd = p === subject.length;
    table[stepCount * width + p] = atEnd ? 1 : 0;
    for (let s = stepCount - 1; s >= 0; s -= 1) {
      const step = steps[s];
      const next = (s + 1) * width;
      let matched = 0;
      switch (step.kind) {
        case "literal":
          matched = !atEnd && subject[p] === step.char ? table[next + p + 1] : 0;
          break;
        case "one":
          matched = !atEnd && stepAcceptsChar(step.crossesSeparator, subject[p]) ? table[next + p + 1] : 0;
          break;
        case "class":
          matched = !atEnd && step.match.test(subject[p]) ? table[next + p + 1] : 0;
          break;
        case "star":
          matched = table[next + p] === 1 || !atEnd && stepAcceptsChar(step.crossesSeparator, subject[p]) && table[s * width + p + 1] === 1 ? 1 : 0;
          break;
        case "split":
          matched = table[step.alternative * width + p] === 1 || table[next + p] === 1 ? 1 : 0;
          break;
      }
      table[s * width + p] = matched;
    }
  }
  return table[0] === 1;
}
function matchesWorkspaceMemberPattern(pattern, relativePath, dialect, onCap) {
  const normalized = dialect.normalizePattern(pattern);
  if (dialect.globstar === "pattern-never-matches" && normalized.includes("**")) {
    return false;
  }
  const steps = compileWorkspaceMemberPattern(normalized, dialect);
  return steps !== void 0 && matchesWorkspaceMemberSteps(steps, relativePath, onCap);
}
var HOST_UNICODE_SPACES = /[\u00A0\u2000-\u200A\u202F\u205F\u3000]/g;
function hostNormalizeWindowsShellPath(filePath) {
  if (!filePath.startsWith("/") || filePath.startsWith("//") || filePath.includes("\\")) {
    return filePath;
  }
  const match2 = filePath.match(/^\/(?:mnt\/|cygdrive\/)?([a-z])(?:\/(.*))?$/i);
  if (!match2)
    return filePath;
  const suffix = match2[2]?.replaceAll("/", "\\");
  return `${match2[1].toUpperCase()}:\\${suffix ?? ""}`;
}
function normalizeHostToolPath(input, options = {}) {
  let normalized = input;
  if (options.normalizeUnicodeSpaces) {
    normalized = normalized.replace(HOST_UNICODE_SPACES, " ");
  }
  if (options.stripAtPrefix && normalized.startsWith("@")) {
    normalized = normalized.slice(1);
  }
  if (process.platform === "win32") {
    normalized = hostNormalizeWindowsShellPath(normalized);
  }
  if (normalized === "~")
    return os.homedir();
  if (normalized.startsWith("~/") || process.platform === "win32" && normalized.startsWith("~\\")) {
    return path2.join(os.homedir(), normalized.slice(2));
  }
  if (normalized.startsWith("file://")) {
    try {
      return fileURLToPath(normalized);
    } catch {
      return normalized;
    }
  }
  return normalized;
}
function resolveHostToolPath(input, baseDir) {
  const normalized = normalizeHostToolPath(input, {
    normalizeUnicodeSpaces: true,
    stripAtPrefix: true
  });
  const normalizedBaseDir = normalizeHostToolPath(baseDir);
  return path2.isAbsolute(normalized) ? path2.resolve(normalized) : path2.resolve(normalizedBaseDir, normalized);
}

export {
  BoundedFifoMap,
  BoundedSet,
  BoundedLruCache,
  minimatch,
  Minimatch,
  isWindowsPath,
  toPosix,
  isFullyQualifiedWin32,
  isFullyQualified,
  isAbsoluteFilePath,
  normalizeFilePath,
  normalizePathSpelling,
  getPathIdentityFallbacks,
  resetPathIdentityFallbacks,
  realpathOrResolve,
  realpathOrResolveAsync,
  kernelPathIdentityAsync,
  normalizeLoggedPath,
  uriToPath,
  uriToDiskPath,
  normalizeMapKey,
  relativeInside,
  toProjectRelativePath,
  normalizeEphemeralMapKey,
  pathsEqual,
  walkUpDirs,
  findNearestContaining,
  findLocalToolConfig,
  isRealGitMarker,
  findNearestMarkerRoot,
  findNearestMarkerRootDetailed,
  isAtOrAboveHomeDir,
  homeRelativePath,
  isUnderDir,
  isWithinIdentity,
  isWithinForm,
  isVendorPath,
  isExternalOrVendorFile,
  nameMatchesMarkerGlob,
  direntsHaveMarkerGlobMatch,
  CARGO_WORKSPACE_MEMBER_DIALECT,
  UV_WORKSPACE_MEMBERS_DIALECT,
  UV_WORKSPACE_EXCLUDE_DIALECT,
  matchesWorkspaceMemberPattern,
  normalizeHostToolPath,
  resolveHostToolPath
};
