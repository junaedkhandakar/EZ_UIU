// One-off audit: report Tailwind class tokens used in src that are missing from dist CSS.
import { readFileSync, readdirSync, statSync } from 'node:fs';
import { join } from 'node:path';

function walk(dir, out = []) {
  for (const f of readdirSync(dir)) {
    const p = join(dir, f);
    if (statSync(p).isDirectory()) walk(p, out);
    else if (/\.(jsx|js)$/.test(f)) out.push(p);
  }
  return out;
}

const files = walk('src');
const cssFile = readdirSync('dist/assets').find((f) => f.endsWith('.css'));
const css = readFileSync(join('dist/assets', cssFile), 'utf8');

const tokens = new Set();
for (const f of files) {
  const src = readFileSync(f, 'utf8');
  // pull out every string inside className={`...`} and className="..."
  for (const m of src.matchAll(/className=\{?["'`]([^"'`]*)["'`]\}?/g)) {
    for (const raw of m[1].split(/\s+/)) {
      if (!raw || raw.includes('${') || raw.includes('}')) continue;
      tokens.add(raw);
    }
  }
}

function esc(sel) {
  return sel.replace(/[^a-zA-Z0-9_-]/g, (c) => '\\' + c);
}

const missing = [];
for (const t of tokens) {
  if (!/^(?!.*\[).*[/:]/.test(t) && !/accentSoft|fade-in|slide-up-in/.test(t)) {
    // only scrutinize tokens likely to be utilities with modifiers or known suspects
  }
  const e = esc(t);
  if (!css.includes('.' + e)) missing.push(t);
}

console.log(`tokens scanned: ${tokens.size}`);
console.log(`missing from CSS (${missing.length}):`);
for (const t of missing.sort()) console.log('  ' + t);
