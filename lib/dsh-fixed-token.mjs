import { randomBytes } from "node:crypto";
import {
  lstatSync as dshFixedLstatSync,
  readFileSync as dshFixedReadFileSync,
  mkdirSync,
  writeFileSync,
} from "node:fs";
import { dirname, isAbsolute } from "node:path";

const original = `function processLaunchToken(owner) {
	const existing = PROCESS_LAUNCH_TOKENS.get(owner);
	if (existing !== void 0) return existing;
	const created = encodeBase64Url(randomBytes(SECRET_BYTES));
	PROCESS_LAUNCH_TOKENS.set(owner, created);
	return created;
}`;

function readPrivateToken(path) {
  const stat = dshFixedLstatSync(path);
  if (!stat.isFile() || stat.uid !== process.getuid() || (stat.mode & 0o077) !== 0) {
    throw new Error("dsh fixed login: token must be an owner-only private regular file");
  }
  const token = dshFixedReadFileSync(path, "utf8").trim();
  if (!/^[A-Za-z0-9_-]{43}$/.test(token)) {
    throw new Error("dsh fixed login: invalid token");
  }
  return token;
}

const [target, tokenPath] = process.argv.slice(2);
if (!target || !tokenPath || !isAbsolute(target) || !isAbsolute(tokenPath)) {
  throw new Error(
    "Usage: node lib/dsh-fixed-token.mjs ABSOLUTE_DSH_CONNECTION_JS ABSOLUTE_TOKEN_FILE",
  );
}
const source = dshFixedReadFileSync(target, "utf8");
// ponytail: patches dsh 0.2.1-rc.3 internals; replace with upstream fixed-token support when available.
const replacement = `${readPrivateToken.toString()}
function processLaunchToken(owner) {
	const existing = PROCESS_LAUNCH_TOKENS.get(owner);
	if (existing !== void 0) return existing;
	const created = readPrivateToken(${JSON.stringify(tokenPath)});
	PROCESS_LAUNCH_TOKENS.set(owner, created);
	return created;
}`;
const imports =
  'import { lstatSync as dshFixedLstatSync, readFileSync as dshFixedReadFileSync } from "node:fs";\n';
const installed = source.includes(replacement) && source.startsWith(imports);
if (!installed && source.split(original).length !== 2) {
  throw new Error("unsupported dsh authentication source; no changes made");
}
mkdirSync(dirname(tokenPath), { recursive: true, mode: 0o700 });
try {
  writeFileSync(tokenPath, `${randomBytes(32).toString("base64url")}\n`, {
    flag: "wx",
    mode: 0o600,
  });
} catch (error) {
  if (error.code !== "EEXIST") throw error;
}
readPrivateToken(tokenPath);
if (!installed) writeFileSync(target, imports + source.replace(original, replacement));
console.log(installed ? "Fixed-token patch already installed." : "Fixed-token patch installed.");
