#!/usr/bin/env node

import fs from "node:fs";
import path from "node:path";

const root = process.cwd();
const home = process.env.HOME || "/home/james";

const defaultFiles = [
  ".config/opencode/AGENTS.md",
  ".config/opencode/modes/algorithm.md",
  ".config/opencode/modes/native.md",
  ".config/opencode/modes/minimal.md",
  ".pai/PAI/AISTEERINGRULES.md",
  ".pai/PAI/USER/AISTEERINGRULES.md",
];

function usage() {
  console.log(`Usage: node scripts/pai/token-budget.mjs [--json] [--snapshot <path>]

Reports approximate token, word, line, and character counts for always-loaded
OpenCode/PAI prompt files, plus duplicate heading and repeated phrase findings.`);
}

function resolveFile(file) {
  const repoPath = path.resolve(root, file);
  if (fs.existsSync(repoPath)) return repoPath;
  return path.resolve(home, file);
}

function countFile(file) {
  const abs = resolveFile(file);
  const text = fs.readFileSync(abs, "utf8");
  const words = (text.match(/\S+/g) || []).length;
  const lines = text.length === 0 ? 0 : text.split(/\r?\n/).length;
  const chars = text.length;
  const approxTokens = Math.ceil(Math.max(chars / 4, words * 1.33));
  return { file, abs, lines, words, chars, approxTokens, text };
}

function normalizePhrase(line) {
  return line
    .toLowerCase()
    .replace(/[`*_>#|\[\](){}:;,.!?]/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

function duplicateFindings(rows) {
  const headings = new Map();
  const phrases = new Map();

  for (const row of rows) {
    const lines = row.text.split(/\r?\n/);
    for (const line of lines) {
      const heading = line.match(/^#{1,4}\s+(.+)$/);
      if (heading) {
        const key = normalizePhrase(heading[1]);
        if (!headings.has(key)) headings.set(key, new Set());
        headings.get(key).add(row.file);
      }

      const phrase = normalizePhrase(line);
      if (phrase.length >= 28 && phrase.length <= 140) {
        if (!phrases.has(phrase)) phrases.set(phrase, new Set());
        phrases.get(phrase).add(row.file);
      }
    }
  }

  const repeatedHeadings = [...headings.entries()]
    .filter(([, files]) => files.size > 1)
    .map(([text, files]) => ({ text, files: [...files] }))
    .sort((a, b) => b.files.length - a.files.length || a.text.localeCompare(b.text));

  const repeatedPhrases = [...phrases.entries()]
    .filter(([, files]) => files.size > 1)
    .map(([text, files]) => ({ text, files: [...files] }))
    .sort((a, b) => b.files.length - a.files.length || a.text.localeCompare(b.text))
    .slice(0, 20);

  return { repeatedHeadings, repeatedPhrases };
}

function renderTable(rows, duplicates) {
  const sorted = [...rows].sort((a, b) => b.approxTokens - a.approxTokens);
  const total = rows.reduce(
    (acc, row) => ({
      lines: acc.lines + row.lines,
      words: acc.words + row.words,
      chars: acc.chars + row.chars,
      approxTokens: acc.approxTokens + row.approxTokens,
    }),
    { lines: 0, words: 0, chars: 0, approxTokens: 0 },
  );

  const out = [];
  out.push("File | Lines | Words | Chars | Approx tokens");
  out.push("--- | ---: | ---: | ---: | ---:");
  for (const row of sorted) {
    out.push(`${row.file} | ${row.lines} | ${row.words} | ${row.chars} | ${row.approxTokens}`);
  }
  out.push(`TOTAL | ${total.lines} | ${total.words} | ${total.chars} | ${total.approxTokens}`);
  out.push("");
  out.push("Duplicate headings:");
  if (duplicates.repeatedHeadings.length === 0) out.push("- none");
  for (const item of duplicates.repeatedHeadings.slice(0, 20)) {
    out.push(`- ${item.text} :: ${item.files.join(", ")}`);
  }
  out.push("");
  out.push("Duplicate phrases:");
  if (duplicates.repeatedPhrases.length === 0) out.push("- none");
  for (const item of duplicates.repeatedPhrases) {
    out.push(`- ${item.text} :: ${item.files.join(", ")}`);
  }
  return `${out.join("\n")}\n`;
}

const args = process.argv.slice(2);
if (args.includes("--help") || args.includes("-h")) {
  usage();
  process.exit(0);
}

let json = false;
let snapshot = null;
for (let i = 0; i < args.length; i += 1) {
  if (args[i] === "--json") json = true;
  if (args[i] === "--snapshot") {
    snapshot = args[i + 1];
    i += 1;
  }
}

const rows = defaultFiles.filter((file) => fs.existsSync(resolveFile(file))).map(countFile);
const duplicates = duplicateFindings(rows);
const report = json
  ? `${JSON.stringify({ rows: rows.map(({ text, ...row }) => row), duplicates }, null, 2)}\n`
  : renderTable(rows, duplicates);

if (snapshot) {
  fs.mkdirSync(path.dirname(snapshot), { recursive: true });
  fs.writeFileSync(snapshot, report);
}

process.stdout.write(report);
